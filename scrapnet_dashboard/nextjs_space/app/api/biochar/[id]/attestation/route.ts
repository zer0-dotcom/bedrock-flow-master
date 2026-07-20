import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAttestationStatus, formatCdrWithFractionalization } from '@/lib/blockchain';

export const dynamic = 'force-dynamic';

/**
 * GET /api/biochar/[id]/attestation
 * Retrieve blockchain attestation details for a specific biochar batch
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const batch = await prisma.biocharBatch.findUnique({
      where: { id },
      select: {
        id: true,
        batchId: true,
        verificationStatus: true,
        verifiedAt: true,
        verifiedBy: true,
        cdrCreditsTonnes: true,
        stabilityClass: true,
        permanenceYears: true,
        feedstockType: true,
        hCorgRatio: true,
        // Hedera HCS attestation
        hederaTopicId: true,
        hederaTransactionId: true,
        hederaConsensusTimestamp: true,
        hederaMessageHash: true,
        // Polygon ERC-1155 attestation
        polygonTokenId: true,
        polygonTransactionHash: true,
        polygonContractAddress: true,
        polygonMintTimestamp: true,
        polygonTokenUri: true,
        // Cross-chain metadata
        crossChainMetadataJson: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Get attestation status
    const attestationStatus = getAttestationStatus({
      hederaTransactionId: batch.hederaTransactionId,
      polygonTransactionHash: batch.polygonTransactionHash,
    });

    // Format CDR with fractionalization
    const cdrFormatted = formatCdrWithFractionalization(batch.cdrCreditsTonnes);

    // Parse cross-chain metadata if available
    let crossChainMetadata = null;
    if (batch.crossChainMetadataJson) {
      try {
        crossChainMetadata = JSON.parse(batch.crossChainMetadataJson);
      } catch {
        crossChainMetadata = null;
      }
    }

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        batchId: batch.batchId,
        verificationStatus: batch.verificationStatus,
        verifiedAt: batch.verifiedAt,
        verifiedBy: batch.verifiedBy,
      },
      cdr: {
        tonnes: cdrFormatted.tonnes,
        fractionalUnits: cdrFormatted.fractionalUnits,
        displayValue: cdrFormatted.displayValue,
        stabilityClass: batch.stabilityClass,
        permanenceYears: batch.permanenceYears,
      },
      attestation: {
        status: attestationStatus,
        hedera: attestationStatus.hasHederaAttestation ? {
          topicId: batch.hederaTopicId,
          transactionId: batch.hederaTransactionId,
          consensusTimestamp: batch.hederaConsensusTimestamp,
          messageHash: batch.hederaMessageHash,
          explorerUrl: `https://hashscan.io/mainnet/transaction/${batch.hederaTransactionId}`,
        } : null,
        polygon: attestationStatus.hasPolygonAttestation ? {
          tokenId: batch.polygonTokenId,
          transactionHash: batch.polygonTransactionHash,
          contractAddress: batch.polygonContractAddress,
          mintTimestamp: batch.polygonMintTimestamp,
          // Decode token URI for display (it's base64 encoded)
          tokenMetadata: batch.polygonTokenUri?.startsWith('data:application/json;base64,')
            ? (() => {
                try {
                  const base64Data = batch.polygonTokenUri!.replace('data:application/json;base64,', '');
                  return JSON.parse(Buffer.from(base64Data, 'base64').toString('utf-8'));
                } catch {
                  return null;
                }
              })()
            : null,
          explorerUrl: `https://polygonscan.com/tx/${batch.polygonTransactionHash}`,
        } : null,
        crossChain: crossChainMetadata,
      },
    });
  } catch (error) {
    console.error('Error fetching attestation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attestation details' },
      { status: 500 }
    );
  }
}
