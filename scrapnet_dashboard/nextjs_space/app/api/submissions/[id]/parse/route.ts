export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFileUrl } from '@/lib/s3';
import crypto from 'crypto';

/**
 * AI FORENSIC PARSER — "The Brain"
 *
 * Uses LLM API to extract structured data from uploaded documents:
 *  - Vendor Name
 *  - MW / Energy Delta
 *  - Material Volume & SKU
 *  - Timestamp
 *
 * Supports: PDF, CSV/XLSX (QuickBooks), DOCX, PLY/Splat
 * Maps extracted materials to ICE v4.1 coefficients for Track A.
 */

// ICE v4.1 coefficient lookup (subset for common materials)
const ICE_COEFFICIENTS: Record<string, { kgCO2ePerUnit: number; unit: string; material: string }> = {
  'asphalt': { kgCO2ePerUnit: 51.0, unit: 'tonne', material: 'Asphalt (general, A1-A3)' },
  'concrete': { kgCO2ePerUnit: 132.0, unit: 'tonne', material: 'Concrete (general, 30 MPa)' },
  'steel': { kgCO2ePerUnit: 1460.0, unit: 'tonne', material: 'Steel (general, recycled content)' },
  'aluminum': { kgCO2ePerUnit: 6670.0, unit: 'tonne', material: 'Aluminium (general, primary)' },
  'copper': { kgCO2ePerUnit: 3810.0, unit: 'tonne', material: 'Copper (general)' },
  'aggregate': { kgCO2ePerUnit: 5.27, unit: 'tonne', material: 'Aggregate (general)' },
  'bitumen': { kgCO2ePerUnit: 470.0, unit: 'tonne', material: 'Bitumen (general)' },
  'cement': { kgCO2ePerUnit: 830.0, unit: 'tonne', material: 'Cement (Portland, CEM I)' },
  'glass': { kgCO2ePerUnit: 910.0, unit: 'tonne', material: 'Glass (general)' },
  'timber': { kgCO2ePerUnit: 31.0, unit: 'tonne', material: 'Timber (general, softwood)' },
  'brick': { kgCO2ePerUnit: 230.0, unit: 'tonne', material: 'Brick (general)' },
  'insulation': { kgCO2ePerUnit: 1860.0, unit: 'tonne', material: 'Insulation (mineral wool)' },
};

