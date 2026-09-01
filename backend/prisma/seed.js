import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create Roles without using upsert (avoiding transactions/replica set requirement)
  let adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        permissions: ['ALL'],
      },
    });
  }

  let staffRole = await prisma.role.findUnique({
    where: { name: 'STAFF' },
  });

  if (!staffRole) {
    await prisma.role.create({
      data: {
        name: 'STAFF',
        permissions: ['READ_STUDENTS', 'WRITE_PAYMENTS'],
      },
    });
  }

  // Create Default Admin User
  const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Renuka@2143';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultAdminPassword, salt);

  let adminUser = await prisma.user.findUnique({
    where: { username: defaultAdminUsername },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        username: defaultAdminUsername,
        email: 'admin@renukaparamedical.com',
        passwordHash,
        roleId: adminRole.id,
      },
    });
  } else {
    adminUser = await prisma.user.update({
      where: { username: defaultAdminUsername },
      data: { passwordHash },
    });
  }

  console.log(`Default Admin User created: ${adminUser.username}`);

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
