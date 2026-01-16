// Arquivo: src/pages/api/yearzero/armas-armaduras.js
// Versão: 1.0.0 - API completa para gerenciamento de armas e armaduras
// FIX: Tratamento robusto de valores e validações específicas

import { prisma } from '../../../lib/prisma';

console.log('[API ArmasArmaduras] Versão 1.0.0 - API inicializada');

// Campos permitidos para atualização
const CAMPOS_PERMITIDOS = [
  'armadura',           // Nome/tipo da armadura
  'nivel_armadura',     // Nível da armadura (1-99)
  'carga_armadura',     // Carga da armadura (1-99)
  'armas'               // Array de armas em formato JSON
];

// Validações específicas
const validarCampo = (campo, valor) => {
  switch (campo) {
    case 'armadura':
      if (valor && valor.length > 100) {
        return 'Nome da armadura deve ter no máximo 100 caracteres';
      }
      break;
      
    case 'nivel_armadura':
    case 'carga_armadura':
      if (valor !== null && valor !== undefined && valor !== '') {
        if (!/^\d{1,2}$/.test(String(valor))) {
          return 'Deve conter até 2 dígitos numéricos';
        }
        const num = parseInt(valor);
        if (num < 0 || num > 99) {
          return 'Valor deve estar entre 0 e 99';
        }
      }
      break;
      
    case 'armas':
      if (valor) {
        try {
          const armas = typeof valor === 'string' ? JSON.parse(valor) : valor;
          if (!Array.isArray(armas)) {
            return 'Armas deve ser um array';
          }
          if (armas.length > 10) {
            return 'Máximo de 10 armas permitidas';
          }
          
          // Valida cada arma individualmente
          for (const arma of armas) {
            if (arma.nome && arma.nome.length > 50) {
              return 'Nome da arma deve ter no máximo 50 caracteres';
            }
            if (arma.bonus && !/^[-+]?\d*$/.test(arma.bonus)) {
              return 'Bônus deve ser um número opcionalmente com sinal';
            }
            if (arma.distancia && arma.distancia.length > 20) {
              return 'Distância deve ter no máximo 20 caracteres';
            }
          }
        } catch (error) {
          return 'Formato de armas inválido (JSON esperado)';
        }
      }
      break;
  }
  return null;
};

// Sanitiza valores
const sanitizarValor = (campo, valor) => {
  if (valor === null || valor === undefined) {
    return '';
  }
  
  switch (campo) {
    case 'armadura':
      return String(valor).trim().slice(0, 100);
      
    case 'nivel_armadura':
    case 'carga_armadura':
      if (valor === '' || valor === null || valor === undefined) {
        return '';
      }
      const strValor = String(valor).replace(/\D/g, '');
      return strValor.slice(0, 2);
      
    case 'armas':
      if (Array.isArray(valor)) {
        // Sanitiza cada arma
        const armasSanitizadas = valor.map((arma, index) => ({
          id: index + 1,
          nome: arma.nome ? String(arma.nome).trim().slice(0, 50) : '',
          bonus: arma.bonus ? String(arma.bonus).replace(/[^+\-\d]/g, '') : '',
          distancia: arma.distancia ? String(arma.distancia).trim().slice(0, 20) : ''
        }));
        return JSON.stringify(armasSanitizadas);
      } else if (typeof valor === 'string') {
        try {
          const parsed = JSON.parse(valor);
          if (Array.isArray(parsed)) {
            return JSON.stringify(parsed.map((arma, index) => ({
              id: index + 1,
              nome: arma.nome ? String(arma.nome).trim().slice(0, 50) : '',
              bonus: arma.bonus ? String(arma.bonus).replace(/[^+\-\d]/g, '') : '',
              distancia: arma.distancia ? String(arma.distancia).trim().slice(0, 20) : ''
            })));
          }
        } catch (error) {
          // Se não for JSON válido, cria array vazio
        }
      }
      return JSON.stringify([]);
      
    default:
      return String(valor).trim();
  }
};

// GET - Obter dados de armas e armaduras
const handleGet = async (req, res) => {
  try {
    const { character_id } = req.query;

    if (!character_id) {
      return res.status(400).json({ 
        error: 'ID do personagem é obrigatório' 
      });
    }

    const charId = parseInt(character_id);
    
    if (isNaN(charId)) {
      return res.status(400).json({ 
        error: 'ID do personagem inválido' 
      });
    }

    console.log(`[API ArmasArmaduras] Buscando dados para personagem:`, charId);

    // Busca apenas os campos relacionados a armas e armaduras
    const character = await prisma.character.findUnique({
      where: { id: charId },
      select: {
        id: true,
        armadura: true,
        nivel_armadura: true,
        carga_armadura: true,
        armas: true
      }
    });

    if (!character) {
      return res.status(404).json({ 
        error: 'Personagem não encontrado' 
      });
    }

    // Processa os dados para retorno consistente
    const dadosProcessados = {
      armadura: character.armadura || '',
      nivel: character.nivel_armadura || '',
      carga: character.carga_armadura || '',
      armas: []
    };

    // Processa armas se existirem
    if (character.armas) {
      try {
        const armasArray = typeof character.armas === 'string' 
          ? JSON.parse(character.armas) 
          : character.armas;
        
        if (Array.isArray(armasArray)) {
          dadosProcessados.armas = armasArray.map(arma => ({
            id: arma.id || 1,
            nome: arma.nome || '',
            bonus: arma.bonus || '',
            distancia: arma.distancia || ''
          }));
        }
      } catch (error) {
        console.log('[API ArmasArmaduras] Erro ao processar armas, usando array vazio');
        dadosProcessados.armas = [];
      }
    }

    // Se não houver armas, retorna array padrão
    if (!dadosProcessados.armas || dadosProcessados.armas.length === 0) {
      dadosProcessados.armas = [
        { id: 1, nome: '', bonus: '', distancia: '' },
        { id: 2, nome: '', bonus: '', distancia: '' },
        { id: 3, nome: '', bonus: '', distancia: '' },
        { id: 4, nome: '', bonus: '', distancia: '' },
      ];
    }

    console.log('[API ArmasArmaduras] Dados retornados:', {
      id: character.id,
      armadura: dadosProcessados.armadura,
      nivel: dadosProcessados.nivel,
      carga: dadosProcessados.carga,
      armas_count: dadosProcessados.armas.length
    });

    return res.status(200).json({
      success: true,
      data: dadosProcessados
    });

  } catch (error) {
    console.error('[API ArmasArmaduras] Erro ao buscar dados:', error);
    return res.status(500).json({ 
      error: 'Erro interno ao buscar dados de armas e armaduras',
      details: error.message 
    });
  }
};

