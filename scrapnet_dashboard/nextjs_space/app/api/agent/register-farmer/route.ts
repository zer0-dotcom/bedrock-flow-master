import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '@/lib/resend';

export const dynamic = 'force-dynamic';

/**
 * Generates a secure temporary password
 */
function generateTempPassword(): string {
  // Generate 12 character password with mixed characters
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  const randomBytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

/**
 * POST /api/agent/register-farmer
 * Register a new farmer by an agent
 * 
 * Request body:
 *   - agentId: ID of the agent registering the farmer
 *   - fullName: Farmer's full name
 *   - username: Unique username
 *   - email: Valid email address
 *   - locationId: Assigned location ID (unified model)
 *   - yardId: DEPRECATED - use locationId instead (kept for backward compatibility)
 *   - phone: Optional phone number
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, fullName, username, email, locationId, yardId, phone } = body;

    // Support both locationId (new) and yardId (legacy)
    const assignedLocationId = locationId || yardId;

    // Validate required fields
    if (!agentId || !fullName || !username || !email || !assignedLocationId) {
      return NextResponse.json(
        { success: false, error: 'All fields are required: agentId, fullName, username, email, locationId' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Username must be 3-30 characters with only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Verify agent exists and is approved
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
    });

    if (!agent || agent.role !== 'AGENT') {
      return NextResponse.json(
        { success: false, error: 'Invalid agent' },
        { status: 403 }
      );
    }

    if (agent.agentStatus !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Your agent account is not approved yet. You cannot register farmers.' },
        { status: 403 }
      );
    }

    // Verify location exists and is active
    const location = await prisma.location.findUnique({
      where: { id: assignedLocationId },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Invalid location selected' },
        { status: 400 }
      );
    }

    if (!location.isActive) {
      return NextResponse.json(
        { success: false, error: 'This location is no longer active' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'This username is already taken' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create farmer user
    const farmer = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        name: fullName,
        phone,
        role: 'FARMER',
        isVerified: true, // Auto-verified when registered by agent
        verifiedAt: new Date(),
        locationId: assignedLocationId,
      },
    });

    // Send Farmer Welcome Kit email via Resend
    try {
      const appUrl = process.env.NEXTAUTH_URL || 'https://scrapcarbcalc.abacusai.app';
      const loginUrl = `${appUrl}/login`;
      const dashboardUrl = `${appUrl}/biochar`;
      const creditsUrl = `${appUrl}/credits`;

      const htmlBody = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0f172a;">
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%); padding: 40px 30px; text-align: center;">
            <div style="display: inline-block; background: rgba(255,255,255,0.1); padding: 12px 24px; border-radius: 50px; margin-bottom: 15px;">
              <span style="font-size: 28px;">🌱</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Bedrock ESG</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0 0; font-size: 15px;">Your Farmer Welcome Kit</p>
          </div>
          
          <div style="background: #1e293b; padding: 35px 30px;">
            <!-- Personal Greeting -->
            <p style="color: #e2e8f0; font-size: 17px; line-height: 1.7; margin: 0 0 20px 0;">
              Hi <strong style="color: #10b981;">${fullName}</strong>,
            </p>
            
            <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 25px 0;">
              Welcome to <strong style="color: white;">Bedrock ESG</strong> – the Industrial Recycling Platform where your agricultural contributions are transformed into verified Carbon Dioxide Removal (CDR) credits. You're now part of our growing network of farmers making a real impact on climate action.
            </p>

            <!-- Credentials Card -->
            <div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); border: 1px solid #10b981; padding: 25px; border-radius: 12px; margin: 25px 0;">
              <h3 style="color: #6ee7b7; margin: 0 0 18px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                🔐 Your Login Credentials
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #a7f3d0; width: 130px; font-size: 14px;">Username:</td>
                  <td style="padding: 8px 0; color: white; font-weight: 600; font-size: 15px;">${username.toLowerCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #a7f3d0; font-size: 14px;">Email:</td>
                  <td style="padding: 8px 0; color: white; font-weight: 600; font-size: 15px;">${email.toLowerCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #a7f3d0; font-size: 14px;">Password:</td>
                  <td style="padding: 8px 0;">
                    <code style="background: #10b981; color: white; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px;">${tempPassword}</code>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #a7f3d0; font-size: 14px;">Assigned Location:</td>
                  <td style="padding: 8px 0; color: white; font-weight: 600; font-size: 15px;">📍 ${location.name}${location.address ? ` (${location.address})` : ''}</td>
                </tr>
              </table>
            </div>

            <!-- Security Warning -->
            <div style="background: #422006; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
              <p style="color: #fcd34d; margin: 0; font-size: 14px; line-height: 1.5;">
                ⚠️ <strong>Security Notice:</strong> Please change your password immediately after your first login. Keep these credentials confidential.
              </p>
            </div>

            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 35px 0 30px 0;">
              <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(16,185,129,0.4);">
                🚀 Login to Your Account
              </a>
            </div>

            <!-- Quick Start Section -->
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #e2e8f0; margin: 0 0 20px 0; font-size: 18px;">
                🎯 Quick Start Guide
              </h3>
              
              <div style="margin-bottom: 18px;">
                <div style="display: flex; align-items: flex-start;">
                  <span style="background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 14px; flex-shrink: 0;">1</span>
                  <div>
                    <p style="color: white; margin: 0 0 4px 0; font-weight: 600; font-size: 15px;">Log In & Change Password</p>
                    <p style="color: #94a3b8; margin: 0; font-size: 13px;">Secure your account with a strong personal password.</p>
                  </div>
                </div>
              </div>
              
              <div style="margin-bottom: 18px;">
                <div style="display: flex; align-items: flex-start;">
                  <span style="background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 14px; flex-shrink: 0;">2</span>
                  <div>
                    <p style="color: white; margin: 0 0 4px 0; font-weight: 600; font-size: 15px;">Submit Your First Biochar Calculation</p>
                    <p style="color: #94a3b8; margin: 0; font-size: 13px;">Record your feedstock (biomass, used soil) to calculate CDR credits.</p>
                  </div>
                </div>
              </div>
              
              <div>
                <div style="display: flex; align-items: flex-start;">
                  <span style="background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 14px; flex-shrink: 0;">3</span>
                  <div>
                    <p style="color: white; margin: 0 0 4px 0; font-weight: 600; font-size: 15px;">Earn & Track Your Credits</p>
                    <p style="color: #94a3b8; margin: 0; font-size: 13px;">View your pending and issued credits, ready for blockchain tokenization.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dashboard CTA -->
            <div style="background: linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%); border: 1px solid #3b82f6; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
              <p style="color: #93c5fd; margin: 0 0 5px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Ready to Earn Credits?</p>
              <h4 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Start Your First Biochar Calculation</h4>
              <a href="${dashboardUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                🧪 Open Biochar Dashboard →
              </a>
            </div>

            <!-- What You Earn Section -->
            <div style="border-top: 1px solid #334155; padding-top: 25px; margin-top: 25px;">
              <h4 style="color: #e2e8f0; margin: 0 0 15px 0; font-size: 16px;">💰 How You Earn Credits</h4>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.7; margin: 0;">
                When you supply feedstock (agricultural waste, wood chips, used soil, or crop residues) for biochar production, you earn <strong style="color: #10b981;">60% of the calculated CDR credits</strong>. These credits are verified through the Hedera Guardian protocol and can be tokenized on the Polygon blockchain.
              </p>
            </div>

            <!-- View Credits Link -->
            <div style="text-align: center; margin-top: 25px;">
              <a href="${creditsUrl}" style="color: #10b981; font-size: 14px; text-decoration: none;">
                View Your Credits Dashboard →
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #0f172a; padding: 25px 30px; text-align: center; border-top: 1px solid #1e293b;">
            <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0;">
              Questions? Contact your registering agent or reply to this email.
            </p>
            <p style="color: #475569; font-size: 11px; margin: 0;">
              © 2026 Bedrock ESG | Industrial Recycling & Carbon Credits Platform
            </p>
          </div>
        </div>
      `;

      // Send via Resend with custom From address
      const emailResult = await sendEmail({
        to: email.toLowerCase(),
        subject: `🌱 Welcome to Bedrock ESG – Your Farmer Welcome Kit`,
        html: htmlBody,
        from: 'Bedrock ESG Onboarding <onboarding@bedrockEsg.io>',
      });

      if (!emailResult.success) {
        console.error('Failed to send welcome email via Resend:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue even if email fails - farmer is created
    }

    return NextResponse.json({
      success: true,
      message: 'Farmer registered successfully. Welcome email sent.',
      farmer: {
        id: farmer.id,
        username: farmer.username,
        email: farmer.email,
        name: farmer.name,
        locationId: farmer.locationId,
        locationName: location.name,
        locationType: location.type,
      },
      // Only include temp password in response for agent reference
      tempPassword,
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering farmer:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
