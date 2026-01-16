// Arquivo: src/pages/sheet/services/yearZeroHandlers.js
// Versão 1.12.1 - FIX: Correção definitiva do endpoint duplicado
console.log('[YearZero Handlers] Versão 1.12.1 - FIX: Endpoint duplicado corrigido');

import { api } from '../../../utils';

// FUNÇÃO PRINCIPAL - Interface compatível com AttributeComponents
export const handleYearZeroUpdate = async (character, rpgSystem, setCharacter, setYearZeroAttributeValues, setYearZeroSkillValues, type, name, value) => {
  if (!character?.id) {
    console.error('[YearZero Handlers] Erro: character ou character.id não disponível');
    return;
  }

  console.log('[YearZero Handlers] Iniciando update');
  console.log('[YearZero Handlers] Dados recebidos:', { type, name, value, characterId: character.id });
  
  // Busca ID do atributo pelo nome
  const getAttributeIdByName = (attrName) => {
    const attributesList = rpgSystem === 'year_zero'
      ? character.yearzero_attributes
      : character.attributes;
    
    if (!attributesList) {
      console.warn('[YearZero Handlers] Lista de atributos não encontrada');
      return null;
    }
    
    const attr = attributesList.find(a => a.attribute?.name === attrName);
    console.log('[YearZero Handlers] Buscando atributo:', attrName, 'ID encontrado:', attr?.attribute?.id);
    return attr?.attribute?.id;
  };
  
  // Busca ID da skill pelo nome
  const getSkillIdByName = (skillName) => {
    const skillsList = rpgSystem === 'year_zero' 
      ? character.yearzero_skills 
      : character.skills;
    
    if (!skillsList) {
      console.warn('[YearZero Handlers] Lista de skills não encontrada');
      return null;
    }
    
    const skill = skillsList.find(s => s.skill?.name === skillName);
    console.log('[YearZero Handlers] Buscando skill:', skillName, 'ID encontrado:', skill?.skill?.id);
    return skill?.skill?.id;
  };
  
  try {
    // ATRIBUTO
    if (type === 'attribute') {
      const attributeId = getAttributeIdByName(name);
      
      if (!attributeId) {
        console.error('[YearZero Handlers] Erro: Atributo não encontrado:', name);
        throw new Error(`Atributo "${name}" não encontrado`);
      }
      
      const parsedValue = parseInt(value);
      console.log('[YearZero Handlers] Valor do atributo parseado:', parsedValue, 'Tipo:', typeof parsedValue);
      
      if (isNaN(parsedValue)) {
        console.error('[YearZero Handlers] Erro: Valor não é um número:', value);
        throw new Error('Valor deve ser um número');
      }
      
      // Validação 0-6
      const clampedValue = Math.max(0, Math.min(6, parsedValue));
      
      console.log('[YearZero Handlers] Enviando para API - atributo:', attributeId, 'valor:', clampedValue);
      
      // CORREÇÃO: Endpoint correto considerando que api.js já adiciona /api/
      await api.put('/yearzero/attribute', {
        character_id: character.id,
        attribute_id: attributeId,
        value: clampedValue
      });

      console.log('[YearZero Handlers] Atualização concluída para atributo:', name, '=', clampedValue);

      // Atualiza estado local se as funções existirem
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          yearzero_attributes: prev.yearzero_attributes?.map(attr =>
            attr.attribute_id === attributeId
              ? { ...attr, value: clampedValue }
              : attr
          ) || []
        }));
      }

      if (setYearZeroAttributeValues) {
        setYearZeroAttributeValues(prev => ({
          ...prev,
          [attributeId]: clampedValue
        }));
      }
      
    } 
    // SKILL
    else if (type === 'skill') {
      const skillId = getSkillIdByName(name);
      
      if (!skillId) {
        console.error('[YearZero Handlers] Erro: Skill não encontrada:', name);
        throw new Error(`Skill "${name}" não encontrada`);
      }
      
      const parsedValue = parseInt(value);
      console.log('[YearZero Handlers] Valor da skill parseado:', parsedValue, 'Tipo:', typeof parsedValue);
      
      if (isNaN(parsedValue)) {
        console.error('[YearZero Handlers] Erro: Valor não é um número:', value);
        throw new Error('Valor deve ser um número');
      }
      
      // Validação 0-6
      const clampedValue = Math.max(0, Math.min(6, parsedValue));
      
      console.log('[YearZero Handlers] Enviando para API - skill:', skillId, 'valor:', clampedValue);
      
      await api.put('/yearzero/skill', {
        character_id: character.id,
        skill_id: skillId,
        value: clampedValue
      });

      console.log('[YearZero Handlers] Atualização concluída para skill:', name, '=', clampedValue);

      // Atualiza estado local se as funções existirem
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          yearzero_skills: prev.yearzero_skills?.map(skill =>
            skill.skill_id === skillId
              ? { ...skill, value: clampedValue }
              : skill
          ) || []
        }));
      }

      if (setYearZeroSkillValues) {
        setYearZeroSkillValues(prev => ({
          ...prev,
          [skillId]: clampedValue
        }));
      }
      
    } 
    // HEALTH/STRESS SQUARES
    else if (type === 'stress_squares' || type === 'health_squares') {
      if (!Array.isArray(value) || value.length !== 10) {
        console.error('[YearZero Handlers] Erro: Squares deve ser array com 10 elementos:', value);
        throw new Error('Squares deve ser array com 10 elementos');
      }
      
      console.log('[YearZero Handlers] Atualizando squares:', type, value);
      
      // Processa squares existentes
      let currentHealthSquares = character.health_squares;
      let currentStressSquares = character.stress_squares;
      
      const parseSquares = (squares) => {
        if (!squares) return Array(10).fill(false);
        if (typeof squares === 'string') {
          try {
            squares = squares.replace(/^"+|"+$/g, '');
            return JSON.parse(squares);
          } catch (error) {
            console.warn('[YearZero Handlers] Não consegui parsear squares, usando array vazio');
            return Array(10).fill(false);
          }
        }
        return squares;
      };
      
      currentHealthSquares = parseSquares(currentHealthSquares);
      currentStressSquares = parseSquares(currentStressSquares);
      
      const payload = {
        character_id: character.id,
        health_squares: type === 'health_squares' ? value : currentHealthSquares,
        stress_squares: type === 'stress_squares' ? value : currentStressSquares
      };
      
      console.log('[YearZero Handlers] Payload para health-stress:', payload);
      
      await api.put('/yearzero/health-stress', payload);
      
      // Atualiza estado local
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          [type]: JSON.stringify(value)
        }));
      }
      
      console.log('[YearZero Handlers] Squares atualizados com sucesso');
      
    } 
    // RADIATION SQUARES
    else if (type === 'radiation_squares') {
      if (!Array.isArray(value) || value.length !== 10) {
        console.error('[YearZero Handlers] Erro: Radiation squares deve ser array com 10 elementos:', value);
        throw new Error('Radiation squares deve ser array com 10 elementos');
      }
      
      console.log('[YearZero Handlers] Atualizando radiation squares:', value);
      
      await api.put('/yearzero/radiation-squares', {
        character_id: character.id,
        radiation_squares: value
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          radiation_squares: JSON.stringify(value)
        }));
      }
      
    } 
    // EXPERIENCE/HISTORY SQUARES
    else if (type === 'experience_squares' || type === 'history_squares') {
      console.log('[YearZero Handlers] Atualizando experience/history squares:', type, value);
      
      if (!Array.isArray(value)) {
        console.error('[YearZero Handlers] Erro: Squares deve ser array:', value);
        throw new Error('Squares deve ser array');
      }
      
      const maxLength = type === 'experience_squares' ? 10 : 3;
      if (value.length !== maxLength) {
        console.error(`[YearZero Handlers] Erro: ${type} deve ter ${maxLength} elementos:`, value.length);
        throw new Error(`${type} deve ter ${maxLength} elementos`);
      }
      
      // Processa squares existentes
      let currentExperienceSquares = character.experience_squares;
      let currentHistorySquares = character.history_squares;
      
      const parseSquares = (squares, defaultLength) => {
        if (!squares) return Array(defaultLength).fill(false);
        if (typeof squares === 'string') {
          try {
            squares = squares.replace(/^"+|"+$/g, '');
            return JSON.parse(squares);
          } catch (error) {
            console.warn('[YearZero Handlers] Não consegui parsear squares, usando array vazio');
            return Array(defaultLength).fill(false);
          }
        }
        return squares;
      };
      
      currentExperienceSquares = parseSquares(currentExperienceSquares, 10);
      currentHistorySquares = parseSquares(currentHistorySquares, 3);
      
      const payload = {
        character_id: character.id,
        experience_squares: type === 'experience_squares' ? value : currentExperienceSquares,
        history_squares: type === 'history_squares' ? value : currentHistorySquares
      };
      
      console.log('[YearZero Handlers] Payload para experience-history:', payload);
      
      await api.put('/yearzero/experience-history', payload);
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          [type]: JSON.stringify(value),
          ...(type === 'experience_squares' && {
            experience_points: value.filter(Boolean).length
          }),
          ...(type === 'history_squares' && {
            history_points: value.filter(Boolean).length
          })
        }));
      }
      
      console.log('[YearZero Handlers] Experience/history squares atualizados com sucesso');
      
    } 
    // EQUIPMENT NOTES - Campo principal
    else if (type === 'equipment_notes') {
      console.log('[YearZero Handlers] Atualizando equipment notes:', value);
      
      await api.put('/yearzero/equipment', {
        character_id: character.id,
        field: 'equipment_notes',
        value: value
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          equipment_notes: value
        }));
      }
      
      console.log('[YearZero Handlers] Equipment notes atualizados com sucesso');
      
    } 
    // TINY ITEMS - Itens minúsculos
    else if (type === 'tiny_items') {
      console.log('[YearZero Handlers] Atualizando tiny items:', value);
      
      await api.put('/yearzero/equipment', {
        character_id: character.id,
        field: 'tiny_items',
        value: value
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          tiny_items: value
        }));
      }
      
      console.log('[YearZero Handlers] Tiny items atualizados com sucesso');
      
    } 
    // EMOTIONAL ITEM - Item emocional
    else if (type === 'emotional_item') {
      console.log('[YearZero Handlers] Atualizando emotional item:', value);
      
      await api.put('/yearzero/equipment', {
        character_id: character.id,
        field: 'emotional_item',
        value: value
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          emotional_item: value
        }));
      }
      
      console.log('[YearZero Handlers] Emotional item atualizado com sucesso');
      
    } 
    // PERSONAL META/TALENTS
    else if (type === 'personal_goal' || type === 'camarada' || type === 'rival' || 
             type === 'career' || type === 'appearance' || type === 'talents') {
      
      console.log('[YearZero Handlers] Atualizando personal meta:', type, value);
      
      let processedValue = value;
      
      if (type === 'talents') {
        try {
          if (typeof value === 'string') {
            processedValue = value.replace(/^"+|"+$/g, '');
            const parsed = JSON.parse(processedValue);
            
            if (!Array.isArray(parsed)) {
              throw new Error('Talents deve ser um array');
            }
            
            const limitedTalents = parsed.slice(0, 4);
            processedValue = JSON.stringify(limitedTalents);
          } else if (Array.isArray(value)) {
            const limitedTalents = value.slice(0, 4);
            processedValue = JSON.stringify(limitedTalents);
          }
        } catch (error) {
          console.error('[YearZero Handlers] Erro ao processar talents:', error);
          throw new Error('Erro ao processar talents: ' + error.message);
        }
      }
      
      await api.put('/yearzero/personal-meta', {
        character_id: character.id,
        field: type,
        value: processedValue
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          [type]: processedValue
        }));
      }
      
      console.log('[YearZero Handlers] Personal meta atualizado com sucesso');
      
    } 
    // EQUIPMENT (alias para compatibilidade)
    else if (type === 'equipment' || type === 'notepad') {
      console.log('[YearZero Handlers] Atualizando equipment (alias):', type, value);
      
      // Mapeia para o campo correto
      const targetField = type === 'equipment' ? 'equipment_notes' : type;
      
      await api.put('/yearzero/equipment', {
        character_id: character.id,
        field: targetField,
        value: value
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          [targetField]: value
        }));
      }
      
      console.log('[YearZero Handlers] Campo de equipment atualizado com sucesso');
      
    } 
    // CONDIÇÕES
    else if (type === 'conditions') {
      console.log('[YearZero Handlers] Atualizando condições:', value);
      
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        console.error('[YearZero Handlers] Erro: Condições deve ser um objeto:', value);
        throw new Error('Condições deve ser um objeto válido');
      }
      
      await api.put('/yearzero/conditions-consumables', {
        character_id: character.id,
        field: 'conditions',
        value: value
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          conditions: JSON.stringify(value)
        }));
      }
      
      console.log('[YearZero Handlers] Condições atualizadas com sucesso');
      
    } 
    // CONSUMÍVEIS
    else if (type === 'consumables') {
      console.log('[YearZero Handlers] Atualizando consumíveis:', value);
      
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        console.error('[YearZero Handlers] Erro: Consumíveis deve ser um objeto:', value);
        throw new Error('Consumíveis deve ser um objeto válido');
      }
      
      await api.put('/yearzero/conditions-consumables', {
        character_id: character.id,
        field: 'consumables',
        value: value
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          consumables: JSON.stringify(value)
        }));
      }
      
      console.log('[YearZero Handlers] Consumíveis atualizados com sucesso');
      
    } 
    // LESÕES/INJURIES
    else if (type === 'injuries' || type === 'lesoes') {
      console.log('[YearZero Handlers] Atualizando lesões:', value);
      
      if (!Array.isArray(value)) {
        console.error('[YearZero Handlers] Erro: Lesões deve ser um array:', value);
        throw new Error('Lesões deve ser um array válido');
      }
      
      const limitedInjuries = value.slice(0, 2);
      
      await api.put('/yearzero/conditions-consumables', {
        character_id: character.id,
        field: 'injuries',
        value: limitedInjuries
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          injuries: JSON.stringify(limitedInjuries)
        }));
      }
      
      console.log('[YearZero Handlers] Lesões atualizadas com sucesso');
      
    }
    // ARMAS E ARMADURAS - CORREÇÃO DO ENDPOINT (sem /api/ duplicado)
    else if (type === 'armadura') {
      console.log('[YearZero Handlers] Atualizando nome da armadura:', value);
      
      // CORREÇÃO: Sem /api/ no início porque api.js já adiciona
      await api.put('/yearzero/armas-armaduras', {
        character_id: character.id,
        field: 'armadura',
        value: value
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          armadura: value
        }));
      }
      
      console.log('[YearZero Handlers] Armadura atualizada com sucesso');
      
    }
    else if (type === 'nivel_armadura') {
      console.log('[YearZero Handlers] Atualizando nível da armadura:', value);
      
      await api.put('/yearzero/armas-armaduras', {
        character_id: character.id,
        field: 'nivel_armadura',
        value: value
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          nivel_armadura: value
        }));
      }
      
      console.log('[YearZero Handlers] Nível da armadura atualizado com sucesso');
      
    }
    else if (type === 'carga_armadura') {
      console.log('[YearZero Handlers] Atualizando carga da armadura:', value);
      
      await api.put('/yearzero/armas-armaduras', {
        character_id: character.id,
        field: 'carga_armadura',
        value: value
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          carga_armadura: value
        }));
      }
      
      console.log('[YearZero Handlers] Carga da armadura atualizada com sucesso');
      
    }
    else if (type === 'armas') {
      console.log('[YearZero Handlers] Atualizando lista de armas:', value);
      
      if (!Array.isArray(value)) {
        console.error('[YearZero Handlers] Erro: Armas deve ser um array:', value);
        throw new Error('Armas deve ser um array válido');
      }
      
      await api.put('/yearzero/armas-armaduras', {
        character_id: character.id,
        field: 'armas',
        value: value
      });
      
      if (setCharacter) {
        setCharacter(prev => ({
          ...prev,
          armas: JSON.stringify(value)
        }));
      }
      
      console.log('[YearZero Handlers] Armas atualizadas com sucesso');
      
    }
    // ATUALIZAÇÃO EM LOTE PARA ARMAS E ARMADURAS - CORREÇÃO DEFINITIVA
    else if (type === 'armas_armaduras_batch') {
      console.log('[YearZero Handlers] Atualizando armas e armaduras em lote:', value);
      
      if (!value || typeof value !== 'object') {
        console.error('[YearZero Handlers] Erro: Dados de lote devem ser um objeto:', value);
        throw new Error('Dados de lote devem ser um objeto válido');
      }
      
      // Prepara os dados no formato correto para a API
      const dadosParaAPI = {
        character_id: character.id,
        updates: {
          armadura: value.armadura || '',
          nivel_armadura: value.nivel || '',
          carga_armadura: value.carga || '',
          armas: value.armas || []
        }
      };
      
      console.log('[YearZero Handlers] Enviando para API (sem /api/ duplicado):', dadosParaAPI);
      
      // CORREÇÃO DEFINITIVA: Sem /api/ no início porque api.js já adiciona
      const resposta = await api.put('/yearzero/armas-armaduras', dadosParaAPI);
      
      console.log('[YearZero Handlers] Resposta da API:', resposta.data);
      
      // Atualiza estado local com os dados retornados
      if (setCharacter && resposta.data?.success) {
        setCharacter(prev => ({
          ...prev,
          armadura: resposta.data.data?.armadura || value.armadura || '',
          nivel_armadura: resposta.data.data?.nivel_armadura || value.nivel || '',
          carga_armadura: resposta.data.data?.carga_armadura || value.carga || '',
          armas: resposta.data.data?.armas ? JSON.stringify(resposta.data.data.armas) : JSON.stringify(value.armas || [])
        }));
      }
      
      console.log('[YearZero Handlers] Atualização em lote concluída com sucesso');
      
    } 
    // TIPOS NÃO TRATADOS
    else {
      console.warn('[YearZero Handlers] Tipo não tratado:', type, name);
      // Ainda chama setCharacter se for um campo direto
      if (setCharacter && character.hasOwnProperty(type)) {
        setCharacter(prev => ({
          ...prev,
          [type]: value
        }));
      }
    }
    
  } catch (error) {
    console.error(`[YearZero Handlers] Erro ao salvar ${type} ${name}:`, error);
    console.error('[YearZero Handlers] Mensagem de erro:', error.message);
    
    if (error.response) {
      console.error('[YearZero Handlers] Status:', error.response.status);
      console.error('[YearZero Handlers] Resposta do servidor:', error.response.data);
      
      // Log mais detalhado para erros de validação
      if (error.response.status === 400 && error.response.data?.details) {
        console.error('[YearZero Handlers] Erros de validação:', error.response.data.details);
      }
    }
    
    // Re-throw para o componente lidar
    throw error;
  }
};

