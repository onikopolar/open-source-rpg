import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('[YearZero Setup] Iniciando setup do sistema Year Zero')
      console.log('[YearZero Setup] Versão 1.0.1 - Fix: Correção dos nomes dos modelos Prisma')
      
      const { character_id } = req.body

      if (!character_id) {
        return res.status(400).json({ error: 'ID do personagem é obrigatório' })
      }

      const charId = parseInt(character_id)

      if (isNaN(charId)) {
        return res.status(400).json({ error: 'ID do personagem inválido' })
      }

      console.log(`[YearZero Setup] Configurando personagem ID: ${charId}`)

      // Buscar atributos e skills do sistema Year Zero
      const yearZeroAttributes = await prisma.yearZeroAttribute.findMany()
      const yearZeroSkills = await prisma.yearZeroSkill.findMany()

      console.log(`[YearZero Setup] Encontrados ${yearZeroAttributes.length} atributos`)
      console.log(`[YearZero Setup] Encontradas ${yearZeroSkills.length} skills`)

      // Verificar se existem dados para vincular
      if (yearZeroAttributes.length === 0) {
        console.error('[YearZero Setup] ERRO: Nenhum atributo Year Zero encontrado no banco')
        return res.status(500).json({ error: 'Dados do sistema Year Zero não configurados' })
      }

      if (yearZeroSkills.length === 0) {
        console.error('[YearZero Setup] ERRO: Nenhuma skill Year Zero encontrada no banco')
        return res.status(500).json({ error: 'Dados do sistema Year Zero não configurados' })
      }

      // Vincular atributos ao personagem
      // NOTA: Modelo correto é yearZeroCharacterAttribute (singular)
      console.log('[YearZero Setup] Vinculando atributos...')
      
      let atributosVinculados = 0
      for (const attribute of yearZeroAttributes) {
        try {
          await prisma.yearZeroCharacterAttribute.upsert({
            where: {
              character_id_attribute_id: {
                character_id: charId,
                attribute_id: attribute.id
              }
            },
            update: {
              value: 0
            },
            create: {
              character_id: charId,
              attribute_id: attribute.id,
              value: 0
            }
          })
          atributosVinculados++
        } catch (error) {
          console.error(`[YearZero Setup] Erro ao vincular atributo ${attribute.name}:`, error.message)
        }
      }

      // Vincular skills ao personagem
      // NOTA: Modelo correto é yearZeroCharacterSkill (singular)
      console.log('[YearZero Setup] Vinculando skills...')
      
      let skillsVinculadas = 0
      for (const skill of yearZeroSkills) {
        try {
          await prisma.yearZeroCharacterSkill.upsert({
            where: {
              character_id_skill_id: {
                character_id: charId,
                skill_id: skill.id
              }
            },
            update: {
              value: 0
            },
            create: {
              character_id: charId,
              skill_id: skill.id,
              value: 0
            }
          })
          skillsVinculadas++
        } catch (error) {
          console.error(`[YearZero Setup] Erro ao vincular skill ${skill.name}:`, error.message)
        }
      }

      console.log(`[YearZero Setup] Concluído com sucesso`)
      console.log(`[YearZero Setup] Atributos vinculados: ${atributosVinculados}/${yearZeroAttributes.length}`)
      console.log(`[YearZero Setup] Skills vinculadas: ${skillsVinculadas}/${yearZeroSkills.length}`)

      res.status(200).json({
        success: true,
        message: 'Personagem configurado para sistema Year Zero Engine',
        character_id: charId,
        attributes_linked: atributosVinculados,
        skills_linked: skillsVinculadas,
        version: '1.0.1'
      })

    } catch (error) {
      console.error('[YearZero Setup] Erro crítico:', error)
      console.error('[YearZero Setup] Stack trace:', error.stack)
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message
      })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ 
      error: 'Método não permitido',
      allowed_methods: ['POST']
    })
  }
}