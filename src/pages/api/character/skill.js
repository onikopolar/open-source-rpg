import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { characterId, skillId, value } = req.body
      
      const result = await prisma.characterSkills.upsert({
        where: {
          character_id_skill_id: {
            character_id: parseInt(characterId),
            skill_id: parseInt(skillId)
          }
        },
        update: {
          value: value.toString()
        },
        create: {
          character_id: parseInt(characterId),
          skill_id: parseInt(skillId),
          value: value.toString()
        }
      })

      res.status(200).json({ success: true, data: result })
    } catch (error) {
      console.error('Erro ao salvar skill:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}
