const { PrismaClient } = require('@prisma/client');

async function testPassword(password) {
  process.env.DATABASE_URL = `postgresql://postgres:${password}@localhost:5432/attendx?schema=public`;
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log(`Password '${password}' is CORRECT`);
    await prisma.$disconnect();
    return true;
  } catch (e) {
    console.log(`Password '${password}' is wrong: ${e.message.split('\n')[0]}`);
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  const passwords = ['password', 'postgres', 'admin', 'root', '1234', ''];
  for (const p of passwords) {
    const success = await testPassword(p);
    if (success) return;
  }
}

main();
