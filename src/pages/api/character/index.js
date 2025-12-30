import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  console.log('=== CHARACTER API ===')
  console.log('Método:', req.method)
  console.log('URL:', req.url)
  console.log('Body:', req.body)

  if (req.method === 'POST') {
    console.log('POST - Criando personagem no banco:', req.body)
    try {
      if (!req.body.name) {
        return res.status(400).json({
          success: false,
          error: 'Nome do personagem é obrigatório'
        })
      }

      // Criar personagem sem sistema RPG - será escolhido depois
      const character = await prisma.character.create({
        data: {
          name: req.body.name,
          age: req.body.age || null,
          gender: req.body.gender || null,
          player_name: req.body.player_name || null,
          // IMPORTANTE: Criar com null - sistema será escolhido na página sheet
          rpg_system: null,
          current_hit_points: req.body.current_hit_points || 0,
          max_hit_points: req.body.max_hit_points || 0
        }
      })

      console.log('POST - Personagem criado com ID:', character.id)
      console.log('POST - Sistema RPG: null (não definido)')
      console.log('POST - Sistema será selecionado pelo usuário na página sheet')

      const response = {
        success: true,
        message: 'Personagem criado com sucesso',
        id: character.id,
        system: null,
        data: character
      }
      console.log('POST - Resposta final:', response)
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
          },
          yearzero_attributes: {
            include: {
              attribute: true
            }
          },
          yearzero_skills: {
            include: {
              skill: true
            }
          },
          feiticeiros_attributes: {
            include: {
              attribute: true
            }
          },
          feiticeiros_pericias: true,
          feiticeiros_oficios: true,
          feiticeiros_resistencias: true,
          feiticeiros_ataques: true
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
      const { id } = req.query;

      console.log('DELETE - ID do personagem:', id)

      const characterId = parseInt(id, 10);
      if (isNaN(characterId)) {
        return res.status(400).json({
          success: false,
          error: 'ID do personagem invalido'
        })
      }

      await prisma.character.delete({
        where: { id: characterId }
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
  res.status(405).json({
    success: false,
    error: 'Método não permitido'
  })
}
