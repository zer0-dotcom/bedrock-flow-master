import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/biochar/history
 * Query historical batches by farmer_id and/or batch_id for auditing
 * 
 * Query params:
 *   - farmer_id: Filter by farmer ID
 *   - batch_id: Filter by batch ID (exact or partial match)
 *   - from_date: Filter batches from this date (ISO string)
 *   - to_date: Filter batches until this date (ISO string)
 *   - stability_class: Filter by stability (high, medium, low)
 *   - limit: Max records to return (default 100)
 *   - offset: Pagination offset (default 0)
 *   - include_certificate: Include parsed certificate_metadata (default true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const farmerId = searchParams.get('farmer_id');
    const batchId = searchParams.get('batch_id');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const stabilityClass = searchParams.get('stability_class');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeCertificate = searchParams.get('include_certificate') !== 'false';

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (farmerId) {
      where.farmerId = farmerId;
    }
    
    if (batchId) {
      // Support exact or partial batch ID search
      where.batchId = {
        contains: batchId,
        mode: 'insensitive',
      };
    }
    
    if (stabilityClass) {
      where.stabilityClass = stabilityClass.toLowerCase();
    }
    
    // Date range filter
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(fromDate);
      }
      if (toDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(toDate);
      }
    }

    // Fetch batches with pagination
    const [batches, total] = await Promise.all([
      prisma.biocharBatch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { farmer: true },
      }),
      prisma.biocharBatch.count({ where }),
    ]);

    // Parse certificate metadata if requested
    const formattedBatches = batches.map(batch => {
      const result: Record<string, unknown> = {
        id: batch.id,
        batch_id: batch.batchId,
        created_at: batch.createdAt.toISOString(),
        feedstock_type: batch.feedstockType,
        dry_weight_kg: batch.dryWeightKg,
        moisture_content_percent: batch.moistureContentPercent,
        pyrolysis_temperature_celsius: batch.pyrolysisTempCelsius,
        h_corg_ratio: batch.hCorgRatio,
        effective_dry_weight_kg: batch.effectiveDryWeightKg,
        biochar_yield_kg: batch.biocharYieldKg,
        cdr_credits_tonnes: batch.cdrCreditsTonnes,
        co2_equivalent_tonnes: batch.co2EquivalentTonnes,
        stability_class: batch.stabilityClass,
        permanence_years: batch.permanenceYears,
        permanence_factor: batch.permanenceFactor,
        process_compliant: batch.processCompliant,
        warnings: batch.warnings,
        feedstock_source_gps: batch.feedstockSourceGps,
        farmer_id: batch.farmerId,
        farmer_credit_amount: batch.farmerCreditAmount,
        farmer: batch.farmer ? {
          id: batch.farmer.id,
          farmer_id: batch.farmer.farmerId,
          name: batch.farmer.name,
          farm_name: batch.farmer.farmName,
          is_verified: batch.farmer.isVerified,
        } : null,
      };
      
      // Include certificate metadata if available and requested
      if (includeCertificate && batch.certificateJson) {
        try {
          result.certificate_metadata = JSON.parse(batch.certificateJson);
        } catch {
          result.certificate_metadata = null;
        }
      }
      
      // Include Hedera Guardian metadata
      try {
        result.hedera_guardian_metadata = JSON.parse(batch.hederaGuardianJson);
      } catch {
        result.hedera_guardian_metadata = null;
      }
      
      return result;
    });

    return NextResponse.json({
      success: true,
      total,
      limit,
      offset,
      has_more: offset + batches.length < total,
      batches: formattedBatches,
    });
  } catch (error) {
    console.error('Error querying biochar history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to query batch history' },
      { status: 500 }
    );
  }
}
