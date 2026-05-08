import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@resumeai.dev' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@resumeai.dev',
      passwordHash,
    },
  });

  console.log(`✅ Created demo user: ${user.email}`);
  console.log('🎉 Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
