const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Criar atributos básicos
  const attributes = await prisma.attribute.createMany({
    data: [
      { name: 'Força', description: 'Poder físico' },
      { name: 'Agilidade', description: 'Velocidade e destreza' },
      { name: 'Inteligência', description: 'Capacidade mental' },
      { name: 'Vontade', description: 'Força de vontade' }
    ]
  })

  // Criar skills básicas
  const skills = await prisma.skill.createMany({
    data: [
      { name: 'Lutar', description: 'Combate corpo a corpo' },
      { name: 'Atirar', description: 'Uso de armas à distância' },
      { name: 'Observar', description: 'Percepção e atenção' },
      { name: 'Persuadir', description: 'Convencimento e diplomacia' }
    ]
  })

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
