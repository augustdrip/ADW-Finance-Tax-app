// Prisma client - will be available after running `npx prisma generate`
// For now, using dynamic import to prevent build errors
let prisma: any;

async function getPrismaClient() {
  if (!prisma) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prisma = new PrismaClient();
    } catch (e) {
      console.error('Prisma client not generated. Run: npx prisma generate');
      throw new Error('Database not configured. Please run: npx prisma generate');
    }
  }
  return prisma;
}

export { getPrismaClient };
export default { getPrismaClient };
