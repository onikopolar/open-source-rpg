// src/pages/sheet/[id].jsx - VERSÃO CORRIGIDA E OTIMIZADA
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

// Hook para verificar se estamos no cliente
const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};

// Validação robusta de ID do personagem
const validateCharacterId = (id) => {
  if (!id) return null;
  
  const characterId = Number(id);
  const isValid = !isNaN(characterId) && characterId > 0;
  return isValid ? characterId : null;
};

// Função para serializar dados do personagem de forma segura
const safeSerializeCharacter = (character) => {
  if (!character) return null;
  
  try {
    return JSON.parse(JSON.stringify(character));
  } catch (error) {
    console.error('Erro ao serializar personagem:', error);
    return null;
  }
};

export const getServerSideProps = async ({ params }) => {
  try {
    const characterId = validateCharacterId(params?.id);

    if (!characterId) {
      return {
        props: {
          character: null,
          error: 'ID do personagem inválido'
        }
      };
    }

    // Buscar personagem com todas as relações necessárias
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
        },
        feiticeiros_attributes: {
          include: {
            attribute: true
          }
        },
        feiticeiros_pericias: true,
        feiticeiros_oficios: true,
        feiticeiros_resistencias: true,
        feiticeiros_ataques: true
      }
    });

    // Auto-setup para Year Zero se necessário
    if (character?.rpg_system === 'year_zero' && 
        (!character.yearzero_attributes || character.yearzero_attributes.length === 0)) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const setupResponse = await fetch(`${baseUrl}/api/yearzero/setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            character_id: characterId
          })
        });
        
        if (setupResponse.ok) {
          const updatedCharacter = await prisma.character.findUnique({
            where: { id: characterId },
            include: {
              attributes: { include: { attribute: true } },
              skills: { include: { skill: true } },
              yearzero_attributes: { include: { attribute: true } },
              yearzero_skills: { include: { skill: true } },
              feiticeiros_attributes: { include: { attribute: true } },
              feiticeiros_pericias: true,
              feiticeiros_oficios: true,
              feiticeiros_resistencias: true,
              feiticeiros_ataques: true
            }
          });
          
          if (updatedCharacter) {
            character.yearzero_attributes = updatedCharacter.yearzero_attributes;
            character.yearzero_skills = updatedCharacter.yearzero_skills;
          }
        }
      } catch (error) {
        console.error('Erro no auto-setup Year Zero:', error);
        // Não falhar o SSR por causa do auto-setup
      }
    }

    if (!character) {
      return {
        props: {
          character: null,
          error: 'Personagem não encontrado'
        }
      };
    }

    const serializedCharacter = safeSerializeCharacter(character);

    return {
      props: {
        rawCharacter: serializedCharacter,
        error: null
      }
    };
  } catch (error) {
    console.error('Erro crítico no SSR:', error);
    return {
      props: {
        character: null,
        error: 'Erro interno do servidor'
      }
    };
  }
};

// Hook personalizado para gerenciar o estado da ficha do personagem
const useCharacterSheet = (rawCharacter, refreshData) => {
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

  // Mudança de sistema RPG
  const handleSystemChange = useCallback(async (newSystem) => {
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

    if (!newSystem || !character?.id) {
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

// Componente principal da ficha do personagem
function CharacterSheet({ rawCharacter, error: serverError }) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const refreshData = useCallback(() => {
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

  // Handler para informações do personagem
  const handleCharacterInfoSubmit = useCallback(async (values) => {
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
  }, [character, setLoading, clearError, handleApiError]);

  // Handler para pontos de vida
  const handleHitPointsUpdate = useCallback(async (newData) => {
    if (!character?.id) return Promise.reject('Personagem não encontrado');
    
    setLoading('hitPoints', true);
    clearError('hitPoints');
    
    try {
      const data = {
        current_hit_points: Number(newData.current),
        max_hit_points: Number(newData.max)
      };

      // Validações robustas
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
  }, [character, setLoading, clearError, handleApiError, setCharacter]);

  // Handler para ações rápidas de saúde
  const handleQuickHealthChange = useCallback(async (amount, type = 'heal') => {
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
      
      // Alerta para personagem inconsciente
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
  }, [character, setLoading, clearError, handleApiError, setCharacter]);

  // Handler específico para Feiticeiros - CORRIGIDO
  const handleFeiticeirosUpdate = useCallback(async (type, identifier, data) => {
    if (!character?.id) {
      console.error('Personagem não encontrado para atualização Feiticeiros');
      return;
    }

    console.log("🔥 FEITICEIROS UPDATE:", { type, identifier, data });
    
    try {
      if (type === 'character') {
        // CORREÇÃO CRÍTICA: Para derived_values_bonuses, converter para string JSON
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
  }, [character, setCharacter]);

  // Handlers para atributos e habilidades clássicos
  const handleAttributeChange = useCallback((attributeId, newValue) => {
    const numericValue = newValue === '' ? '' : parseInt(newValue) || 0;
    
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: numericValue
    }));
  }, []);

  const handleSkillChange = useCallback((skillId, newValue) => {
    const numericValue = newValue === '' ? '' : parseInt(newValue) || 0;
    
    setSkillValues(prev => ({
      ...prev,
      [skillId]: numericValue
    }));
  }, []);

  const saveAttributeValue = useCallback(async (attributeId) => {
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
  }, [character, attributeValues, setLoading, clearError, handleApiError, setCharacter, rpgSystem]);

  const saveSkillValue = useCallback(async (skillId) => {
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
  }, [character, skillValues, setLoading, clearError, handleApiError, setCharacter, rpgSystem]);

  // Funções auxiliares para valores
  const getAttributeValue = useCallback((charAttr) => {
    if (!charAttr?.attribute) {
      return '';
    }
    
    const attributeId = charAttr.attribute.id;
    const value = attributeValues[attributeId] !== undefined 
      ? attributeValues[attributeId] 
      : charAttr.value;
    
    return value === 0 || value === '0' || value === '' ? '' : String(value);
  }, [attributeValues]);

  const getSkillValue = useCallback((charSkill) => {
    if (!charSkill?.skill) {
      return '';
    }
    
    const skillId = charSkill.skill.id;
    const value = skillValues[skillId] !== undefined 
      ? skillValues[skillId] 
      : charSkill.value;
    
    return value === 0 || value === '0' || value === '' ? '' : String(value);
  }, [skillValues]);

  // Validação de entrada numérica
  const validateNumericInput = useCallback((event) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }, []);

  // Modais
  const attributeDiceModal = useModal(({ close, custom }) => {
    return React.createElement(DiceRollModal, {
      handleClose: close,
      characterId: custom.characterId,
      characterName: custom.characterName,
      skillName: custom.attributeName,
      skillValue: custom.attributeValue
    });
  });

  const diceRollModal = useModal(({ close, custom }) => {
    return React.createElement(DiceRollModal, {
      handleClose: close,
      characterId: custom.characterId,
      characterName: custom.characterName,
      skillName: custom.skillName,
      skillValue: custom.skillValue
    });
  });

  const statusBarModal = useModal(({ close, custom }) => {
    return React.createElement(StatusBarModal, {
      handleClose: close,
      characterId: custom.characterId,
      characterName: custom.characterName,
      currentHitPoints: custom.currentHitPoints,
      maxHitPoints: custom.maxHitPoints,
      onSubmit: handleHitPointsUpdate,
      isLoading: loadingStates.hitPoints
    });
  });

  const changePictureModal = useModal(({ close, custom }) => {
    return React.createElement(ChangePictureModal, {
      handleClose: close,
      characterId: custom.characterId,
      characterName: custom.characterName
    });
  });

  // Handlers para Year Zero
  const handleYearZeroUpdate = useCallback(async (type, name, value) => {
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
  }, [character, rpgSystem, setCharacter, setYearZeroAttributeValues, setYearZeroSkillValues]);

  const handleYearZeroPushRoll = useCallback(() => {
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
      
      handleYearZeroUpdate('stress_squares', 'stress_squares', newStressSquares);
      
    } catch (error) {
      console.error('Erro ao processar stress squares:', error);
    }
  }, [character, handleYearZeroUpdate]);

  const yearZeroDiceModal = useModal(({ close, custom }) => {
    return React.createElement(YearZeroDiceModal, {
      handleClose: close,
      characterId: custom.characterId,
      baseDice: custom.baseDice,
      skillDice: custom.skillDice,
      gearDice: custom.gearDice,
      attributeName: custom.attributeName,
      skillName: custom.skillName,
      character: character,
      stressSquares: custom.stressSquares,
      onPushRoll: handleYearZeroPushRoll
    });
  });

  const handleYearZeroAttributeRoll = useCallback((attributeName, attributeValue, stressCount, stressSquares) => {
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
  }, [character, yearZeroDiceModal]);

  const handleYearZeroSkillRoll = useCallback((skillName, skillValue, stressCount, stressSquares) => {
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
  }, [character, yearZeroDiceModal]);

  // Renderização de atributos e habilidades
  const renderAttribute = useCallback((charAttr) => {
    if (!charAttr?.attribute?.id) {
      return null;
    }

    const attributeId = charAttr.attribute.id;
    const isLoading = loadingStates[`attribute-${attributeId}`];
    const error = errors[`attribute-${attributeId}`];
    const attributeValue = getAttributeValue(charAttr);

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
    if (!charSkill?.skill?.id) return null;
    
    const skillId = charSkill.skill.id;
    const isLoading = loadingStates[`skill-${skillId}`];
    const error = errors[`skill-${skillId}`];
    const skillValue = getSkillValue(charSkill);

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

  // Socket para atualizações em tempo real
  useEffect(() => {
    if (!socket || !character?.id) return;

    const handleCharacterUpdated = (data) => {
      if (data.id === character.id) {
        console.log('Character atualizado via socket');
        refreshData();
      }
    };

    socket.on('characterUpdated', handleCharacterUpdated);

    return () => {
      socket.off('characterUpdated', handleCharacterUpdated);
    };
  }, [character, refreshData]);

  // Estados de carregamento
  if (!isInitialized) {
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

  // Tratamento de erros
  if (serverError || !character) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Header />
        <Alert severity="error" sx={{ mt: 2 }}>
          {serverError || 'Personagem não encontrado'}
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => {
            router.push('/dashboard');
          }}
        >
          Voltar para o Dashboard
        </Button>
      </Box>
    );
  }
  
  // Renderização principal
  return (
    <>
      <Head>
        <title>{`${character.name} - RPG System`}</title>
        <meta name="description" content={`Ficha do personagem ${character.name}`} />
      </Head>

      <Header />

      <Container maxWidth="lg" sx={{ py: 2, px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Alertas de erro */}
        {Object.keys(errors).map(errorKey => (
          <Alert 
            key={errorKey} 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => {
              clearError(errorKey);
            }}
          >
            {errors[errorKey]}
          </Alert>
        ))}

        {/* Seção de informações do personagem */}
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

        {/* Seletor de sistema RPG */}
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

        {/* Sistema atual e botão para trocar */}
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
                {rpgSystem === 'year_zero' ? 'Year Zero Engine' : rpgSystem === 'feiticeiros' ? 'Feiticeiros & Maldições' : 'Sistema Clássico'}
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

        {/* Ficha do sistema selecionado */}
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
                Ficha - {rpgSystem === 'year_zero' ? 'Year Zero Engine' : rpgSystem === 'feiticeiros' ? 'Feiticeiros & Maldições' : 'Sistema Clássico'}
              </Typography>
            </Box>

            {rpgSystem === 'year_zero' ? (
              <YearZeroSheet 
                character={character}
                attributes={character.yearzero_attributes?.map(attr => ({
                  name: attr.attribute?.name,
                  year_zero_value: yearZeroAttributeValues[attr.attribute_id] || attr.value || 1
                })) || []}
                skills={character.yearzero_skills?.map(skill => ({
                  name: skill.skill?.name,
                  year_zero_value: yearZeroSkillValues[skill.skill_id] || skill.value || 1
                })) || []}
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
                onUpdate={handleFeiticeirosUpdate}
                onQuickHeal={(amount) => handleQuickHealthChange(amount, 'heal')}
                onQuickDamage={(amount) => handleQuickHealthChange(amount, 'damage')}
                loadingStates={loadingStates}
                errors={errors}
                isMobile={isMobile}
              />
            ) : (
              // Sistema clássico
              <Box>
                <Section title="Status">
                  <StatusBar
                    character={character}
                    onStatusBarClick={() => {
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

        {/* Botão de rolagem de dados */}
        <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
          <Button
            variant="contained"
            size={isMobile ? "medium" : "large"}
            onClick={() => {
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

      {/* Renderização dos modais */}
      {attributeDiceModal.isOpen && attributeDiceModal.content}
      {diceRollModal.isOpen && diceRollModal.content}
      {statusBarModal.isOpen && statusBarModal.content}
      {changePictureModal.isOpen && changePictureModal.content}
      {yearZeroDiceModal.isOpen && yearZeroDiceModal.content}
    </>
  );
}

export default CharacterSheet;