// FUNÇÃO WRAPPER - Para uso direto com AttributeComponents
export const createYearZeroUpdateHandler = (character, rpgSystem, setCharacter, setYearZeroAttributeValues, setYearZeroSkillValues) => {
  return async (type, name, value) => {
    try {
      await handleYearZeroUpdate(
        character,
        rpgSystem,
        setCharacter,
        setYearZeroAttributeValues,
        setYearZeroSkillValues,
        type,
        name,
        value
      );
      return true;
    } catch (error) {
      console.error('[YearZero Handlers] Erro no wrapper:', error);
      return false;
    }
  };
};

// Handler para push roll
export const handleYearZeroPushRoll = (character, handleYearZeroUpdate) => {
  if (!character) return;
  
  console.log('[YearZero Handlers] Iniciando push roll');
  
  let currentStressSquares = character?.stress_squares;
  
  try {
    if (typeof currentStressSquares === 'string') {
      currentStressSquares = currentStressSquares.replace(/^"+|"+$/g, '');
      currentStressSquares = JSON.parse(currentStressSquares);
    }
    
    if (!Array.isArray(currentStressSquares) || currentStressSquares.length !== 10) {
      currentStressSquares = Array(10).fill(false);
    }
    
    const currentStressCount = currentStressSquares.filter(Boolean).length;
    
    if (currentStressCount >= 10) {
      console.log('[YearZero Handlers] Stress máximo atingido');
      return;
    }
    
    const newStressCount = currentStressCount + 1;
    const newStressSquares = Array(10).fill(false);
    for (let i = 0; i < newStressCount; i++) {
      newStressSquares[i] = true;
    }
    
    console.log('[YearZero Handlers] Chamando handleYearZeroUpdate com novos stress squares');
    console.log('[YearZero Handlers] Count atual:', currentStressCount, '-> novo:', newStressCount);
    
    handleYearZeroUpdate('stress_squares', 'stress_squares', newStressSquares);
    
    console.log('[YearZero Handlers] Push roll concluído com sucesso');
    
  } catch (error) {
    console.error('[YearZero Handlers] Erro ao processar stress squares:', error);
  }
};