function matchIceCoefficient(materialDesc: string): { kgCO2ePerUnit: number; unit: string; material: string } | null {
  const lower = materialDesc.toLowerCase();
  for (const [key, val] of Object.entries(ICE_COEFFICIENTS)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

async function parseDocumentWithLLM(
  fileContent: string,
  fileType: string,
  track: string
): Promise<Record<string, unknown>> {
  const trackPrompts: Record<string, string> = {
    TRACK_A_MATERIALS: `You are analyzing a materials invoice/receipt for carbon accounting.
Extract the following structured data:
- vendorName: The company or vendor name on the document
- materialType: The primary material (asphalt, concrete, steel, aluminum, copper, aggregate, bitumen, cement, glass, timber, brick, insulation)
- materialVolume: Numeric quantity of material
- materialUnit: Unit of measurement (tonnes, kg, m³, etc.)
- materialSku: Any SKU or product code
- energyDeltaMw: Any energy consumption figures in MW or MWh (null if not present)
- timestamp: Date of the transaction/invoice (ISO format)
- confidence: Your confidence score 0-1`,
    TRACK_B_ENERGY_179D: `You are analyzing a building energy audit or envelope document for IRS Section 179D compliance.
Extract:
- vendorName: Building owner or auditing firm
- buildingAddress: Address of the building
- buildingSqFt: Total square footage
- energyDeltaMw: Energy savings or consumption delta in MW/MWh
- hvacEfficiency: HVAC system efficiency rating if present
- envelopeRValue: Building envelope R-value if present
- lightingPowerDensity: Lighting power density if present
- timestamp: Date of audit (ISO format)
- confidence: Your confidence score 0-1`,
    TRACK_C_BIOCHAR_CDR: `You are analyzing a biochar production receipt for Carbon Dioxide Removal (CDR) credit calculation.
Extract:
- vendorName: Producer or facility name
- feedstockType: Type of feedstock used
- dryWeightKg: Dry weight of biochar in kg
- pyrolysisTemp: Pyrolysis temperature in Celsius
- cdrCreditsTonnes: CDR credits if specified
- materialVolume: Volume of biochar produced
- materialUnit: Unit (kg, tonnes)
- timestamp: Date of production (ISO format)
- confidence: Your confidence score 0-1`,
  };

  const systemPrompt = trackPrompts[track] || trackPrompts.TRACK_A_MATERIALS;

  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            fileType === 'pdf'
              ? [
                  {
                    type: 'file',
                    file: {
                      filename: 'document.pdf',
                      file_data: `data:application/pdf;base64,${fileContent}`,
                    },
                  },
                  {
                    type: 'text',
                    text: 'Parse this document and extract the data according to your instructions. Respond with raw JSON only.',
                  },
                ]
              : `Here is the document content:\n\n${fileContent}\n\nParse this and extract the data according to your instructions. Respond with raw JSON only. Do not include code blocks or markdown.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in LLM response');

  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Failed to parse LLM JSON response');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { documents: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.documents.length === 0) {
      return NextResponse.json({ error: 'No documents to parse' }, { status: 400 });
    }

    const allResults: Record<string, unknown>[] = [];

    for (const doc of submission.documents) {
      if (doc.parsed) continue;

      let fileContent = '';
      const fileType = doc.fileType.toLowerCase();

      // Get file from S3
      const fileUrl = await getFileUrl(doc.cloudStoragePath, false);
      const fileResponse = await fetch(fileUrl);

      if (!fileResponse.ok) {
        console.error(`[Parser] Failed to fetch file ${doc.fileName}`);
        continue;
      }

      if (fileType === 'pdf') {
        // Base64 encode for LLM
        const buffer = await fileResponse.arrayBuffer();
        fileContent = Buffer.from(buffer).toString('base64');
      } else if (fileType === 'csv') {
        fileContent = await fileResponse.text();
      } else if (fileType === 'xlsx') {
        const XLSX = await import('xlsx');
        const buffer = await fileResponse.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        fileContent = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet]);
      } else if (fileType === 'docx') {
        const mammoth = await import('mammoth');
        const buffer = Buffer.from(await fileResponse.arrayBuffer());
        const result = await mammoth.extractRawText({ buffer });
        fileContent = result.value;
      } else if (fileType === 'ply' || fileType === 'splat') {
        // For PLY/splat we pass raw text (ASCII portion) to LLM
        const buffer = await fileResponse.arrayBuffer();
        const text = Buffer.from(buffer).toString('utf-8').slice(0, 10000); // First 10K chars
        fileContent = text;
      } else {
        fileContent = await fileResponse.text();
      }

      // Parse with LLM
      const parsed = await parseDocumentWithLLM(fileContent, fileType, submission.track);
      allResults.push(parsed);

      // Update document as parsed
      await prisma.submissionDocument.update({
        where: { id: doc.id },
        data: {
          parsed: true,
          parsedAt: new Date(),
          parseResultJson: JSON.stringify(parsed),
        },
      });
    }

    // Merge results into submission-level data
    const primary = allResults[0] || {};
    const vendorName = (primary.vendorName as string) || null;
    const energyDeltaMw = primary.energyDeltaMw ? Number(primary.energyDeltaMw) : null;
    const materialVolume = primary.materialVolume ? Number(primary.materialVolume) : null;
    const materialUnit = (primary.materialUnit as string) || null;
    const materialSku = (primary.materialSku as string) || null;
    const confidence = primary.confidence ? Number(primary.confidence) : null;
    const extractedTimestamp = primary.timestamp
      ? new Date(primary.timestamp as string)
      : null;

    // ICE coefficient mapping for Track A
    let iceCoefficient: number | null = null;
    let iceMaterial: string | null = null;
    let carbonTonnes: number | null = null;

    if (
      submission.track === 'TRACK_A_MATERIALS' &&
      primary.materialType &&
      materialVolume
    ) {
      const iceMatch = matchIceCoefficient(primary.materialType as string);
      if (iceMatch) {
        iceCoefficient = iceMatch.kgCO2ePerUnit;
        iceMaterial = iceMatch.material;
        carbonTonnes = (materialVolume * iceMatch.kgCO2ePerUnit) / 1000;
      }
    }

    // CDR credits for Track C
    let cdrCreditsTonnes: number | null = null;
    if (submission.track === 'TRACK_C_BIOCHAR_CDR' && primary.cdrCreditsTonnes) {
      cdrCreditsTonnes = Number(primary.cdrCreditsTonnes);
      carbonTonnes = cdrCreditsTonnes;
    }

    // Carbon value (using $50/tonne benchmark)
    const carbonValueUsd = carbonTonnes ? carbonTonnes * 50 : null;

    // 179D compliance bundle for Track B
    let irsForm7205Json: string | null = null;
    let buildingEnvelopeJson: string | null = null;
    if (submission.track === 'TRACK_B_ENERGY_179D') {
      buildingEnvelopeJson = JSON.stringify({
        address: primary.buildingAddress,
        sqFt: primary.buildingSqFt,
        hvacEfficiency: primary.hvacEfficiency,
        envelopeRValue: primary.envelopeRValue,
        lightingPowerDensity: primary.lightingPowerDensity,
      });
      irsForm7205Json = JSON.stringify({
        formVersion: '7205-2026',
        buildingAddress: primary.buildingAddress,
        grossSquareFootage: primary.buildingSqFt,
        energySavingsPercent: energyDeltaMw ? Math.min(energyDeltaMw * 10, 50) : null,
        deductionPerSqFt: energyDeltaMw ? Math.min(energyDeltaMw * 0.5, 5.0) : 0,
        totalDeduction:
          primary.buildingSqFt && energyDeltaMw
            ? Number(primary.buildingSqFt) * Math.min(Number(energyDeltaMw) * 0.5, 5.0)
            : null,
        certifyingEngineer: 'PE Sign-off Required',
        complianceDate: new Date().toISOString(),
      });
      if (energyDeltaMw) {
        carbonTonnes = energyDeltaMw * 0.419; // US grid mix
      }
    }

    // Update submission with parsed data
    const backtraceHash = crypto
      .createHash('sha256')
      .update(`${submission.submissionId}-${Date.now()}`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        vendorName,
        energyDeltaMw,
        materialVolume,
        materialUnit,
        materialSku,
        extractedTimestamp,
        parserConfidence: confidence,
        iceCoefficient,
        iceMaterial,
        carbonTonnes,
        carbonValueUsd,
        cdrCreditsTonnes,
        irsForm7205Json,
        buildingEnvelopeJson,
        parserResultJson: JSON.stringify(allResults),
        status: 'PENDING_FORENSIC_VERIFICATION',
        backtraceId: `BT-${backtraceHash.slice(0, 8)}`,
      },
      include: { documents: true, settlement: true },
    });

    return NextResponse.json({
      submission: updated,
      parseResults: allResults,
      iceMapping: iceCoefficient
        ? { coefficient: iceCoefficient, material: iceMaterial }
        : null,
    });
  } catch (error) {
    console.error('[Parser] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Parsing failed' },
      { status: 500 }
    );
  }
}
