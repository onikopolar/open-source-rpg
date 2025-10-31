const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('INICIANDO SEED COMBINADO PARA AMBOS OS SISTEMAS')

  // 1. Limpar TODOS os dados existentes
  console.log('Limpando dados existentes...')
  await prisma.yearZeroSkills.deleteMany({})
  await prisma.yearZeroAttributes.deleteMany({})
  await prisma.characterSkills.deleteMany({})
  await prisma.characterAttributes.deleteMany({})
  await prisma.roll.deleteMany({})
  await prisma.character.deleteMany({})
  await prisma.yearZeroSkill.deleteMany({})
  await prisma.yearZeroAttribute.deleteMany({})
  await prisma.skill.deleteMany({})
  await prisma.attribute.deleteMany({})

  // 2. CRIAR SISTEMA CLASSICO
  console.log('Criando sistema classico...')
  
  // Atributos Classicos
  const classicAttributes = await prisma.attribute.createMany({
    data: [
      { name: 'Força', description: 'Poder fisico' },
      { name: 'Agilidade', description: 'Velocidade e destreza' },
      { name: 'Inteligência', description: 'Capacidade mental' },
      { name: 'Vontade', description: 'Forca de vontade' }
    ]
  })

  // Skills Classicas
  const classicSkills = await prisma.skill.createMany({
    data: [
      { name: 'Lutar', description: 'Combate corpo a corpo' },
      { name: 'Atirar', description: 'Uso de armas a distancia' },
      { name: 'Observar', description: 'Percepcao e atencao' },
      { name: 'Persuadir', description: 'Convencimento e diplomacia' }
    ]
  })

  console.log('Sistema classico criado com sucesso')

  // 3. CRIAR SISTEMA YEAR ZERO
  console.log('Criando sistema Year Zero...')
  
  // Atributos Year Zero
  const yearZeroAttributes = await prisma.yearZeroAttribute.createMany({
    data: [
      { name: 'Força', description: 'Poder fisico e combate' },
      { name: 'Agilidade', description: 'Velocidade, destreza e mobilidade' },
      { name: 'Inteligência', description: 'Inteligencia, percepcao e tecnologia' },
      { name: 'Empatia', description: 'Relacionamentos, comando e cuidados' }
    ]
  })

  // Skills Year Zero
  const yearZeroSkills = await prisma.yearZeroSkill.createMany({
    data: [
      { name: 'COMBATE CORPO A CORPO', description: 'Combate corpo a corpo' },
      { name: 'MAQUINÁRIO PESADO', description: 'Uso de maquinas pesadas e forca bruta' },
      { name: 'RESISTÊNCIA', description: 'Resistencia fisica e vigor' },
      { name: 'COMBATE À DISTÂNCIA', description: 'Combate a distancia' },
      { name: 'MOBILIDADE', description: 'Mobilidade e agilidade' },
      { name: 'PILOTAGEM', description: 'Pilotagem e movimentos sutis' },
      { name: 'OBSERVAÇÃO', description: 'Observacao e percepcao' },
      { name: 'SOBREVIVÊNCIA', description: 'Sobrevivencia em ambientes hostis' },
      { name: 'TECNOLOGIA', description: 'Uso e compreensao de tecnologia' },
      { name: 'MANIPULAÇÃO', description: 'Persuasao e influencia' },
      { name: 'COMANDO', description: 'Lideranca e comando' },
      { name: 'AJUDA MÉDICA', description: 'Primeiros socorros e medicina' }
    ]
  })

  console.log('Sistema Year Zero criado com sucesso')
  console.log('SEED COMBINADO CONCLUIDO COM SUCESSO')
}

main()
  .catch((error) => {
    console.error('ERRO NO SEED COMBINADO:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })