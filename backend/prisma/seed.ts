import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_USERNAME = 'Empripanel';
const ADMIN_PASSWORD = 'Empripanel';
const ADMIN_EMAIL = 'empripanel@localhost';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const existing = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME },
    select: { id: true, role: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { username: ADMIN_USERNAME },
      data: {
        role: 'ADMIN',
        password: passwordHash,
      },
    });
    console.log(`Updated existing user "${ADMIN_USERNAME}" to role ADMIN and refreshed password.`);
  } else {
    await prisma.user.create({
      data: {
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: passwordHash,
        role: 'ADMIN',
      },
    });
    console.log(`Created dev admin user: username="${ADMIN_USERNAME}", role=ADMIN.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
