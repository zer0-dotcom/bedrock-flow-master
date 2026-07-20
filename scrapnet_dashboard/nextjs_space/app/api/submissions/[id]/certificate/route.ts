export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

/**
 * SOVEREIGN CERTIFICATE GENERATOR
 *
 * Generates a forensic PDF certificate for each verified asset.
 * Footer requirements:
 *   - Solana Tx Hash
 *   - Backtrace ID (BT-C9C4C5)
 *   - PE (Professional Engineer) sign-off block
 */

function buildCertificateHtml(submission: Record<string, unknown>, settlement: Record<string, unknown> | null): string {
  const sub = submission as Record<string, unknown>;
  const stl = settlement as Record<string, unknown> | null;
  const now = new Date().toISOString();
  const certHash = crypto.createHash('sha256').update(`${sub.submissionId}-${now}`).digest('hex').slice(0, 16).toUpperCase();

  const trackLabel: Record<string, string> = {
    TRACK_A_MATERIALS: 'Track A — Materials (Asphalt/Concrete/Metal)',
    TRACK_B_ENERGY_179D: 'Track B — 179D Energy (Real Estate)',
    TRACK_C_BIOCHAR_CDR: 'Track C — Biochar CDR',
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      padding: 40px;
      min-height: 100vh;
    }
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 48px;
      background: linear-gradient(135deg, #111111, #1a1a1a);
    }
    .header {
      text-align: center;
      border-bottom: 1px solid #2a2a2a;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #3b82f6;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .header .subtitle {
      font-size: 14px;
      color: #64748b;
      letter-spacing: 1px;
    }
    .badge {
      display: inline-block;
      background: rgba(59,130,246,0.15);
      border: 1px solid #3b82f6;
      color: #3b82f6;
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 12px;
    }
    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .data-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .data-item {
      background: rgba(255,255,255,0.03);
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .data-item .label {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .data-item .value {
      font-size: 15px;
      font-weight: 500;
      color: #e5e5e5;
    }
    .data-item .value.highlight { color: #3b82f6; font-weight: 600; }
    .data-item .value.green { color: #22c55e; font-weight: 600; }
    .settlement-bar {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .settlement-bar .segment {
      flex: 1;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
    .segment.owner { background: rgba(34,197,94,0.15); border: 1px solid #22c55e; }
    .segment.treasury { background: rgba(59,130,246,0.15); border: 1px solid #3b82f6; }
    .segment.specialist { background: rgba(168,85,247,0.15); border: 1px solid #a855f7; }
    .segment .pct { font-size: 20px; font-weight: 700; }
    .segment .amt { font-size: 13px; color: #94a3b8; margin-top: 4px; }
    .segment .lbl { font-size: 10px; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
    .footer {
      border-top: 1px solid #2a2a2a;
      padding-top: 24px;
      margin-top: 32px;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .footer-item {
      font-size: 11px;
      color: #64748b;
    }
    .footer-item .ft-val {
      font-family: monospace;
      font-size: 12px;
      color: #94a3b8;
      word-break: break-all;
      margin-top: 2px;
    }
    .pe-block {
      border: 1px dashed #3b82f6;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .pe-block .pe-title {
      font-size: 12px;
      color: #3b82f6;
      letter-spacing: 1.5px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .pe-block .pe-line {
      border-bottom: 1px solid #475569;
      width: 60%;
      margin: 16px auto 8px;
    }
    .pe-block .pe-label {
      font-size: 11px;
      color: #64748b;
    }
    .watermark {
      text-align: center;
      font-size: 10px;
      color: #374151;
      margin-top: 24px;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1>SOVEREIGN CERTIFICATE</h1>
      <div class="subtitle">BEDROCK ESG — Industrial Carbon Verification Platform</div>
      <div class="badge">${trackLabel[sub.track as string] || sub.track}</div>
    </div>

    <div class="section">
      <div class="section-title">SUBMISSION IDENTITY</div>
      <div class="data-grid">
        <div class="data-item">
          <div class="label">Submission ID</div>
          <div class="value highlight">${sub.submissionId}</div>
        </div>
        <div class="data-item">
          <div class="label">Aethexer Sentinel</div>
          <div class="value" style="font-size:11px;font-family:monospace">${sub.serviceIdentity}</div>
        </div>
        <div class="data-item">
          <div class="label">Wallet Address</div>
          <div class="value" style="font-size:12px;font-family:monospace">${sub.walletAddress}</div>
        </div>
        <div class="data-item">
          <div class="label">Company</div>
          <div class="value">${sub.companyName || 'N/A'}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">FORENSIC DATA</div>
      <div class="data-grid">
        <div class="data-item">
          <div class="label">Vendor</div>
          <div class="value">${sub.vendorName || 'N/A'}</div>
        </div>
        <div class="data-item">
          <div class="label">Material Volume</div>
          <div class="value">${sub.materialVolume || 'N/A'} ${sub.materialUnit || ''}</div>
        </div>
        <div class="data-item">
          <div class="label">Energy Delta</div>
          <div class="value">${sub.energyDeltaMw ? `${sub.energyDeltaMw} MW` : 'N/A'}</div>
        </div>
        <div class="data-item">
          <div class="label">Parser Confidence</div>
          <div class="value">${sub.parserConfidence ? `${(Number(sub.parserConfidence) * 100).toFixed(0)}%` : 'N/A'}</div>
        </div>
        <div class="data-item">
          <div class="label">Carbon Impact</div>
          <div class="value green">${sub.carbonTonnes ? `${Number(sub.carbonTonnes).toFixed(4)} tonnes CO\u2082e` : 'N/A'}</div>
        </div>
        <div class="data-item">
          <div class="label">Carbon Value</div>
          <div class="value green">${sub.carbonValueUsd ? `$${Number(sub.carbonValueUsd).toFixed(2)} USD` : 'N/A'}</div>
        </div>
      </div>
    </div>

    ${stl ? `
    <div class="section">
      <div class="section-title">70/20/10 SMART SETTLEMENT</div>
      <div class="settlement-bar">
        <div class="segment owner">
          <div class="pct" style="color:#22c55e">70%</div>
          <div class="amt">$${Number(stl.assetOwnerShare).toFixed(2)}</div>
          <div class="lbl">Asset Sovereign</div>
        </div>
        <div class="segment treasury">
          <div class="pct" style="color:#3b82f6">20%</div>
          <div class="amt">$${Number(stl.treasuryShare).toFixed(2)}</div>
          <div class="lbl">Platform Processor</div>
        </div>
        <div class="segment specialist">
          <div class="pct" style="color:#a855f7">10%</div>
          <div class="amt">$${Number(stl.specialistShare).toFixed(2)}</div>
          <div class="lbl">Public Resilience</div>
        </div>
      </div>
    </div>` : ''}

    <div class="footer">
      <div class="footer-grid">
        <div class="footer-item">
          <div>Solana Tx Hash</div>
          <div class="ft-val">${sub.solanaTxHash || 'PENDING_ANCHOR'}</div>
        </div>
        <div class="footer-item">
          <div>Backtrace ID</div>
          <div class="ft-val">${sub.backtraceId || 'BT-C9C4C5'}</div>
        </div>
        <div class="footer-item">
          <div>Certificate Hash</div>
          <div class="ft-val">${certHash}</div>
        </div>
        <div class="footer-item">
          <div>Generated</div>
          <div class="ft-val">${now}</div>
        </div>
      </div>
      <div class="pe-block">
        <div class="pe-title">PROFESSIONAL ENGINEER (PE) SIGN-OFF</div>
        <div class="pe-line"></div>
        <div class="pe-label">Licensed Professional Engineer — Signature & Stamp</div>
        <div class="pe-line"></div>
        <div class="pe-label">PE License Number &amp; State</div>
        <div class="pe-line"></div>
        <div class="pe-label">Date of Certification</div>
      </div>
    </div>
    <div class="watermark">BEDROCK ESG · AETHEXER SENTINEL · SOLANA DEVNET</div>
  </div>
</body>
</html>`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { settlement: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const html = buildCertificateHtml(
      submission as unknown as Record<string, unknown>,
      submission.settlement as unknown as Record<string, unknown> | null
    );

    // Generate PDF via HTML2PDF API
    const createResponse = await fetch(
      'https://apps.abacus.ai/api/createConvertHtmlToPdfRequest',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          html_content: html,
          pdf_options: {
            format: 'A4',
            print_background: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
          },
          base_url: process.env.NEXTAUTH_URL || '',
        }),
      }
    );

    if (!createResponse.ok) {
      const err = await createResponse.text();
      throw new Error(`PDF request creation failed: ${err}`);
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      throw new Error('No request_id returned from PDF API');
    }

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 120;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1500));

      const statusResponse = await fetch(
        'https://apps.abacus.ai/api/getConvertHtmlToPdfStatus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_id,
            deployment_token: process.env.ABACUSAI_API_KEY,
          }),
        }
      );

      const statusResult = await statusResponse.json();
      const status = statusResult?.status || 'FAILED';

      if (status === 'SUCCESS') {
        const pdfBase64 = statusResult?.result?.result;
        if (!pdfBase64) throw new Error('PDF generation completed but no data');

        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        // Hash the certificate
        const certHash = crypto
          .createHash('sha256')
          .update(pdfBuffer)
          .digest('hex');

        await prisma.submission.update({
          where: { id },
          data: { certificateHash: certHash },
        });

        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="sovereign-cert-${submission.submissionId}.pdf"`,
          },
        });
      } else if (status === 'FAILED') {
        throw new Error(
          statusResult?.result?.error || 'PDF generation failed'
        );
      }

      attempts++;
    }

    throw new Error('PDF generation timed out');
  } catch (error) {
    console.error('[Certificate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Certificate generation failed' },
      { status: 500 }
    );
  }
}
