import { useState, useEffect, useCallback } from 'react';

// Hook pra verificar se to no cliente
const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};

// Hook personalizado pra gerenciar o estado da ficha do personagem
// VERSÃO 1.3.0 - Fix: Atualiza estado completo após mudança de sistema
export const useCharacterSheet = (rawCharacter, refreshData) => {
  const [character, setCharacter] = useState(rawCharacter);
  const [attributeValues, setAttributeValues] = useState({});
  const [skillValues, setSkillValues] = useState({});
  const [yearZeroAttributeValues, setYearZeroAttributeValues] = useState({});
  const [yearZeroSkillValues, setYearZeroSkillValues] = useState({});

  // Sistema RPG agora pode ser null (não escolhido ainda)
  const [rpgSystem, setRpgSystem] = useState(rawCharacter?.rpg_system || null);
  const [isChangingSystem, setIsChangingSystem] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});
  
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isSelectorExpanded, setIsSelectorExpanded] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isClient = useIsClient();

  // Inicialização do componente - VERSÃO 1.3.0
  useEffect(() => {
    console.log('[useCharacterSheet] Inicializando versão 1.3.0');
    
    if (!isClient) {
      console.log('[useCharacterSheet] Não estou no cliente ainda');
      setIsInitialized(true);
      return;
    }

    const characterId = rawCharacter?.id;

    if (!characterId) {
      console.log('[useCharacterSheet] Personagem não encontrado');
      setIsInitialized(true);
      return;
    }

    try {
      console.log(`[useCharacterSheet] Personagem ID: ${characterId}, Sistema: ${rawCharacter?.rpg_system}`);
      
      // Verificar se a ficha já foi visitada
      const visitedSheets = JSON.parse(localStorage.getItem('visited_character_sheets') || '[]');
      const hasVisited = visitedSheets.includes(characterId);
      const firstTime = !hasVisited;

      setIsFirstTime(firstTime);
      
      // Lógica corrigida: sistema null = não escolhido ainda
      const hasChosenSystem = rawCharacter?.rpg_system !== null && rawCharacter?.rpg_system !== undefined;
      console.log(`[useCharacterSheet] Sistema escolhido? ${hasChosenSystem} (valor: ${rawCharacter?.rpg_system})`);
      
      if (!hasChosenSystem) {
        // Sistema não escolhido ainda - sempre mostrar seletor
        console.log('[useCharacterSheet] Sistema não escolhido - mostrando seletor');
        setIsSelectorExpanded(true);
        setIsSheetExpanded(false);
      } else {
        // Sistema já escolhido - mostrar ficha
        console.log(`[useCharacterSheet] Sistema já escolhido (${rawCharacter.rpg_system}) - mostrando ficha`);
        setIsSelectorExpanded(false);
        setIsSheetExpanded(true);
      }
      
      setIsInitialized(true);
      console.log('[useCharacterSheet] Inicialização concluída');
      
    } catch (error) {
      console.error('[useCharacterSheet] Erro na inicialização:', error);
      setIsInitialized(true);
    }
  }, [rawCharacter, isClient]);

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
        console.log(`[useCharacterSheet] Ficha ${character.id} marcada como visitada`);
      }
    } catch (error) {
      console.error('[useCharacterSheet] Erro ao marcar ficha como visitada:', error);
    }
  }, [character?.id]);

  // Inicializar valores de atributos e habilidades
  useEffect(() => {
    console.log('[useCharacterSheet] Inicializando valores de atributos e skills');
    
    if (character?.attributes) {
      const initialAttributeValues = {};
      character.attributes.forEach(charAttr => {
        if (charAttr.attribute_id) {
          initialAttributeValues[charAttr.attribute_id] = charAttr.value;
        }
      });
      setAttributeValues(initialAttributeValues);
      console.log(`[useCharacterSheet] ${Object.keys(initialAttributeValues).length} atributos inicializados`);
      
      // Debug: mostrar todos os atributos
      character.attributes.forEach((attr, i) => {
        console.log(`  ${i+1}. ${attr.attribute?.name || 'Sem nome'} (ID: ${attr.attribute_id}, Valor: ${attr.value})`);
      });
    }

    if (character?.skills) {
      const initialSkillValues = {};
      character.skills.forEach(charSkill => {
        if (charSkill.skill_id) {
          initialSkillValues[charSkill.skill_id] = charSkill.value;
        }
      });
      setSkillValues(initialSkillValues);
      console.log(`[useCharacterSheet] ${Object.keys(initialSkillValues).length} habilidades inicializadas`);
      
      // Debug: mostrar todas as skills
      character.skills.forEach((skill, i) => {
        console.log(`  ${i+1}. ${skill.skill?.name || 'Sem nome'} (ID: ${skill.skill_id}, Valor: ${skill.value})`);
      });
    }
  }, [character]);

  // Gerenciamento de estados de loading
  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
    if (isLoading) {
      console.log(`[useCharacterSheet] Loading iniciado: ${key}`);
    } else {
      console.log(`[useCharacterSheet] Loading concluído: ${key}`);
    }
  }, []);

  // Tratamento de erros de API
  const handleApiError = useCallback((error, context) => {
    const errorMessage = error.response?.data?.error || error.message || `Erro ao ${context}`;
    console.error(`[useCharacterSheet] Erro no contexto ${context}:`, errorMessage);
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
    console.log(`[useCharacterSheet] Erro limpo: ${context}`);
  }, []);

  // Mudança de sistema RPG - VERSÃO 1.3.0 (usa resposta completa da API)
  const handleSystemChange = useCallback(async (newSystem, api) => {
    console.log(`[useCharacterSheet] Tentando mudar sistema para: ${newSystem}`);
    
    if (newSystem === 'expand_selector') {
      console.log('[useCharacterSheet] Expandindo seletor manualmente');
      setIsSelectorExpanded(true);
      setIsSheetExpanded(false);
      return;
    }

    // Se clicar no mesmo sistema que já está ativo, só fecha o seletor
    if (newSystem === rpgSystem && rpgSystem) {
      console.log(`[useCharacterSheet] Sistema ${newSystem} já está ativo - fechando seletor`);
      setIsSelectorExpanded(false);
      setIsSheetExpanded(true);
      return;
    }

    if (!newSystem || !character?.id || !api) {
      console.error('[useCharacterSheet] Dados insuficientes para mudar sistema');
      return;
    }

    setIsChangingSystem(true);
    clearError('systemChange');
    
    try {
      console.log(`[useCharacterSheet] Iniciando mudança para sistema ${newSystem}`);
      
      // UI: fechar seletor e abrir ficha
      setIsSelectorExpanded(false);
      setIsSheetExpanded(true);
      setRpgSystem(newSystem);
      
      // Marcar como visitada se for primeira vez
      if (isFirstTime) {
        markSheetAsVisited();
      }
      
      // CORREÇÃO CRÍTICA: Capturar a resposta completa da API
      console.log(`[useCharacterSheet] Salvando sistema ${newSystem} no banco para personagem ${character.id}`);
      const response = await api.put(`/character/${character.id}`, {
        rpg_system: newSystem
      });
      
      // ATUALIZAÇÃO CRÍTICA: Usar TODOS os dados da resposta, não só rpg_system
      if (response.data && response.data.data) {
        console.log('[useCharacterSheet] Atualizando estado com dados completos da API');
        console.log(`[useCharacterSheet] Atributos recebidos: ${response.data.data.attributes?.length || 0}`);
        console.log(`[useCharacterSheet] Skills recebidas: ${response.data.data.skills?.length || 0}`);
        
        setCharacter(response.data.data);
      } else {
        // Fallback: atualizar só o rpg_system se não tiver dados completos
        console.log('[useCharacterSheet] API não retornou dados completos, usando fallback');
        setCharacter(prev => ({
          ...prev,
          rpg_system: newSystem
        }));
      }
      
      console.log(`[useCharacterSheet] Sistema ${newSystem} salvo com sucesso`);

      // Setup automático para Year Zero
      if (newSystem === "year_zero") {
        console.log('[useCharacterSheet] Iniciando setup Year Zero');
        try {
          await api.post("/yearzero/setup", {
            character_id: character.id
          });
          
          console.log('[useCharacterSheet] Setup Year Zero concluído');
          
          if (refreshData) {
            await refreshData();
          }
        } catch (error) {
          console.error("[useCharacterSheet] Erro no setup Year Zero:", error);
        }
      }
      
      // Setup automático para Feiticeiros
      if (newSystem === "feiticeiros") {
        console.log('[useCharacterSheet] Iniciando setup Feiticeiros');
        try {
          await api.post("/feiticeiros/setup", {
            character_id: character.id
          });
          
          console.log('[useCharacterSheet] Setup Feiticeiros concluído');
          
          if (refreshData) {
            await refreshData();
          }
        } catch (error) {
          console.error("[useCharacterSheet] Erro no setup Feiticeiros:", error);
        }
      }

      setIsChangingSystem(false);
      console.log(`[useCharacterSheet] Mudança para sistema ${newSystem} concluída com sucesso`);
      
      // Forçar um refresh dos dados pra garantir que tudo está atualizado
      if (refreshData) {
        console.log('[useCharacterSheet] Forçando refresh dos dados');
        await refreshData();
      }
      
    } catch (error) {
      console.error(`[useCharacterSheet] Erro ao mudar sistema para ${newSystem}:`, error);
      
      // Em caso de erro, voltar para seletor
      setIsSelectorExpanded(true);
      setIsSheetExpanded(false);
      setRpgSystem(null);
      
      handleApiError(error, 'systemChange');
      setIsChangingSystem(false);
      
      console.log('[useCharacterSheet] Sistema restaurado para estado de seleção');
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
