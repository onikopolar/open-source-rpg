import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { character_id } = req.body

      const charId = parseInt(character_id)

      if (isNaN(charId)) {
        return res.status(400).json({ error: 'ID do personagem inválido' })
      }

      const yearZeroAttributes = await prisma.yearZeroAttribute.findMany()
      const yearZeroSkills = await prisma.yearZeroSkill.findMany()

      console.log(`[DEBUG] YearZero Setup - Vinculando ${yearZeroAttributes.length} atributos e ${yearZeroSkills.length} skills ao personagem ${charId}`)        

      for (const attribute of yearZeroAttributes) {
        await prisma.yearZeroAttributes.upsert({
          where: {
            character_id_attribute_id: {
              character_id: charId,
              attribute_id: attribute.id
            }
          },
          update: {},
          create: {
            character_id: charId,
            attribute_id: attribute.id,
            value: 1
          }
        })
      }

      for (const skill of yearZeroSkills) {
        await prisma.yearZeroSkills.upsert({
          where: {
            character_id_skill_id: {
              character_id: charId,
              skill_id: skill.id
            }
          },
          update: {},
          create: {
            character_id: charId,
            skill_id: skill.id,
            value: 1
          }
        })
      }

      res.status(200).json({
        success: true,
        message: 'Personagem configurado para Year Zero Engine',
        attributes_linked: yearZeroAttributes.length,
        skills_linked: yearZeroSkills.length
      })

    } catch (error) {
      console.error('Erro no setup Year Zero:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}