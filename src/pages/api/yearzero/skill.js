import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      // Log de versao
      console.log('[YearZero Skill API] Iniciando processamento')
      console.log('[YearZero Skill API] Versao 1.0.1 - Fix: Modelo yearZeroCharacterSkill')
      
      const { character_id, skill_id, value } = req.body

      console.log('[YearZero Skill API] Dados recebidos:', { character_id, skill_id, value })

      const charId = parseInt(character_id)
      const skillId = parseInt(skill_id)
      const numValue = parseInt(value)

      if (isNaN(charId) || isNaN(skillId) || isNaN(numValue)) {
        console.error('[YearZero Skill API] Erro de validacao: IDs ou valor invalidos')
        return res.status(400).json({ error: 'IDs e valor devem ser numeros validos' })
      }

      if (numValue < 0 || numValue > 6) {
        console.error('[YearZero Skill API] Erro de validacao: Valor fora do intervalo')
        return res.status(400).json({ error: 'Valor da skill deve estar entre 0 e 6' })
      }

      console.log(`[YearZero Skill API] Atualizando skill: personagem=${charId}, skill=${skillId}, valor=${numValue}`)

      // CORRECAO: Usar yearZeroCharacterSkill em vez de yearZeroSkills
      const result = await prisma.yearZeroCharacterSkill.upsert({
        where: {
          character_id_skill_id: {
            character_id: charId,
            skill_id: skillId
          }
        },
        update: {
          value: numValue
        },
        create: {
          character_id: charId,
          skill_id: skillId,
          value: numValue
        }
      })

      console.log('[YearZero Skill API] Skill atualizada com sucesso')
      console.log('[YearZero Skill API] Resultado:', result)

      res.status(200).json({ 
        success: true, 
        data: result,
        version: '1.0.1'
      })

    } catch (error) {
      console.error('[YearZero Skill API] Erro ao salvar skill Year Zero:', error)
      console.error('[YearZero Skill API] Mensagem de erro:', error.message)
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error.message 
      })
    }
  } else {
    console.error('[YearZero Skill API] Metodo nao permitido:', req.method)
    res.setHeader('Allow', ['PUT'])
    res.status(405).json({ 
      error: 'Metodo nao permitido',
      allowed: ['PUT'] 
    })
  }
}