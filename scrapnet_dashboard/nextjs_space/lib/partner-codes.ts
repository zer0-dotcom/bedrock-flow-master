import crypto from 'crypto';
const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateCode(prefix: 'REF' | 'SPEC'): string {
  let code = '';
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 6; i++) { code += SAFE_CHARS[bytes[i] % SAFE_CHARS.length]; }
  return `${prefix}-${code}`;
}
export async function generateUniqueRefCode(prisma: any): Promise<string> {
  let code: string; let exists = true;
  while (exists) { code = generateCode('REF'); exists = !!(await prisma.partnerProfile.findUnique({ where: { refCode: code } })); }
  return code!;
}
export async function generateUniqueSpecCode(prisma: any): Promise<string> {
  let code: string; let exists = true;
  while (exists) { code = generateCode('SPEC'); exists = !!(await prisma.partnerProfile.findUnique({ where: { specCode: code } })); }
  return code!;
}
