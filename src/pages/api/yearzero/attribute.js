import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { character_id, attribute_id, value } = req.body

      const charId = parseInt(character_id)
      const attrId = parseInt(attribute_id)
      const numValue = parseInt(value)

      if (isNaN(charId) || isNaN(attrId) || isNaN(numValue)) {
        return res.status(400).json({ error: 'IDs e valor devem ser números válidos' })
      }

      if (numValue < 1 || numValue > 6) {
        return res.status(400).json({ error: 'Valor do atributo deve estar entre 1 e 6' })
      }

      const result = await prisma.yearZeroAttributes.upsert({
        where: {
          character_id_attribute_id: {
            character_id: charId,
            attribute_id: attrId
          }
        },
        update: {
          value: numValue
        },
        create: {
          character_id: charId,
          attribute_id: attrId,
          value: numValue
        }
      })

      res.status(200).json(result)
    } catch (error) {
      console.error('Erro ao salvar atributo Year Zero:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.setHeader('Allow', ['PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}