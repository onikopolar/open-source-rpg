const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedYearZero() {
  console.log('��� Iniciando seed do sistema Year Zero Engine...')
  
  // Atributos Year Zero
  const yearZeroAttributes = [
    { name: 'Força', description: 'Poder físico e resistência' },
    { name: 'Agilidade', description: 'Velocidade, reflexos e coordenação' },
    { name: 'Inteligência', description: 'Raciocínio, lógica e conhecimento' },
    { name: 'Empatia', description: 'Percepção social e carisma' }
  ]
  
  // Skills Year Zero
  const yearZeroSkills = [
    { name: 'COMBATE CORPO A CORPO', description: 'Luta desarmada e com armas brancas' },
    { name: 'MAQUINÁRIO PESADO', description: 'Operação de veículos e equipamentos pesados' },
    { name: 'RESISTÊNCIA', description: 'Resistência física e recuperação' },
    { name: 'COMBATE À DISTÂNCIA', description: 'Armas de fogo e arremesso' },
    { name: 'MOBILIDADE', description: 'Movimentação furtiva e acrobacias' },
    { name: 'PILOTAGEM', description: 'Controle de veículos e aeronaves' },
    { name: 'OBSERVAÇÃO', description: 'Percepção e investigação' },
    { name: 'SOBREVIVÊNCIA', description: 'Sobrevivência em ambientes hostis' },
    { name: 'TECNOLOGIA', description: 'Eletrônica, computadores e engenharia' },
    { name: 'MANIPULAÇÃO', description: 'Persuasão e engodo' },
    { name: 'COMANDO', description: 'Liderança e táticas' },
    { name: 'AJUDA MÉDICA', description: 'Primeiros socorros e medicina' }
  ]
  
  // Criar atributos
  for (const attr of yearZeroAttributes) {
    await prisma.yearZeroAttribute.upsert({
      where: { name: attr.name },
      update: {},
      create: attr
    })
    console.log(`✓ Atributo criado: ${attr.name}`)
  }
  
  // Criar skills
  for (const skill of yearZeroSkills) {
    await prisma.yearZeroSkill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill
    })
    console.log(`✓ Skill criada: ${skill.name}`)
  }
  
  console.log('✅ Seed do sistema Year Zero concluído!')
}

seedYearZero()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
