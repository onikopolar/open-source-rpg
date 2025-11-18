import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { character_id, health_squares, stress_squares } = req.body

      const charId = parseInt(character_id)

      if (isNaN(charId)) {
        return res.status(400).json({ error: 'ID do personagem inválido' })
      }

      if (!Array.isArray(health_squares) || !Array.isArray(stress_squares)) {
        return res.status(400).json({ error: 'Health e stress squares devem ser arrays' })
      }

      const result = await prisma.character.update({
        where: { id: charId },
        data: {
          health_squares: JSON.stringify(health_squares),
          stress_squares: JSON.stringify(stress_squares)
        }
      })

      res.status(200).json({ success: true, data: result })
    } catch (error) {
      console.error('Erro ao salvar health/stress squares:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}