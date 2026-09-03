import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import {
  AETHEX_ENGINE,
  ARMORED_TRANSPORT_BASELINE,
  DIGITAL_PACKET_SPECS,
  PHYSICAL_NODE_SPECS,
  createDigitalPacket,
  createVerificationBundle,
  calculateTransportDisplacement,
  executeAethexSettlement,
  getAethexSystemSnapshot,
  DigitalPacket,
  AethexTradeSettlement,
} from '@/lib/aethex-engine';

export const dynamic = 'force-dynamic';

/**
 * AETHEX TRADE SETTLEMENT & GHG DISPLACEMENT ENGINE API
 *
 * Handles digital packet transfers, Aethex verification, and transport
 * GHG displacement calculations for Green Alpha valuation.
 *
 * Verification Layers:
 * - Guardian Layer: 2-of-2 Multi-Sig validation
 * - Stealth Layer: Zero-Knowledge Proof verification
 *
 * Calculation Logic:
 * - Input: Digital Packets transferred (current: 779)
 * - Output: CO2e saved from deprecated armored transport (current: 6.7t)
 * - Due4 Economic: -2.7 kg CO2e/mile displacement factor
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    // Engine status and configuration
    if (action === 'status') {
      const snapshot = getAethexSystemSnapshot();
      return NextResponse.json({
        engine: AETHEX_ENGINE,
        status: 'ONLINE',
        systemSnapshot: snapshot,
        verificationLayers: {
          guardianLayer: {
            type: '2-of-2 Multi-Sig',
            status: 'ACTIVE',
            nodes: ['GUARDIAN_NODE_ALPHA', 'GUARDIAN_NODE_BETA'],
          },
          stealthLayer: {
            type: 'Zero-Knowledge Proofs',
            status: 'ACTIVE',
            circuit: 'AETHEX_TRANSPORT_CIRCUIT_V1',
          },
        },
        physicalNode: {
          peakLoad: `${PHYSICAL_NODE_SPECS.peakLoadMw} MW`,
          renewableEnergy: `${PHYSICAL_NODE_SPECS.renewablePercentage * 100}%`,
          gridEmissionFactor: `${PHYSICAL_NODE_SPECS.gridEmissionFactor} kg CO2e/kWh`,
        },
      });
    }

    // Baselines and constants
    if (action === 'baselines') {
      return NextResponse.json({
        armoredTransport: ARMORED_TRANSPORT_BASELINE,
        digitalPacket: DIGITAL_PACKET_SPECS,
        physicalNode: PHYSICAL_NODE_SPECS,
        due4Economic: {
          displacementFactor: ARMORED_TRANSPORT_BASELINE.kgCO2ePerMile,
          unit: 'kg CO2e/mile',
          description: 'Carbon-intensive physical security displacement rate',
        },
      });
    }

    // Fetch settlement history
    if (action === 'settlements') {
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const status = searchParams.get('status');

      const where: Record<string, unknown> = {
        tokenType: 'AETHEX_DISPLACEMENT',
      };
      if (status) {
        where.complianceState = status === 'SETTLED' ? 'COMPLIANT' : 'FLAGGED';
      }

      const entries = await prisma.universalLedgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const settlements = entries.map((entry) => {
        const resultData = entry.resultJson ? JSON.parse(entry.resultJson as string) : {};
        return {
          settlementId: entry.entryId,
          packetCount: resultData.packetCount || 0,
          displacedMiles: resultData.displacedMiles || 0,
          co2eSavedTonnes: entry.carbonAvoidedTonnes,
          valuationUsd: entry.totalValueUsd,
          status: entry.complianceState === 'COMPLIANT' ? 'SETTLED' : 'REMEDIATION_REQUIRED',
          verificationStatus: resultData.verificationStatus || 'UNKNOWN',
          settledAt: entry.createdAt,
        };
      });

      return NextResponse.json({
        settlements,
        count: settlements.length,
        aggregates: {
          totalPackets: settlements.reduce((sum, s) => sum + s.packetCount, 0),
          totalCO2eSaved: settlements.reduce((sum, s) => sum + s.co2eSavedTonnes, 0),
          totalValue: settlements.reduce((sum, s) => sum + s.valuationUsd, 0),
        },
      });
    }

    // Calculate displacement for given parameters
    if (action === 'calculate') {
      const packetCount = parseInt(searchParams.get('packets') || '1', 10);
      const milesPerPacket = parseFloat(searchParams.get('milesPerPacket') || '125');

      // Create simulated packets for calculation
      const packets: DigitalPacket[] = [];
      for (let i = 0; i < packetCount; i++) {
        packets.push(
          createDigitalPacket(
            'ORIGIN_NODE',
            'DESTINATION_NODE',
            milesPerPacket
          )
        );
      }

      const result = calculateTransportDisplacement(packets, 'FULLY_VERIFIED');

      return NextResponse.json({
        calculation: result,
        formula: {
          description: 'CO2e Saved = Displaced Miles × Due4 Economic Factor × Reduction Factor',
          due4Factor: `${ARMORED_TRANSPORT_BASELINE.kgCO2ePerMile} kg CO2e/mile`,
          reductionFactor: `${DIGITAL_PACKET_SPECS.reductionFactor * 100}%`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Aethex Settlement GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Transfer digital packets and calculate displacement
    if (action === 'transfer-packets') {
      const { packets: packetData } = body;

      if (!packetData || !Array.isArray(packetData) || packetData.length === 0) {
        return NextResponse.json(
          { error: 'Missing packets array' },
          { status: 400 }
        );
      }

      // Create digital packets
      const packets: DigitalPacket[] = packetData.map((p: {
        originNode?: string;
        destinationNode?: string;
        displacedRouteMiles?: number;
        packetSizeKb?: number;
      }) =>
        createDigitalPacket(
          p.originNode || 'AETHEX_ORIGIN',
          p.destinationNode || 'AETHEX_DESTINATION',
          p.displacedRouteMiles || ARMORED_TRANSPORT_BASELINE.averageRouteDistanceMiles,
          p.packetSizeKb
        )
      );

      // Execute settlement
      const settlement: AethexTradeSettlement = await executeAethexSettlement(packets);

      // Record in ledger if verified
      if (settlement.status === 'SETTLED') {
        const inputHash = crypto
          .createHash('sha256')
          .update(JSON.stringify(settlement.displacementResult))
          .digest('hex');

        await prisma.universalLedgerEntry.create({
          data: {
            entryId: settlement.settlementId,
            extractionType: 'RESONANCE', // Digital transfer category
            sourceNodeId: 'AETHEX_LEDGER',
            inputHash,
            resultJson: JSON.stringify({
              packetCount: packets.length,
              displacedMiles: settlement.displacementResult.totalDisplacedMiles,
              verificationStatus: settlement.verificationBundle.verificationStatus,
              guardianSignatures: settlement.verificationBundle.guardianSignatures.length,
              zkProofVerified: settlement.verificationBundle.zkProof.verified,
            }),
            totalValueUsd: settlement.valuationUsd,
            founderYieldUsd: settlement.valuationUsd * 0.7,   // Asset Sovereign
            stewardshipUsd: settlement.valuationUsd * 0.2,     // Verification Node
            publicResilienceUsd: settlement.valuationUsd * 0.1, // Public Resilience
            carbonAvoidedTonnes: settlement.displacementResult.co2eSavedTonnes,
            complianceState: 'COMPLIANT',
            tokenType: 'AETHEX_DISPLACEMENT',
            tokenMinted: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        settlement: {
          settlementId: settlement.settlementId,
          tradeId: settlement.tradeId,
          status: settlement.status,
          valuationUsd: settlement.valuationUsd,
          layer1Hash: settlement.layer1Hash,
          settledAt: settlement.settledAt,
        },
        displacement: settlement.displacementResult,
        verification: {
          status: settlement.verificationBundle.verificationStatus,
          guardianSignatures: settlement.verificationBundle.guardianSignatures.length,
          zkProofVerified: settlement.verificationBundle.zkProof.verified,
          smartContractTriggered: settlement.verificationBundle.smartContractTriggered,
        },
        packets: packets.map((p) => ({
          packetId: p.packetId,
          displacedMiles: p.displacedRouteMiles,
          status: p.status,
        })),
      });
    }

    // Batch transfer with custom parameters
    if (action === 'batch-transfer') {
      const {
        packetCount,
        averageRouteMiles = ARMORED_TRANSPORT_BASELINE.averageRouteDistanceMiles,
        originNode = 'AETHEX_BATCH_ORIGIN',
        destinationNode = 'AETHEX_BATCH_DESTINATION',
      } = body;

      if (!packetCount || packetCount < 1) {
        return NextResponse.json(
          { error: 'packetCount must be at least 1' },
          { status: 400 }
        );
      }

      // Create batch of packets
      const packets: DigitalPacket[] = [];
      for (let i = 0; i < packetCount; i++) {
        packets.push(
          createDigitalPacket(
            originNode,
            destinationNode,
            averageRouteMiles
          )
        );
      }

      const settlement = await executeAethexSettlement(packets);

      // Record in ledger
      if (settlement.status === 'SETTLED') {
        const inputHash = crypto
          .createHash('sha256')
          .update(JSON.stringify(settlement.displacementResult))
          .digest('hex');

        await prisma.universalLedgerEntry.create({
          data: {
            entryId: settlement.settlementId,
            extractionType: 'RESONANCE',
            sourceNodeId: 'AETHEX_LEDGER',
            inputHash,
            resultJson: JSON.stringify({
              packetCount,
              displacedMiles: settlement.displacementResult.totalDisplacedMiles,
              verificationStatus: settlement.verificationBundle.verificationStatus,
              batchTransfer: true,
            }),
            totalValueUsd: settlement.valuationUsd,
            founderYieldUsd: settlement.valuationUsd * 0.7,   // Asset Sovereign
            stewardshipUsd: settlement.valuationUsd * 0.2,     // Verification Node
            publicResilienceUsd: settlement.valuationUsd * 0.1, // Public Resilience
            carbonAvoidedTonnes: settlement.displacementResult.co2eSavedTonnes,
            complianceState: 'COMPLIANT',
            tokenType: 'AETHEX_DISPLACEMENT',
            tokenMinted: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        batchSize: packetCount,
        settlement: {
          settlementId: settlement.settlementId,
          status: settlement.status,
          valuationUsd: settlement.valuationUsd,
        },
        displacement: {
          totalDisplacedMiles: settlement.displacementResult.totalDisplacedMiles,
          co2eSavedKg: settlement.displacementResult.co2eSavedKg,
          co2eSavedTonnes: settlement.displacementResult.co2eSavedTonnes,
          due4EconomicPremiumUsd: settlement.displacementResult.due4EconomicPremiumUsd,
        },
        verification: settlement.verificationBundle.verificationStatus,
      });
    }

    // Verify existing packet
    if (action === 'verify-packet') {
      const { packetId, originNode, destinationNode, displacedMiles } = body;

      if (!packetId) {
        return NextResponse.json(
          { error: 'Missing packetId' },
          { status: 400 }
        );
      }

      // Create packet for verification
      const packet: DigitalPacket = {
        packetId,
        originNode: originNode || 'UNKNOWN_ORIGIN',
        destinationNode: destinationNode || 'UNKNOWN_DESTINATION',
        transferTimestamp: new Date().toISOString(),
        packetSizeKb: DIGITAL_PACKET_SPECS.avgPacketSizeKb,
        encryptionStandard: 'AES-256-GCM',
        status: 'VERIFIED',
        displacedRouteMiles: displacedMiles || ARMORED_TRANSPORT_BASELINE.averageRouteDistanceMiles,
      };

      const verificationBundle = createVerificationBundle(packet);

      return NextResponse.json({
        success: true,
        packetId,
        verification: {
          status: verificationBundle.verificationStatus,
          guardianSignatures: verificationBundle.guardianSignatures.map((s) => ({
            signatureId: s.signatureId,
            guardianNodeId: s.guardianNodeId,
            signedAt: s.signedAt,
          })),
          zkProof: {
            proofId: verificationBundle.zkProof.proofId,
            verified: verificationBundle.zkProof.verified,
            verifiedAt: verificationBundle.zkProof.verifiedAt,
          },
          smartContractTriggered: verificationBundle.smartContractTriggered,
        },
      });
    }

    // Current system state (simulate the 779 packets / 6.7t state)
    if (action === 'get-current-state') {
      const snapshot = getAethexSystemSnapshot();

      // Calculate what current state displacement looks like
      const packets: DigitalPacket[] = [];
      for (let i = 0; i < snapshot.totalPackets; i++) {
        packets.push(
          createDigitalPacket(
            'HISTORICAL_ORIGIN',
            'HISTORICAL_DESTINATION',
            // Calculate average miles per packet to match 6.7t total
            // 6.7t = 6700kg / (779 packets × 2.7 kg/mile × 1.35 overhead) ≈ 2.34 miles avg
            // But we use actual reported baseline
            (snapshot.totalCO2eSavedTonnes * 1000) /
              (snapshot.totalPackets * ARMORED_TRANSPORT_BASELINE.kgCO2ePerMile * 1.35)
          )
        );
      }

      const currentDisplacement = calculateTransportDisplacement(packets, 'FULLY_VERIFIED');

      return NextResponse.json({
        success: true,
        currentState: {
          totalPackets: snapshot.totalPackets,
          totalCO2eSavedTonnes: snapshot.totalCO2eSavedTonnes,
          calculatedDisplacement: currentDisplacement,
        },
        baselines: {
          armoredTransport: snapshot.armoredTransportBaseline,
          physicalNode: snapshot.physicalNodeSpecs,
        },
        note: 'Current state reflects 779 digital packets with 6.7t CO2e saved from deprecated armored transport.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Aethex Settlement POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
