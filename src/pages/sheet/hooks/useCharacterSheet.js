import { useState, useEffect, useCallback } from 'react';

// Hook para verificar se estamos no cliente
const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};

// Hook personalizado para gerenciar o estado da ficha do personagem
export const useCharacterSheet = (rawCharacter, refreshData) => {
  const [character, setCharacter] = useState(rawCharacter);
  const [attributeValues, setAttributeValues] = useState({});
  const [skillValues, setSkillValues] = useState({});
  const [yearZeroAttributeValues, setYearZeroAttributeValues] = useState({});
  const [yearZeroSkillValues, setYearZeroSkillValues] = useState({});

  const [rpgSystem, setRpgSystem] = useState(rawCharacter?.rpg_system || '');
  const [isChangingSystem, setIsChangingSystem] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});
  
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isSelectorExpanded, setIsSelectorExpanded] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isClient = useIsClient();

  // Inicialização do componente
  useEffect(() => {
    if (!isClient) {
      setIsInitialized(true);
      return;
    }

    const characterId = rawCharacter?.id;

    if (!characterId) {
      setIsInitialized(true);
      return;
    }

    try {
      const visitedSheets = JSON.parse(localStorage.getItem('visited_character_sheets') || '[]');
      const hasVisited = visitedSheets.includes(characterId);
      const firstTime = !hasVisited;

      setIsFirstTime(firstTime);
      
      const hasRpgSystem = !!rawCharacter?.rpg_system;
      const shouldExpandSelector = !hasRpgSystem;
      const shouldExpandSheet = hasRpgSystem;
      
      setIsSelectorExpanded(shouldExpandSelector);
      setIsSheetExpanded(shouldExpandSheet);
      setIsInitialized(true);
    } catch (error) {
      console.error('Erro na inicialização:', error);
      setIsInitialized(true);
    }
  }, [rawCharacter?.id, rawCharacter?.rpg_system, isClient]);

  // Marcar ficha como visitada
  const markSheetAsVisited = useCallback(() => {
    if (typeof window === 'undefined' || !character?.id) {
      return;
    }
    
    try {
      const visitedSheets = JSON.parse(localStorage.getItem('visited_character_sheets') || '[]');
      if (!visitedSheets.includes(character.id)) {
        visitedSheets.push(character.id);
        localStorage.setItem('visited_character_sheets', JSON.stringify(visitedSheets));
        setIsFirstTime(false);
      }
    } catch (error) {
      console.error('Erro ao marcar ficha como visitada:', error);
    }
  }, [character?.id]);

  // Inicializar valores de atributos e habilidades
  useEffect(() => {
    if (character?.attributes) {
      const initialAttributeValues = {};
      character.attributes.forEach(charAttr => {
        if (charAttr.attribute_id) {
          initialAttributeValues[charAttr.attribute_id] = charAttr.value;
        }
      });
      setAttributeValues(initialAttributeValues);
    }

    if (character?.skills) {
      const initialSkillValues = {};
      character.skills.forEach(charSkill => {
        if (charSkill.skill_id) {
          initialSkillValues[charSkill.skill_id] = charSkill.value;
        }
      });
      setSkillValues(initialSkillValues);
    }
  }, [character]);

  // Gerenciamento de estados de loading
  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  // Tratamento de erros de API
  const handleApiError = useCallback((error, context) => {
    const errorMessage = error.response?.data?.error || error.message || `Erro ao ${context}`;
    setErrors(prev => ({ ...prev, [context]: errorMessage }));
    return errorMessage;
  }, []);

  // Limpar erros
  const clearError = useCallback((context) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[context];
      return newErrors;
    });
  }, []);

  // Mudança de sistema RPG - IMPORTANTE: api será passado do componente principal
  const handleSystemChange = useCallback(async (newSystem, api) => {
    if (newSystem === 'expand_selector') {
      setIsSelectorExpanded(true);
      setIsSheetExpanded(false);
      return;
    }

    if (newSystem === rpgSystem) {
      setIsSelectorExpanded(false);
      setIsSheetExpanded(true);
      return;
    }

    if (!newSystem || !character?.id || !api) {
      return;
    }

    setIsChangingSystem(true);
    clearError('systemChange');
    
    try {
      setIsSelectorExpanded(false);
      setIsSheetExpanded(true);
      setRpgSystem(newSystem);
      
      if (isFirstTime) {
        markSheetAsVisited();
      }
      
      await api.put(`/character/${character.id}`, {
        rpg_system: newSystem
      });
      
      setCharacter(prev => ({
        ...prev,
        rpg_system: newSystem
      }));

      // Setup automático para Year Zero
      if (newSystem === "year_zero") {
        try {
          await api.post("/yearzero/setup", {
            character_id: character.id
          });
          
          if (refreshData) {
            await refreshData();
          }
        } catch (error) {
          console.error("Erro no setup Year Zero:", error);
        }
      }

      setIsChangingSystem(false);
      
    } catch (error) {
      setIsSelectorExpanded(true);
      setIsSheetExpanded(false);
      setRpgSystem('');
      
      handleApiError(error, 'systemChange');
      setIsChangingSystem(false);
    }
  }, [
    character, 
    rpgSystem, 
    isFirstTime,
    clearError, 
    handleApiError, 
    refreshData,
    markSheetAsVisited
  ]);

  return {
    character,
    setCharacter,
    attributeValues,
    setAttributeValues,
    skillValues,
    setSkillValues,
    yearZeroAttributeValues,
    setYearZeroAttributeValues,
    yearZeroSkillValues,
    setYearZeroSkillValues,
    rpgSystem,
    setRpgSystem,
    isChangingSystem,
    setIsChangingSystem,
    loadingStates,
    setLoading,
    errors,
    setErrors,
    handleApiError,
    clearError,
    isSelectorExpanded,
    setIsSelectorExpanded,
    isSheetExpanded,
    setIsSheetExpanded,
    isFirstTime,
    isInitialized,
    markSheetAsVisited,
    handleSystemChange
  };
};