// Handler para rolagem de atributo
export const handleYearZeroAttributeRoll = (character, yearZeroDiceModal, attributeName, attributeValue, stressSquares) => {
  if (!character?.id) return;
  
  console.log('[YearZero Handlers] Iniciando attribute roll:', attributeName, 'valor:', attributeValue);
  
  yearZeroDiceModal.appear({
    characterId: character.id,
    baseDice: attributeValue,
    skillDice: 0,
    gearDice: 0,
    attributeName: attributeName,
    skillName: '',
    stressSquares: stressSquares
  });
};

// Handler para rolagem de skill
export const handleYearZeroSkillRoll = (character, yearZeroDiceModal, skillName, skillValue, stressSquares) => {
  if (!character?.id) return;
  
  console.log('[YearZero Handlers] Iniciando skill roll:', skillName, 'valor:', skillValue);
  
  const skillToAttributeMap = {
    "COMBATE CORPO A CORPO": "Força",
    "MAQUINÁRIO PESADO": "Força",
    "RESISTÊNCIA": "Força",
    "COMBATE À DISTÂNCIA": "Agilidade",
    "MOBILIDADE": "Agilidade",
    "PILOTAGEM": "Agilidade",
    "OBSERVAÇÃO": "Inteligência",
    "SOBREVIVÊNCIA": "Inteligência",
    "TECNOLOGIA": "Inteligência",
    "MANIPULAÇÃO": "Empatia",
    "COMANDO": "Empatia",
    "AJUDA MÉDICA": "Empatia"
  };
  
  const relatedAttribute = skillToAttributeMap[skillName] || 'Força';
  
  const attribute = character.yearzero_attributes?.find(attr => 
    attr.attribute?.name === relatedAttribute
  );
  const attributeValue = attribute ? parseInt(attribute.value) || 0 : 0;
  
  console.log('[YearZero Handlers] Atributo relacionado:', relatedAttribute, 'valor:', attributeValue);
  
  yearZeroDiceModal.appear({
    characterId: character.id,
    baseDice: attributeValue,
    skillDice: parseInt(skillValue) || 0,
    gearDice: 0,
    attributeName: relatedAttribute,
    skillName: skillName,
    stressSquares: stressSquares
  });
};

