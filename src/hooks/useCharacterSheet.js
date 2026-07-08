// useCharacterSheet.js - VERSÃO 3.3.1 - FIX: Força inicialização quando rawCharacter chega

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};

export const useCharacterSheet = (rawCharacter, refreshData) => {
  console.log('[useCharacterSheet] Versão 3.3.1 - Força inicialização quando rawCharacter chega');

  const initialCharacterRef = useRef(rawCharacter);
  const [character, setCharacter] = useState(null);
  
  const [characterValues, setCharacterValues] = useState({
    attributes: null,
    skills: null,
    yearZeroAttributes: null,
    yearZeroSkills: null
  });

  const [rpgSystem, setRpgSystem] = useState(null);
  const [isChangingSystem, setIsChangingSystem] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});
  
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isSelectorExpanded, setIsSelectorExpanded] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isClient = useIsClient();
  const refreshDataRef = useRef(refreshData);
  
  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  // NOVO: Monitorar mudanças no rawCharacter e forçar inicialização
  useEffect(() => {
    if (rawCharacter && !character) {
      console.log('[useCharacterSheet] rawCharacter recebido, inicializando...');
      initialCharacterRef.current = rawCharacter;
      
      const characterData = rawCharacter;
      const characterId = characterData?.id;

      if (!characterId) {
        console.log('[useCharacterSheet] Personagem sem ID');
        setIsInitialized(true);
        return;
      }

      try {
        console.log(`[useCharacterSheet] Inicializando com ID: ${characterId}, Sistema: ${characterData?.rpg_system || 'null'}`);
        
        const visitedSheets = JSON.parse(localStorage.getItem('visited_character_sheets') || '[]');
        const hasVisited = visitedSheets.includes(characterId);
        setIsFirstTime(!hasVisited);
        
        const hasChosenSystem = characterData?.rpg_system !== null && characterData?.rpg_system !== undefined;
        
        if (!hasChosenSystem) {
          console.log('[useCharacterSheet] Sistema não escolhido - mostrando seletor');
          setIsSelectorExpanded(true);
          setIsSheetExpanded(false);
        } else {
          console.log(`[useCharacterSheet] Sistema já escolhido (${characterData.rpg_system}) - mostrando ficha`);
          setIsSelectorExpanded(false);
          setIsSheetExpanded(true);
        }
        
        setCharacter(characterData);
        setRpgSystem(characterData?.rpg_system || null);
        setIsInitialized(true);
        console.log('[useCharacterSheet] Inicialização concluída com sucesso');
        
      } catch (error) {
        console.error('[useCharacterSheet] Erro na inicialização:', error);
        setIsInitialized(true);
      }
    }
  }, [rawCharacter, character]);

  // Processo valores apenas quando character muda
  useEffect(() => {
    if (!character) {
      return;
    }
    
    console.log('[useCharacterSheet] Processando valores de atributos e skills');
    
    let attributeCount = 0;
    let skillCount = 0;
    
    let newAttributeValues = null;
    if (character.attributes && character.attributes.length > 0) {
      newAttributeValues = {};
      for (const charAttr of character.attributes) {
        if (charAttr.attribute_id) {
          newAttributeValues[charAttr.attribute_id] = charAttr.value;
          attributeCount++;
        }
      }
    }
    
    let newSkillValues = null;
    if (character.skills && character.skills.length > 0) {
      newSkillValues = {};
      for (const charSkill of character.skills) {
        if (charSkill.skill_id) {
          newSkillValues[charSkill.skill_id] = charSkill.value;
          skillCount++;
        }
      }
    }
    
    let newYearZeroAttributeValues = null;
    if (character.yearzero_attributes && character.yearzero_attributes.length > 0) {
      newYearZeroAttributeValues = {};
      for (const attr of character.yearzero_attributes) {
        if (attr.attribute_id) {
          newYearZeroAttributeValues[attr.attribute_id] = attr.value || 0;
        }
      }
    }
    
    let newYearZeroSkillValues = null;
    if (character.yearzero_skills && character.yearzero_skills.length > 0) {
      newYearZeroSkillValues = {};
      for (const skill of character.yearzero_skills) {
        if (skill.skill_id) {
          newYearZeroSkillValues[skill.skill_id] = skill.value || 0;
        }
      }
    }
    
    setCharacterValues({
      attributes: newAttributeValues,
      skills: newSkillValues,
      yearZeroAttributes: newYearZeroAttributeValues,
      yearZeroSkills: newYearZeroSkillValues
    });
    
    console.log(`[useCharacterSheet] Valores processados: ${attributeCount} atributos, ${skillCount} skills`);
    
  }, [character]);

  const managementFunctionsRef = useRef({
    setLoading: (key, isLoading) => {
      setLoadingStates(prev => {
        if (prev[key] === isLoading) return prev;
        return { ...prev, [key]: isLoading };
      });
      if (isLoading) console.log(`[useCharacterSheet] Loading: ${key}`);
    },
    
    handleApiError: (error, context) => {
      const errorMessage = error.response?.data?.error || error.message || `Erro ao ${context}`;
      console.error(`[useCharacterSheet] Erro em ${context}:`, errorMessage);
      setErrors(prev => {
        if (prev[context] === errorMessage) return prev;
        return { ...prev, [context]: errorMessage };
      });
      return errorMessage;
    },
    
    clearError: (context) => {
      setErrors(prev => {
        if (!prev[context]) return prev;
        const newErrors = { ...prev };
        delete newErrors[context];
        return newErrors;
      });
    }
  });

  const callbacksRef = useRef({
    onUpdate: (type, name, value) => {
      console.log(`[useCharacterSheet] onUpdate: ${type}, ${name}=${value}`);
      return { type, name, value, handled: true };
    },
    onAttributeRoll: (attributeName, attributeValue, stressCount = 0, stressSquares = []) => {
      console.log(`[useCharacterSheet] Rolando atributo: ${attributeName}=${attributeValue}`);
      return { attributeName, attributeValue, stressCount, stressSquares, timestamp: Date.now(), type: 'attribute' };
    },
    onSkillRoll: (skillName, skillValue, stressCount = 0, stressSquares = []) => {
      console.log(`[useCharacterSheet] Rolando skill: ${skillName}=${skillValue}`);
      return { skillName, skillValue, stressCount, stressSquares, timestamp: Date.now(), type: 'skill' };
    }
  });

  const handleSystemChange = useCallback(async (newSystem, api) => {
    console.log(`[useCharacterSheet] Mudando sistema para: ${newSystem}`);
    
    if (newSystem === 'expand_selector') {
      setIsSelectorExpanded(true);
      setIsSheetExpanded(false);
      return;
    }

    if (newSystem === rpgSystem && rpgSystem) {
      setIsSelectorExpanded(false);
      setIsSheetExpanded(true);
      return;
    }

    const currentCharacterId = character?.id;
    if (!newSystem || !currentCharacterId || !api) {
      console.error('[useCharacterSheet] Dados insuficientes');
      return;
    }

    setIsChangingSystem(true);
    managementFunctionsRef.current.clearError('systemChange');
    
    try {
      setIsSelectorExpanded(false);
      setIsSheetExpanded(true);
      setRpgSystem(newSystem);
      
      if (isFirstTime) {
        try {
          const visitedSheets = JSON.parse(localStorage.getItem('visited_character_sheets') || '[]');
          if (!visitedSheets.includes(currentCharacterId)) {
            visitedSheets.push(currentCharacterId);
            localStorage.setItem('visited_character_sheets', JSON.stringify(visitedSheets));
            setIsFirstTime(false);
          }
        } catch (error) {
          console.error('[useCharacterSheet] Erro ao marcar ficha:', error);
        }
      }
      
      const response = await api.put(`/character/${currentCharacterId}`, { rpg_system: newSystem });
      
      if (newSystem === "year_zero") {
        try {
          await api.post("/yearzero/setup", { character_id: currentCharacterId });
          
          // Re-fetch dos dados completos do personagem após o setup do Year Zero
          // O PUT foi feito antes do setup, então a resposta não inclui yearzero_attributes/skills
          const refreshedResponse = await api.get(`/character/${currentCharacterId}`);
          if (refreshedResponse?.data) {
            console.log('[useCharacterSheet] Personagem atualizado com dados Year Zero do setup');
            setCharacter(refreshedResponse.data);
            setIsChangingSystem(false);
            return;
          }
        } catch (error) {
          if (error.response?.status !== 404) {
            console.error('[useCharacterSheet] Erro no setup Year Zero:', error);
          }
        }
      }

      setIsChangingSystem(false);
      
      // Usar dados completos da resposta da API (inclui attributes/skills vinculados)
      if (response?.data?.data) {
        console.log('[useCharacterSheet] Personagem atualizado com dados completos da API');
        setCharacter(response.data.data);
      } else if (character) {
        const updatedCharacter = { ...character, rpg_system: newSystem };
        setCharacter(updatedCharacter);
      }
      
    } catch (error) {
      console.error(`[useCharacterSheet] Erro ao mudar sistema:`, error);
      setIsSelectorExpanded(true);
      setIsSheetExpanded(false);
      setRpgSystem(rpgSystem);
      managementFunctionsRef.current.handleApiError(error, 'systemChange');
      setIsChangingSystem(false);
    }
  }, [character, rpgSystem, isFirstTime]);

  const getAttributes = useCallback(() => character?.attributes || [], [character?.attributes]);
  const getSkills = useCallback(() => character?.skills || [], [character?.skills]);

  // Setters para valores individuais de atributos/skills
  const setAttributeValues = useCallback((updater) => {
    setCharacterValues(prev => ({
      ...prev,
      attributes: typeof updater === 'function' ? updater(prev.attributes || {}) : updater
    }));
  }, []);

  const setSkillValues = useCallback((updater) => {
    setCharacterValues(prev => ({
      ...prev,
      skills: typeof updater === 'function' ? updater(prev.skills || {}) : updater
    }));
  }, []);

  const setYearZeroAttributeValues = useCallback((updater) => {
    setCharacterValues(prev => ({
      ...prev,
      yearZeroAttributes: typeof updater === 'function' ? updater(prev.yearZeroAttributes || {}) : updater
    }));
  }, []);

  const setYearZeroSkillValues = useCallback((updater) => {
    setCharacterValues(prev => ({
      ...prev,
      yearZeroSkills: typeof updater === 'function' ? updater(prev.yearZeroSkills || {}) : updater
    }));
  }, []);

  const arraysAreEqual = useCallback((arr1, arr2) => {
    if (arr1 === arr2) return true;
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }, []);

  const markSheetAsVisited = useCallback(() => {
    if (typeof window === 'undefined' || !character?.id) return;
    try {
      const visitedSheets = JSON.parse(localStorage.getItem('visited_character_sheets') || '[]');
      if (!visitedSheets.includes(character.id)) {
        visitedSheets.push(character.id);
        localStorage.setItem('visited_character_sheets', JSON.stringify(visitedSheets));
        setIsFirstTime(false);
      }
    } catch (error) {
      console.error('[useCharacterSheet] Erro ao marcar ficha:', error);
    }
  }, [character?.id]);

  const api = useMemo(() => {
    console.log('[useCharacterSheet] Criando API otimizada');
    return {
      character,
      setCharacter,
      attributeValues: characterValues.attributes || {},
      skillValues: characterValues.skills || {},
      yearZeroAttributeValues: characterValues.yearZeroAttributes || {},
      yearZeroSkillValues: characterValues.yearZeroSkills || {},
      setAttributeValues,
      setSkillValues,
      setYearZeroAttributeValues,
      setYearZeroSkillValues,
      rpgSystem,
      setRpgSystem,
      isChangingSystem,
      setIsChangingSystem,
      loadingStates,
      setLoading: managementFunctionsRef.current.setLoading,
      errors,
      setErrors,
      handleApiError: managementFunctionsRef.current.handleApiError,
      clearError: managementFunctionsRef.current.clearError,
      isSelectorExpanded,
      setIsSelectorExpanded,
      isSheetExpanded,
      setIsSheetExpanded,
      isFirstTime,
      isInitialized,
      markSheetAsVisited,
      handleSystemChange,
      getAttributes,
      getSkills,
      arraysAreEqual,
      onUpdate: callbacksRef.current.onUpdate,
      onAttributeRoll: callbacksRef.current.onAttributeRoll,
      onSkillRoll: callbacksRef.current.onSkillRoll
    };
  }, [
    character,
    characterValues.attributes,
    characterValues.skills,
    characterValues.yearZeroAttributes,
    characterValues.yearZeroSkills,
    rpgSystem,
    isChangingSystem,
    loadingStates,
    errors,
    isSelectorExpanded,
    isSheetExpanded,
    isFirstTime,
    isInitialized
  ]);

  return api;
};