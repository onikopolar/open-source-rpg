import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed exclusivo para sistema Feiticeiros...');

  // 1. Limpar dados existentes das tabelas Feiticeiros
  await prisma.feiticeirosAttribute.deleteMany();
  console.log('Feiticeiros attributes limpos');

  // 2. Criar atributos base do sistema Feiticeiros
  const feiticeirosAttributes = [
    {
      name: 'FORÇA',
      description: 'Mede a força física do personagem',
      base_value: 10
    },
    {
      name: 'DESTREZA',
      description: 'Mede a agilidade e coordenação motora',
      base_value: 10
    },
    {
      name: 'CONSTITUIÇÃO',
      description: 'Mede a resistência física e saúde',
      base_value: 10
    },
    {
      name: 'INTELIGÊNCIA',
      description: 'Mede a capacidade cognitiva e raciocínio',
      base_value: 10
    },
    {
      name: 'SABEDORIA',
      description: 'Mede a percepção e intuição',
      base_value: 10
    },
    {
      name: 'PRESENÇA',
      description: 'Mede o carisma e influência social',
      base_value: 10
    }
  ];

  for (const attr of feiticeirosAttributes) {
    await prisma.feiticeirosAttribute.create({
      data: attr
    });
  }
  console.log('6 atributos Feiticeiros criados');

  // 3. Verificar e criar configurações específicas do Feiticeiros
  const configsToCreate = [
    {
      name: 'feiticeiros_fixed_values',
      value: JSON.stringify([15, 14, 13, 12, 11, 10])
    },
    {
      name: 'feiticeiros_tabela_custos',
      value: JSON.stringify({
        8: 0,
        9: 1,
        10: 2,
        11: 3,
        12: 4,
        13: 5,
        14: 7,
        15: 9
      })
    },
    {
      name: 'feiticeiros_metodos_criacao',
      value: JSON.stringify({
        FIXOS: { id: 'FIXOS', nome: 'Valores Fixos', descricao: 'Distribua os valores fixos entre os atributos' },
        COMPRA: { id: 'COMPRA', nome: 'Sistema de Compra', descricao: 'Compre pontos de atributo com orçamento limitado' },
        ROLAGEM: { id: 'ROLAGEM', nome: 'Rolagem de Dados', descricao: 'Role dados para determinar os atributos' }
      })
    }
  ];

  for (const config of configsToCreate) {
    const existing = await prisma.config.findUnique({
      where: { name: config.name }
    });

    if (!existing) {
      await prisma.config.create({
        data: config
      });
      console.log(`Config ${config.name} criada`);
    } else {
      console.log(`Config ${config.name} já existe, pulando...`);
    }
  }

  console.log('Seed para sistema Feiticeiros concluído com sucesso!');
  console.log('Tabelas populadas:');
  console.log('- feiticeiros_attribute (6 atributos)');
  console.log('- config (3 configurações específicas do Feiticeiros)');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });