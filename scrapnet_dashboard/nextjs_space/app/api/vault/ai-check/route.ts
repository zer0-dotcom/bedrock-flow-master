import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 2026 Currency Authenticator Database (simulated)
const SECURITY_FEATURES_DB: Record<string, string[]> = {
  USD: [
    '3D Security Ribbon',
    'Color-Shifting Ink',
    'Watermark Portrait',
    'Security Thread',
    'Microprinting',
    'Raised Printing',
    'Infrared Properties',
    'UV Fluorescence',
  ],
  EUR: [
    'Hologram Stripe',
    'Emerald Number',
    'Portrait Watermark',
    'Security Thread',
    'Raised Print',
    'Microtext',
    'UV/IR Features',
  ],
  GBP: [
    'Hologram Foil',
    'See-Through Window',
    'Microlettering',
    'UV Features',
    'Raised Print',
    'Security Thread',
  ],
  GOLD_BULLION: [
    'Assay Mark Verification',
    'Weight Tolerance (±0.01g)',
    'Purity Certification',
    'Serial Number Match',
    'XRF Spectroscopy',
    'Ultrasonic Testing',
    'Specific Gravity Test',
  ],
  SILVER_BULLION: [
    'Hallmark Verification',
    'Weight Tolerance',
    'Purity Certification',
    'Serial Number Match',
    'XRF Analysis',
  ],
};

// POST - Run AI security check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationId, scanData } = body;

    if (!verificationId) {
      return NextResponse.json(
        { error: 'Missing verificationId' },
        { status: 400 }
      );
    }

    // Fetch verification record
    const verification = await prisma.vaultVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Simulate AI analysis with 2026 Currency Authenticator
    const currencyType = verification.currencyType;
    const expectedFeatures = SECURITY_FEATURES_DB[currencyType] || SECURITY_FEATURES_DB.USD;
    
    // Simulate feature detection (in production, this would call actual scanner API)
    const detectedFeatures: string[] = [];
    const flaggedIssues: string[] = [];
    let confidenceScore = 0;

    // Simulate scan results
    expectedFeatures.forEach((feature, index) => {
      // Simulate 85-95% detection rate
      const detected = Math.random() > 0.08;
      if (detected) {
        detectedFeatures.push(feature);
      } else {
        flaggedIssues.push(`Feature not detected: ${feature}`);
      }
    });

    // Calculate confidence score
    confidenceScore = (detectedFeatures.length / expectedFeatures.length) * 100;

    // Add random variance for realism
    confidenceScore = Math.min(99.9, confidenceScore + (Math.random() * 5 - 2.5));
    confidenceScore = Math.round(confidenceScore * 10) / 10;

    // Gold-specific checks
    if (currencyType === 'GOLD_BULLION' || currencyType === 'SILVER_BULLION' || currencyType === 'PLATINUM') {
      if (verification.goldPurity) {
        const purityValid = verification.goldPurity >= 99.5 || verification.goldPurity >= 22; // karats
        if (!purityValid) {
          flaggedIssues.push(`Purity below standard: ${verification.goldPurity}`);
          confidenceScore -= 10;
        }
      }
    }

    // Determine status based on confidence
    const aiStatus = confidenceScore >= 85 ? 'AI_VERIFIED' : 'AI_FLAGGED';

    const aiResult = {
      timestamp: new Date().toISOString(),
      authenticatorVersion: '2026.3.1',
      currencyType,
      expectedFeatures,
      detectedFeatures,
      detectionRate: `${Math.round((detectedFeatures.length / expectedFeatures.length) * 100)}%`,
      confidenceScore,
      status: aiStatus,
      recommendation: confidenceScore >= 85 
        ? 'PROCEED_TO_DESTRUCTION' 
        : 'MANUAL_REVIEW_REQUIRED',
    };

    // Update verification record
    const updated = await prisma.vaultVerification.update({
      where: { id: verificationId },
      data: {
        status: aiStatus as any,
        aiCheckTimestamp: new Date(),
        aiCheckResult: JSON.stringify(aiResult),
        aiConfidenceScore: confidenceScore,
        securityFeatures: JSON.stringify(detectedFeatures),
        flaggedIssues: flaggedIssues.length > 0 ? JSON.stringify(flaggedIssues) : null,
      },
    });

    return NextResponse.json({
      success: true,
      aiResult,
      verification: updated,
    });
  } catch (error) {
    console.error('AI Check error:', error);
    return NextResponse.json({ error: 'AI verification failed' }, { status: 500 });
  }
}
