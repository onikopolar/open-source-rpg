// ./src/pages/api/feiticeiros/derived-values.js
import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { characterId, bonuses } = req.body
      console.log('🔥 FEITICEIROS DERIVED VALUES API - Atualizando:', { characterId, bonuses })

      // Validar dados
      if (!characterId || !bonuses) {
        return res.status(400).json({ error: 'Dados inválidos' })
      }

      // ✅ CORREÇÃO CRÍTICA: Detectar e reconstruir JSON corrompido
      let cleanBonuses = {};
      
      // Se tem propriedades numéricas, está CORROMPIDO
      const hasNumericKeys = Object.keys(bonuses).some(key => !isNaN(parseInt(key)));
      
      if (hasNumericKeys) {
        console.log('🚨 DADOS CORROMPIDOS DETECTADOS - Tentando reconstruir...');
        
        // Tentar reconstruir o JSON a partir dos caracteres
        try {
          const jsonString = Object.keys(bonuses)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(key => bonuses[key])
            .join('');
          
          console.log('🔧 String reconstruída:', jsonString);
          
          // Tentar parsear o JSON reconstruído
          const reconstructed = JSON.parse(jsonString);
          cleanBonuses = {
            atencao: parseInt(reconstructed.atencao) || 0,
            defesa: parseInt(reconstructed.defesa) || 0,
            iniciativa: parseInt(reconstructed.iniciativa) || 0,
            deslocamento: parseInt(reconstructed.deslocamento) || 0
          };
        } catch (parseError) {
          console.error('❌ Erro ao reconstruir JSON:', parseError);
          // Fallback: usar apenas propriedades não numéricas
          cleanBonuses = {
            atencao: parseInt(bonuses.atencao) || 0,
            defesa: parseInt(bonuses.defesa) || 0,
            iniciativa: parseInt(bonuses.iniciativa) || 0,
            deslocamento: parseInt(bonuses.deslocamento) || 0
          };
        }
      } else {
        // Dados normais
        cleanBonuses = {
          atencao: parseInt(bonuses.atencao) || 0,
          defesa: parseInt(bonuses.defesa) || 0,
          iniciativa: parseInt(bonuses.iniciativa) || 0,
          deslocamento: parseInt(bonuses.deslocamento) || 0
        };
      }

      console.log('🔥 FEITICEIROS DERIVED VALUES API - Dados LIMPOS:', cleanBonuses)

      // Preparar dados para atualização
      const updateData = {
        derived_values_bonuses: JSON.stringify(cleanBonuses),
        atencao_bonus: cleanBonuses.atencao,
        defesa_bonus: cleanBonuses.defesa,
        iniciativa_bonus: cleanBonuses.iniciativa,
        deslocamento_bonus: cleanBonuses.deslocamento
      }

      console.log('🔥 FEITICEIROS DERIVED VALUES API - Dados para atualização:', updateData)

      // Atualizar os bônus no character
      const result = await prisma.character.update({
        where: {
          id: parseInt(characterId)
        },
        data: updateData
      })

      console.log('🔥 FEITICEIROS DERIVED VALUES API - Atualizado com sucesso:', result.id)
      res.status(200).json({ 
        success: true, 
        data: result,
        message: 'Valores derivados atualizados com sucesso'
      })
    } catch (error) {
      console.error('Erro ao salvar derived values Feiticeiros:', error)
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error.message 
      })
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}