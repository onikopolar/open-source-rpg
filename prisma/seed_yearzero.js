const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log(' Iniciando seed do YearZero...')

  // Criar atributos do YearZero
  const attributes = [
    { name: 'FORÇA', description: 'Poder físico, capacidade de carga e força bruta' },
    { name: 'AGILIDADE', description: 'Coordenação motora, reflexos e destreza' },
    { name: 'RACIOCÍNIO', description: 'Inteligência, percepção e raciocínio lógico' },
    { name: 'EMPATIA', description: 'Percepção social, carisma e inteligência emocional' }
  ]

  for (const attr of attributes) {
    await prisma.attribute.upsert({
      where: { name: attr.name },
      update: {},
      create: attr
    })
    console.log(` Atributo ${attr.name} criado`)
  }

  // Criar skills do YearZero
  const skills = [
    { name: 'Combate Corpo a Corpo', description: 'Lutas, armas brancas' },
    { name: 'Maquinário Pesado', description: 'Operação de equipamentos pesados' },
    { name: 'Resistência', description: 'Fôlego, resistência física' },
    { name: 'Combate à Distância', description: 'Armas de fogo, arcos' },
    { name: 'Mobilidade', description: 'Furtividade, escalada, acrobacias' },
    { name: 'Pilotagem', description: 'Veículos terrestres e aéreos' },
    { name: 'Observação', description: 'Percepção, investigação' },
    { name: 'Sobrevivência', description: 'Rastreamento, navegação' },
    { name: 'Tecnologia', description: 'Eletrônica, computadores' },
    { name: 'Manipulação', description: 'Persuasão, enganação' },
    { name: 'Comando', description: 'Liderança, intimidação' },
    { name: 'Cuidados Médicos', description: 'Primeiros socorros, medicina' }
  ]

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill
    })
    console.log(` Skill ${skill.name} criada`)
  }

  // Criar um personagem de exemplo para YearZero
  const exampleCharacter = await prisma.character.upsert({
    where: { id: 1 },
    update: {
      rpg_system: 'year_zero',
      stress_level: 0,
      trauma_level: 0,
      willpower: 0,
      experience: 0
    },
    create: {
      id: 1,
      name: 'Personagem YearZero Exemplo',
      rpg_system: 'year_zero',
      stress_level: 0,
      trauma_level: 0,
      willpower: 0,
      experience: 0
    }
  })

  console.log(' Personagem exemplo criado')

  // Associar atributos ao personagem com valores iniciais
  const attributeValues = {
    'FORÇA': 3,
    'AGILIDADE': 4, 
    'RACIOCÍNIO': 3,
    'EMPATIA': 2
  }

  for (const [attrName, value] of Object.entries(attributeValues)) {
    const attribute = await prisma.attribute.findUnique({
      where: { name: attrName }
    })

    await prisma.characterAttributes.upsert({
      where: {
        character_id_attribute_id: {
          character_id: exampleCharacter.id,
          attribute_id: attribute.id
        }
      },
      update: { value: value },
      create: {
        character_id: exampleCharacter.id,
        attribute_id: attribute.id,
        value: value
      }
    })
    console.log(` Atributo ${attrName} associado com valor ${value}`)
  }

  // Associar skills ao personagem com valores iniciais
  const skillValues = {
    'Combate Corpo a Corpo': 1,
    'Maquinário Pesado': 1,
    'Resistência': 1,
    'Combate à Distância': 1,
    'Mobilidade': 1,
    'Pilotagem': 1,
    'Observação': 1,
    'Sobrevivência': 1,
    'Tecnologia': 1,
    'Manipulação': 1,
    'Comando': 1,
    'Cuidados Médicos': 1
  }

  for (const [skillName, value] of Object.entries(skillValues)) {
    const skill = await prisma.skill.findUnique({
      where: { name: skillName }
    })

    await prisma.characterSkills.upsert({
      where: {
        character_id_skill_id: {
          character_id: exampleCharacter.id,
          skill_id: skill.id
        }
      },
      update: { value: value },
      create: {
        character_id: exampleCharacter.id,
        skill_id: skill.id,
        value: value
      }
    })
    console.log(` Skill ${skillName} associada com valor ${value}`)
  }

  console.log(' Seed do YearZero concluído!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
