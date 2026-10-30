const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe('PRAGMA foreign_key_check;');
  console.log('Foreign key check violations:', result);
  if (Array.isArray(result) && result.length === 0) {
    console.log('SUCCESS: Database has ZERO foreign key violations.');
    process.exit(0);
  } else {
    console.error('FAILURE: Foreign key violations detected!', result);
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
