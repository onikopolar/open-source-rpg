import { api } from '../utils';

// Handler para informações do personagem
export const handleCharacterInfoSubmit = async (character, values, setLoading, clearError, handleApiError) => {
  if (!character?.id) return Promise.reject('Personagem não encontrado');
  
  setLoading('characterInfo', true);
  clearError('characterInfo');
  
  try {
    await api.put(`/character/${character.id}`, values);
    setLoading('characterInfo', false);
    return Promise.resolve();
  } catch (error) {
    const errorMessage = handleApiError(error, 'characterInfo');
    setLoading('characterInfo', false);
    return Promise.reject(errorMessage);
  }
};

// Handler para pontos de vida
export const handleHitPointsUpdate = async (character, newData, setLoading, clearError, handleApiError, setCharacter) => {
  if (!character?.id) return Promise.reject('Personagem não encontrado');
  
  setLoading('hitPoints', true);
  clearError('hitPoints');
  
  try {
    const data = {
      current_hit_points: Number(newData.current),
      max_hit_points: Number(newData.max)
    };

    if (isNaN(data.current_hit_points) || isNaN(data.max_hit_points)) {
      throw new Error('Valores de pontos de vida inválidos');
    }

    if (data.current_hit_points < 0 || data.max_hit_points < 0) {
      throw new Error('Pontos de vida não podem ser negativos');
    }

    if (data.current_hit_points > data.max_hit_points) {
      throw new Error('Pontos de vida atuais não podem ser maiores que os máximos');
    }

    await api.put(`/character/${character.id}`, data);
    
    setCharacter(prev => ({
      ...prev,
      current_hit_points: data.current_hit_points,
      max_hit_points: data.max_hit_points
    }));
    
    setLoading('hitPoints', false);
    return Promise.resolve();
  } catch (error) {
    const errorMessage = handleApiError(error, 'hitPoints');
    setLoading('hitPoints', false);
    return Promise.reject(errorMessage);
  }
};

// Handler para ações rápidas de saúde
export const handleQuickHealthChange = async (character, amount, type, setLoading, clearError, handleApiError, setCharacter) => {
  if (!character?.id) return;
  
  const currentHP = character?.current_hit_points || 0;
  const maxHP = character?.max_hit_points || 0;
  
  let newCurrentHP;
  if (type === 'heal') {
    newCurrentHP = Math.min(currentHP + amount, maxHP);
  } else {
    newCurrentHP = Math.max(0, currentHP - amount);
  }

  if (newCurrentHP === currentHP) {
    return;
  }

  setLoading('quickHealth', true);
  clearError('quickHealth');
  
  try {
    const data = {
      current_hit_points: newCurrentHP,
      max_hit_points: maxHP
    };

    await api.put(`/character/${character.id}`, data);
    
    setCharacter(prev => ({
      ...prev,
      current_hit_points: newCurrentHP
    }));
    
    setLoading('quickHealth', false);
    
    if (newCurrentHP === 0 && type === 'damage') {
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          alert('Personagem inconsciente!');
        }
      }, 100);
    }
  } catch (error) {
    const errorMessage = handleApiError(error, 'quickHealth');
    setLoading('quickHealth', false);
    console.error('Erro na ação rápida de saúde:', errorMessage);
  }
};

