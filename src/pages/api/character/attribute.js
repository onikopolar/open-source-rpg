import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { characterId, attributeId, value } = req.body

      const result = await prisma.characterAttributes.upsert({
        where: {
          character_id_attribute_id: {
            character_id: parseInt(characterId),
            attribute_id: parseInt(attributeId)
          }
        },
        update: {
          value: parseInt(value) || 0
        },
        create: {
          character_id: parseInt(characterId),
          attribute_id: parseInt(attributeId),
          value: parseInt(value) || 0
        }
      })

      res.status(200).json({ success: true, data: result })
    } catch (error) {
      console.error('Erro ao salvar atributo:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}