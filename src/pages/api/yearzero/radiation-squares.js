import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { character_id, radiation_squares } = req.body

      const charId = parseInt(character_id)

      if (isNaN(charId)) {
        return res.status(400).json({ error: 'ID do personagem inválido' })
      }

      if (!Array.isArray(radiation_squares)) {
        return res.status(400).json({ error: 'Radiation squares deve ser um array' })
      }

      const result = await prisma.character.update({
        where: { id: charId },
        data: {
          radiation_squares: JSON.stringify(radiation_squares)
        }
      })

      console.log('[Radiation API] Squares atualizados para personagem:', charId, 'valor:', radiation_squares)
      res.status(200).json({ success: true, data: result })
    } catch (error) {
      console.error('Erro ao salvar radiation squares:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}
