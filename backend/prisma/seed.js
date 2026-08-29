import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      permissions: ['ALL'],
    },
  });

  await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: {
      name: 'STAFF',
      permissions: ['READ_STUDENTS', 'WRITE_PAYMENTS'],
    },
  });

  // Create Default Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash },
    create: {
      username: 'admin',
      email: 'admin@renukaparamedical.com',
      passwordHash,
      roleId: adminRole.id,
    },
  });

  console.log(`Default Admin User created: ${adminUser.username} (password: admin123)`);

  // Create Default Institute Settings
  const existingSettings = await prisma.instituteSetting.findFirst();
  if (!existingSettings) {
    await prisma.instituteSetting.create({
      data: {
        instituteName: 'Renuka Paramedical Institute',
        logoUrl: '/logo.png',
        address: 'Shree Bussiness Building, First Floor, Chinchkar Chowk, Pragatinagar, Baramati, Maharashtra 413102',
        mobile: '+91 913048003',
        email: 'renukaparamedical@gmai.com',
      },
    });
    console.log('Default Institute Settings seeded.');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
