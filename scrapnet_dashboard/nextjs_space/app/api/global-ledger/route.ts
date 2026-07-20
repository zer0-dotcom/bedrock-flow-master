import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper: Mask PII for privacy compliance
function maskPII(str: string | null): string | null {
  if (!str) return null;
  if (str.length <= 4) return '****';
  return str.substring(0, 2) + '*'.repeat(Math.max(str.length - 4, 2)) + str.substring(str.length - 2);
}

/**
 * Global Impact Ledger API
 * Returns aggregate statistics for the public ledger display
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Live Activity Feed
    if (action === 'activity-feed') {
      const limit = parseInt(searchParams.get('limit') || '20');
      
      // Fetch recent transactions
      const transactions = await prisma.internationalTransaction.findMany({
        where: { status: { in: ['COMPLETED', 'PENDING'] } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          transactionId: true,
          type: true,
          originatorJurisdiction: true,
          beneficiaryJurisdiction: true,
          currencyCode: true,
          amount: true,
          amountUsd: true,
          travelRuleTriggered: true,
          status: true,
          createdAt: true,
        },
      });

      // Fetch recent verifications
      const verifications = await prisma.vaultVerification.findMany({
        where: { status: { in: ['COMPLETED', 'DESTRUCTION_UPLOADED'] } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          vaultNode: {
            select: { name: true, region: true, country: true },
          },
        },
      });

      // Combine and sort by timestamp
      const activityItems = [
        ...transactions.map(tx => ({
          id: tx.id,
          type: 'TRANSACTION' as const,
          subtype: tx.type,
          timestamp: tx.createdAt,
          jurisdiction: tx.originatorJurisdiction,
          toJurisdiction: tx.beneficiaryJurisdiction,
          amount: tx.amountUsd,
          currency: 'USD',
          status: tx.status,
          travelRuleTriggered: tx.travelRuleTriggered,
          refId: tx.transactionId,
        })),
        ...verifications.map(v => ({
          id: v.id,
          type: 'VERIFICATION' as const,
          subtype: v.currencyType,
          timestamp: v.createdAt,
          jurisdiction: v.vaultNode?.region || 'UNKNOWN',
          toJurisdiction: null,
          amount: v.avoidedCo2Kg || 0,
          currency: 'CO2_KG',
          status: v.status,
          travelRuleTriggered: false,
          refId: v.verificationId,
          nodeName: v.vaultNode?.name,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return NextResponse.json({
        success: true,
        activityFeed: activityItems,
        timestamp: new Date().toISOString(),
      });
    }

    // Backtracking / Transaction Trace
    if (action === 'backtrace') {
      const txId = searchParams.get('transactionId');
      if (!txId) {
        return NextResponse.json({ error: 'transactionId required' }, { status: 400 });
      }

      const transaction = await prisma.internationalTransaction.findFirst({
        where: {
          OR: [
            { id: txId },
            { transactionId: txId },
          ],
        },
      });

      if (!transaction) {
        return NextResponse.json({ found: false, message: 'Transaction not found' });
      }

      // Build trace with privacy-compliant data
      const trace = {
        transactionId: transaction.transactionId,
        type: transaction.type,
        status: transaction.status,
        timestamp: transaction.createdAt,
        
        // Originator (masked for privacy)
        originator: {
          jurisdiction: transaction.originatorJurisdiction,
          wallet: maskPII(transaction.originatorWallet),
          name: maskPII(transaction.originatorName),
          gps: transaction.originatorGpsLat && transaction.originatorGpsLng
            ? { lat: Math.round(transaction.originatorGpsLat * 10) / 10, lng: Math.round(transaction.originatorGpsLng * 10) / 10 }
            : null,
        },
        
        // Beneficiary (masked for privacy)
        beneficiary: {
          jurisdiction: transaction.beneficiaryJurisdiction,
          wallet: maskPII(transaction.beneficiaryWallet),
          name: maskPII(transaction.beneficiaryName),
        },
        
        // Transaction details
        financial: {
          currency: transaction.currencyCode,
          amount: transaction.amount,
          amountUsd: transaction.amountUsd,
          exchangeRate: transaction.exchangeRate,
        },
        
        // Compliance
        compliance: {
          travelRuleTriggered: transaction.travelRuleTriggered,
          vatApplicable: transaction.vatApplicable,
          vatAmount: transaction.vatAmount,
          treasuryBackupRequired: transaction.treasuryBackupRequired,
          whitepaperHashRequired: transaction.whitepaperHashRequired,
        },
        
        // Credit distribution
        creditSplit: {
          bankShare: transaction.bankShare,
          platformShare: transaction.platformShare,
          sustainabilityShare: transaction.sustainabilityShare,
        },
        
        // Blockchain references
        blockchain: {
          txHash: transaction.blockchainTxHash,
          hederaTopicId: transaction.hederaTopicId,
          hederaSequenceNum: transaction.hederaSequenceNum,
        },
        
        // Privacy notice
        privacyNotice: 'Personal data masked per GDPR/CCPA. Full details available to authorized parties only.',
      };

      return NextResponse.json({
        found: true,
        trace,
      });
    }

    // Handle verification lookup
    if (action === 'lookup') {
      const tokenId = searchParams.get('tokenId');
      if (!tokenId) {
        return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
      }

      const verification = await prisma.vaultVerification.findFirst({
        where: {
          OR: [
            { id: tokenId },
            { verificationId: tokenId },
          ],
        },
        include: {
          vaultNode: {
            select: {
              name: true,
              nodeType: true,
              region: true,
              country: true,
            },
          },
        },
      });

      if (!verification) {
        return NextResponse.json({ found: false, message: 'Token not found' });
      }

      return NextResponse.json({
        found: true,
        token: {
          tokenId: verification.verificationId,
          status: verification.status,
          currencyType: verification.currencyType,
          totalValue: verification.totalValue,
          valueCurrency: verification.valueCurrency,
          destructionVideoHash: verification.destructionVideoHash,
          destructionMethod: verification.destructionMethod,
          destructionTimestamp: verification.destructionTimestamp,
          avoidedCo2Kg: verification.avoidedCo2Kg,
          creditStatus: verification.creditStatus,
          hederaAttestation: verification.logisticsAuditJson 
            ? JSON.parse(verification.logisticsAuditJson)?.auditTrail 
            : null,
          vaultNode: verification.vaultNode ? {
            name: verification.vaultNode.name,
            type: verification.vaultNode.nodeType,
            region: verification.vaultNode.region,
            country: verification.vaultNode.country,
          } : null,
          createdAt: verification.createdAt,
        },
      });
    }

    // Fetch aggregate statistics
    const [nodes, verifications, regionStats] = await Promise.all([
      // Active vault nodes with coordinates
      prisma.vaultNode.findMany({
        where: { isActive: true },
        select: {
          id: true,
          nodeId: true,
          name: true,
          nodeType: true,
          region: true,
          country: true,
          coordinates: true,
          securityLevel: true,
          _count: {
            select: { verifications: true },
          },
        },
      }),

      // Verified verifications for totals
      prisma.vaultVerification.aggregate({
        where: {
          status: { in: ['COMPLETED', 'DESTRUCTION_UPLOADED'] },
        },
        _sum: {
          totalValue: true,
          distanceKm: true,
          avoidedCo2Kg: true,
          unverifiedCredits: true,
        },
        _count: true,
      }),

      // Stats by region
      prisma.vaultVerification.groupBy({
        by: ['vaultNodeId'],
        where: {
          status: { in: ['COMPLETED', 'DESTRUCTION_UPLOADED'] },
        },
        _sum: {
          totalValue: true,
          avoidedCo2Kg: true,
        },
        _count: true,
      }),
    ]);

    // Map region stats to nodes
    const nodeStatsMap = new Map(
      regionStats.map(stat => [stat.vaultNodeId, stat])
    );

    // Aggregate by region
    const regionAggregates: Record<string, {
      totalValue: number;
      totalCo2Avoided: number;
      verificationCount: number;
      nodeCount: number;
    }> = {};

    nodes.forEach(node => {
      const region = node.region || 'Unspecified';
      if (!regionAggregates[region]) {
        regionAggregates[region] = {
          totalValue: 0,
          totalCo2Avoided: 0,
          verificationCount: 0,
          nodeCount: 0,
        };
      }
      
      const nodeStat = nodeStatsMap.get(node.id);
      regionAggregates[region].nodeCount++;
      if (nodeStat) {
        regionAggregates[region].totalValue += nodeStat._sum.totalValue || 0;
        regionAggregates[region].totalCo2Avoided += nodeStat._sum.avoidedCo2Kg || 0;
        regionAggregates[region].verificationCount += nodeStat._count || 0;
      }
    });

    // Format nodes for map display
    const mapNodes = nodes
      .filter(n => n.coordinates)
      .map(node => {
        const [lat, lng] = (node.coordinates || '0,0').split(',').map(Number);
        return {
          id: node.nodeId,
          name: node.name,
          type: node.nodeType,
          region: node.region,
          country: node.country,
          lat,
          lng,
          securityLevel: node.securityLevel,
          verifications: node._count.verifications,
        };
      });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalKmAvoided: Math.round(verifications._sum.distanceKm || 0),
        totalCo2Vested: Math.round((verifications._sum.avoidedCo2Kg || 0) * 100) / 100,
        totalCo2VestedTonnes: Math.round((verifications._sum.avoidedCo2Kg || 0) / 1000 * 100) / 100,
        totalValueDigitized: verifications._sum.totalValue || 0,
        totalVerifications: verifications._count,
        totalCredits: Math.round((verifications._sum.unverifiedCredits || 0) * 10000) / 10000,
        activeNodes: nodes.length,
      },
      regions: Object.entries(regionAggregates).map(([name, data]) => ({
        name,
        ...data,
      })),
      nodes: mapNodes,
    });
  } catch (error) {
    console.error('Global ledger API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global ledger data' },
      { status: 500 }
    );
  }
}
