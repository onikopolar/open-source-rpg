// Arquivo: src/pages/api/yearzero/conditions-consumables.js
// Versão 1.1.0 - FIX: Correção de tratamento de valores e melhor logging

import { prisma } from '../../../lib/prisma';

console.log('[API ConditionsConsumables] Versão 1.1.0 - FIX: Correção de valores e logging');

export default async function handler(req, res) {
  console.log(`[API ConditionsConsumables] ${req.method} recebido para:`, req.body || req.query);

  // PUT - Atualizar condições, consumíveis ou lesões do personagem
  if (req.method === 'PUT') {
    try {
      const { character_id, field, value } = req.body;

      console.log('[API ConditionsConsumables] Dados PUT recebidos:', { character_id, field, value });

      if (!character_id) {
        console.error('[API ConditionsConsumables] Erro: ID do personagem não fornecido');
        return res.status(400).json({ 
          error: 'ID do personagem é obrigatório' 
        });
      }

      if (!field) {
        console.error('[API ConditionsConsumables] Erro: Campo não fornecido');
        return res.status(400).json({ 
          error: 'Campo a ser atualizado é obrigatório' 
        });
      }

      // Valida campos permitidos
      const allowedFields = ['conditions', 'consumables', 'injuries'];
      
      if (!allowedFields.includes(field)) {
        console.error(`[API ConditionsConsumables] Erro: Campo '${field}' não permitido`);
        return res.status(400).json({ 
          error: `Campo '${field}' não permitido. Campos permitidos: ${allowedFields.join(', ')}` 
        });
      }

      const charId = parseInt(character_id);
      
      if (isNaN(charId)) {
        console.error('[API ConditionsConsumables] Erro: ID do personagem inválido:', character_id);
        return res.status(400).json({ 
          error: 'ID do personagem inválido' 
        });
      }

      console.log(`[API ConditionsConsumables] Validando personagem: ${charId}`);

      // Verifica se o personagem existe
      const characterExists = await prisma.character.findUnique({
        where: { id: charId },
        select: { id: true }
      });

      if (!characterExists) {
        console.error(`[API ConditionsConsumables] Erro: Personagem ${charId} não encontrado`);
        return res.status(404).json({ 
          error: 'Personagem não encontrado' 
        });
      }

      console.log(`[API ConditionsConsumables] Processando campo: ${field}, valor:`, value);

      // Tratamento direto e simplificado dos valores
      let sanitizedValue = '';

      if (field === 'conditions' || field === 'consumables') {
        // Campos de objeto
        if (value === null || value === undefined || value === '') {
          sanitizedValue = '{}';
          console.log(`[API ConditionsConsumables] ${field}: valor vazio, usando objeto vazio`);
        } else if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed === '') {
            sanitizedValue = '{}';
          } else {
            try {
              // Tenta parsear como JSON
              const parsed = JSON.parse(trimmed);
              if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                sanitizedValue = JSON.stringify(parsed);
                console.log(`[API ConditionsConsumables] ${field}: JSON válido parseado`);
              } else {
                sanitizedValue = '{}';
                console.log(`[API ConditionsConsumables] ${field}: não é objeto JSON válido`);
              }
            } catch (error) {
              sanitizedValue = '{}';
              console.log(`[API ConditionsConsumables] ${field}: erro no parse JSON, usando objeto vazio`);
            }
          }
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // Já é um objeto
          sanitizedValue = JSON.stringify(value);
          console.log(`[API ConditionsConsumables] ${field}: objeto recebido, convertendo para JSON`);
        } else {
          sanitizedValue = '{}';
          console.log(`[API ConditionsConsumables] ${field}: tipo não suportado, usando objeto vazio`);
        }
      } else if (field === 'injuries') {
        // Campo de array
        if (value === null || value === undefined || value === '') {
          sanitizedValue = '[]';
          console.log(`[API ConditionsConsumables] ${field}: valor vazio, usando array vazio`);
        } else if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed === '') {
            sanitizedValue = '[]';
          } else {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                // Limita a 2 itens como especificado no componente
                const limited = parsed.slice(0, 2);
                sanitizedValue = JSON.stringify(limited);
                console.log(`[API ConditionsConsumables] ${field}: array válido, limitado a ${limited.length} itens`);
              } else {
                sanitizedValue = '[]';
                console.log(`[API ConditionsConsumables] ${field}: não é array JSON válido`);
              }
            } catch (error) {
              sanitizedValue = '[]';
              console.log(`[API ConditionsConsumables] ${field}: erro no parse JSON, usando array vazio`);
            }
          }
        } else if (Array.isArray(value)) {
          // Já é um array
          const limited = value.slice(0, 2);
          sanitizedValue = JSON.stringify(limited);
          console.log(`[API ConditionsConsumables] ${field}: array recebido, limitado a ${limited.length} itens`);
        } else {
          sanitizedValue = '[]';
          console.log(`[API ConditionsConsumables] ${field}: tipo não suportado, usando array vazio`);
        }
      }

      console.log(`[API ConditionsConsumables] Valor final para salvar no ${field}:`, sanitizedValue);

      // Atualiza o campo específico
      const updateData = { [field]: sanitizedValue };
      
      console.log(`[API ConditionsConsumables] Atualizando banco de dados...`);
      const result = await prisma.character.update({
        where: { id: charId },
        data: updateData
      });

      // Parseia o valor salvo para retornar
      let returnValue;
      try {
        returnValue = field === 'injuries' 
          ? JSON.parse(result[field] || '[]')
          : JSON.parse(result[field] || '{}');
      } catch (error) {
        returnValue = field === 'injuries' ? [] : {};
      }

      const response = {
        success: true,
        data: {
          id: result.id,
          [field]: returnValue
        }
      };

      console.log(`[API ConditionsConsumables] ${field} atualizado com sucesso para personagem ${charId}`);
      return res.status(200).json(response);

    } catch (error) {
      console.error('[API ConditionsConsumables] Erro ao atualizar:', error);
      console.error('[API ConditionsConsumables] Stack trace:', error.stack);
      return res.status(500).json({ 
        error: 'Erro interno ao atualizar condições e consumíveis',
        details: error.message 
      });
    }
  }

  // GET - Buscar condições, consumíveis e lesões do personagem
  if (req.method === 'GET') {
    try {
      const { character_id } = req.query;

      console.log('[API ConditionsConsumables] Dados GET recebidos:', { character_id });

      if (!character_id) {
        console.error('[API ConditionsConsumables] Erro: ID do personagem não fornecido na query');
        return res.status(400).json({ 
          error: 'ID do personagem é obrigatório' 
        });
      }

      const charId = parseInt(character_id);
      
      if (isNaN(charId)) {
        console.error('[API ConditionsConsumables] Erro: ID do personagem inválido:', character_id);
        return res.status(400).json({ 
          error: 'ID do personagem inválido' 
        });
      }

      console.log(`[API ConditionsConsumables] Buscando dados para personagem: ${charId}`);

      // Busca apenas os campos relacionados
      const character = await prisma.character.findUnique({
        where: { id: charId },
        select: {
          id: true,
          conditions: true,
          consumables: true,
          injuries: true
        }
      });

      if (!character) {
        console.error(`[API ConditionsConsumables] Erro: Personagem ${charId} não encontrado`);
        return res.status(404).json({ 
          error: 'Personagem não encontrado' 
        });
      }

      console.log(`[API ConditionsConsumables] Personagem encontrado, parseando dados...`);

      // Parseia os valores JSON com tratamento de erro robusto
      const responseData = {
        id: character.id,
        conditions: {},
        consumables: {},
        injuries: []
      };

      // Conditions
      if (character.conditions) {
        try {
          responseData.conditions = JSON.parse(character.conditions);
          console.log(`[API ConditionsConsumables] Conditions parseadas:`, Object.keys(responseData.conditions).length, 'campos');
        } catch (error) {
          console.warn(`[API ConditionsConsumables] Erro ao parsear conditions, usando objeto vazio:`, error.message);
          responseData.conditions = {};
        }
      } else {
        console.log(`[API ConditionsConsumables] Conditions vazio no banco`);
      }

      // Consumables
      if (character.consumables) {
        try {
          responseData.consumables = JSON.parse(character.consumables);
          console.log(`[API ConditionsConsumables] Consumables parseados:`, Object.keys(responseData.consumables).length, 'campos');
        } catch (error) {
          console.warn(`[API ConditionsConsumables] Erro ao parsear consumables, usando objeto vazio:`, error.message);
          responseData.consumables = {};
        }
      } else {
        console.log(`[API ConditionsConsumables] Consumables vazio no banco`);
      }

      // Injuries
      if (character.injuries) {
        try {
          responseData.injuries = JSON.parse(character.injuries);
          console.log(`[API ConditionsConsumables] Injuries parseadas:`, responseData.injuries.length, 'itens');
        } catch (error) {
          console.warn(`[API ConditionsConsumables] Erro ao parsear injuries, usando array vazio:`, error.message);
          responseData.injuries = [];
        }
      } else {
        console.log(`[API ConditionsConsumables] Injuries vazio no banco`);
      }

      console.log(`[API ConditionsConsumables] Dados retornados com sucesso para personagem ${charId}`);
      console.log(`[API ConditionsConsumables] Resumo:`, {
        conditions: Object.keys(responseData.conditions),
        consumables: Object.keys(responseData.consumables),
        injuries: responseData.injuries
      });

      return res.status(200).json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('[API ConditionsConsumables] Erro ao buscar:', error);
      console.error('[API ConditionsConsumables] Stack trace:', error.stack);
      return res.status(500).json({ 
        error: 'Erro interno ao buscar condições e consumíveis',
        details: error.message 
      });
    }
  }

  // Método não permitido
  console.error(`[API ConditionsConsumables] Método ${req.method} não permitido`);
  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ 
    error: `Método ${req.method} não permitido` 
  });
}