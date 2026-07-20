import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { 
  executeDualBlockchainAttestation, 
  BlockchainAttestationInput,
  formatCdrWithFractionalization
} from '@/lib/blockchain';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/agent/verification-queue
 * Returns pending items for verification
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'biochar', 'recycling', 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let biocharBatches: Array<{
      id: string;
      type: string;
      batchId: string;
      createdAt: Date;
      feedstockType: string;
      dryWeightKg: number;
      cdrCreditsTonnes: number;
      farmerName: string | null;
      farmerId: string | null;
    }> = [];

    let recyclingLogs: Array<{
      id: string;
      type: string;
      logId: string;
      createdAt: Date;
      materialType: string;
      weightKg: number;
      sourceLocation: string | null;
      submitterName: string | null;
      locationName: string | null;
      locationType: string | null;
    }> = [];

    if (type === 'all' || type === 'biochar') {
      const batches = await prisma.biocharBatch.findMany({
        where: {
          verificationStatus: 'PENDING',
        },
        orderBy: { createdAt: 'asc' },
        take: type === 'all' ? Math.floor(limit / 2) : limit,
        include: {
          farmer: {
            select: { name: true, id: true },
          },
        },
      });

      biocharBatches = batches.map((b) => ({
        id: b.id,
        type: 'biochar',
        batchId: b.batchId,
        createdAt: b.createdAt,
        feedstockType: b.feedstockType,
        dryWeightKg: b.dryWeightKg,
        cdrCreditsTonnes: b.cdrCreditsTonnes,
        farmerName: b.farmer?.name || null,
        farmerId: b.farmer?.id || null,
      }));
    }

    if (type === 'all' || type === 'recycling') {
      const logs = await prisma.recyclingLog.findMany({
        where: {
          verificationStatus: 'PENDING',
        },
        orderBy: { createdAt: 'asc' },
        take: type === 'all' ? Math.floor(limit / 2) : limit,
        include: {
          submittedBy: {
            select: { name: true },
          },
          destinationLocation: {
            select: { name: true, type: true },
          },
        },
      });

      recyclingLogs = logs.map((l) => ({
        id: l.id,
        type: 'recycling',
        logId: l.logId,
        createdAt: l.createdAt,
        materialType: l.materialType,
        weightKg: l.weightKg,
        sourceLocation: l.sourceLocation,
        submitterName: l.submittedBy?.name || null,
        locationName: l.destinationLocation?.name || null,
        locationType: l.destinationLocation?.type || null,
      }));
    }

    // Combine and sort by creation date
    const allItems = [
      ...biocharBatches.map((b) => ({ ...b, itemType: 'biochar' as const })),
      ...recyclingLogs.map((r) => ({ ...r, itemType: 'recycling' as const })),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return NextResponse.json({
      success: true,
      items: allItems,
      counts: {
        biochar: biocharBatches.length,
        recycling: recyclingLogs.length,
        total: allItems.length,
      },
    });
  } catch (error) {
    console.error('Error fetching verification queue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch verification queue' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/verification-queue
 * Verify or reject items
 * 
 * For BIOCHAR VERIFICATION, triggers Dual-Blockchain Attestation:
 * 1. Hedera HCS: Submits scientific metadata for immutable audit trail
 * 2. Polygon ERC-1155: Mints fractionalized CDR token (up to 4 decimal places)
 * 3. Cross-chain: Links Polygon token URI to Hedera Transaction ID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, itemType, action, agentId, rejectionReason } = body;

    if (!itemId || !itemType || !action || !agentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    const newStatus = action === 'verify' ? 'VERIFIED' : 'REJECTED';
    let attestationResult = null;

    if (itemType === 'biochar') {
      // Fetch the batch details for blockchain attestation
      const batch = await prisma.biocharBatch.findUnique({
        where: { id: itemId },
        include: {
          farmer: { select: { id: true, farmerId: true } },
        },
      });

      if (!batch) {
        return NextResponse.json(
          { success: false, error: 'Biochar batch not found' },
          { status: 404 }
        );
      }

      // If verifying, execute Dual-Blockchain Attestation
      if (action === 'verify') {
        try {
          // Generate certificate hash for attestation
          const certificateHash = crypto
            .createHash('sha256')
            .update(JSON.stringify({
              batch_id: batch.batchId,
              h_corg_ratio: batch.hCorgRatio,
              feedstock_type: batch.feedstockType,
              cdr_tonnes: batch.cdrCreditsTonnes,
              timestamp: new Date().toISOString(),
            }))
            .digest('hex');

          // Prepare attestation input
          const attestationInput: BlockchainAttestationInput = {
            batchId: batch.batchId,
            hCorgRatio: batch.hCorgRatio,
            feedstockType: batch.feedstockType,
            stabilityClass: batch.stabilityClass,
            cdrTonnes: batch.cdrCreditsTonnes,
            permanenceYears: batch.permanenceYears,
            farmerId: batch.farmer?.farmerId || null,
            agentId: agentId,
            certificateHash,
          };

          // Execute Dual-Blockchain Attestation
          console.log(`[VERIFICATION] Starting Dual-Blockchain Attestation for batch ${batch.batchId}`);
          attestationResult = await executeDualBlockchainAttestation(attestationInput);

          // Format CDR with fractionalization info
          const cdrFormatted = formatCdrWithFractionalization(batch.cdrCreditsTonnes);
          console.log(`[VERIFICATION] CDR formatted: ${cdrFormatted.displayValue}`);

          // Update batch with verification status AND blockchain attestation data
          await prisma.biocharBatch.update({
            where: { id: itemId },
            data: {
              verificationStatus: newStatus,
              verifiedAt: new Date(),
              verifiedBy: agentId,
              rejectionReason: null,
              // Hedera HCS attestation
              hederaTopicId: attestationResult.hedera.topicId,
              hederaTransactionId: attestationResult.hedera.transactionId,
              hederaConsensusTimestamp: attestationResult.hedera.consensusTimestamp,
              hederaMessageHash: attestationResult.hedera.messageHash,
              // Polygon ERC-1155 attestation
              polygonTokenId: attestationResult.polygon.tokenId,
              polygonTransactionHash: attestationResult.polygon.transactionHash,
              polygonContractAddress: attestationResult.polygon.contractAddress,
              polygonMintTimestamp: new Date(attestationResult.polygon.mintTimestamp),
              polygonTokenUri: attestationResult.polygon.tokenUri,
              // Cross-chain metadata
              crossChainMetadataJson: JSON.stringify(attestationResult.crossChainMetadata),
            },
          });

          console.log(`[VERIFICATION] Batch ${batch.batchId} verified with dual-blockchain attestation`);

        } catch (attestationError) {
          console.error('[VERIFICATION] Blockchain attestation failed:', attestationError);
          // Still verify the batch but log the attestation failure
          await prisma.biocharBatch.update({
            where: { id: itemId },
            data: {
              verificationStatus: newStatus,
              verifiedAt: new Date(),
              verifiedBy: agentId,
              rejectionReason: null,
            },
          });
          
          return NextResponse.json({
            success: true,
            message: 'Batch verified but blockchain attestation failed',
            warning: 'Dual-blockchain attestation could not be completed. Manual attestation may be required.',
            attestationError: attestationError instanceof Error ? attestationError.message : 'Unknown error',
          });
        }
      } else {
        // Rejection - no blockchain attestation needed
        await prisma.biocharBatch.update({
          where: { id: itemId },
          data: {
            verificationStatus: newStatus,
            verifiedAt: new Date(),
            verifiedBy: agentId,
            rejectionReason: rejectionReason || null,
          },
        });
      }
    } else if (itemType === 'recycling') {
      // Recycling logs don't require blockchain attestation (yet)
      await prisma.recyclingLog.update({
        where: { id: itemId },
        data: {
          verificationStatus: newStatus,
          verifiedAt: new Date(),
          verifiedBy: agentId,
          rejectionReason: action === 'reject' ? rejectionReason : null,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid item type' },
        { status: 400 }
      );
    }

    // Build response based on verification type
    const response: Record<string, unknown> = {
      success: true,
      message: `Item ${action === 'verify' ? 'verified' : 'rejected'} successfully`,
    };

    // Include attestation data if verification was performed on biochar
    if (action === 'verify' && itemType === 'biochar' && attestationResult) {
      response.attestation = {
        hedera: {
          topicId: attestationResult.hedera.topicId,
          transactionId: attestationResult.hedera.transactionId,
          consensusTimestamp: attestationResult.hedera.consensusTimestamp,
          messageHash: attestationResult.hedera.messageHash,
          explorerUrl: `https://hashscan.io/mainnet/transaction/${attestationResult.hedera.transactionId}`,
        },
        polygon: {
          tokenId: attestationResult.polygon.tokenId,
          transactionHash: attestationResult.polygon.transactionHash,
          contractAddress: attestationResult.polygon.contractAddress,
          tokenUri: 'Stored in database (base64 encoded)',
          fractionalUnits: attestationResult.polygon.fractionalUnits,
          explorerUrl: `https://polygonscan.com/tx/${attestationResult.polygon.transactionHash}`,
        },
        crossChain: {
          attestationId: attestationResult.crossChainMetadata.attestationId,
          totalCdrTonnes: attestationResult.crossChainMetadata.totalCdrTonnes,
          fractionalPrecision: attestationResult.crossChainMetadata.fractionalPrecision,
          hederaToPolygonLink: attestationResult.crossChainMetadata.hederaToPolygonLink,
          polygonToHederaLink: attestationResult.crossChainMetadata.polygonToHederaLink,
        },
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process verification' },
      { status: 500 }
    );
  }
}