// Função para carregar dados de condições e consumíveis
export const loadConditionsConsumablesData = async (characterId) => {
  if (!characterId) {
    console.error('[YearZero Handlers] Erro: characterId não fornecido');
    return null;
  }
  
  try {
    console.log('[YearZero Handlers] Carregando dados de condições e consumíveis para character:', characterId);
    
    const response = await api.get(`/yearzero/conditions-consumables?character_id=${characterId}`);
    
    if (response.data?.success) {
      console.log('[YearZero Handlers] Dados carregados com sucesso:', response.data.data);
      return response.data.data;
    } else {
      console.warn('[YearZero Handlers] Resposta sem sucesso:', response.data);
      return null;
    }
    
  } catch (error) {
    console.error('[YearZero Handlers] Erro ao carregar dados de condições e consumíveis:', error);
    
    if (error.response) {
      console.error('[YearZero Handlers] Status da resposta:', error.response.status);
      console.error('[YearZero Handlers] Dados da resposta:', error.response.data);
    }
    
    // Retorna dados padrão em caso de erro
    return {
      conditions: {},
      consumables: {},
      injuries: []
    };
  }
};

// Função para carregar dados de armas e armaduras
export const loadArmasArmadurasData = async (characterId) => {
  if (!characterId) {
    console.error('[YearZero Handlers] Erro: characterId não fornecido');
    return null;
  }
  
  try {
    console.log('[YearZero Handlers] Carregando dados de armas e armaduras para character:', characterId);
    
    const response = await api.get(`/yearzero/armas-armaduras?character_id=${characterId}`);
    
    if (response.data?.success) {
      console.log('[YearZero Handlers] Dados carregados com sucesso:', response.data.data);
      return response.data.data;
    } else {
      console.warn('[YearZero Handlers] Resposta sem sucesso:', response.data);
      return null;
    }
    
  } catch (error) {
    console.error('[YearZero Handlers] Erro ao carregar dados de armas e armaduras:', error);
    
    if (error.response) {
      console.error('[YearZero Handlers] Status da resposta:', error.response.status);
      console.error('[YearZero Handlers] Dados da resposta:', error.response.data);
    }
    
    // Retorna dados padrão em caso de erro
    return {
      armadura: '',
      nivel: '',
      carga: '',
      armas: [
        { id: 1, nome: '', bonus: '', distancia: '' },
        { id: 2, nome: '', bonus: '', distancia: '' },
        { id: 3, nome: '', bonus: '', distancia: '' },
        { id: 4, nome: '', bonus: '', distancia: '' },
      ]
    };
  }
};

