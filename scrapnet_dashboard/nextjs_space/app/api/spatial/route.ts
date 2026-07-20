import { NextRequest, NextResponse } from 'next/server';
import {
  parsePlyFile,
  parsePlyHeader,
  SPATIAL_PARSER_ENGINE,
} from '@/lib/ply-parser';
import { anchorToChain, hashForAnchor, getNotaryStatus } from '@/lib/solana-notary';

export const dynamic = 'force-dynamic';

/**
 * SPATIAL HERITAGE PARSER API
 *
 * GET  → Parser status and capabilities
 * POST → Parse a PLY file buffer and return spatial analysis + carbon estimates
 */

export async function GET() {
  try {
    const notaryStatus = getNotaryStatus();

    return NextResponse.json({
      engine: SPATIAL_PARSER_ENGINE,
      status: 'ONLINE',
      notaryAvailable: notaryStatus.configured,
      capabilities: {
        formats: SPATIAL_PARSER_ENGINE.supportedFormats,
        gaussianSplatDetection: SPATIAL_PARSER_ENGINE.gaussianSplatDetection,
        materialDensities: SPATIAL_PARSER_ENGINE.materialDensities,
        emissionFactors: SPATIAL_PARSER_ENGINE.emissionFactors,
        outputFields: [
          'boundingBox',
          'surfaceArea',
          'estimatedVolume',
          'pointDensity',
          'materialEstimate (asphalt/aggregate/concrete)',
          'carbonEstimate (kgCO2e per material)',
          'integrityHash',
        ],
      },
    });
  } catch (error: any) {
    console.error('[Spatial API] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let fileBuffer: Buffer;
    let filename = 'upload.ply';

    if (contentType.includes('multipart/form-data')) {
      // Handle form-data upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided. Send a PLY file as form-data with key "file".' },
          { status: 400 }
        );
      }

      filename = file.name || 'upload.ply';
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      // Handle base64-encoded PLY in JSON body
      const body = await request.json();
      const { fileBase64, fileName } = body;

      if (!fileBase64) {
        return NextResponse.json(
          { error: 'Missing fileBase64 in request body' },
          { status: 400 }
        );
      }

      filename = fileName || 'upload.ply';
      fileBuffer = Buffer.from(fileBase64, 'base64');
    } else {
      // Raw binary body
      const arrayBuffer = await request.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }

    // Validate it's a PLY file
    const magic = fileBuffer.subarray(0, 3).toString('ascii');
    if (magic !== 'ply') {
      return NextResponse.json(
        { error: 'Invalid file: not a PLY file (missing "ply" magic number)' },
        { status: 400 }
      );
    }

    // Parse
    const result = parsePlyFile(fileBuffer, filename);

    // Optionally anchor to Mainnet
    let anchor = null;
    const notaryStatus = getNotaryStatus();
    if (notaryStatus.configured) {
      const anchorResult = await anchorToChain({
        type: 'SPATIAL_ATTESTATION',
        entityId: result.parseId,
        dataHash: result.integrityHash,
        carbonTonnes: result.carbonEstimate.asphaltKgCO2e / 1000,
        metadata: {
          filename,
          vertexCount: result.vertexCount,
          volume: result.estimatedVolume,
          isGaussianSplat: result.isGaussianSplat,
        },
      });

      anchor = {
        transactionSignature: anchorResult.transactionSignature,
        explorerUrl: anchorResult.explorerUrl,
        anchored: anchorResult.success,
        error: anchorResult.error,
      };
    }

    return NextResponse.json({
      success: true,
      parse: result,
      anchor,
      summary: {
        vertexCount: result.vertexCount,
        faceCount: result.faceCount,
        volumeM3: result.estimatedVolume,
        surfaceAreaM2: result.surfaceArea,
        pointDensity: result.pointDensity,
        isGaussianSplat: result.isGaussianSplat,
        asphaltTonnes: result.materialEstimate.asphaltTonnes,
        asphaltCO2eKg: result.carbonEstimate.asphaltKgCO2e,
      },
    });
  } catch (error: any) {
    console.error('[Spatial API] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse PLY file' },
      { status: 500 }
    );
  }
}