// Handler específico para Feiticeiros
export const handleFeiticeirosUpdate = async (character, setCharacter, type, identifier, data) => {
  if (!character?.id) {
    console.error('Personagem não encontrado para atualização Feiticeiros');
    return;
  }

  console.log("FEITICEIROS UPDATE:", { type, identifier, data });
  
  try {
    if (type === 'character') {
      const valueToSend = identifier === 'derived_values_bonuses' 
        ? JSON.stringify(data)
        : data;

      await api.put(`/character/${character.id}`, {
        [identifier]: valueToSend
      });
      
      setCharacter(prev => ({
        ...prev,
        [identifier]: data
      }));
      
    } else if (type === 'attribute') {
      await api.put('/feiticeiros/attribute', {
        characterId: character.id,
        attributeName: identifier,
        value: parseInt(data.value) || 10
      });

      setCharacter(prev => ({
        ...prev,
        feiticeiros_attributes: prev.feiticeiros_attributes?.map(attr =>
          attr.attribute?.name === identifier
            ? { ...attr, value: parseInt(data.value) || 10 }
            : attr
        ) || []
      }));
      
    } else if (type === 'pericia') {
      await api.put('/feiticeiros/pericia', {
        characterId: character.id,
        periciaNome: identifier,
        data: {
          treinada: Boolean(data.treinada),
          mestre: Boolean(data.mestre),
          outros: parseInt(data.outros) || 0
        }
      });

      setCharacter(prev => ({
        ...prev,
        feiticeiros_pericias: prev.feiticeiros_pericias?.map(pericia =>
          pericia.nome === identifier
            ? { 
                ...pericia, 
                treinada: Boolean(data.treinada),
                mestre: Boolean(data.mestre),
                outros: parseInt(data.outros) || 0
              }
            : pericia
        ) || []
      }));
      
    } else if (type === 'oficio') {
      await api.put('/feiticeiros/oficio', {
        characterId: character.id,
        oficioNome: identifier,
        data: {
          treinada: Boolean(data.treinada),
          mestre: Boolean(data.mestre),
          outros: parseInt(data.outros) || 0
        }
      });

      setCharacter(prev => ({
        ...prev,
        feiticeiros_oficios: prev.feiticeiros_oficios?.map(oficio =>
          oficio.nome === identifier
            ? { 
                ...oficio, 
                treinada: Boolean(data.treinada),
                mestre: Boolean(data.mestre),
                outros: parseInt(data.outros) || 0
              }
            : oficio
        ) || []
      }));
      
    } else if (type === 'resistencia') {
      await api.put('/feiticeiros/resistencia', {
        characterId: character.id,
        resistenciaNome: identifier,
        data: {
          treinada: Boolean(data.treinada),
          mestre: Boolean(data.mestre),
          outros: parseInt(data.outros) || 0
        }
      });

      setCharacter(prev => ({
        ...prev,
        feiticeiros_resistencias: prev.feiticeiros_resistencias?.map(resistencia =>
          resistencia.nome === identifier
            ? { 
                ...resistencia, 
                treinada: Boolean(data.treinada),
                mestre: Boolean(data.mestre),
                outros: parseInt(data.outros) || 0
              }
            : resistencia
        ) || []
      }));
      
    } else if (type === 'ataque') {
      await api.put('/feiticeiros/ataque', {
        characterId: character.id,
        ataqueNome: identifier,
        data: {
          treinada: Boolean(data.treinada),
          mestre: Boolean(data.mestre),
          outros: parseInt(data.outros) || 0
        }
      });

      setCharacter(prev => ({
        ...prev,
        feiticeiros_ataques: prev.feiticeiros_ataques?.map(ataque =>
          ataque.nome === identifier
            ? { 
                ...ataque, 
                treinada: Boolean(data.treinada),
                mestre: Boolean(data.mestre),
                outros: parseInt(data.outros) || 0
              }
            : ataque
        ) || []
      }));
      
    } else {
      console.warn(`Tipo desconhecido: ${type}`);
    }
    
  } catch (error) {
    console.error(`Erro ao salvar ${type} ${identifier}:`, error);
    const errorMessage = error.response?.data?.error || error.message || `Erro ao salvar ${type}`;
    throw new Error(errorMessage);
  }
};

// Handlers para atributos e habilidades clássicos
export const handleAttributeChange = (attributeId, newValue, setAttributeValues) => {
  const numericValue = newValue === '' ? '' : parseInt(newValue) || 0;
  
  setAttributeValues(prev => ({
    ...prev,
    [attributeId]: numericValue
  }));
};