// Função para salvar múltiplos campos de uma vez (otimização)
export const saveConditionsConsumablesBatch = async (characterId, data) => {
  if (!characterId || !data) {
    console.error('[YearZero Handlers] Erro: characterId ou dados não fornecidos');
    return false;
  }
  
  try {
    console.log('[YearZero Handlers] Salvando batch de dados:', data);
    
    // Salva cada campo individualmente
    const results = [];
    
    if (data.conditions) {
      const result = await api.put('/yearzero/conditions-consumables', {
        character_id: characterId,
        field: 'conditions',
        value: data.conditions
      });
      results.push({ field: 'conditions', success: result.data?.success });
    }
    
    if (data.consumables) {
      const result = await api.put('/yearzero/conditions-consumables', {
        character_id: characterId,
        field: 'consumables',
        value: data.consumables
      });
      results.push({ field: 'consumables', success: result.data?.success });
    }
    
    if (data.injuries) {
      const result = await api.put('/yearzero/conditions-consumables', {
        character_id: characterId,
        field: 'injuries',
        value: data.injuries
      });
      results.push({ field: 'injuries', success: result.data?.success });
    }
    
    const allSuccess = results.every(r => r.success);
    console.log('[YearZero Handlers] Batch salvo com sucesso:', results);
    
    return allSuccess;
    
  } catch (error) {
    console.error('[YearZero Handlers] Erro ao salvar batch:', error);
    return false;
  }
};

