import { NextRequest, NextResponse } from 'next/server';
import {
  ICE_V4_FACTORS,
  ECOINVENT_V310_FACTORS,
  GRID_MIXES,
  lookupEmissionFactor,
  lookupByCategory,
  getGridEmissionFactor,
  calculateMaterialEmissions,
  applyBiogenicCorrection,
  EMISSION_FACTOR_ENGINE,
  EmissionFactorSource,
} from '@/lib/emission-factors';

export const dynamic = 'force-dynamic';

/**
 * EMISSION FACTOR DATABASE API
 * ICE v4.1 + Ecoinvent v3.10.1 with 60% Biogenic Variance Correction
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      return NextResponse.json({
        engine: EMISSION_FACTOR_ENGINE,
        status: 'ONLINE',
        databases: {
          ice: { version: '4.1', factorCount: ICE_V4_FACTORS.length },
          ecoinvent: { version: '3.10.1', factorCount: ECOINVENT_V310_FACTORS.length },
        },
        gridMixes: GRID_MIXES.map((g) => ({
          country: g.country,
          code: g.countryCode,
          factor: g.gridEmissionFactor,
          biogenicCorrection: g.biogenicCorrectionFactor,
        })),
      });
    }

    if (action === 'lookup') {
      const material = searchParams.get('material');
      const source = searchParams.get('source') as EmissionFactorSource | null;

      if (!material) {
        return NextResponse.json(
          { error: 'Missing material query parameter' },
          { status: 400 }
        );
      }

      const factor = lookupEmissionFactor(material, source || undefined);
      return NextResponse.json({ query: material, factor });
    }

    if (action === 'category') {
      const category = searchParams.get('category');
      const source = searchParams.get('source') as EmissionFactorSource | null;

      if (!category) {
        return NextResponse.json(
          { error: 'Missing category query parameter' },
          { status: 400 }
        );
      }

      const factors = lookupByCategory(category, source || undefined);
      return NextResponse.json({ category, factors, count: factors.length });
    }

    if (action === 'grid') {
      const country = searchParams.get('country');
      if (!country) {
        return NextResponse.json({ grids: GRID_MIXES });
      }
      const grid = getGridEmissionFactor(country);
      return NextResponse.json({ countryCode: country, grid });
    }

    if (action === 'all-ice') {
      return NextResponse.json({ source: 'ICE_v4.1', factors: ICE_V4_FACTORS });
    }

    if (action === 'all-ecoinvent') {
      return NextResponse.json({ source: 'ECOINVENT_v3.10.1', factors: ECOINVENT_V310_FACTORS });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[EmissionFactors API] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'calculate') {
      const { material, quantity, countryCode, source } = body;

      if (!material || quantity === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields: material, quantity' },
          { status: 400 }
        );
      }

      const result = calculateMaterialEmissions(
        material,
        quantity,
        countryCode,
        source
      );

      return NextResponse.json({
        success: true,
        input: { material, quantity, countryCode, source },
        result: {
          factor: result.factor,
          rawEmissionsKg: result.rawEmissions,
          biogenicCorrection: result.corrected,
        },
      });
    }

    if (action === 'biogenic-correction') {
      const { totalEmissionsKg, biogenicFraction, countryCode } = body;

      if (!totalEmissionsKg || biogenicFraction === undefined || !countryCode) {
        return NextResponse.json(
          { error: 'Missing: totalEmissionsKg, biogenicFraction, countryCode' },
          { status: 400 }
        );
      }

      const result = applyBiogenicCorrection(
        totalEmissionsKg,
        biogenicFraction,
        countryCode
      );

      return NextResponse.json({ success: true, correction: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[EmissionFactors API] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
