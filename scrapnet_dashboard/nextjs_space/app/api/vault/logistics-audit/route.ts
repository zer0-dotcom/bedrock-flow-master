import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  calculateAvoidedLogistics,
  formatUnverifiedCreditCertificate,
  TransportMethod,
  CENTRAL_RESERVES,
  LogisticsAuditInput,
} from '@/lib/logistics-auditor';

export const dynamic = 'force-dynamic';

/**
 * Avoided Logistics Auditor API
 * 
 * Calculates CO2e avoided by tokenizing on-site instead of physical shipping.
 * Uses 2026 High-Security Logistics Factors:
 * - Air Cargo: 500g CO2/km
 * - Armored Vehicle: 180g CO2/km
 */

// POST - Calculate avoided logistics emissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      verificationId,
      originCoordinates,
      destinationCoordinates,
      destinationPreset, // Optional: Use preset Central Reserve
      transportMethod = 'ARMORED_VEHICLE',
    } = body;

    // Validate verification ID
    if (!verificationId) {
      return NextResponse.json(
        { error: 'Missing required field: verificationId' },
        { status: 400 }
      );
    }

    // Fetch verification record
    const verification = await prisma.vaultVerification.findUnique({
      where: { id: verificationId },
      include: { vaultNode: true },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Determine origin coordinates (from vault node or provided)
    let finalOrigin = originCoordinates;
    if (!finalOrigin && verification.vaultNode?.address) {
      // For demo, use NYC Federal Reserve as default origin if no coordinates
      finalOrigin = CENTRAL_RESERVES.US_FEDERAL.coordinates;
    }
    if (!finalOrigin) {
      return NextResponse.json(
        { error: 'Origin coordinates required. Provide originCoordinates or ensure vault node has address.' },
        { status: 400 }
      );
    }

    // Determine destination coordinates
    let finalDestination = destinationCoordinates;
    if (!finalDestination && destinationPreset && CENTRAL_RESERVES[destinationPreset]) {
      finalDestination = CENTRAL_RESERVES[destinationPreset].coordinates;
    }
    if (!finalDestination) {
      // Default to US Federal Reserve
      finalDestination = CENTRAL_RESERVES.US_FEDERAL.coordinates;
    }

    // Validate transport method
    const validMethods: TransportMethod[] = ['AIR_CARGO', 'ARMORED_VEHICLE'];
    if (!validMethods.includes(transportMethod)) {
      return NextResponse.json(
        { error: `Invalid transport method. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare audit input
    const auditInput: LogisticsAuditInput = {
      originCoordinates: finalOrigin,
      destinationCoordinates: finalDestination,
      transportMethod,
      totalValue: verification.totalValue,
      currencyType: verification.currencyType,
      verificationId: verification.verificationId,
      destructionHash: verification.destructionVideoHash || undefined,
    };

    // Calculate avoided logistics emissions
    const auditResult = calculateAvoidedLogistics(auditInput);

    // Format as Unverified Carbon Credit certificate
    const certificate = formatUnverifiedCreditCertificate(auditResult);

    // Update verification record with logistics data
    const updated = await prisma.vaultVerification.update({
      where: { id: verificationId },
      data: {
        originCoordinates: finalOrigin,
        destinationCoordinates: finalDestination,
        distanceKm: auditResult.distanceKm,
        transportMethod,
        avoidedCo2Grams: auditResult.avoidedEmissions.grams,
        avoidedCo2Kg: auditResult.avoidedEmissions.kilograms,
        unverifiedCredits: auditResult.credits.amount,
        creditStatus: auditResult.credits.status,
        logisticsAuditTimestamp: new Date(),
        logisticsAuditJson: JSON.stringify(certificate),
      },
    });

    return NextResponse.json({
      success: true,
      auditResult,
      certificate,
      verification: {
        id: updated.id,
        verificationId: updated.verificationId,
        status: updated.status,
        creditStatus: updated.creditStatus,
        unverifiedCredits: updated.unverifiedCredits,
      },
    });
  } catch (error) {
    console.error('Logistics audit error:', error);
    return NextResponse.json(
      { error: 'Logistics audit calculation failed' },
      { status: 500 }
    );
  }
}

// GET - Retrieve logistics audit for a verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verificationId = searchParams.get('verificationId');

    if (!verificationId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: verificationId' },
        { status: 400 }
      );
    }

    const verification = await prisma.vaultVerification.findFirst({
      where: {
        OR: [
          { id: verificationId },
          { verificationId: verificationId },
        ],
      },
      include: { vaultNode: true },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Check if logistics audit exists
    if (!verification.logisticsAuditJson) {
      return NextResponse.json({
        success: true,
        hasAudit: false,
        message: 'No logistics audit has been performed for this verification.',
        verificationId: verification.verificationId,
      });
    }

    // Parse stored audit data
    const certificate = JSON.parse(verification.logisticsAuditJson);

    return NextResponse.json({
      success: true,
      hasAudit: true,
      verification: {
        id: verification.id,
        verificationId: verification.verificationId,
        status: verification.status,
        destructionHash: verification.destructionVideoHash,
      },
      logistics: {
        originCoordinates: verification.originCoordinates,
        destinationCoordinates: verification.destinationCoordinates,
        distanceKm: verification.distanceKm,
        transportMethod: verification.transportMethod,
        avoidedCo2Grams: verification.avoidedCo2Grams,
        avoidedCo2Kg: verification.avoidedCo2Kg,
      },
      credits: {
        amount: verification.unverifiedCredits,
        status: verification.creditStatus,
        auditTimestamp: verification.logisticsAuditTimestamp,
      },
      certificate,
    });
  } catch (error) {
    console.error('Logistics audit GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve logistics audit' },
      { status: 500 }
    );
  }
}

// PUT - Update credit status when destruction hash is provided
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationId, destructionHash } = body;

    if (!verificationId || !destructionHash) {
      return NextResponse.json(
        { error: 'Missing required fields: verificationId, destructionHash' },
        { status: 400 }
      );
    }

    // Fetch current verification
    const verification = await prisma.vaultVerification.findFirst({
      where: {
        OR: [
          { id: verificationId },
          { verificationId: verificationId },
        ],
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Verify destruction hash matches
    if (verification.destructionVideoHash !== destructionHash) {
      return NextResponse.json(
        { error: 'Destruction hash does not match. Credits cannot be verified.' },
        { status: 400 }
      );
    }

    // Update credit status to VERIFIED
    const updated = await prisma.vaultVerification.update({
      where: { id: verification.id },
      data: {
        creditStatus: 'VERIFIED',
      },
    });

    // Update the stored certificate if exists
    let updatedCertificate = null;
    if (verification.logisticsAuditJson) {
      const cert = JSON.parse(verification.logisticsAuditJson);
      cert.credits.status = 'VERIFIED';
      cert.credits.statusDescription = 'Verified - Destruction Hash Confirmed';
      cert.credits.pendingVerification = null;
      cert._notice = 'Credits have been verified and are eligible for tokenization.';
      cert._verifiedAt = new Date().toISOString();
      cert._destructionHash = destructionHash;

      await prisma.vaultVerification.update({
        where: { id: verification.id },
        data: {
          logisticsAuditJson: JSON.stringify(cert),
        },
      });

      updatedCertificate = cert;
    }

    return NextResponse.json({
      success: true,
      message: 'Credits verified successfully. Destruction hash confirmed.',
      verification: {
        id: updated.id,
        verificationId: updated.verificationId,
        creditStatus: updated.creditStatus,
        unverifiedCredits: updated.unverifiedCredits,
      },
      certificate: updatedCertificate,
    });
  } catch (error) {
    console.error('Credit verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify credits' },
      { status: 500 }
    );
  }
}
