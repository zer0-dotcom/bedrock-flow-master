import { NextRequest, NextResponse } from 'next/server';
import { calculateCarbonScore, getCarbonBalance } from '@/lib/carbon-calculator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/carbon-score
 * Calculate carbon score based on user role and input data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role, inputData } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: 'userId and role are required' },
        { status: 400 }
      );
    }

    const validRoles = ['FARMER', 'REALTOR', 'BUSINESS_OWNER', 'SOVEREIGN_INDIVIDUAL'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await calculateCarbonScore({
      userId,
      role,
      inputData: inputData || {},
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        carbonScore: result.carbonScore,
        carbonValueUsd: result.carbonValueUsd,
        universalLawSplit: {
          founderYield70: result.founderYield70,
          stewardship20: result.stewardship20,
          publicOverflow10: result.publicOverflow10,
        },
        calculationDetails: result.calculationDetails,
      },
    });
  } catch (error: any) {
    console.error('Carbon score API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/carbon-score?userId=xxx
 * Get user's current carbon balance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const carbonBalance = await getCarbonBalance(userId);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        carbonBalance,
        carbonValueUsd: carbonBalance * 85.0, // Market rate
      },
    });
  } catch (error: any) {
    console.error('Carbon balance API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
