import { api } from '../../../utils';

// Handlers para Year Zero
export const handleYearZeroUpdate = async (character, rpgSystem, setCharacter, setYearZeroAttributeValues, setYearZeroSkillValues, type, name, value) => {
  if (!character?.id) return;

  const getAttributeIdByName = (attrName) => {
    const attributesList = rpgSystem === 'year_zero'
      ? character.yearzero_attributes
      : character.attributes;
    
    const attr = attributesList?.find(a => a.attribute?.name === attrName);
    return attr?.attribute?.id;
  };
  
  const getSkillIdByName = (skillName) => {
    const skillsList = rpgSystem === 'year_zero' 
      ? character.yearzero_skills 
      : character.skills;
    const skill = skillsList?.find(s => s.skill?.name === skillName);
    return skill?.skill?.id;
  };
  
  try {
    if (type === 'attribute') {
      const attributeId = getAttributeIdByName(name);
      
      if (!attributeId) {
        throw new Error(`Atributo "${name}" não encontrado`);
      }
      
      await api.put('/yearzero/attribute', {
        character_id: character.id,
        attribute_id: attributeId,
        value: parseInt(value) || 1
      });

      setCharacter(prev => ({
        ...prev,
        yearzero_attributes: prev.yearzero_attributes?.map(attr =>
          attr.attribute_id === attributeId
            ? { ...attr, value: parseInt(value) || 1 }
            : attr
        ) || []
      }));

      setYearZeroAttributeValues(prev => ({
        ...prev,
        [attributeId]: parseInt(value) || 1
      }));
      
    } else if (type === 'skill') {
      const skillId = getSkillIdByName(name);
      
      if (!skillId) {
        throw new Error(`Skill "${name}" não encontrada`);
      }
      
      await api.put('/yearzero/skill', {
        character_id: character.id,
        skill_id: skillId,
        value: parseInt(value) || 1
      });

      setCharacter(prev => ({
        ...prev,
        yearzero_skills: prev.yearzero_skills?.map(skill =>
          skill.skill_id === skillId
            ? { ...skill, value: parseInt(value) || 1 }
            : skill
        ) || []
      }));

      setYearZeroSkillValues(prev => ({
        ...prev,
        [skillId]: parseInt(value) || 1
      }));
      
    } else if (type === 'stress_squares') {
      const squaresJson = JSON.stringify(value);
      await api.put(`/character/${character.id}`, {
        stress_squares: squaresJson
      });
      
      setCharacter(prev => ({
        ...prev,
        stress_squares: squaresJson
      }));
      
    } else if (type === 'health_squares') {
      const squaresJson = JSON.stringify(value);
      await api.put(`/character/${character.id}`, {
        health_squares: squaresJson
      });
      
      setCharacter(prev => ({
        ...prev,
        health_squares: squaresJson
      }));
      
    } else {
      console.warn(`Tipo desconhecido: ${type}`);
    }
    
  } catch (error) {
    console.error(`Erro ao salvar ${type} ${name}:`, error);
  }
};

export const handleYearZeroPushRoll = (character, handleYearZeroUpdate) => {
  if (!character) return;
  
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
      () => {}, // setCharacter placeholder
      () => {}, // setYearZeroAttributeValues placeholder
      () => {}, // setYearZeroSkillValues placeholder
      'stress_squares',
      'stress_squares',
      newStressSquares
    );
    
  } catch (error) {
    console.error('Erro ao processar stress squares:', error);
  }
};

export const handleYearZeroAttributeRoll = (character, yearZeroDiceModal, attributeName, attributeValue, stressSquares) => {
  if (!character?.id) return;
  
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
