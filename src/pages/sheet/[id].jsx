import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { 
  Grid, 
  Container, 
  Button, 
  Box, 
  Typography, 
  TextField, 
  Alert, 
  CircularProgress,
  Collapse,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Casino,
  Remove
} from '@mui/icons-material';

import { api } from '../../utils';
import socket from '../../utils/socket';

import {
  Header, 
  Section, 
  StatusBar, 
  DiceRollModal,
  YearZeroDiceModal, 
  StatusBarModal, 
  ChangePictureModal
} from '../../components';

import {
  CharacterInfoForm
} from '../../components/forms';

import SheetSelector from '../../components/sheets/SheetSelector';
import YearZeroSheet from '../../components/sheets/YearZeroSheet';
import FeiticeirosSheet from '../../components/sheets/FeiticeirosSheet';

import useModal from '../../hooks/useModal';
import { prisma } from '../../database';

const validateCharacterId = (id) => {
  console.log('[DEBUG] validateCharacterId - Validando ID:', id);
  const characterId = Number(id);
  const isValid = !isNaN(characterId);
  console.log('[DEBUG] validateCharacterId - Resultado:', { id, characterId, isValid });
  return isValid ? characterId : null;
};

export const getServerSideProps = async ({ params }) => {
  console.log('[DEBUG] getServerSideProps - Iniciando SSR com params:', params);
  
  try {
    const characterId = validateCharacterId(params.id);
    console.log('[DEBUG] getServerSideProps - ID validado:', characterId);

    if (!characterId) {
      console.error('[ERROR] getServerSideProps - ID do personagem invalido');
      return {
        props: {
          character: null,
          error: 'ID do personagem invalido'
        }
      };
    }

    console.log('[DEBUG] getServerSideProps - Buscando character no banco:', characterId);
    const character = await prisma.character.findUnique({
      where: {
        id: characterId
      },
      include: {
        attributes: {
          include: {
            attribute: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        yearzero_attributes: {
          include: {
            attribute: true
          }
        },
        yearzero_skills: {
          include: {
            skill: true
          }
        }
      }
    });

    console.log('[DEBUG] getServerSideProps - Character encontrado:', !!character);
    console.log('[DEBUG] getServerSideProps - Detalhes do character:', {
      id: character?.id,
      name: character?.name,
      rpgSystem: character?.rpg_system,
      attributesCount: character?.attributes?.length,
      skillsCount: character?.skills?.length,
      yearZeroAttributesCount: character?.yearzero_attributes?.length,
      yearZeroSkillsCount: character?.yearzero_skills?.length
    });

    if (character?.rpg_system === 'year_zero' && 
        (!character.yearzero_attributes || character.yearzero_attributes.length === 0)) {
      console.log('[DEBUG] getServerSideProps - Executando auto-setup para Year Zero');
      try {
        const setupResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/yearzero/setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            character_id: characterId
          })
        });
        
        if (setupResponse.ok) {
          console.log('[DEBUG] getServerSideProps - Auto-setup concluido com sucesso');
          
          const updatedCharacter = await prisma.character.findUnique({
            where: { id: characterId },
            include: {
              attributes: { include: { attribute: true } },
              skills: { include: { skill: true } },
              yearzero_attributes: { include: { attribute: true } },
              yearzero_skills: { include: { skill: true } }
            }
          });
          
          if (updatedCharacter) {
            character.yearzero_attributes = updatedCharacter.yearzero_attributes;
            character.yearzero_skills = updatedCharacter.yearzero_skills;
            console.log('[DEBUG] getServerSideProps - Dados Year Zero recarregados apos setup');
          }
        } else {
          console.error('[ERROR] getServerSideProps - Erro no auto-setup:', await setupResponse.text());
        }
      } catch (error) {
        console.error('[ERROR] getServerSideProps - Erro no auto-setup:', error);
      }
    }

    if (!character) {
      console.error('[ERROR] getServerSideProps - Personagem nao encontrado');
      return {
        props: {
          character: null,
          error: 'Personagem nao encontrado'
        }
      };
    }

    const serializedCharacter = JSON.parse(JSON.stringify(character));
    console.log('[DEBUG] getServerSideProps - Character serializado com sucesso');

    return {
      props: {
        rawCharacter: serializedCharacter,
        error: null
      }
    };
  } catch (error) {
    console.error('[ERROR] getServerSideProps - Erro critico:', error);
    return {
      props: {
        character: null,
        error: 'Erro interno do servidor'
      }
    };
  }
};