// PUT - Atualizar dados de armas e armaduras
const handlePut = async (req, res) => {
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

    // Valida se o campo é permitido
    if (!CAMPOS_PERMITIDOS.includes(field)) {
      return res.status(400).json({ 
        error: `Campo '${field}' não permitido. Campos permitidos: ${CAMPOS_PERMITIDOS.join(', ')}` 
      });
    }

    console.log(`[API ArmasArmaduras] Atualizando ${field} para personagem:`, character_id);

    const charId = parseInt(character_id);
    
    if (isNaN(charId)) {
      return res.status(400).json({ 
        error: 'ID do personagem inválido' 
      });
    }

    // Valida o valor
    const erroValidacao = validarCampo(field, value);
    if (erroValidacao) {
      return res.status(400).json({ 
        error: `Valor inválido para ${field}: ${erroValidacao}` 
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

    // Sanitiza o valor
    const valorSanitizado = sanitizarValor(field, value);
    
    console.log('[API ArmasArmaduras] Valor processado:', {
      campo: field,
      original: value,
      sanitizado: valorSanitizado,
      tipo: typeof valorSanitizado
    });

    // Atualiza o campo específico
    const updateData = { [field]: valorSanitizado };
    
    const result = await prisma.character.update({
      where: { id: charId },
      data: updateData
    });

    const response = {
      success: true,
      data: {
        id: result.id,
        [field]: result[field] || ''
      }
    };

    console.log(`[API ArmasArmaduras] ${field} atualizado com sucesso:`, response.data[field]);
    return res.status(200).json(response);

  } catch (error) {
    console.error('[API ArmasArmaduras] Erro ao atualizar:', error);
    return res.status(500).json({ 
      error: 'Erro interno ao atualizar dados de armas e armaduras',
      details: error.message 
    });
  }
};

// PUT em lote - Atualizar múltiplos campos de uma vez
const handlePutBatch = async (req, res) => {
  try {
    const { character_id, updates } = req.body;

    if (!character_id) {
      return res.status(400).json({ 
        error: 'ID do personagem é obrigatório' 
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ 
        error: 'Dados de atualização são obrigatórios e devem ser um objeto' 
      });
    }

    console.log(`[API ArmasArmaduras] Atualização em lote para personagem:`, character_id);

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

    const updateData = {};
    const errosValidacao = [];

    // Processa cada campo
    for (const [field, value] of Object.entries(updates)) {
      // Verifica se o campo é permitido
      if (!CAMPOS_PERMITIDOS.includes(field)) {
        errosValidacao.push(`Campo '${field}' não permitido`);
        continue;
      }

      // Valida o valor
      const erroValidacao = validarCampo(field, value);
      if (erroValidacao) {
        errosValidacao.push(`${field}: ${erroValidacao}`);
        continue;
      }

      // Sanitiza o valor
      updateData[field] = sanitizarValor(field, value);
    }

    // Se houver erros de validação, retorna
    if (errosValidacao.length > 0) {
      return res.status(400).json({ 
        error: 'Erros de validação',
        details: errosValidacao 
      });
    }

    // Se não houver nada para atualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: 'Nenhum dado válido para atualização' 
      });
    }

    console.log('[API ArmasArmaduras] Atualizando campos:', Object.keys(updateData));

    const result = await prisma.character.update({
      where: { id: charId },
      data: updateData
    });

    // Retorna apenas os campos atualizados
    const responseData = {};
    for (const field of Object.keys(updateData)) {
      responseData[field] = result[field] || '';
    }

    const response = {
      success: true,
      data: {
        id: result.id,
        ...responseData
      }
    };

    console.log(`[API ArmasArmaduras] Atualização em lote concluída com sucesso`);
    return res.status(200).json(response);

  } catch (error) {
    console.error('[API ArmasArmaduras] Erro na atualização em lote:', error);
    return res.status(500).json({ 
      error: 'Erro interno na atualização em lote',
      details: error.message 
    });
  }
};

// Handler principal
export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
        
      case 'PUT':
        // Verifica se é atualização em lote
        if (req.body && req.body.updates !== undefined) {
          return await handlePutBatch(req, res);
        }
        return await handlePut(req, res);
        
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ 
          error: `Método ${req.method} não permitido` 
        });
    }
  } catch (error) {
    console.error('[API ArmasArmaduras] Erro no handler:', error);
    return res.status(500).json({ 
      error: 'Erro interno no servidor',
      details: error.message 
    });
  }
}

// Adiciona um endpoint de saúde da API
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};