import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { character_id, skill_id, value } = req.body

      const charId = parseInt(character_id)
      const skillId = parseInt(skill_id)
      const numValue = parseInt(value)

      if (isNaN(charId) || isNaN(skillId) || isNaN(numValue)) {
        return res.status(400).json({ error: 'IDs e valor devem ser números válidos' })
      }

      if (numValue < 0 || numValue > 6) {
        return res.status(400).json({ error: 'Valor da skill deve estar entre 1 e 6' })
      }

      const result = await prisma.yearZeroSkills.upsert({
        where: {
          character_id_skill_id: {
            character_id: charId,
            skill_id: skillId
          }
        },
        update: {
          value: numValue
        },
        create: {
          character_id: charId,
          skill_id: skillId,
          value: numValue
        }
      })

      res.status(200).json({ success: true, data: result })
    } catch (error) {
      console.error('Erro ao salvar skill Year Zero:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}