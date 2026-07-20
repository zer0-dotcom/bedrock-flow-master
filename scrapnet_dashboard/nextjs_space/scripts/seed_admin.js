const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'john@doe.com';
  const username = 'johndoe';
  const password = 'johndoe123';
  const passwordHash = await bcrypt.hash(password, 10);

  // Upsert so running multiple times is safe.
  const admin = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      username,
      name: 'John Doe',
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
      onboardingComplete: true,
    },
    update: {
      // Reset password & ensure flags so the user can always sign in.
      passwordHash,
      role: 'ADMIN',
      isVerified: true,
      onboardingComplete: true,
      username,
      name: 'John Doe',
    },
    select: {
      id: true, email: true, username: true, role: true, name: true,
      isVerified: true, onboardingComplete: true,
    }
  });
  console.log('Admin user ready:', JSON.stringify(admin, null, 2));

  // Verify password
  const fresh = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, fresh.passwordHash);
  console.log('Password check OK:', ok);

  // ── Kato (Founder) ────────────────────────────────────────────────
  const katoEmail = 'idecade8@gmail.com';
  const katoPassword = 'Kato2026!';
  const katoHash = await bcrypt.hash(katoPassword, 12);
  const kato = await prisma.user.upsert({
    where: { email: katoEmail },
    create: {
      email: katoEmail,
      username: 'kato',
      name: 'Kato',
      passwordHash: katoHash,
      role: 'ADMIN',
      isVerified: true,
      onboardingComplete: true,
    },
    update: {
      passwordHash: katoHash,
      role: 'ADMIN',
      isVerified: true,
      onboardingComplete: true,
      username: 'kato',
      name: 'Kato',
    },
    select: {
      id: true, email: true, username: true, role: true, name: true,
      isVerified: true, onboardingComplete: true,
    }
  });
  console.log('Kato (Founder) ready:', JSON.stringify(kato, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
