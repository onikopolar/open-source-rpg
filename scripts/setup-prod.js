const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupProduction() {
  console.log('Iniciando configuracao do banco de dados para producao...');
  
  try {
    // Verificar se a conexão com o banco funciona
    await prisma.$connect();
    console.log('Conexao com o banco estabelecida com sucesso');

    // Executar migrações/seeds se necessário
    console.log('Setup de producao concluido');
    
  } catch (error) {
    console.error('Erro no setup de producao:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupProduction();