// Função para salvar armas e armaduras em lote - CORRIGIDA
export const saveArmasArmadurasBatch = async (characterId, data) => {
  if (!characterId || !data) {
    console.error('[YearZero Handlers] Erro: characterId ou dados não fornecidos');
    return false;
  }
  
  try {
    console.log('[YearZero Handlers] Salvando batch de armas e armaduras:', data);
    
    // Prepara os updates no formato correto
    const updates = {};
    
    if (data.armadura !== undefined) updates.armadura = data.armadura;
    if (data.nivel !== undefined) updates.nivel_armadura = data.nivel;
    if (data.carga !== undefined) updates.carga_armadura = data.carga;
    if (data.armas !== undefined) updates.armas = data.armas;
    
    if (Object.keys(updates).length === 0) {
      console.warn('[YearZero Handlers] Nenhum dado para salvar no batch');
      return true;
    }
    
    // CORREÇÃO: Endpoint correto sem /api/ duplicado
    const result = await api.put('/yearzero/armas-armaduras', {
      character_id: characterId,
      updates: updates
    });
    
    const success = result.data?.success || false;
    console.log('[YearZero Handlers] Batch de armas e armaduras salvo com sucesso:', success);
    
    return success;
    
  } catch (error) {
    console.error('[YearZero Handlers] Erro ao salvar batch de armas e armaduras:', error);
    return false;
  }
};

