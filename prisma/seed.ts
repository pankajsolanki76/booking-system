import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME;
  const adminPhone = process.env.ADMIN_PHONE;

  if (!adminEmail || !adminPassword || !adminName || !adminPhone) {
    throw new Error('❌ Missing required environment variables for seeding (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE)');
  }
  
  // Check if the default admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    // Hash the default password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        phoneNumber: adminPhone,
        password: hashedPassword,
        role: Role.ADMIN, // Set role to ADMIN
      },
    });
    
    console.log(`✅ Super Admin seeded successfully with email: ${adminEmail}`);
  } else {
    console.log(`ℹ️ Super Admin already exists (${adminEmail}). Skipping seed.`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
