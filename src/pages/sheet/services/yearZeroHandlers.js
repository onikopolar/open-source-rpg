// Arquivo: src/pages/sheet/services/yearZeroHandlers.js
import { api } from '../../../utils';

// FIX: Agora eu uso o callback handleYearZeroUpdate que recebo, que já tem os setters configurados
console.log('[YearZero Handlers] Versão 1.6.1 - FIX: handleYearZeroPushRoll agora usa o callback recebido com setters reais');

// Handlers para Year Zero
export const handleYearZeroUpdate = async (character, rpgSystem, setCharacter, setYearZeroAttributeValues, setYearZeroSkillValues, type, name, value) => {
  if (!character?.id) return;

  console.log('[YearZero Handlers] Iniciando update');
  console.log('[YearZero Handlers] Dados recebidos:', { type, name, value, characterId: character.id });
  
  const getAttributeIdByName = (attrName) => {
    const attributesList = rpgSystem === 'year_zero'
      ? character.yearzero_attributes
      : character.attributes;
    
    const attr = attributesList?.find(a => a.attribute?.name === attrName);
    console.log('[YearZero Handlers] Buscando atributo:', attrName, 'ID encontrado:', attr?.attribute?.id);
    return attr?.attribute?.id;
  };
  
  const getSkillIdByName = (skillName) => {
    const skillsList = rpgSystem === 'year_zero' 
      ? character.yearzero_skills 
      : character.skills;
    const skill = skillsList?.find(s => s.skill?.name === skillName);
    console.log('[YearZero Handlers] Buscando skill:', skillName, 'ID encontrado:', skill?.skill?.id);
    return skill?.skill?.id;
  };
  
  try {
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
      
      console.log('[YearZero Handlers] Enviando para API - atributo:', attributeId, 'valor:', parsedValue);
      
      await api.put('/yearzero/attribute', {
        character_id: character.id,
        attribute_id: attributeId,
        value: parsedValue
      });

      console.log('[YearZero Handlers] Atualização concluída para atributo:', name, '=', parsedValue);

      setCharacter(prev => ({
        ...prev,
        yearzero_attributes: prev.yearzero_attributes?.map(attr =>
          attr.attribute_id === attributeId
            ? { ...attr, value: parsedValue }
            : attr
        ) || []
      }));

      setYearZeroAttributeValues(prev => ({
        ...prev,
        [attributeId]: parsedValue
      }));
      
    } else if (type === 'skill') {
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
      
      console.log('[YearZero Handlers] Enviando para API - skill:', skillId, 'valor:', parsedValue);
      
      await api.put('/yearzero/skill', {
        character_id: character.id,
        skill_id: skillId,
        value: parsedValue
      });

      console.log('[YearZero Handlers] Atualização concluída para skill:', name, '=', parsedValue);

      setCharacter(prev => ({
        ...prev,
        yearzero_skills: prev.yearzero_skills?.map(skill =>
          skill.skill_id === skillId
            ? { ...skill, value: parsedValue }
            : skill
        ) || []
      }));

      setYearZeroSkillValues(prev => ({
        ...prev,
        [skillId]: parsedValue
      }));
      
    } else if (type === 'stress_squares' || type === 'health_squares') {
      if (!Array.isArray(value) || value.length !== 10) {
        console.error('[YearZero Handlers] Erro: Squares deve ser array com 10 elementos:', value);
        throw new Error('Squares deve ser array com 10 elementos');
      }
      
      console.log('[YearZero Handlers] Atualizando squares:', type, value);
      
      let currentHealthSquares = character.health_squares;
      let currentStressSquares = character.stress_squares;
      
      if (typeof currentHealthSquares === 'string') {
        try {
          currentHealthSquares = JSON.parse(currentHealthSquares.replace(/^"+|"+$/g, ''));
        } catch (error) {
          console.warn('[YearZero Handlers] Não consegui parsear health_squares, usando array vazio');
          currentHealthSquares = Array(10).fill(false);
        }
      }
      
      if (typeof currentStressSquares === 'string') {
        try {
          currentStressSquares = JSON.parse(currentStressSquares.replace(/^"+|"+$/g, ''));
        } catch (error) {
          console.warn('[YearZero Handlers] Não consegui parsear stress_squares, usando array vazio');
          currentStressSquares = Array(10).fill(false);
        }
      }
      
      if (!Array.isArray(currentHealthSquares) || currentHealthSquares.length !== 10) {
        currentHealthSquares = Array(10).fill(false);
      }
      
      if (!Array.isArray(currentStressSquares) || currentStressSquares.length !== 10) {
        currentStressSquares = Array(10).fill(false);
      }
      
      const payload = {
        character_id: character.id,
        health_squares: type === 'health_squares' ? value : currentHealthSquares,
        stress_squares: type === 'stress_squares' ? value : currentStressSquares
      };
      
      console.log('[YearZero Handlers] Payload para health-stress:', payload);
      
      await api.put('/yearzero/health-stress', payload);
      
      setCharacter(prev => ({
        ...prev,
        [type]: JSON.stringify(value)
      }));
      
      console.log('[YearZero Handlers] Squares atualizados com sucesso');
      
    } else if (type === 'radiation_squares') {
      if (!Array.isArray(value) || value.length !== 10) {
        console.error('[YearZero Handlers] Erro: Radiation squares deve ser array com 10 elementos:', value);
        throw new Error('Radiation squares deve ser array com 10 elementos');
      }
      
      console.log('[YearZero Handlers] Atualizando radiation squares:', value);
      
      await api.put('/yearzero/radiation-squares', {
        character_id: character.id,
        radiation_squares: value
      });
      
      setCharacter(prev => ({
        ...prev,
        radiation_squares: JSON.stringify(value)
      }));
      
    } else if (type === 'experience_squares' || type === 'history_squares') {
      console.log('[YearZero Handlers] Atualizando experience/history squares:', type, value);
      
      if (!Array.isArray(value)) {
        console.error('[YearZero Handlers] Erro: Squares deve ser array:', value);
        throw new Error('Squares deve ser array');
      }
      
      if (type === 'experience_squares' && value.length !== 10) {
        console.error('[YearZero Handlers] Erro: Experience squares deve ter 10 elementos:', value.length);
        throw new Error('Experience squares deve ter 10 elementos');
      }
      
      if (type === 'history_squares' && value.length !== 3) {
        console.error('[YearZero Handlers] Erro: History squares deve ter 3 elementos:', value.length);
        throw new Error('History squares deve ter 3 elementos');
      }
      
      let currentExperienceSquares = character.experience_squares;
      let currentHistorySquares = character.history_squares;
      
      const parseSquares = (squares) => {
        if (!squares) return type === 'experience_squares' ? Array(10).fill(false) : Array(3).fill(false);
        
        if (typeof squares === 'string') {
          try {
            squares = squares.replace(/^"+|"+$/g, '');
            return JSON.parse(squares);
          } catch (error) {
            console.warn('[YearZero Handlers] Não consegui parsear squares, usando array vazio');
            return type === 'experience_squares' ? Array(10).fill(false) : Array(3).fill(false);
          }
        }
        
        return squares;
      };
      
      currentExperienceSquares = parseSquares(currentExperienceSquares);
      currentHistorySquares = parseSquares(currentHistorySquares);
      
      if (!Array.isArray(currentExperienceSquares) || currentExperienceSquares.length !== 10) {
        currentExperienceSquares = Array(10).fill(false);
      }
      
      if (!Array.isArray(currentHistorySquares) || currentHistorySquares.length !== 3) {
        currentHistorySquares = Array(3).fill(false);
      }
      
      const payload = {
        character_id: character.id,
        experience_squares: type === 'experience_squares' ? value : currentExperienceSquares,
        history_squares: type === 'history_squares' ? value : currentHistorySquares
      };
      
      console.log('[YearZero Handlers] Payload para experience-history:', payload);
      
      await api.put('/yearzero/experience-history', payload);
      
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
      
      console.log('[YearZero Handlers] Experience/history squares atualizados com sucesso');
      
    } else if (type === 'experience_points' || type === 'history_points') {
      console.log('[YearZero Handlers] Convertendo pontos numéricos para squares:', type, value);
      
      const parsedValue = parseInt(value) || 0;
      const maxSquares = type === 'experience_points' ? 10 : 3;
      
      const squares = Array(maxSquares).fill(false);
      for (let i = 0; i < Math.min(parsedValue, maxSquares); i++) {
        squares[i] = true;
      }
      
      await handleYearZeroUpdate(
        character,
        rpgSystem,
        setCharacter,
        setYearZeroAttributeValues,
        setYearZeroSkillValues,
        type === 'experience_points' ? 'experience_squares' : 'history_squares',
        type === 'experience_points' ? 'experience_squares' : 'history_squares',
        squares
      );
      
    } else if (type === 'equipment_notes') {
      console.log('[YearZero Handlers] Atualizando equipment notes:', value);
      
      await api.put(`/character/${character.id}`, {
        equipment_notes: value
      });
      
      setCharacter(prev => ({
        ...prev,
        equipment_notes: value
      }));
      
    } else if (type === 'equipment' || type === 'notepad') {
      console.log('[YearZero Handlers] Atualizando equipment/notepad:', type, value);
      
      await api.put(`/character/${character.id}`, {
        [type]: value
      });
      
      setCharacter(prev => ({
        ...prev,
        [type]: value
      }));
      
    } else if (type === 'personal_goal' || type === 'camarada' || type === 'rival' || 
               type === 'career' || type === 'appearance' || type === 'talents') {
      // Handler para campos do PersonalMetaTalents
      console.log('[YearZero Handlers] Atualizando personal meta:', type, value);
      
      // Validação específica para talents
      if (type === 'talents') {
        let talentsValue = value;
        
        try {
          if (typeof talentsValue === 'string') {
            talentsValue = talentsValue.replace(/^"+|"+$/g, '');
            const parsed = JSON.parse(talentsValue);
            
            if (!Array.isArray(parsed)) {
              console.error('[YearZero Handlers] Erro: Talents deve ser um array');
              throw new Error('Talents deve ser um array');
            }
            
            const limitedTalents = parsed.slice(0, 4);
            talentsValue = JSON.stringify(limitedTalents);
          } else if (Array.isArray(talentsValue)) {
            const limitedTalents = talentsValue.slice(0, 4);
            talentsValue = JSON.stringify(limitedTalents);
          } else {
            console.error('[YearZero Handlers] Erro: Formato inválido para talents');
            throw new Error('Formato inválido para talents');
          }
        } catch (error) {
          console.error('[YearZero Handlers] Erro ao processar talents:', error);
          throw new Error('Erro ao processar talents: ' + error.message);
        }
      }
      
      console.log('[YearZero Handlers] Enviando para personal-meta API:', { type, value });
      
      await api.put('/yearzero/personal-meta', {
        character_id: character.id,
        field: type,
        value: type === 'talents' ? value : String(value || '')
      });
      
      setCharacter(prev => ({
        ...prev,
        [type]: type === 'talents' ? value : String(value || '')
      }));
      
      console.log('[YearZero Handlers] Personal meta atualizado com sucesso');
      
    } else {
      console.warn('[YearZero Handlers] Tipo desconhecido:', type, name);
    }
    
  } catch (error) {
    console.error(`[YearZero Handlers] Erro ao salvar ${type} ${name}:`, error);
    console.error('[YearZero Handlers] Mensagem de erro:', error.message);
    
    if (error.response) {
      console.error('[YearZero Handlers] Resposta do servidor:', error.response.data);
      console.error('[YearZero Handlers] Status:', error.response.status);
    }
  }
};

// FIX: Agora eu uso o callback handleYearZeroUpdate que recebo
// Ele já tem todos os setters configurados, então eu só chamo ele com os parâmetros corretos
export const handleYearZeroPushRoll = (character, handleYearZeroUpdate) => {
  if (!character) return;
  
  console.log('[YearZero Handlers] Iniciando push roll - agora com setters reais');
  
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
    
    // FIX CRÍTICO: Agora eu uso o callback que recebi
    // Esse callback já está configurado com setCharacter, setYearZeroAttributeValues, setYearZeroSkillValues
    console.log('[YearZero Handlers] Chamando handleYearZeroUpdate com novos stress squares');
    console.log('[YearZero Handlers] Count atual:', currentStressCount, '-> novo:', newStressCount);
    
    handleYearZeroUpdate('stress_squares', 'stress_squares', newStressSquares);
    
    console.log('[YearZero Handlers] Push roll concluído com sucesso - stress atualizado no estado local');
    
  } catch (error) {
    console.error('[YearZero Handlers] Erro ao processar stress squares:', error);
  }
};

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