import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateMetalAvoidedEmissions, MetalCalculationInput } from '@/lib/metal-calculator';

export const dynamic = 'force-dynamic';

// GET: Fetch metal recovery logs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metalType = searchParams.get('metalType');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (metalType) where.metalType = metalType;
    if (status) where.verificationStatus = status;

    const [logs, total] = await Promise.all([
      prisma.metalRecoveryLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.metalRecoveryLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching metal logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metal recovery logs' },
      { status: 500 }
    );
  }
}

// POST: Calculate or save a new metal recovery log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // Calculate avoided emissions
    const calculationInput: MetalCalculationInput = {
      metalType: data.metalType,
      weightKg: data.weightKg,
      purityPercent: data.purityPercent,
    };
    const result = calculateMetalAvoidedEmissions(calculationInput);

    if (action === 'calculate') {
      return NextResponse.json({ calculation: result });
    }

    if (action === 'save') {
      // Generate unique log ID
      const logCount = await prisma.metalRecoveryLog.count();
      const logId = `MTL-${String(logCount + 1).padStart(6, '0')}`;

      const log = await prisma.metalRecoveryLog.create({
        data: {
          logId,
          metalType: data.metalType,
          weightKg: data.weightKg,
          purityPercent: data.purityPercent || 90,
          sourceDescription: data.sourceDescription,
          sourceLocationId: data.sourceLocationId,
          sourceGps: data.sourceGps,
          processingDate: data.processingDate ? new Date(data.processingDate) : new Date(),
          destinationLocationId: data.destinationLocationId,
          avoidedEmissionsKg: result.avoidedEmissionsKg,
          emissionFactorUsed: result.emissionFactor,
          submittedById: data.submittedById,
          notes: data.notes,
          blockchainJson: JSON.stringify(result.blockchainMetadata),
        },
      });

      return NextResponse.json({
        log,
        calculation: result,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "calculate" or "save"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing metal recovery:', error);
    return NextResponse.json(
      { error: 'Failed to process metal recovery' },
      { status: 500 }
    );
  }
}
