import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  console.log('=== CHARACTER API ===')
  console.log('Método:', req.method)
  console.log('URL:', req.url)
  console.log('Body:', req.body)

  if (req.method === 'POST') {
    console.log('POST - Criando personagem no banco:', req.body)
    try {
      const character = await prisma.character.create({
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

      console.log('POST - Personagem criado com ID:', character.id)

      const response = {
        success: true,
        message: 'Personagem criado com sucesso',
        id: character.id,
        data: character
      }
      console.log('POST - Resposta:', response)
      return res.status(200).json(response)
    } catch (error) {
      console.error('POST - Erro ao criar personagem:', error)
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar personagem no banco'
      })
    }
  }

  if (req.method === 'GET') {
    console.log('GET - Buscando personagens')
    try {
      const characters = await prisma.character.findMany({
        include: {
          attributes: {
            include: {
              attribute: true
            }
          },
          skills: {
            include: {
              skill: true
            }
          }
        }
      })
      console.log('GET - Personagens encontrados:', characters.length)
      return res.status(200).json(characters)
    } catch (error) {
      console.error('GET - Erro:', error)
      return res.status(500).json({ error: 'Erro ao buscar personagens' })
    }
  }

  if (req.method === 'DELETE') {
    console.log('DELETE - Deletando personagem')
    try {
      // Extrai o ID da URL (ex: /api/character/2)
      const id = parseInt(req.url.split('/').pop())

      console.log('DELETE - ID do personagem:', id)

      await prisma.character.delete({
        where: { id }
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
