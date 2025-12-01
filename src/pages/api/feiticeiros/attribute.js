import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { characterId, attributeName, value } = req.body
      console.log('🔥 FEITICEIROS ATTRIBUTE API - Atualizando:', { characterId, attributeName, value })

      // Buscar o ID do atributo pelo nome
      const attribute = await prisma.feiticeirosAttribute.findFirst({
        where: { name: attributeName }
      })

      if (!attribute) {
        console.error('Atributo Feiticeiros não encontrado:', attributeName)
        return res.status(404).json({ error: 'Atributo não encontrado' })
      }

      const result = await prisma.feiticeirosCharacterAttribute.upsert({
        where: {
          character_id_attribute_id: {
            character_id: parseInt(characterId),
            attribute_id: attribute.id
          }
        },
        update: {
          value: parseInt(value) || 10
        },
        create: {
          character_id: parseInt(characterId),
          attribute_id: attribute.id,
          value: parseInt(value) || 10
        }
      })

      console.log('🔥 FEITICEIROS ATTRIBUTE API - Atualizado com sucesso')
      res.status(200).json({ success: true, data: result })
    } catch (error) {
      console.error('Erro ao salvar atributo Feiticeiros:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}