export const handleSkillChange = (skillId, newValue, setSkillValues) => {
  const numericValue = newValue === '' ? '' : parseInt(newValue) || 0;
  
  setSkillValues(prev => ({
    ...prev,
    [skillId]: numericValue
  }));
};

export const saveAttributeValue = async (character, attributeValues, attributeId, setLoading, clearError, handleApiError, setCharacter, rpgSystem) => {
  if (!character?.id) return;
  
  setLoading(`attribute-${attributeId}`, true);
  clearError(`attribute-${attributeId}`);
  
  try {
    const value = attributeValues[attributeId] || 0;
    
    if (rpgSystem === 'year_zero') {
      await api.put('/yearzero/attribute', {
        character_id: character.id,
        attribute_id: attributeId,
        value: value
      });
    } else {
      await api.put('/character/attribute', {
        characterId: character.id,
        attributeId: attributeId,
        value: value
      });
    }
    
    setCharacter(prev => {
      const updated = { ...prev };
      
      if (rpgSystem === 'year_zero') {
        updated.yearzero_attributes = prev.yearzero_attributes?.map(attr =>
          attr.attribute_id === attributeId
            ? { ...attr, value: value }
            : attr
        ) || [];
      } else {
        updated.attributes = prev.attributes?.map(attr =>
          attr.attribute_id === attributeId
            ? { ...attr, value: value }
            : attr
        ) || [];
      }
      
      return updated;
    });
    
    setLoading(`attribute-${attributeId}`, false);
  } catch (error) {
    const errorMessage = handleApiError(error, `attribute-${attributeId}`);
    setLoading(`attribute-${attributeId}`, false);
    console.error('Erro ao salvar atributo:', errorMessage);
  }
};

export const saveSkillValue = async (character, skillValues, skillId, setLoading, clearError, handleApiError, setCharacter, rpgSystem) => {
  if (!character?.id) return;
  
  setLoading(`skill-${skillId}`, true);
  clearError(`skill-${skillId}`);
  
  try {
    const value = skillValues[skillId] || 0;
    
    if (rpgSystem === 'year_zero') {
      await api.put('/yearzero/skill', {
        character_id: character.id,
        skill_id: skillId,
        value: value
      });
    } else {
      await api.put('/character/skill', {
        characterId: character.id,
        skillId: skillId,
        value: value
      });
    }
    
    setCharacter(prev => {
      const updated = { ...prev };
      
      if (rpgSystem === 'year_zero') {
        updated.yearzero_skills = prev.yearzero_skills?.map(skill =>
          skill.skill_id === skillId
            ? { ...skill, value: value }
            : skill
        ) || [];
      } else {
        updated.skills = prev.skills?.map(skill =>
          skill.skill_id === skillId
            ? { ...skill, value: value }
            : skill
        ) || [];
      }
      
      return updated;
    });
    
    setLoading(`skill-${skillId}`, false);
  } catch (error) {
    const errorMessage = handleApiError(error, `skill-${skillId}`);
    setLoading(`skill-${skillId}`, false);
    console.error('Erro ao salvar habilidade:', errorMessage);
  }
};

// Funções auxiliares para valores
export const getAttributeValue = (charAttr, attributeValues) => {
  if (!charAttr?.attribute) {
    return '';
  }
  
  const attributeId = charAttr.attribute.id;
  const value = attributeValues[attributeId] !== undefined 
    ? attributeValues[attributeId] 
    : charAttr.value;
  
  return value === 0 || value === '0' || value === '' ? '' : String(value);
};

export const getSkillValue = (charSkill, skillValues) => {
  if (!charSkill?.skill) {
    return '';
  }
  
  const skillId = charSkill.skill.id;
  const value = skillValues[skillId] !== undefined 
    ? skillValues[skillId] 
    : charSkill.value;
  
  return value === 0 || value === '0' || value === '' ? '' : String(value);
};