const useCharacterSheet = (rawCharacter, refreshData) => {
  console.log('[DEBUG] useCharacterSheet - Inicializando hook com rawCharacter:', rawCharacter?.id);
  
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[DEBUG] useCharacterSheet - Inicializando no cliente');
    
    const characterId = rawCharacter?.id;
    if (!characterId) {
      console.log('[DEBUG] useCharacterSheet - Sem character ID, usando padrões');
      setIsInitialized(true);
      return;
    }

    const visitedSheets = JSON.parse(localStorage.getItem('visited_character_sheets') || '[]');
    const hasVisited = visitedSheets.includes(characterId);
    const firstTime = !hasVisited;
    
    console.log('[DEBUG] useCharacterSheet - Verificando primeira visita:', {
      characterId,
      visitedSheets,
      hasVisited,
      firstTime
    });

    setIsFirstTime(firstTime);
    
    const shouldExpandSelector = firstTime || !rawCharacter?.rpg_system;
    const shouldExpandSheet = !firstTime && !!rawCharacter?.rpg_system;
    
    console.log('[DEBUG] useCharacterSheet - Definindo estados de expansão:', {
      firstTime,
      hasSystem: !!rawCharacter?.rpg_system,
      shouldExpandSelector,
      shouldExpandSheet
    });

    setIsSelectorExpanded(shouldExpandSelector);
    setIsSheetExpanded(shouldExpandSheet);
    setIsInitialized(true);
    
  }, [rawCharacter?.id, rawCharacter?.rpg_system]);

  const markSheetAsVisited = useCallback(() => {
    if (typeof window === 'undefined' || !character?.id) return;
    
    const visitedSheets = JSON.parse(localStorage.getItem('visited_character_sheets') || '[]');
    if (!visitedSheets.includes(character.id)) {
      visitedSheets.push(character.id);
      localStorage.setItem('visited_character_sheets', JSON.stringify(visitedSheets));
      setIsFirstTime(false);
      console.log('[DEBUG] useCharacterSheet - Ficha marcada como visitada:', character.id);
    }
  }, [character?.id]);

  useEffect(() => {
    console.log('[DEBUG] useCharacterSheet useEffect - Inicializando valores de atributos e habilidades');
    
    if (character?.attributes) {
      const initialAttributeValues = {};
      character.attributes.forEach(charAttr => {
        initialAttributeValues[charAttr.attribute_id] = charAttr.value;
        console.log(`[DEBUG] useCharacterSheet - Atributo ${charAttr.attribute_id}: ${charAttr.attribute.name} = ${charAttr.value}`);
      });
      setAttributeValues(initialAttributeValues);
    }

    if (character?.skills) {
      const initialSkillValues = {};
      character.skills.forEach(charSkill => {
        initialSkillValues[charSkill.skill_id] = charSkill.value;
        console.log(`[DEBUG] useCharacterSheet - Habilidade ${charSkill.skill_id}: ${charSkill.skill.name} = ${charSkill.value}`);
      });
      setSkillValues(initialSkillValues);
    }
  }, [character]);

  const setLoading = useCallback((key, isLoading) => {
    console.log(`[DEBUG] useCharacterSheet setLoading - ${key}: ${isLoading}`);
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const handleApiError = useCallback((error, context) => {
    console.error(`[ERROR] useCharacterSheet handleApiError - Contexto: ${context}`, error);
    const errorMessage = error.response?.data?.error || error.message || `Erro ao ${context}`;
    setErrors(prev => ({ ...prev, [context]: errorMessage }));
    return errorMessage;
  }, []);

  const clearError = useCallback((context) => {
    console.log(`[DEBUG] useCharacterSheet clearError - Limpando erro: ${context}`);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[context];
      return newErrors;
    });
  }, []);

  const handleSystemChange = useCallback(async (newSystem) => {
    console.log('[DEBUG] useCharacterSheet handleSystemChange - Nova solicitacao:', { 
      currentSystem: rpgSystem, 
      newSystem,
      isFirstTime
    });
    
    if (newSystem === 'expand_selector') {
      console.log('[DEBUG] useCharacterSheet handleSystemChange - Expandindo seletor');
      setIsSelectorExpanded(true);
      setIsSheetExpanded(false);
      return;
    }

    if (newSystem === rpgSystem) {
      console.log('[DEBUG] useCharacterSheet handleSystemChange - Recolhendo seletor - sistema ja selecionado');
      setIsSelectorExpanded(false);
      setIsSheetExpanded(true);
      return;
    }

    if (!newSystem || !character?.id) {
      console.error('[ERROR] useCharacterSheet handleSystemChange - Dados invalidos para mudanca de sistema');
      return;
    }

    console.log('[DEBUG] useCharacterSheet handleSystemChange - Iniciando mudanca de sistema');
    setIsChangingSystem(true);
    clearError('systemChange');
    
    try {
      setIsSelectorExpanded(false);
      setIsSheetExpanded(true);
      setRpgSystem(newSystem);
      
      if (isFirstTime) {
        markSheetAsVisited();
      }
      
      console.log('[DEBUG] useCharacterSheet handleSystemChange - Fazendo requisicao para API');
      await api.put(`/character/${character.id}`, {
        rpg_system: newSystem
      });
      
      setCharacter(prev => ({
        ...prev,
        rpg_system: newSystem
      }));
      
      console.log('[DEBUG] useCharacterSheet handleSystemChange - Mudanca de sistema concluida com sucesso');

      if (newSystem === "year_zero") {
        console.log("[DEBUG] handleSystemChange - Configurando personagem para Year Zero Engine");
        try {
          await api.post("/yearzero/setup", {
            character_id: character.id
          });
          console.log("[DEBUG] handleSystemChange - Personagem configurado para Year Zero");
          
          if (refreshData) {
            console.log("[DEBUG] handleSystemChange - Recarregando dados apos setup");
            await refreshData();
          }
        } catch (error) {
          console.error("[ERROR] handleSystemChange - Erro no setup Year Zero:", error);
        }
      }

      setIsChangingSystem(false);
      
    } catch (error) {
      console.error('[ERROR] useCharacterSheet handleSystemChange - Erro na mudanca de sistema:', error);
      
      setIsSelectorExpanded(true);
      setIsSheetExpanded(false);
      setRpgSystem('');
      
      const errorMessage = handleApiError(error, 'systemChange');
      setIsChangingSystem(false);
      throw new Error(errorMessage);
    }
  }, [
    character, 
    rpgSystem, 
    isFirstTime,
    clearError, 
    handleApiError, 
    setCharacter, 
    refreshData,
    setIsSelectorExpanded,
    setIsSheetExpanded,
    setRpgSystem,
    setIsChangingSystem,
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

function CharacterSheet({ rawCharacter, error: serverError }) {
  console.log('[DEBUG] CharacterSheet - Componente renderizado com props:', {
    rawCharacterId: rawCharacter?.id,
    serverError
  });
  
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  console.log('[DEBUG] CharacterSheet - Configuracoes de dispositivo:', {
    isMobile,
    theme: theme.palette.mode
  });

  const refreshData = useCallback(() => {
    console.log('[DEBUG] CharacterSheet refreshData - Atualizando dados da pagina');
    return router.replace(router.asPath);
  }, [router]);

  const {
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
    isChangingSystem,
    loadingStates,
    setLoading,
    errors,
    handleApiError,
    clearError,
    isSelectorExpanded,
    isSheetExpanded,
    isFirstTime,
    isInitialized,
    handleSystemChange
  } = useCharacterSheet(rawCharacter, refreshData);

  console.log('[DEBUG] CharacterSheet - Estados do hook:', {
    characterId: character?.id,
    rpgSystem,
    isSelectorExpanded,
    isSheetExpanded,
    isChangingSystem,
    loadingStatesCount: Object.keys(loadingStates).length,
    errorsCount: Object.keys(errors).length
  });

  const handleCharacterInfoSubmit = useCallback(async (values) => {
    console.log('[DEBUG] CharacterSheet handleCharacterInfoSubmit - Iniciando atualizacao:', values);
    setLoading('characterInfo', true);
    clearError('characterInfo');
    
    try {
      await api.put(`/character/${character.id}`, values);
      console.log('[SUCCESS] CharacterSheet handleCharacterInfoSubmit - Atualizacao bem-sucedida');
      setLoading('characterInfo', false);
      return Promise.resolve();
    } catch (error) {
      const errorMessage = handleApiError(error, 'characterInfo');
      setLoading('characterInfo', false);
      return Promise.reject(errorMessage);
    }
  }, [character, setLoading, clearError, handleApiError]);

  const handleHitPointsUpdate = useCallback(async (newData) => {
    console.log('[DEBUG] CharacterSheet handleHitPointsUpdate - Atualizando pontos de vida:', newData);
    setLoading('hitPoints', true);
    clearError('hitPoints');
    
    try {
      const data = {
        current_hit_points: Number(newData.current),
        max_hit_points: Number(newData.max)
      };

      console.log('[DEBUG] CharacterSheet handleHitPointsUpdate - Dados validados:', data);

      if (isNaN(data.current_hit_points) || isNaN(data.max_hit_points)) {
        throw new Error('Valores de pontos de vida invalidos');
      }

      if (data.current_hit_points < 0 || data.max_hit_points < 0) {
        throw new Error('Pontos de vida nao podem ser negativos');
      }

      if (data.current_hit_points > data.max_hit_points) {
        throw new Error('Pontos de vida atuais nao podem ser maiores que os maximos');
      }

      await api.put(`/character/${character.id}`, data);
      
      setCharacter(prev => ({
        ...prev,
        current_hit_points: data.current_hit_points,
        max_hit_points: data.max_hit_points
      }));
      
      console.log('[SUCCESS] CharacterSheet handleHitPointsUpdate - Pontos de vida atualizados com sucesso');
      setLoading('hitPoints', false);
      return Promise.resolve();
    } catch (error) {
      const errorMessage = handleApiError(error, 'hitPoints');
      setLoading('hitPoints', false);
      return Promise.reject(errorMessage);
    }
  }, [character, setLoading, clearError, handleApiError, setCharacter]);

  const handleQuickHealthChange = useCallback(async (amount, type = 'heal') => {
    console.log(`[DEBUG] CharacterSheet handleQuickHealthChange - ${type} ${amount} pontos`);
    
    const currentHP = character?.current_hit_points || 0;
    const maxHP = character?.max_hit_points || 0;
    
    let newCurrentHP;
    if (type === 'heal') {
      newCurrentHP = Math.min(currentHP + amount, maxHP);
    } else {
      newCurrentHP = Math.max(0, currentHP - amount);
    }

    console.log(`[DEBUG] CharacterSheet handleQuickHealthChange - HP atual: ${currentHP} -> ${newCurrentHP}`);

    if (newCurrentHP === currentHP) {
      console.log('[DEBUG] CharacterSheet handleQuickHealthChange - Sem mudanca necessaria');
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
      
      console.log('[SUCCESS] CharacterSheet handleQuickHealthChange - Saude atualizada com sucesso');
      setLoading('quickHealth', false);
      
      if (newCurrentHP === 0 && type === 'damage') {
        console.log('[WARN] CharacterSheet handleQuickHealthChange - Personagem inconsciente');
        setTimeout(() => alert('Personagem inconsciente!'), 100);
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'quickHealth');
      setLoading('quickHealth', false);
      throw new Error(errorMessage);
    }
  }, [character, setLoading, clearError, handleApiError, setCharacter]);

  const handleAttributeChange = useCallback((attributeId, newValue) => {
    console.log(`[DEBUG] CharacterSheet handleAttributeChange - Atributo ${attributeId}: ${newValue}`);
    const numericValue = newValue === '' ? '' : parseInt(newValue) || 0;
    
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: numericValue
    }));
  }, []);

  const handleSkillChange = useCallback((skillId, newValue) => {
    console.log(`[DEBUG] CharacterSheet handleSkillChange - Habilidade ${skillId}: ${newValue}`);
    const numericValue = newValue === '' ? '' : parseInt(newValue) || 0;
    
    setSkillValues(prev => ({
      ...prev,
      [skillId]: numericValue
    }));
  }, []);

  const saveAttributeValue = useCallback(async (attributeId) => {
    console.log(`[DEBUG] CharacterSheet saveAttributeValue - Salvando atributo ${attributeId}`);
    setLoading(`attribute-${attributeId}`, true);
    clearError(`attribute-${attributeId}`);
    
    try {
      const value = attributeValues[attributeId] || 0;
      console.log(`[DEBUG] CharacterSheet saveAttributeValue - Valor a ser salvo: ${value}`);
      
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
        const updated = {
          ...prev
        };
        
        if (rpgSystem === 'year_zero') {
          updated.yearzero_attributes = prev.yearzero_attributes.map(attr =>
            attr.attribute_id === attributeId
              ? { ...attr, value: value }
              : attr
          );
        } else {
          updated.attributes = prev.attributes.map(attr =>
            attr.attribute_id === attributeId
              ? { ...attr, value: value }
              : attr
          );
        }
        
        return updated;
      });
      
      console.log(`[SUCCESS] CharacterSheet saveAttributeValue - Atributo ${attributeId} salvo com sucesso`);
      setLoading(`attribute-${attributeId}`, false);
    } catch (error) {
      const errorMessage = handleApiError(error, `attribute-${attributeId}`);
      setLoading(`attribute-${attributeId}`, false);
      throw new Error(errorMessage);
    }
  }, [character, attributeValues, setLoading, clearError, handleApiError, setCharacter, rpgSystem]);

  const saveSkillValue = useCallback(async (skillId) => {
    console.log(`[DEBUG] CharacterSheet saveSkillValue - Salvando habilidade ${skillId}`);
    setLoading(`skill-${skillId}`, true);
    clearError(`skill-${skillId}`);
    
    try {
      const value = skillValues[skillId] || 0;
      console.log(`[DEBUG] CharacterSheet saveSkillValue - Valor a ser salvo: ${value}`);
      
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
        const updated = {
          ...prev
        };
        
        if (rpgSystem === 'year_zero') {
          updated.yearzero_skills = prev.yearzero_skills.map(skill =>
            skill.skill_id === skillId
              ? { ...skill, value: value }
              : skill
          );
        } else {
          updated.skills = prev.skills.map(skill =>
            skill.skill_id === skillId
              ? { ...skill, value: value }
              : skill
          );
        }
        
        return updated;
      });
      
      console.log(`[SUCCESS] CharacterSheet saveSkillValue - Habilidade ${skillId} salva com sucesso`);
      setLoading(`skill-${skillId}`, false);
    } catch (error) {
      const errorMessage = handleApiError(error, `skill-${skillId}`);
      setLoading(`skill-${skillId}`, false);
      throw new Error(errorMessage);
    }
  }, [character, skillValues, setLoading, clearError, handleApiError, setCharacter, rpgSystem]);

  const getAttributeValue = useCallback((charAttr) => {
    if (!charAttr?.attribute) {
      console.warn(`[WARN] CharacterSheet getAttributeValue - Atributo invalido:`, charAttr);
      return '';
    }
    
    const attributeId = charAttr.attribute.id;
    const value = attributeValues[attributeId] !== undefined 
      ? attributeValues[attributeId] 
      : charAttr.value;
    
    const result = value === 0 || value === '0' || value === '' ? '' : String(value);
    console.log(`[DEBUG] CharacterSheet getAttributeValue - ${charAttr.attribute.name}: ${result}`);
    
    return result;
  }, [attributeValues]);

  const getSkillValue = useCallback((charSkill) => {
    if (!charSkill?.skill) {
      console.warn(`[WARN] CharacterSheet getSkillValue - Habilidade invalida:`, charSkill);
      return '';
    }
    
    const skillId = charSkill.skill.id;
    const value = skillValues[skillId] !== undefined 
      ? skillValues[skillId] 
      : charSkill.value;
    
    const result = value === 0 || value === '0' || value === '' ? '' : String(value);
    console.log(`[DEBUG] CharacterSheet getSkillValue - ${charSkill.skill.name}: ${result}`);
    
    return result;
  }, [skillValues]);

  const validateNumericInput = useCallback((event) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (!/[0-9]/.test(event.key)) {
      console.log(`[DEBUG] CharacterSheet validateNumericInput - Tecla bloqueada: ${event.key}`);
      event.preventDefault();
    }
  }, []);

  const attributeDiceModal = useModal(({ close, custom }) => {
    console.log('[DEBUG] CharacterSheet attributeDiceModal - Criando modal com props:', custom);
    return (
      <DiceRollModal
        handleClose={close}
        characterId={custom.characterId}
        characterName={custom.characterName}
        skillName={custom.attributeName}
        skillValue={custom.attributeValue}
      />
    );
  });

  const diceRollModal = useModal(({ close, custom }) => {
    console.log('[DEBUG] CharacterSheet diceRollModal - Criando modal com props:', custom);
    return (
      <DiceRollModal
        handleClose={close}
        characterId={custom.characterId}
        characterName={custom.characterName}
        skillName={custom.skillName}
        skillValue={custom.skillValue}
      />
    );
  });

  const statusBarModal = useModal(({ close, custom }) => {
    console.log('[DEBUG] CharacterSheet statusBarModal - Criando modal com props:', custom);
    return (
      <StatusBarModal
        handleClose={close}
        characterId={custom.characterId}
        characterName={custom.characterName}
        currentHitPoints={custom.currentHitPoints}
        maxHitPoints={custom.maxHitPoints}
        onSubmit={handleHitPointsUpdate}
        isLoading={loadingStates.hitPoints}
      />
    );
  });

  const changePictureModal = useModal(({ close, custom }) => {
    console.log('[DEBUG] CharacterSheet changePictureModal - Criando modal com props:', custom);
    return (
      <ChangePictureModal
        handleClose={close}
        characterId={custom.characterId}
        characterName={custom.characterName}
      />
    );
  });

  const handleYearZeroUpdate = useCallback(async (type, name, value) => {
    console.log("[DEBUG] onUpdate INICIADO - Sistema:", rpgSystem, "Type:", type, "Name:", name, "Value:", value);
    
    const getAttributeIdByName = (attrName) => {
      const attributesList = rpgSystem === 'year_zero'
        ? character.yearzero_attributes
        : character.attributes;
      
      console.log("[SERVER DEBUG] getAttributeIdByName - Sistema:", rpgSystem, 
        "YearZero Attributes:", character.yearzero_attributes?.map(a => a.attribute?.name),
        "Classic Attributes:", character.attributes?.map(a => a.attribute?.name),
        "Procurando por:", attrName);
      
      const attr = attributesList?.find(a => a.attribute?.name === attrName);
      const foundId = attr?.attribute?.id;
      console.log("[SERVER DEBUG] Resultado:", foundId);
      return foundId;
    };
    
    const getSkillIdByName = (skillName) => {
      const skillsList = rpgSystem === 'year_zero' 
        ? character.yearzero_skills 
        : character.skills;
      const skill = skillsList?.find(s => s.skill?.name === skillName);
      return skill?.skill?.id;
    };
    
    console.log('[DEBUG] CharacterSheet onUpdate YearZero - Chamado:', { type, name, value });
    console.log("[DEBUG] CharacterSheet onUpdate - Nomes disponíveis:", { 
      attributes: rpgSystem === 'year_zero' ? character.yearzero_attributes?.map(a => a.attribute?.name) : character.attributes?.map(a => a.attribute?.name), 
      skills: rpgSystem === 'year_zero' ? character.yearzero_skills?.map(s => s.skill?.name) : character.skills?.map(s => s.skill?.name) 
    });
    console.log("[DEBUG] - Sistema atual:", rpgSystem, "Year Zero Attributes:", character.yearzero_attributes?.map(a => a.attribute?.name));
    
    try {
      if (type === 'attribute') {
        console.log(`[DEBUG] CharacterSheet onUpdate YearZero - Salvando atributo Year Zero: ${name} = ${value}`);
        const availableAttributes = rpgSystem === 'year_zero' ? character.yearzero_attributes?.map(a => a.attribute?.name) : character.attributes?.map(a => a.attribute?.name);
        console.log("[DEBUG] - Nome recebido:", name, "Nomes disponíveis:", availableAttributes);
        
        const attributeId = getAttributeIdByName(name);
        console.log(`[DEBUG] CharacterSheet onUpdate - Mapeando atributo "${name}" para ID:`, attributeId);
        
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
          yearzero_attributes: prev.yearzero_attributes.map(attr =>
            attr.attribute_id === attributeId
              ? { ...attr, value: parseInt(value) || 1 }
              : attr
          )
        }));

        setYearZeroAttributeValues(prev => ({
          ...prev,
          [attributeId]: parseInt(value) || 1
        }));
        
        console.log(`[SUCCESS] CharacterSheet onUpdate YearZero - Atributo ${name} salvo com sucesso`);
        
      } else if (type === 'skill') {
        const skillId = getSkillIdByName(name);
        console.log(`[DEBUG] CharacterSheet onUpdate - Mapeando skill "${name}" para ID:`, skillId);
        
        if (!skillId) {
          throw new Error(`Skill "${name}" não encontrada`);
        }
        
        console.log(`[DEBUG] CharacterSheet onUpdate YearZero - Salvando skill Year Zero: ${name} = ${value}`);
        
        await api.put('/yearzero/skill', {
          character_id: character.id,
          skill_id: skillId,
          value: parseInt(value) || 1
        });

        setCharacter(prev => ({
          ...prev,
          yearzero_skills: prev.yearzero_skills.map(skill =>
            skill.skill_id === skillId
              ? { ...skill, value: parseInt(value) || 1 }
              : skill
          )
        }));

        setYearZeroSkillValues(prev => ({
          ...prev,
          [skillId]: parseInt(value) || 1
        }));
        
        console.log(`[SUCCESS] CharacterSheet onUpdate YearZero - Skill ${name} salva com sucesso`);
        
      } else if (type === 'stress_squares') {
        console.log(`[DEBUG] CharacterSheet onUpdate YearZero - Salvando stress_squares:`, value);
        
        const squaresJson = JSON.stringify(value);
        await api.put(`/character/${character.id}`, {
          stress_squares: squaresJson
        });
        
        setCharacter(prev => ({
          ...prev,
          stress_squares: squaresJson
        }));
        
        console.log(`[SUCCESS] CharacterSheet onUpdate YearZero - Stress squares salvos com sucesso`);
        
      } else if (type === 'health_squares') {
        console.log(`[DEBUG] CharacterSheet onUpdate YearZero - Salvando health_squares:`, value);
        
        const squaresJson = JSON.stringify(value);
        await api.put(`/character/${character.id}`, {
          health_squares: squaresJson
        });
        
        setCharacter(prev => ({
          ...prev,
          health_squares: squaresJson
        }));
        
        console.log(`[SUCCESS] CharacterSheet onUpdate YearZero - Health squares salvos com sucesso`);
        
      } else {
        console.warn(`[WARN] CharacterSheet onUpdate YearZero - Tipo desconhecido: ${type}`);
      }
      
    } catch (error) {
      console.error(`[ERROR] CharacterSheet onUpdate YearZero - Erro ao salvar ${type} ${name}:`, error);
      const errorMessage = error.response?.data?.error || error.message || `Erro ao salvar ${type}`;
      console.error(`[ERROR] CharacterSheet onUpdate YearZero - Erro: ${errorMessage}`);
    }
  }, [character, rpgSystem, setCharacter, setYearZeroAttributeValues, setYearZeroSkillValues]);

  const handleYearZeroPushRoll = useCallback(() => {
    console.log('[DEBUG] handleYearZeroPushRoll - Iniciando atualizacao de stress por rolagem forçada');
    
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
        console.log('[DEBUG] handleYearZeroPushRoll - Stress já está no máximo (10)');
        return;
      }
      
      const newStressCount = currentStressCount + 1;
      const newStressSquares = Array(10).fill(false);
      for (let i = 0; i < newStressCount; i++) {
        newStressSquares[i] = true;
      }
      
      console.log('[DEBUG] handleYearZeroPushRoll - Adicionando stress:', 
                  `De ${currentStressCount} para ${newStressCount} quadrados`);
      
      handleYearZeroUpdate('stress_squares', 'stress_squares', newStressSquares);
      
    } catch (error) {
      console.error('[ERROR] handleYearZeroPushRoll - Erro ao processar stress squares:', error);
    }
  }, [character, handleYearZeroUpdate]);

  const yearZeroDiceModal = useModal(({ close, custom }) => {
    console.log('[DEBUG] CharacterSheet yearZeroDiceModal - Criando modal com props:', custom);
    return (
      <YearZeroDiceModal
        handleClose={close}
        characterId={custom.characterId}
        baseDice={custom.baseDice}
        skillDice={custom.skillDice}
        gearDice={custom.gearDice}
        attributeName={custom.attributeName}
        skillName={custom.skillName}
        character={character}
        stressSquares={custom.stressSquares}
        onPushRoll={handleYearZeroPushRoll}
      />
    );
  });

  const handleYearZeroAttributeRoll = useCallback((attributeName, attributeValue, stressCount, stressSquares) => {
    console.log('[DEBUG] CharacterSheet - Rolagem de atributo Year Zero:', { 
      attributeName, 
      attributeValue, 
      stressCount,
      stressSquares 
    });
    
    yearZeroDiceModal.appear({
      characterId: character.id,
      baseDice: attributeValue,
      skillDice: 0,
      gearDice: 0,
      attributeName: attributeName,
      skillName: '',
      stressSquares: stressSquares
    });
  }, [character, yearZeroDiceModal]);

  const handleYearZeroSkillRoll = useCallback((skillName, skillValue, stressCount, stressSquares) => {
    console.log('[DEBUG] CharacterSheet - Rolagem de skill Year Zero:', { 
      skillName, 
      skillValue, 
      stressCount,
      stressSquares 
    });
    
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
    console.log('[DEBUG] CharacterSheet - Skill mapeada para atributo:', { skillName, relatedAttribute });
    
    const attribute = character.yearzero_attributes?.find(attr => 
      attr.attribute?.name === relatedAttribute
    );
    const attributeValue = attribute ? parseInt(attribute.value) || 0 : 0;
    
    console.log('[DEBUG] CharacterSheet - Calculando dados Year Zero:', {
      skillName,
      relatedAttribute,
      attributeValue,
      skillValue,
      stressCount
    });
    
    yearZeroDiceModal.appear({
      characterId: character.id,
      baseDice: attributeValue,
      skillDice: parseInt(skillValue) || 0,
      gearDice: 0,
      attributeName: relatedAttribute,
      skillName: skillName,
      stressSquares: stressSquares
    });
  }, [character, yearZeroDiceModal]);

  const renderAttribute = useCallback((charAttr) => {
    if (!charAttr?.attribute?.id) {
      console.error('[ERROR] CharacterSheet renderAttribute - Atributo invalido:', charAttr);
      return null;
    }

    const attributeId = charAttr.attribute.id;
    const isLoading = loadingStates[`attribute-${attributeId}`];
    const error = errors[`attribute-${attributeId}`];
    const attributeValue = getAttributeValue(charAttr);

    console.log(`[DEBUG] CharacterSheet renderAttribute - Renderizando ${charAttr.attribute.name}:`, {
      attributeId,
      isLoading,
      hasError: !!error,
      value: attributeValue
    });

    return (
      <Grid item xs={12} sm={6} md={4} key={attributeId}>
        <Box sx={{ 
          p: 2, 
          border: '1px solid #e0e0e0', 
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'background.paper',
          flexDirection: isMobile ? 'column' : 'row',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          <Typography variant="h6" sx={{ 
            minWidth: isMobile ? 'auto' : 120, 
            fontWeight: 'bold',
            fontSize: isMobile ? '1rem' : '1.25rem'
          }}>
            {charAttr.attribute.name}
          </Typography>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => {
              console.log(`[DEBUG] CharacterSheet renderAttribute - Clicou em rolar atributo ${charAttr.attribute.name}`);
              attributeDiceModal.appear({
                characterId: character.id,
                characterName: character.name,
                attributeName: charAttr.attribute.name,
                attributeValue: attributeValue
              });
            }}
            disabled={isLoading}
            sx={{ minWidth: isMobile ? '100%' : 'auto' }}
          >
            Rolar
          </Button>
          
          <TextField
            value={attributeValue}
            variant="outlined"
            size="small"
            sx={{ width: isMobile ? '100%' : 80 }}
            inputProps={{
              style: {
                textAlign: 'center',
                padding: '8px'
              },
              inputMode: 'numeric'
            }}
            onBlur={() => {
              console.log(`[DEBUG] CharacterSheet renderAttribute - Salvando atributo ${charAttr.attribute.name}`);
              saveAttributeValue(attributeId);
            }}
            onChange={(event) => handleAttributeChange(attributeId, event.target.value)}
            onKeyDown={validateNumericInput}
            placeholder="0"
            disabled={isLoading}
            error={!!error}
            helperText={error}
          />
          
          {isLoading && <CircularProgress size={20} />}
        </Box>
      </Grid>
    );
  }, [character, attributeDiceModal, getAttributeValue, handleAttributeChange, saveAttributeValue, validateNumericInput, loadingStates, errors, isMobile]);

  const renderSkill = useCallback((charSkill) => {
    const skillId = charSkill.skill.id;
    const isLoading = loadingStates[`skill-${skillId}`];
    const error = errors[`skill-${skillId}`];
    const skillValue = getSkillValue(charSkill);

    console.log(`[DEBUG] CharacterSheet renderSkill - Renderizando ${charSkill.skill.name}:`, {
      skillId,
      isLoading,
      hasError: !!error,
      value: skillValue
    });

    return (
      <Grid item xs={12} sm={6} md={4} key={skillId}>
        <Box sx={{ 
          p: 2, 
          border: '1px solid #e0e0e0', 
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'background.paper',
          flexDirection: isMobile ? 'column' : 'row',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          <Typography variant="h6" sx={{ 
            minWidth: isMobile ? 'auto' : 120, 
            fontWeight: 'bold',
            fontSize: isMobile ? '1rem' : '1.25rem'
          }}>
            {charSkill.skill.name}
          </Typography>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => {
              console.log(`[DEBUG] CharacterSheet renderSkill - Clicou em rolar habilidade ${charSkill.skill.name}`);
              diceRollModal.appear({
                characterId: character.id,
                characterName: character.name,
                skillName: charSkill.skill.name,
                skillValue: skillValue
              });
            }}
            disabled={isLoading}
            sx={{ minWidth: isMobile ? '100%' : 'auto' }}
          >
            Rolar
          </Button>
          
          <TextField
            value={skillValue}
            variant="outlined"
            size="small"
            sx={{ width: isMobile ? '100%' : 80 }}
            inputProps={{
              style: {
                textAlign: 'center',
                padding: '8px'
              },
              inputMode: 'numeric'
            }}
            onBlur={() => {
              console.log(`[DEBUG] CharacterSheet renderSkill - Salvando habilidade ${charSkill.skill.name}`);
              saveSkillValue(skillId);
            }}
            onChange={(event) => handleSkillChange(skillId, event.target.value)}
            onKeyDown={validateNumericInput}
            placeholder="0"
            disabled={isLoading}
            error={!!error}
            helperText={error}
          />
          
          {isLoading && <CircularProgress size={20} />}
        </Box>
      </Grid>
    );
  }, [character, diceRollModal, getSkillValue, handleSkillChange, saveSkillValue, validateNumericInput, loadingStates, errors, isMobile]);

  useEffect(() => {
    console.log('[DEBUG] CharacterSheet useEffect - Configurando listeners do socket');
    
    const handleCharacterUpdated = (data) => {
      console.log('[DEBUG] CharacterSheet socket - Character atualizado:', data);
      if (data.id === character?.id) {
        console.log('[DEBUG] CharacterSheet socket - Atualizando dados locais');
      }
    };

    if (socket) {
      socket.on('characterUpdated', handleCharacterUpdated);
      console.log('[DEBUG] CharacterSheet socket - Listener configurado');
    } else {
      console.warn('[WARN] CharacterSheet socket - Socket nao disponivel');
    }

    return () => {
      if (socket) {
        socket.off('characterUpdated', handleCharacterUpdated);
        console.log('[DEBUG] CharacterSheet socket - Listener removido');
      }
    };
  }, [character, refreshData]);

  if (!isInitialized) {
    console.log('[DEBUG] CharacterSheet - Aguardando inicialização...');
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Header />
        <CircularProgress sx={{ mt: 4 }} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Carregando ficha...
        </Typography>
      </Box>
    );
  }

  if (serverError || !character) {
    console.error('[ERROR] CharacterSheet - Erro do servidor ou character ausente:', { serverError, hasCharacter: !!character });
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Header />
        <Alert severity="error" sx={{ mt: 2 }}>
          {serverError || 'Personagem nao encontrado'}
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => {
            console.log('[DEBUG] CharacterSheet - Voltando para dashboard');
            router.push('/dashboard');
          }}
        >
          Voltar para o Dashboard
        </Button>
      </Box>
    );
  }

  console.log('[DEBUG] CharacterSheet - Renderizando componente principal');
  
  return (
    <>
      <Head>
        <title>{`${character.name} - RPG System`}</title>
        <meta name="description" content={`Ficha do personagem ${character.name}`} />
      </Head>

      <Header />

      <Container maxWidth="lg" sx={{ py: 2, px: { xs: 1, sm: 2, md: 3 } }}>
        {Object.keys(errors).map(errorKey => (
          <Alert 
            key={errorKey} 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => {
              console.log(`[DEBUG] CharacterSheet - Fechando alerta de erro: ${errorKey}`);
              clearError(errorKey);
            }}
          >
            {errors[errorKey]}
          </Alert>
        ))}

        <Section title="Informações do Personagem">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}>
                <Image
                  src={character.standard_character_picture_url || '/assets/user.png'}
                  alt={character.name}
                  width={isMobile ? 120 : 150}
                  height={isMobile ? 160 : 200}
                  style={{ 
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }}
                  loading="eager"
                  priority
                />
                <Button 
                  variant="outlined" 
                  sx={{ 
                    mt: 2,
                    width: isMobile ? '100%' : 'auto',
                    minWidth: 140
                  }}
                  onClick={() => {
                    console.log('[DEBUG] CharacterSheet - Clicou em alterar imagem');
                    changePictureModal.appear({
                      characterId: character.id,
                      characterName: character.name
                    });
                  }}
                  disabled={loadingStates.changePicture}
                  size={isMobile ? "small" : "medium"}
                >
                  {loadingStates.changePicture ? <CircularProgress size={24} /> : 'Alterar Imagem'}
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <CharacterInfoForm
                character={character}
                onSubmit={handleCharacterInfoSubmit}
                onSuccess={refreshData}
                isLoading={loadingStates.characterInfo}
                isMobile={isMobile}
              />
            </Grid>
          </Grid>
        </Section>

        <Collapse in={isSelectorExpanded} timeout="auto" unmountOnExit>
          <Section title={isFirstTime ? "Escolha seu Sistema RPG" : "Selecionar Sistema RPG"}>
            {isFirstTime && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Primeira vez aqui?</strong> Escolha o sistema RPG que melhor se adapta ao seu personagem. 
                  Você poderá trocar a qualquer momento!
                </Typography>
              </Alert>
            )}
            <SheetSelector
              currentSystem={rpgSystem}
              onSystemChange={handleSystemChange}
              character={character}
              isSaving={isChangingSystem}
            />
          </Section>
        </Collapse>

        {!isSelectorExpanded && rpgSystem && (
          <Box sx={{ 
            textAlign: 'center', 
            mb: 4,
            p: 4,
            borderRadius: 3,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              opacity: 0.8
            }} />
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1, 
                fontWeight: 600,
                color: 'text.primary',
                mt: 1
              }}
            >
              Sistema Atual:{" "}
              <Box 
                component="span" 
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 700
                }}
              >
                {rpgSystem === 'year_zero' ? 'Year Zero Engine' : rpgSystem === 'feiticeiros' ? 'Feiticeiros & Maldições' : 'Sistema Classico'}
              </Box>
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 3,
                color: 'text.secondary',
                maxWidth: 400,
                mx: 'auto'
              }}
            >
              Não é o que você esperava? Experimente outro estilo de sistema RPG!
            </Typography>

            <Button
              variant="contained"
              size={isMobile ? "medium" : "large"}
              onClick={() => {
                console.log('[DEBUG] CharacterSheet - Clicou em trocar sistema');
                handleSystemChange('expand_selector');
              }}
              startIcon={<ExpandMore />}
              sx={{
                borderRadius: 2,
                backgroundColor: 'primary.main',
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                px: 4,
                py: 1.5,
                fontSize: isMobile ? '0.9rem' : '1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Trocar Sistema RPG
            </Button>
          </Box>
        )}

        <Collapse in={isSheetExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 3,
              p: 2,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 2 : 0
            }}>
              <Typography variant="h5" fontWeight="bold" sx={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }}>
                Ficha - {rpgSystem === 'year_zero' ? 'Year Zero Engine' : rpgSystem === 'feiticeiros' ? 'Feiticeiros & Maldições' : 'Sistema Classico'}
              </Typography>
            </Box>

            {rpgSystem === 'year_zero' ? (
              <YearZeroSheet 
                character={character}
                attributes={(() => {
                  const attributesArray = character.yearzero_attributes?.map(attr => ({
                    name: attr.attribute?.name,
                    year_zero_value: yearZeroAttributeValues[attr.attribute_id] || attr.value || 1
                  })) || [];
                  console.log("[DEBUG] CharacterSheet - Estrutura completa dos atributos:", character.attributes);
                  console.log('[DEBUG] CharacterSheet - Atributos sendo passados para YearZeroSheet:', attributesArray);
                  return attributesArray;
                })()}
                skills={(() => {
                  const skillsArray = character.yearzero_skills?.map(skill => ({
                    name: skill.skill?.name,
                    year_zero_value: yearZeroSkillValues[skill.skill_id] || skill.value || 1
                  })) || [];
                  console.log('[DEBUG] CharacterSheet - Habilidades sendo passadas para YearZeroSheet:', skillsArray);
                  return skillsArray;
                })()}
                onUpdate={handleYearZeroUpdate}
                onAttributeRoll={handleYearZeroAttributeRoll}
                onSkillRoll={handleYearZeroSkillRoll}
                onQuickHeal={(amount) => handleQuickHealthChange(amount, 'heal')}
                onQuickDamage={(amount) => handleQuickHealthChange(amount, 'damage')}
                loadingStates={loadingStates}
                errors={errors}
                isMobile={isMobile}
              />
            ) : rpgSystem === 'feiticeiros' ? (
              <FeiticeirosSheet 
                character={character}
                onUpdate={handleYearZeroUpdate}
                onQuickHeal={(amount) => handleQuickHealthChange(amount, 'heal')}
                onQuickDamage={(amount) => handleQuickHealthChange(amount, 'damage')}
                loadingStates={loadingStates}
                errors={errors}
                isMobile={isMobile}
              />
            ) : (
              <Box>
                <Section title="Status">
                  <StatusBar
                    character={character}
                    onStatusBarClick={() => {
                      console.log('[DEBUG] CharacterSheet - Clicou na status bar');
                      statusBarModal.appear({
                        characterId: character.id,
                        characterName: character.name,
                        currentHitPoints: character.current_hit_points,
                        maxHitPoints: character.max_hit_points
                      });
                    }}
                    onQuickHeal={(amount) => handleQuickHealthChange(amount, 'heal')}
                    onQuickDamage={(amount) => handleQuickHealthChange(amount, 'damage')}
                    isLoading={loadingStates.quickHealth}
                    isMobile={isMobile}
                  />
                </Section>

                <Section title="Atributos">
                  <Grid container spacing={2}>
                    {character.attributes?.map(renderAttribute)}
                  </Grid>
                </Section>

                <Section title="Habilidades">
                  <Grid container spacing={2}>
                    {character.skills?.map(renderSkill)}
                  </Grid>
                </Section>
              </Box>
            )}
          </Box>
        </Collapse>

        <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
          <Button
            variant="contained"
            size={isMobile ? "medium" : "large"}
            onClick={() => {
              console.log('[DEBUG] CharacterSheet - Clicou em rolar dados gerais');
              diceRollModal.appear({
                characterId: character.id,
                characterName: character.name
              });
            }}
            sx={{ 
              px: isMobile ? 3 : 4,
              py: isMobile ? 1.5 : 2
            }}
            startIcon={<Casino />}
          >
            Rolar Dados
          </Button>
        </Box>
      </Container>
    </>
  );
}

export default CharacterSheet;