// Arquivo: src/pages/api/yearzero/equipment.js
// Versão 1.0.1 - FIX: Corrigido tratamento de valores null/undefined
// FIX: Mantém string vazia como string vazia, não converte para null

import { prisma } from '../../../lib/prisma';

console.log('[API Equipment] Versão 1.0.1 - API corrigida para valores null');

export default async function handler(req, res) {
  // PUT - Atualizar equipamentos do personagem
  if (req.method === 'PUT') {
    try {
      const { character_id, field, value } = req.body;

      if (!character_id) {
        return res.status(400).json({ 
          error: 'ID do personagem é obrigatório' 
        });
      }

      if (!field) {
        return res.status(400).json({ 
          error: 'Campo a ser atualizado é obrigatório' 
        });
      }

      // Valida campos permitidos
      const allowedFields = ['equipment_notes', 'tiny_items', 'emotional_item'];
      if (!allowedFields.includes(field)) {
        return res.status(400).json({ 
          error: `Campo '${field}' não permitido. Campos permitidos: ${allowedFields.join(', ')}` 
        });
      }

      console.log(`[API Equipment] Atualizando ${field} para personagem:`, character_id);

      const charId = parseInt(character_id);
      
      if (isNaN(charId)) {
        return res.status(400).json({ 
          error: 'ID do personagem inválido' 
        });
      }

      // Verifica se o personagem existe
      const characterExists = await prisma.character.findUnique({
        where: { id: charId },
        select: { id: true }
      });

      if (!characterExists) {
        return res.status(404).json({ 
          error: 'Personagem não encontrado' 
        });
      }

      // CORREÇÃO: Tratamento robusto de valores
      let sanitizedValue = '';
      
      if (value === null || value === undefined) {
        // Se for null/undefined explicitamente, mantém string vazia
        sanitizedValue = '';
        console.log('[API Equipment] Valor null/undefined, convertendo para string vazia');
      } else if (typeof value === 'string') {
        sanitizedValue = value.trim();
        
        // Remove aspas extras que podem vir do JSON
        sanitizedValue = sanitizedValue.replace(/^"+|"+$/g, '');
        
        // CORREÇÃO: Se for string vazia após trim, mantém como string vazia
        if (sanitizedValue === '') {
          console.log('[API Equipment] String vazia detectada, mantendo como string vazia');
        }
        
        // Tenta parsear JSON se parecer ser um array ou objeto
        try {
          if ((sanitizedValue.startsWith('[') && sanitizedValue.endsWith(']')) || 
              (sanitizedValue.startsWith('{') && sanitizedValue.endsWith('}'))) {
            const parsed = JSON.parse(sanitizedValue);
            // Se parseou mas não é string, mantém o JSON stringificado
            if (typeof parsed !== 'string') {
              sanitizedValue = JSON.stringify(parsed);
            }
          }
        } catch (error) {
          // Se não conseguir parsear, mantém o valor original
          console.log('[API Equipment] Valor não é JSON válido, mantendo como string:', sanitizedValue);
        }
      } else {
        // Para outros tipos (number, boolean, etc.), converte para string
        sanitizedValue = String(value).trim();
      }

      console.log('[API Equipment] Valor final para salvar:', {
        raw: value,
        sanitized: sanitizedValue,
        type: typeof value
      });

      // Atualiza o campo específico
      const updateData = { [field]: sanitizedValue };
      
      const result = await prisma.character.update({
        where: { id: charId },
        data: updateData
      });

      const response = {
        success: true,
        data: {
          id: result.id,
          [field]: result[field] || '' // Garante que não retorne null
        }
      };

      console.log(`[API Equipment] ${field} atualizado com sucesso:`, response.data[field]);
      return res.status(200).json(response);

    } catch (error) {
      console.error('[API Equipment] Erro ao atualizar equipamentos:', error);
      return res.status(500).json({ 
        error: 'Eriro interno ao atualizar equipamentos',
        details: error.message 
      });
    }
  }

  // Método não permitido
  res.setHeader('Allow', ['PUT']);
  return res.status(405).json({ 
    error: `Método ${req.method} não permitido` 
  });
}