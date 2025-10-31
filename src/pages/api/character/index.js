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
      // Validar dados obrigatórios
      if (!req.body.name) {
        return res.status(400).json({
          success: false,
          error: 'Nome do personagem é obrigatório'
        })
      }

      // 1. Primeiro cria o personagem
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
      console.log('POST - Sistema RPG selecionado:', req.body.rpg_system || 'classic')

      // 2. Buscar todos os attributes do sistema classico
      const allAttributes = await prisma.attribute.findMany()
      console.log(`POST - Encontrados ${allAttributes.length} attributes classicos no sistema`)

      // 3. Associar todos os attributes classicos ao personagem
      if (allAttributes.length > 0) {
        for (const attr of allAttributes) {
          await prisma.characterAttributes.create({
            data: {
              character: { connect: { id: character.id } },
              attribute: { connect: { id: attr.id } },
              value: 1
            }
          })
        }
        console.log(`POST - ${allAttributes.length} attributes classicos associados ao personagem`)
      }

      // 4. Buscar todos os skills do sistema classico
      const allSkills = await prisma.skill.findMany()
      console.log(`POST - Encontrados ${allSkills.length} skills classicos no sistema`)

      // 5. Associar todos os skills classicos ao personagem
      if (allSkills.length > 0) {
        for (const skill of allSkills) {
          await prisma.characterSkills.create({
            data: {
              character: { connect: { id: character.id } },
              skill: { connect: { id: skill.id } },
              value: 0
            }
          })
        }
        console.log(`POST - ${allSkills.length} skills classicos associados ao personagem`)
      }

      // 6. SE FOR SISTEMA YEAR ZERO, criar atributos e skills Year Zero
      const isYearZeroSystem = req.body.rpg_system === 'year_zero'
      if (isYearZeroSystem) {
        console.log('POST - Sistema Year Zero detectado, criando atributos e skills Year Zero')
        
        try {
          // Buscar atributos Year Zero
          const yearZeroAttributes = await prisma.yearZeroAttribute.findMany()
          console.log(`POST - Encontrados ${yearZeroAttributes.length} atributos Year Zero`)
          
          // Vincular atributos Year Zero
          if (yearZeroAttributes.length > 0) {
            for (const attr of yearZeroAttributes) {
              await prisma.yearZeroAttributes.create({
                data: {
                  character_id: character.id,
                  attribute_id: attr.id,
                  value: 1
                }
              })
            }
            console.log(`POST - ${yearZeroAttributes.length} atributos Year Zero vinculados`)
          }
          
          // Buscar skills Year Zero
          const yearZeroSkills = await prisma.yearZeroSkill.findMany()
          console.log(`POST - Encontrados ${yearZeroSkills.length} skills Year Zero`)
          
          // Vincular skills Year Zero
          if (yearZeroSkills.length > 0) {
            for (const skill of yearZeroSkills) {
              await prisma.yearZeroSkills.create({
                data: {
                  character_id: character.id,
                  skill_id: skill.id,
                  value: 1
                }
              })
            }
            console.log(`POST - ${yearZeroSkills.length} skills Year Zero vinculados`)
          }
          
          console.log('POST - Configuracao Year Zero concluida com sucesso')
        } catch (yearZeroError) {
          console.error('POST - Erro ao configurar Year Zero:', yearZeroError)
          // Nao interrompe a criacao do personagem, apenas loga o erro
        }
      }

      // 7. Buscar o personagem completo com todas as relacoes para retornar
      const completeCharacter = await prisma.character.findUnique({
        where: { id: character.id },
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
          }
        }
      })

      const response = {
        success: true,
        message: 'Personagem criado com sucesso',
        id: character.id,
        system: req.body.rpg_system || 'classic',
        data: completeCharacter
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

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'ID do personagem invalido'
        })
      }

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
  res.status(405).json({ 
    success: false,
    error: 'Método não permitido' 
  })
}