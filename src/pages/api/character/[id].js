import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { id } = req.query
  console.log('=== CHARACTER [id] API ===')
  console.log('Método:', req.method)
  console.log('ID:', id)
  console.log('Body:', req.body)

  if (req.method === 'PUT') {
    console.log('PUT - Atualizando personagem:', id)
    try {
      const character = await prisma.character.update({
        where: { id: parseInt(id) },
        data: {
          name: req.body.name,
          age: req.body.age || null,
          gender: req.body.gender || null,
          player_name: req.body.player_name || null,
          rpg_system: req.body.rpg_system || 'classic',
          current_hit_points: req.body.current_hit_points || 0,
          max_hit_points: req.body.max_hit_points || 0
        }
      })

      console.log('PUT - Personagem atualizado:', character.id)
      return res.status(200).json({
        success: true,
        message: `Personagem ${id} atualizado com sucesso`,
        data: character
      })
    } catch (error) {
      console.error('PUT - Erro ao atualizar personagem:', error)
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar personagem'
      })
    }
  }

  if (req.method === 'DELETE') {
    console.log('DELETE - Deletando personagem:', id)
    try {
      await prisma.character.delete({
        where: { id: parseInt(id) }
      })

      console.log('DELETE - Personagem deletado com sucesso')
      return res.status(200).json({
        success: true,
        message: 'Personagem deletado com sucesso'
      })
    } catch (error) {
      console.error('DELETE - Erro ao deletar personagem:', error)
      return res.status(500).json({
        success: false,
        error: 'Erro ao deletar personagem'
      })
    }
  }

  console.log('Método não permitido:', req.method)
  res.status(404).json({ error: 'Método não permitido' })
}