// Função helper para preparar dados do ConditionsConsumablesTracker
export const prepareConditionsConsumablesData = (character) => {
  if (!character) {
    console.warn('[YearZero Handlers] Personagem não fornecido, retornando dados iniciais');
    return {
      conditions: {},
      consumables: {},
      lesoes: ['', '']
    };
  }
  
  try {
    let conditions = {};
    let consumables = {};
    let injuries = [];
    
    // Processa condições
    if (character.conditions) {
      if (typeof character.conditions === 'string') {
        conditions = JSON.parse(character.conditions);
      } else if (typeof character.conditions === 'object') {
        conditions = character.conditions;
      }
    }
    
    // Processa consumíveis
    if (character.consumables) {
      if (typeof character.consumables === 'string') {
        consumables = JSON.parse(character.consumables);
      } else if (typeof character.consumables === 'object') {
        consumables = character.consumables;
      }
    }
    
    // Processa lesões
    if (character.injuries) {
      if (typeof character.injuries === 'string') {
        injuries = JSON.parse(character.injuries);
      } else if (Array.isArray(character.injuries)) {
        injuries = character.injuries;
      }
    }
    
    // Garante que injuries tenha exatamente 2 elementos
    const lesoes = injuries.slice(0, 2);
    while (lesoes.length < 2) {
      lesoes.push('');
    }
    
    const result = {
      conditions,
      consumables,
      lesoes
    };
    
    console.log('[YearZero Handlers] Dados preparados:', result);
    return result;
    
  } catch (error) {
    console.error('[YearZero Handlers] Erro ao preparar dados:', error);
    
    // Retorna dados padrão em caso de erro
    return {
      conditions: {},
      consumables: {},
      lesoes: ['', '']
    };
  }
};

