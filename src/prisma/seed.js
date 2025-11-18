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
  await prisma.config.deleteMany({})

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

  // 4. CRIAR PERSONAGEM DE EXEMPLO COM SISTEMA YEAR ZERO
  console.log('Criando personagem de exemplo...')

  // CORREÇÃO: Usar apenas campos existentes no schema
 const exampleCharacter = await prisma.character.create({
  data: {
    name: 'Personagem Year Zero',
    rpg_system: 'year_zero',
    stress_level: 0,
    max_hit_points: 10,
    current_hit_points: 10,
    health_squares: JSON.stringify(Array(10).fill(false)),
    stress_squares: JSON.stringify(Array(10).fill(false)),
    // Campos obrigatórios com valores padrão
    current_picture: 1,
    is_dead: false
  }
})

  // Buscar atributos e skills criados
  const createdYearZeroAttributes = await prisma.yearZeroAttribute.findMany()
  const createdYearZeroSkills = await prisma.yearZeroSkill.findMany()

  // Vincular atributos ao personagem com valores iniciais
  const characterYearZeroAttributes = await prisma.yearZeroAttributes.createMany({
    data: createdYearZeroAttributes.map(attr => ({
      character_id: exampleCharacter.id,
      attribute_id: attr.id,
      value: 3 // Valor inicial padrao
    }))
  })

  // Vincular skills ao personagem com valores iniciais
  const characterYearZeroSkills = await prisma.yearZeroSkills.createMany({
    data: createdYearZeroSkills.map(skill => ({
      character_id: exampleCharacter.id,
      skill_id: skill.id,
      value: 2 // Valor inicial padrao
    }))
  })

  // 5. CRIAR CONFIGURACAO DO SISTEMA YEAR ZERO
  console.log('Criando configuracao do sistema Year Zero...')

  // Configuração das vinculações atributo-perícia
  const skillMappings = {
    strength: ['COMBATE CORPO A CORPO', 'MAQUINÁRIO PESADO', 'RESISTÊNCIA'],
    agility: ['COMBATE À DISTÂNCIA', 'MOBILIDADE', 'PILOTAGEM'],
    intelligence: ['OBSERVAÇÃO', 'SOBREVIVÊNCIA', 'TECNOLOGIA'],
    empathy: ['MANIPULAÇÃO', 'COMANDO', 'AJUDA MÉDICA']
  }

  // Salvar configurações no banco
  await prisma.config.createMany({
    data: [
      {
        name: 'YEAR_ZERO_STRENGTH_SKILLS',
        value: JSON.stringify(skillMappings.strength)
      },
      {
        name: 'YEAR_ZERO_AGILITY_SKILLS', 
        value: JSON.stringify(skillMappings.agility)
      },
      {
        name: 'YEAR_ZERO_INTELLIGENCE_SKILLS',
        value: JSON.stringify(skillMappings.intelligence)
      },
      {
        name: 'YEAR_ZERO_EMPATHY_SKILLS',
        value: JSON.stringify(skillMappings.empathy)
      },
      {
        name: 'YEAR_ZERO_STRESS_CONFIG',
        value: JSON.stringify({
          max_stress: 10,
          panic_threshold: 1,
          push_roll_stress_increment: 1
        })
      },
      {
        name: 'YEAR_ZERO_DICE_CONFIG',
        value: JSON.stringify({
          white_dice_success: 6,
          yellow_dice_success: 6,
          yellow_dice_panic: 1
        })
      }
    ]
  })

  console.log('Sistema Year Zero criado com sucesso')
  console.log('Personagem de exemplo criado com ID:', exampleCharacter.id)
  console.log('Configuracoes do sistema salvas')
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