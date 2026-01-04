import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { character_id, experience_squares, history_squares } = req.body

      const charId = parseInt(character_id)

      if (isNaN(charId)) {
        return res.status(400).json({ error: 'ID do personagem inválido' })
      }

      if (!Array.isArray(experience_squares) || !Array.isArray(history_squares)) {
        return res.status(400).json({ error: 'Experience e history squares devem ser arrays' })
      }

      // Verifica se experience_squares tem 10 elementos
      if (experience_squares.length !== 10) {
        return res.status(400).json({ error: 'Experience squares deve ter exatamente 10 elementos' })
      }

      // Verifica se history_squares tem 3 elementos
      if (history_squares.length !== 3) {
        return res.status(400).json({ error: 'History squares deve ter exatamente 3 elementos' })
      }

      const result = await prisma.character.update({
        where: { id: charId },
        data: {
          experience_squares: JSON.stringify(experience_squares),
          history_squares: JSON.stringify(history_squares),
          // Também atualiza os valores numéricos para compatibilidade
          experience_points: experience_squares.filter(Boolean).length,
          history_points: history_squares.filter(Boolean).length
        }
      })

      res.status(200).json({ 
        success: true, 
        data: {
          ...result,
          // Retorna os valores calculados também
          experience_value: experience_squares.filter(Boolean).length,
          history_value: history_squares.filter(Boolean).length
        }
      })
    } catch (error) {
      console.error('Erro ao salvar experience/history squares:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}