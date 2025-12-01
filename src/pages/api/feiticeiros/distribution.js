// ./src/pages/api/feiticeiros/distribution.js
import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { characterId, distributionData, metodo } = req.body
      
      console.log('🔥 FEITICEIROS DISTRIBUTION API - Atualizando distribuição:', { 
        characterId, 
        metodo,
        distributionDataCount: distributionData?.length
      })

      // DEBUG CRÍTICO: Verificar os dados recebidos
      console.log('🔥🔥🔥 DISTRIBUTION DATA COMPLETA:')
      distributionData?.forEach((attr, index) => {
        console.log(`  ${index}: ${attr.name} = ${attr.value} (tipo: ${typeof attr.value})`)
      })

      // Validar dados
      if (!characterId || !distributionData || !metodo) {
        console.error('❌ Dados inválidos:', { 
          characterId, 
          hasDistributionData: !!distributionData,
          metodo 
        })
        return res.status(400).json({ error: 'Dados inválidos' })
      }

      // Verificar se character existe
      const character = await prisma.character.findUnique({
        where: { id: parseInt(characterId) }
      })

      if (!character) {
        console.error('❌ Personagem não encontrado:', characterId)
        return res.status(404).json({ error: 'Personagem não encontrado' })
      }

      console.log('🔥 Iniciando salvamento de', distributionData.length, 'atributos...')

      // Salvar cada atributo individualmente
      const updatePromises = distributionData.map(async (attr) => {
        try {
          // VALIDAÇÃO CRÍTICA: Verificar se o valor é válido
          const attributeValue = parseInt(attr.value)
          if (isNaN(attributeValue) || attributeValue < 1 || attributeValue > 30) {
            console.error(`❌ Valor inválido para ${attr.name}:`, attr.value)
            throw new Error(`Valor inválido para ${attr.name}: ${attr.value}`)
          }

          console.log(`🔥 Salvando atributo: ${attr.name} = ${attributeValue}`)
          
          // Buscar o ID do atributo pelo nome
          const attribute = await prisma.feiticeirosAttribute.findFirst({
            where: { name: attr.name }
          })

          if (!attribute) {
            console.error('❌ Atributo não encontrado no banco:', attr.name)
            throw new Error(`Atributo não encontrado: ${attr.name}`)
          }

          // DEBUG: Verificar dados antes do upsert
          console.log(`🔍 Upsert: char=${characterId}, attr=${attribute.id}, value=${attributeValue}`)

          // Upsert do atributo do personagem - CORREÇÃO CRÍTICA AQUI
          const result = await prisma.feiticeirosCharacterAttribute.upsert({
            where: {
              character_id_attribute_id: {
                character_id: parseInt(characterId),
                attribute_id: attribute.id
              }
            },
            update: {
              value: attributeValue // ✅ USAR O VALOR DIRETO, SEM FALLBACK
            },
            create: {
              character_id: parseInt(characterId),
              attribute_id: attribute.id,
              value: attributeValue // ✅ USAR O VALOR DIRETO
            }
          })

          console.log(`✅ Atributo salvo com SUCESSO: ${attr.name} = ${result.value}`)
          return result

        } catch (error) {
          console.error(`❌ Erro ao salvar atributo ${attr.name}:`, error)
          throw error
        }
      })

      // Aguardar todas as promises dos atributos
      const results = await Promise.all(updatePromises)
      
      // Verificar se todos os atributos foram salvos
      const savedCount = results.filter(r => r !== null).length
      console.log(`✅ ${savedCount}/${distributionData.length} atributos salvos com sucesso`)

      // ✅ ATUALIZAR MÉTODO E MARCADOR DE CONCLUSÃO
      console.log('🔥 Atualizando método e marcador de conclusão:', metodo)
      const characterUpdate = await prisma.character.update({
        where: { id: parseInt(characterId) },
        data: {
          feiticeiros_metodo_criacao: metodo,
          feiticeiros_distribution_completed: true
        }
      })

      console.log('✅✅✅ DISTRIBUIÇÃO COMPLETA SALVA COM SUCESSO!')
      console.log('📊 RESUMO:')
      console.log('  - Personagem:', characterId)
      console.log('  - Método:', metodo)
      console.log('  - Atributos salvos:', savedCount)
      console.log('  - Distribution completed:', characterUpdate.feiticeiros_distribution_completed)

      res.status(200).json({ 
        success: true, 
        data: results,
        savedCount,
        message: `Distribuição de ${savedCount} atributos salva com sucesso`
      })

    } catch (error) {
      console.error('❌ ERRO CRÍTICO ao salvar distribuição Feiticeiros:', error)
      
      // Log detalhado do erro
      console.error('❌ Stack trace:', error.stack)
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
      })

      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error.message,
        code: error.code
      })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}