import { api } from '../../../utils';

// Handlers para Year Zero
export const handleYearZeroUpdate = async (character, rpgSystem, setCharacter, setYearZeroAttributeValues, setYearZeroSkillValues, type, name, value) => {
  if (!character?.id) return;

  console.log('[YearZero Handlers] Iniciando update');
  console.log('[YearZero Handlers] Versao 1.1.0 - Feature: Suporte para equipment_notes');
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
        console.error('[YearZero Handlers] ERRO: Atributo nao encontrado:', name);
        throw new Error(`Atributo "${name}" nao encontrado`);
      }
      
      const parsedValue = parseInt(value);
      console.log('[YearZero Handlers] Valor do atributo parseado:', parsedValue, 'Tipo:', typeof parsedValue);
      
      if (isNaN(parsedValue)) {
        console.error('[YearZero Handlers] ERRO: Valor nao e um numero:', value);
        throw new Error('Valor deve ser um numero');
      }
      
      console.log('[YearZero Handlers] Enviando para API - atributo:', attributeId, 'valor:', parsedValue);
      
      await api.put('/yearzero/attribute', {
        character_id: character.id,
        attribute_id: attributeId,
        value: parsedValue
      });

      console.log('[YearZero Handlers] Atualizacao concluida para atributo:', name, '=', parsedValue);

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
        console.error('[YearZero Handlers] ERRO: Skill nao encontrada:', name);
        throw new Error(`Skill "${name}" nao encontrada`);
      }
      
      const parsedValue = parseInt(value);
      console.log('[YearZero Handlers] Valor da skill parseado:', parsedValue, 'Tipo:', typeof parsedValue);
      
      if (isNaN(parsedValue)) {
        console.error('[YearZero Handlers] ERRO: Valor nao e um numero:', value);
        throw new Error('Valor deve ser um numero');
      }
      
      console.log('[YearZero Handlers] Enviando para API - skill:', skillId, 'valor:', parsedValue);
      
      await api.put('/yearzero/skill', {
        character_id: character.id,
        skill_id: skillId,
        value: parsedValue
      });

      console.log('[YearZero Handlers] Atualizacao concluida para skill:', name, '=', parsedValue);

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
      
    } else if (type === 'stress_squares') {
      const squaresJson = JSON.stringify(value);
      console.log('[YearZero Handlers] Atualizando stress squares:', squaresJson);
      
      await api.put(`/character/${character.id}`, {
        stress_squares: squaresJson
      });
      
      setCharacter(prev => ({
        ...prev,
        stress_squares: squaresJson
      }));
      
    } else if (type === 'health_squares') {
      const squaresJson = JSON.stringify(value);
      console.log('[YearZero Handlers] Atualizando health squares:', squaresJson);
      
      await api.put(`/character/${character.id}`, {
        health_squares: squaresJson
      });
      
      setCharacter(prev => ({
        ...prev,
        health_squares: squaresJson
      }));
      
    } else if (type === 'equipment_notes') {
      console.log('[YearZero Handlers] Atualizando equipment notes:', value);
      
      await api.put(`/character/${character.id}`, {
        equipment_notes: value
      });
      
      setCharacter(prev => ({
        ...prev,
        equipment_notes: value
      }));
      
    } else {
      console.warn('[YearZero Handlers] Tipo desconhecido:', type);
    }
    
  } catch (error) {
    console.error(`[YearZero Handlers] Erro ao salvar ${type} ${name}:`, error);
    console.error('[YearZero Handlers] Mensagem de erro:', error.message);
  }
};

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
      console.log('[YearZero Handlers] Stress maximo atingido');
      return;
    }
    
    const newStressCount = currentStressCount + 1;
    const newStressSquares = Array(10).fill(false);
    for (let i = 0; i < newStressCount; i++) {
      newStressSquares[i] = true;
    }
    
    handleYearZeroUpdate(
      character,
      'year_zero',
      () => {},
      () => {},
      () => {},
      'stress_squares',
      'stress_squares',
      newStressSquares
    );
    
    console.log('[YearZero Handlers] Push roll concluido');
    
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
