export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mixType = searchParams.get('mixType');
    const greenTarget = searchParams.get('greenTarget');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};

    if (mixType && mixType !== 'all') {
      where.mixType = mixType;
    }

    if (greenTarget === 'true') {
      where.meetsGreenTarget = true;
    } else if (greenTarget === 'false') {
      where.meetsGreenTarget = false;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      plannedTonnage,
      targetRapPercentage,
      tripDistance,
      mixType,
      layerType,
      carbonCap,
      predictedCo2Emissions,
      optimalRapPercentage,
      carbonScore,
      tonsCo2Saved,
      mixRecommendation,
      meetsGreenTarget,
      carbonCapCompliance,
      gpsCoordinates,
      blockchainTimestamp,
      blockchainJson,
    } = body;

    const project = await prisma.project.create({
      data: {
        projectId,
        plannedTonnage: parseFloat(plannedTonnage),
        targetRapPercentage: parseFloat(targetRapPercentage),
        tripDistance: parseFloat(tripDistance),
        mixType,
        layerType,
        carbonCap: parseFloat(carbonCap) || 60,
        predictedCo2Emissions: parseFloat(predictedCo2Emissions),
        optimalRapPercentage: parseFloat(optimalRapPercentage),
        carbonScore: parseFloat(carbonScore),
        tonsCo2Saved: parseFloat(tonsCo2Saved),
        mixRecommendation,
        meetsGreenTarget: Boolean(meetsGreenTarget),
        carbonCapCompliance: Boolean(carbonCapCompliance),
        gpsCoordinates: gpsCoordinates || null,
        blockchainTimestamp: new Date(blockchainTimestamp),
        blockchainJson,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to save project' },
      { status: 500 }
    );
  }
}
