import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      console.log('[YearZero Attribute API] Iniciando processamento')
      console.log('[YearZero Attribute API] Versao 1.0.2 - Fix: Validacao do valor 0')
      
      const { character_id, attribute_id, value } = req.body

      console.log('[YearZero Attribute API] Dados recebidos:', { character_id, attribute_id, value })

      const charId = parseInt(character_id)
      const attrId = parseInt(attribute_id)
      const numValue = parseInt(value)

      // DEBUG: Verificar o valor convertido
      console.log('[YearZero Attribute API] Valor convertido:', numValue, 'Tipo:', typeof numValue)

      if (isNaN(charId) || isNaN(attrId) || isNaN(numValue)) {
        console.error('[YearZero Attribute API] Erro de validacao: IDs ou valor invalidos')
        return res.status(400).json({ error: 'IDs e valor devem ser numeros validos' })
      }

      // CORRECAO: Permite 0 (inclusive)
      if (numValue < 0 || numValue > 6) {
        console.error('[YearZero Attribute API] Erro de validacao: Valor fora do intervalo:', numValue)
        return res.status(400).json({ error: 'Valor do atributo deve estar entre 0 e 6 (inclusive)' })
      }

      console.log(`[YearZero Attribute API] Atualizando atributo: personagem=${charId}, atributo=${attrId}, valor=${numValue}`)

      const result = await prisma.yearZeroCharacterAttribute.upsert({
        where: {
          character_id_attribute_id: {
            character_id: charId,
            attribute_id: attrId
          }
        },
        update: {
          value: numValue
        },
        create: {
          character_id: charId,
          attribute_id: attrId,
          value: numValue
        }
      })

      console.log('[YearZero Attribute API] Atributo atualizado com sucesso')
      console.log('[YearZero Attribute API] Resultado:', result)

      res.status(200).json({
        success: true,
        data: result,
        version: '1.0.2'
      })

    } catch (error) {
      console.error('[YearZero Attribute API] Erro ao salvar atributo Year Zero:', error)
      console.error('[YearZero Attribute API] Mensagem de erro:', error.message)
      res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      })
    }
  } else {
    console.error('[YearZero Attribute API] Metodo nao permitido:', req.method)
    res.setHeader('Allow', ['PUT'])
    res.status(405).json({
      error: 'Metodo nao permitido',
      allowed: ['PUT']
    })
  }
}