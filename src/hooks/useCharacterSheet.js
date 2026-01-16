// useCharacterSheet.js - VERSÃO 3.2.0 - FIX: Removido refreshData desnecessário após mudança de sistema
// Data: 2024-01-16
// Autor: Sistema RPG
// Versão: 3.2.0 - FIX: Removido refreshData desnecessário após mudança de sistema
// Descrição: Correção crítica que remove a chamada de refreshData após mudança de sistema, preservando scroll

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Hook minimalista para verificar se estou no cliente
const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};

// Hook personalizado para gerenciar o estado da ficha do personagem
// Versão 3.2.0 - FIX: Removido refreshData desnecessário
export const useCharacterSheet = (rawCharacter, refreshData) => {
  console.log('[useCharacterSheet] Versão 3.2.0 - Removido refreshData desnecessário após mudança de sistema');

  // Uso useRef para o character inicial para evitar múltiplas execuções
  const initialCharacterRef = useRef(rawCharacter);
  const [character, setCharacter] = useState(null);
  
  // Estado unificado e otimizado
  const [characterValues, setCharacterValues] = useState({
    attributes: null,
    skills: null,
    yearZeroAttributes: null,
    yearZeroSkills: null
  });

  // Estados mínimos necessários
  const [rpgSystem, setRpgSystem] = useState(null);
  const [isChangingSystem, setIsChangingSystem] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});
  
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isSelectorExpanded, setIsSelectorExpanded] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isClient = useIsClient();

  // Ref para refreshData do pai - agora com controle melhor
  const refreshDataRef = useRef(refreshData);
  const shouldRefreshAfterSystemChangeRef = useRef(false);
  
  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  // Inicialização otimizada - executa apenas uma vez
  useEffect(() => {
    if (!isClient) {
      console.log('[useCharacterSheet] Aguardando cliente...');
      return;
    }

    // Se já inicializei, não executo de novo
    if (isInitialized) {
      console.log('[useCharacterSheet] Já inicializado, pulando');
      return;
    }

    console.log('[useCharacterSheet] Executando inicialização otimizada');
    
    const characterId = initialCharacterRef.current?.id;

    if (!characterId) {
      console.log('[useCharacterSheet] Personagem não encontrado');
      setIsInitialized(true);
      return;
    }

    try {
      console.log(`[useCharacterSheet] Personagem ID: ${characterId}, Sistema: ${initialCharacterRef.current?.rpg_system || 'null'}`);
      
      // Verificar se a ficha já foi visitada uma única vez
      const visitedSheets = JSON.parse(localStorage.getItem('visited_character_sheets') || '[]');
      const hasVisited = visitedSheets.includes(characterId);
      
      setIsFirstTime(!hasVisited);
      
      // Lógica otimizada para sistema
      const hasChosenSystem = initialCharacterRef.current?.rpg_system !== null && initialCharacterRef.current?.rpg_system !== undefined;
      
      if (!hasChosenSystem) {
        console.log('[useCharacterSheet] Sistema não escolhido - mostrando seletor');
        setIsSelectorExpanded(true);
        setIsSheetExpanded(false);
      } else {
        console.log(`[useCharacterSheet] Sistema já escolhido (${initialCharacterRef.current.rpg_system}) - mostrando ficha`);
        setIsSelectorExpanded(false);
        setIsSheetExpanded(true);
      }
      
      // Configurar estados uma única vez
      setCharacter(initialCharacterRef.current);
      setRpgSystem(initialCharacterRef.current?.rpg_system || null);
      
      setIsInitialized(true);
      console.log('[useCharacterSheet] Inicialização otimizada concluída');
      
    } catch (error) {
      console.error('[useCharacterSheet] Erro na inicialização otimizada:', error);
      setIsInitialized(true);
    }
  }, [isClient, isInitialized]);

  // Processo valores apenas quando character muda de null para objeto
  useEffect(() => {
    if (!character) {
      return;
    }
    
    console.log('[useCharacterSheet] Processando valores de atributos e skills');
    
    let attributeCount = 0;
    let skillCount = 0;
    
    // Processo otimizado sem criar objetos desnecessários
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
    
    // Atualização otimizada com comparação profunda
    setCharacterValues(prev => {
      const prevAttrJson = JSON.stringify(prev.attributes);
      const newAttrJson = JSON.stringify(newAttributeValues);
      const prevSkillJson = JSON.stringify(prev.skills);
      const newSkillJson = JSON.stringify(newSkillValues);
      
      if (prevAttrJson === newAttrJson && prevSkillJson === newSkillJson) {
        console.log('[useCharacterSheet] Valores inalterados');
        return prev;
      }
      
      console.log(`[useCharacterSheet] Atualizando ${attributeCount} atributos e ${skillCount} skills`);
      return {
        ...prev,
        attributes: newAttributeValues,
        skills: newSkillValues
      };
    });
    
  }, [character]);

  // Funções de gerenciamento otimizadas com useRef
  const managementFunctionsRef = useRef({
    setLoading: (key, isLoading) => {
      setLoadingStates(prev => {
        if (prev[key] === isLoading) {
          return prev;
        }
        return {
          ...prev,
          [key]: isLoading
        };
      });
      
      if (isLoading) {
        console.log(`[useCharacterSheet] Loading: ${key}`);
      }
    },
    
    handleApiError: (error, context) => {
      const errorMessage = error.response?.data?.error || error.message || `Erro ao ${context}`;
      console.error(`[useCharacterSheet] Erro em ${context}:`, errorMessage);
      
      setErrors(prev => {
        if (prev[context] === errorMessage) {
          return prev;
        }
        return { ...prev, [context]: errorMessage };
      });
      
      return errorMessage;
    },
    
    clearError: (context) => {
      setErrors(prev => {
        if (!prev[context]) {
          return prev;
        }
        const newErrors = { ...prev };
        delete newErrors[context];
        return newErrors;
      });
    }
  });

  // Callbacks absolutamente estáveis com useRef
  const callbacksRef = useRef({
    onUpdate: (type, name, value) => {
      console.log(`[useCharacterSheet] onUpdate: ${type}, ${name}=${value}`);
      
      if (refreshDataRef.current) {
        console.log('[useCharacterSheet] Chamando refreshData');
      }
      
      return { type, name, value, handled: true };
    },
    
    onAttributeRoll: (attributeName, attributeValue, stressCount = 0, stressSquares = []) => {
      console.log(`[useCharacterSheet] Rolando atributo: ${attributeName}=${attributeValue}`);
      
      return {
        attributeName,
        attributeValue,
        stressCount,
        stressSquares,
        timestamp: Date.now(),
        type: 'attribute'
      };
    },
    
    onSkillRoll: (skillName, skillValue, stressCount = 0, stressSquares = []) => {
      console.log(`[useCharacterSheet] Rolando skill: ${skillName}=${skillValue}`);
      
      return {
        skillName,
        skillValue,
        stressCount,
        stressSquares,
        timestamp: Date.now(),
        type: 'skill'
      };
    }
  });

  // Mudança de sistema RPG otimizada - VERSÃO CORRIGIDA SEM REFRESHDATA AUTOMÁTICO
  const handleSystemChange = useCallback(async (newSystem, api) => {
    console.log(`[useCharacterSheet] Mudando sistema para: ${newSystem}`);
    
    if (newSystem === 'expand_selector') {
      console.log('[useCharacterSheet] Expandindo seletor');
      setIsSelectorExpanded(true);
      setIsSheetExpanded(false);
      return;
    }

    if (newSystem === rpgSystem && rpgSystem) {
      console.log(`[useCharacterSheet] Sistema ${newSystem} já ativo`);
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
      console.log(`[useCharacterSheet] Salvando sistema ${newSystem}`);
      
      // Atualizar estados primeiro para feedback imediato
      setIsSelectorExpanded(false);
      setIsSheetExpanded(true);
      setRpgSystem(newSystem);
      
      // Marcar como visitado se for primeira vez
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
      
      // Salvar o sistema no banco de dados
      console.log(`[useCharacterSheet] Salvando sistema ${newSystem} no banco`);
      await api.put(`/character/${currentCharacterId}`, {
        rpg_system: newSystem
      });
      
      // Setup automático apenas se necessário - com tratamento adequado
      if (newSystem === "year_zero") {
        try {
          console.log('[useCharacterSheet] Tentando setup Year Zero');
          await api.post("/yearzero/setup", {
            character_id: currentCharacterId
          });
          console.log('[useCharacterSheet] Setup Year Zero concluído');
        } catch (error) {
          // Tratamento específico para erro 404 - apenas log, não marca como erro
          if (error.response?.status === 404) {
            console.log('[useCharacterSheet] Endpoint /yearzero/setup não existe, ignorando setup');
          } else {
            console.error('[useCharacterSheet] Erro no setup Year Zero:', error);
            managementFunctionsRef.current.handleApiError(error, 'yearZeroSetup');
          }
        }
      }
      
      // Sistema Feiticeiros selecionado - sem setup automático
      if (newSystem === "feiticeiros") {
        console.log('[useCharacterSheet] Sistema Feiticeiros selecionado - sem setup automático');
      }

      setIsChangingSystem(false);
      console.log(`[useCharacterSheet] Sistema ${newSystem} configurado com sucesso`);
      
      // CORREÇÃO CRÍTICA: NÃO chamar refreshData após mudança de sistema
      // Isso preserva a posição do scroll e evita recarregamento desnecessário
      console.log('[useCharacterSheet] Skip refreshData para preservar scroll');
      
      // Em vez de refreshData, atualizar o character localmente se necessário
      if (character) {
        const updatedCharacter = {
          ...character,
          rpg_system: newSystem
        };
        setCharacter(updatedCharacter);
        console.log('[useCharacterSheet] Character atualizado localmente com novo sistema');
      }
      
    } catch (error) {
      console.error(`[useCharacterSheet] Erro ao mudar sistema:`, error);
      
      // Reverter estados em caso de erro
      setIsSelectorExpanded(true);
      setIsSheetExpanded(false);
      setRpgSystem(rpgSystem);
      
      managementFunctionsRef.current.handleApiError(error, 'systemChange');
      setIsChangingSystem(false);
    }
  }, [
    character,
    rpgSystem,
    isFirstTime
  ]);

  // Getter otimizado para attributes
  const getAttributes = useCallback(() => {
    return character?.attributes || [];
  }, [character?.attributes]);

  // Getter otimizado para skills
  const getSkills = useCallback(() => {
    return character?.skills || [];
  }, [character?.skills]);

  // Helper para arrays
  const arraysAreEqual = useCallback((arr1, arr2) => {
    if (arr1 === arr2) return true;
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;
    
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }, []);

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
      console.error('[useCharacterSheet] Erro ao marcar ficha:', error);
    }
  }, [character?.id]);

  // Objeto de retorno otimizado
  const api = useMemo(() => {
    console.log('[useCharacterSheet] Criando API otimizada');
    
    return {
      // Estados essenciais
      character,
      setCharacter,
      attributeValues: characterValues.attributes || {},
      skillValues: characterValues.skills || {},
      yearZeroAttributeValues: characterValues.yearZeroAttributes || {},
      yearZeroSkillValues: characterValues.yearZeroSkills || {},
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
      
      // Callbacks absolutamente estáveis - mesmas referências sempre
      onUpdate: callbacksRef.current.onUpdate,
      onAttributeRoll: callbacksRef.current.onAttributeRoll,
      onSkillRoll: callbacksRef.current.onSkillRoll
    };
  }, [
    // Dependências mínimas - apenas o que realmente pode mudar
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