// Função helper para preparar dados do ArmasArmadura
export const prepareArmasArmadurasData = (character) => {
  if (!character) {
    console.warn('[YearZero Handlers] Personagem não fornecido, retornando dados iniciais');
    return {
      armadura: '',
      nivel: '',
      carga: '',
      armas: [
        { id: 1, nome: '', bonus: '', distancia: '' },
        { id: 2, nome: '', bonus: '', distancia: '' },
        { id: 3, nome: '', bonus: '', distancia: '' },
        { id: 4, nome: '', bonus: '', distancia: '' },
      ]
    };
  }
  
  try {
    let armadura = character.armadura || '';
    let nivel = character.nivel_armadura || '';
    let carga = character.carga_armadura || '';
    let armas = [];
    
    // Processa armas
    if (character.armas) {
      if (typeof character.armas === 'string') {
        try {
          const parsedArmas = JSON.parse(character.armas);
          if (Array.isArray(parsedArmas)) {
            armas = parsedArmas.map((arma, index) => ({
              id: arma.id || index + 1,
              nome: arma.nome || '',
              bonus: arma.bonus || '',
              distancia: arma.distancia || ''
            }));
          }
        } catch (error) {
          console.warn('[YearZero Handlers] Não consegui parsear armas, usando array padrão');
        }
      } else if (Array.isArray(character.armas)) {
        armas = character.armas;
      }
    }
    
    // Garante que tenha pelo menos 4 armas
    while (armas.length < 4) {
      armas.push({
        id: armas.length + 1,
        nome: '',
        bonus: '',
        distancia: ''
      });
    }
    
    // Limita a 4 armas
    const armasLimitadas = armas.slice(0, 4);
    
    const result = {
      armadura,
      nivel,
      carga,
      armas: armasLimitadas
    };
    
    console.log('[YearZero Handlers] Dados de armas e armaduras preparados:', result);
    return result;
    
  } catch (error) {
    console.error('[YearZero Handlers] Erro ao preparar dados de armas e armaduras:', error);
    
    // Retorna dados padrão em caso de erro
    return {
      armadura: '',
      nivel: '',
      carga: '',
      armas: [
        { id: 1, nome: '', bonus: '', distancia: '' },
        { id: 2, nome: '', bonus: '', distancia: '' },
        { id: 3, nome: '', bonus: '', distancia: '' },
        { id: 4, nome: '', bonus: '', distancia: '' },
      ]
    };
  }
};

// Função de compatibilidade para manter retrocompatibilidade
export const prepareArmsArmorData = prepareArmasArmadurasData;