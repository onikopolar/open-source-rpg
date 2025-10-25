const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Associando atributos e pericias aos personagens...')

  try {
    const characters = await prisma.character.findMany()
    const attributes = await prisma.attribute.findMany()
    const skills = await prisma.skill.findMany()

    console.log(`Encontrados ${characters.length} personagens`)
    console.log(`Encontrados ${attributes.length} atributos`)
    console.log(`Encontrados ${skills.length} pericias`)

    for (const character of characters) {
      for (const attribute of attributes) {
        const exists = await prisma.characterAttributes.findUnique({
          where: {
            character_id_attribute_id: {
              character_id: character.id,
              attribute_id: attribute.id
            }
          }
        })

        if (!exists) {
          await prisma.characterAttributes.create({
            data: {
              character_id: character.id,
              attribute_id: attribute.id,
              value: '10'
            }
          })
        }
      }

      for (const skill of skills) {
        const exists = await prisma.characterSkills.findUnique({
          where: {
            character_id_skill_id: {
              character_id: character.id,
              skill_id: skill.id
            }
          }
        })

        if (!exists) {
          await prisma.characterSkills.create({
            data: {
              character_id: character.id,
              skill_id: skill.id,
              value: '0'
            }
          })
        }
      }
    }

    console.log('Dados associados com sucesso')

  } catch (error) {
    console.error('Erro durante a associacao:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
