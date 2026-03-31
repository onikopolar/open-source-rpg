const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tabletopToken.findFirst().then(token => {
  console.log('imageUrl:', token?.imageUrl);
  prisma.$disconnect();
}).catch(console.error);
