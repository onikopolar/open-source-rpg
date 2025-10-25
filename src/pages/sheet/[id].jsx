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

import useModal from '../../hooks/useModal';
import { prisma } from '../../database';

/**
 * Valida e converte o ID do personagem
 */
const validateCharacterId = (id) => {
  console.log('[DEBUG] validateCharacterId - Validando ID:', id);
  const characterId = Number(id);
  const isValid = !isNaN(characterId);
  console.log('[DEBUG] validateCharacterId - Resultado:', { id, characterId, isValid });
  return isValid ? characterId : null;
};

/**
 * Props do servidor para a pagina de ficha do personagem
 */
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
        }
      }
    });

    console.log('[DEBUG] getServerSideProps - Character encontrado:', !!character);
    console.log('[DEBUG] getServerSideProps - Detalhes do character:', {
      id: character?.id,
      name: character?.name,
      rpgSystem: character?.rpg_system,
      attributesCount: character?.attributes?.length,
      skillsCount: character?.skills?.length
    });

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

/**
 * Hook personalizado para gerenciar estados da ficha com sistema expansivel
 */
const useCharacterSheet = (rawCharacter) => {
  console.log('[DEBUG] useCharacterSheet - Inicializando hook com rawCharacter:', rawCharacter?.id);
  
  const [character, setCharacter] = useState(rawCharacter);
  const [attributeValues, setAttributeValues] = useState({});
  const [skillValues, setSkillValues] = useState({});
  
  const [rpgSystem, setRpgSystem] = useState(rawCharacter?.rpg_system || '');
  const [isChangingSystem, setIsChangingSystem] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});
  
  const [isSelectorExpanded, setIsSelectorExpanded] = useState(!rawCharacter?.rpg_system);
  const [isSheetExpanded, setIsSheetExpanded] = useState(!!rawCharacter?.rpg_system);

  console.log('[DEBUG] useCharacterSheet - Estados iniciais:', {
    hasCharacter: !!character,
    rpgSystem,
    isSelectorExpanded,
    isSheetExpanded
  });

  /**
   * Inicializa os valores dos atributos e habilidades
   */
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

  /**
   * Controla estados de loading
   */
  const setLoading = useCallback((key, isLoading) => {
    console.log(`[DEBUG] useCharacterSheet setLoading - ${key}: ${isLoading}`);
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  /**
   * Gerencia erros da aplicacao
   */
  const handleApiError = useCallback((error, context) => {
    console.error(`[ERROR] useCharacterSheet handleApiError - Contexto: ${context}`, error);
    const errorMessage = error.response?.data?.error || error.message || `Erro ao ${context}`;
    setErrors(prev => ({ ...prev, [context]: errorMessage }));
    return errorMessage;
  }, []);

  /**
   * Limpa erro especifico
   */
  const clearError = useCallback((context) => {
    console.log(`[DEBUG] useCharacterSheet clearError - Limpando erro: ${context}`);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[context];
      return newErrors;
    });
  }, []);

  /**
   * Manipula a mudanca do sistema RPG
   */
  const handleSystemChange = useCallback(async (newSystem) => {
    console.log('[DEBUG] useCharacterSheet handleSystemChange - Nova solicitacao:', { 
      currentSystem: rpgSystem, 
      newSystem 
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
      
      console.log('[DEBUG] useCharacterSheet handleSystemChange - Fazendo requisicao para API');
      await api.put(`/character/${character.id}`, {
        rpg_system: newSystem
      });
      
      setCharacter(prev => ({
        ...prev,
        rpg_system: newSystem
      }));
      
      console.log('[DEBUG] useCharacterSheet handleSystemChange - Mudanca de sistema concluida com sucesso');
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
  }, [character, rpgSystem, clearError, handleApiError, setCharacter]);

  return {
    character,
    setCharacter,
    attributeValues,
    setAttributeValues,
    skillValues,
    setSkillValues,
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
    handleSystemChange
  };
};

/**
 * Componente principal da ficha do personagem com sistema expansivel
 */
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

  const {
    character,
    setCharacter,
    attributeValues,
    setAttributeValues,
    skillValues,
    setSkillValues,
    rpgSystem,
    isChangingSystem,
    loadingStates,
    setLoading,
    errors,
    handleApiError,
    clearError,
    isSelectorExpanded,
    isSheetExpanded,
    handleSystemChange
  } = useCharacterSheet(rawCharacter);

  console.log('[DEBUG] CharacterSheet - Estados do hook:', {
    characterId: character?.id,
    rpgSystem,
    isSelectorExpanded,
    isSheetExpanded,
    isChangingSystem,
    loadingStatesCount: Object.keys(loadingStates).length,
    errorsCount: Object.keys(errors).length
  });

  /**
   * Atualiza os dados da pagina
   */
  const refreshData = useCallback(() => {
    console.log('[DEBUG] CharacterSheet refreshData - Atualizando dados da pagina');
    return router.replace(router.asPath);
  }, [router]);

  /**
   * Manipula o envio das informacoes do personagem
   */
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

  /**
   * Manipula a atualizacao dos pontos de vida
   */
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

  /**
   * Manipula mudancas rapidas de saude (cura/dano)
   */
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

  /**
   * Manipula a alteracao de valores de atributos
   */
  const handleAttributeChange = useCallback((attributeId, newValue) => {
    console.log(`[DEBUG] CharacterSheet handleAttributeChange - Atributo ${attributeId}: ${newValue}`);
    const numericValue = newValue === '' ? '' : parseInt(newValue) || 0;
    
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: numericValue
    }));
  }, []);

  /**
   * Manipula a alteracao de valores de habilidades
   */
  const handleSkillChange = useCallback((skillId, newValue) => {
    console.log(`[DEBUG] CharacterSheet handleSkillChange - Habilidade ${skillId}: ${newValue}`);
    const numericValue = newValue === '' ? '' : parseInt(newValue) || 0;
    
    setSkillValues(prev => ({
      ...prev,
      [skillId]: numericValue
    }));
  }, []);

  /**
   * Salva o valor de um atributo
   */
  const saveAttributeValue = useCallback(async (attributeId) => {
    console.log(`[DEBUG] CharacterSheet saveAttributeValue - Salvando atributo ${attributeId}`);
    setLoading(`attribute-${attributeId}`, true);
    clearError(`attribute-${attributeId}`);
    
    try {
      const value = attributeValues[attributeId] || 0;
      console.log(`[DEBUG] CharacterSheet saveAttributeValue - Valor a ser salvo: ${value}`);
      
      await api.put('/character/attribute', {
        character_id: character.id,
        attribute_id: attributeId,
        value: value
      });
      
      setCharacter(prev => ({
        ...prev,
        attributes: prev.attributes.map(attr => 
          attr.attribute_id === attributeId 
            ? { ...attr, value: value }
            : attr
        )
      }));
      
      console.log(`[SUCCESS] CharacterSheet saveAttributeValue - Atributo ${attributeId} salvo com sucesso`);
      setLoading(`attribute-${attributeId}`, false);
    } catch (error) {
      const errorMessage = handleApiError(error, `attribute-${attributeId}`);
      setLoading(`attribute-${attributeId}`, false);
      throw new Error(errorMessage);
    }
  }, [character, attributeValues, setLoading, clearError, handleApiError, setCharacter]);

  /**
   * Salva o valor de uma habilidade
   */
  const saveSkillValue = useCallback(async (skillId) => {
    console.log(`[DEBUG] CharacterSheet saveSkillValue - Salvando habilidade ${skillId}`);
    setLoading(`skill-${skillId}`, true);
    clearError(`skill-${skillId}`);
    
    try {
      const value = skillValues[skillId] || 0;
      console.log(`[DEBUG] CharacterSheet saveSkillValue - Valor a ser salvo: ${value}`);
      
      await api.put('/character/skill', {
        character_id: character.id,
        skill_id: skillId,
        value: value
      });
      
      setCharacter(prev => ({
        ...prev,
        skills: prev.skills.map(skill => 
          skill.skill_id === skillId 
            ? { ...skill, value: value }
            : skill
        )
      }));
      
      console.log(`[SUCCESS] CharacterSheet saveSkillValue - Habilidade ${skillId} salva com sucesso`);
      setLoading(`skill-${skillId}`, false);
    } catch (error) {
      const errorMessage = handleApiError(error, `skill-${skillId}`);
      setLoading(`skill-${skillId}`, false);
      throw new Error(errorMessage);
    }
  }, [character, skillValues, setLoading, clearError, handleApiError, setCharacter]);

  /**
   * Obtem o valor atual de um atributo
   */
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

  /**
   * Obtem o valor atual de uma habilidade
   */
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

  /**
   * Valida entrada numerica
   */
  const validateNumericInput = useCallback((event) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (!/[0-9]/.test(event.key)) {
      console.log(`[DEBUG] CharacterSheet validateNumericInput - Tecla bloqueada: ${event.key}`);
      event.preventDefault();
    }
  }, []);

  /**
   * Modais da aplicacao - ORDEM CORRIGIDA
   */
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

  // YEAR ZERO DICE MODAL MOVED TO BE DEFINED BEFORE IT'S USED
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

  /**
   * Renderiza um atributo individual (Sistema Classico)
   */
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

  /**
   * Renderiza uma habilidade individual (Sistema Classico)
   */
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

  /**
   * Configura listeners do socket para atualizacoes em tempo real
   */
  useEffect(() => {
    console.log('[DEBUG] CharacterSheet useEffect - Configurando listeners do socket');
    
    const handleCharacterUpdated = (data) => {
      console.log('[DEBUG] CharacterSheet socket - Character atualizado:', data);
      if (data.id === character?.id) {
        console.log('[DEBUG] CharacterSheet socket - Atualizando dados locais');
        refreshData();
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

  // Verificacao de erro do servidor
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
        {/* Exibicao de erros */}
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

        {/* Secao de Informacoes do Personagem */}
        <Section title="Informacoes do Personagem">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
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
                  sx={{ mt: 2 }}
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

        {/* SELETOR DE SISTEMA EXPANSIVEL - RECOLHE APOS SELECAO */}
        <Collapse in={isSelectorExpanded} timeout="auto" unmountOnExit>
          <Section title="Selecionar Sistema RPG">
            <SheetSelector
              currentSystem={rpgSystem}
              onSystemChange={handleSystemChange}
              character={character}
              isSaving={isChangingSystem}
            />
          </Section>
        </Collapse>

        {/* BOTAO TROCAR SISTEMA */}
        {!isSelectorExpanded && (
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
                {rpgSystem === 'year_zero' ? 'Year Zero Engine' : 'Sistema Clássico'}
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

        {/* FICHA EXPANSIVEL - APARECE APOS SELECAO DO SISTEMA */}
        <Collapse in={isSheetExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 3 }}>
            {/* Cabecalho da ficha expansivel */}
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
                Ficha - {rpgSystem === 'year_zero' ? 'Year Zero Engine' : 'Sistema Classico'}
              </Typography>
            </Box>

            {/* Conteudo da ficha selecionada */}
            {rpgSystem === 'year_zero' ? (
              <YearZeroSheet 
                character={character}
                attributeValues={attributeValues}
                skillValues={skillValues}
 
  attributes={(() => {
    const attributesArray = character.attributes?.map(attr => ({
      name: attr.attribute?.name,
      year_zero_value: attributeValues[attr.attribute_id] || attr.value || 1
    })) || [];
    console.log('[DEBUG] CharacterSheet - Atributos sendo passados para YearZeroSheet:', attributesArray);
    return attributesArray;
  })()}

  skills={(() => {
    const skillsArray = character.skills?.map(skill => ({
      name: skill.skill?.name, 
      year_zero_value: skillValues[skill.skill_id] || skill.value || 1
    })) || [];
    console.log('[DEBUG] CharacterSheet - Habilidades sendo passadas para YearZeroSheet:', skillsArray);
    return skillsArray;
  })()}
                onAttributeChange={handleAttributeChange}
                onSkillChange={handleSkillChange}

                onUpdate={(type, name, value) => {
                  console.log('[DEBUG] CharacterSheet onUpdate YearZero - Chamado:', { type, name, value });
                  
                  if (type === 'attribute') {
                    // Mapear atributos do Year Zero para atributos do sistema
                    const yearZeroToSystemMap = {
                      'FORÇA': 'FORÇA',
                      'AGILIDADE': 'DESTREZA', 
                      'RACIOCÍNIO': 'INTELIGÊNCIA',
                      'EMPATIA': 'CARISMA'
                    };
                    
                    const systemAttributeName = yearZeroToSystemMap[name] || name;
                    console.log(`[DEBUG] CharacterSheet onUpdate YearZero - Mapeando atributo: ${name} -> ${systemAttributeName}`);
                    
                    // Encontrar o ID do atributo pelo nome do sistema
                    const attribute = character.attributes?.find(attr => 
                      attr.attribute?.name === systemAttributeName
                    );
                    if (attribute) {
                      console.log(`[DEBUG] CharacterSheet onUpdate YearZero - Encontrado atributo: ${systemAttributeName} -> ID: ${attribute.attribute_id}`);
                      saveAttributeValue(attribute.attribute_id);
                    } else {
                      console.warn(`[WARN] CharacterSheet onUpdate YearZero - Atributo nao encontrado: ${systemAttributeName}. Atributos disponiveis:`, 
                        character.attributes?.map(a => a.attribute?.name));
                    }
                  } else if (type === 'skill') {
                    console.log(`[DEBUG] CharacterSheet onUpdate YearZero - Habilidade do Year Zero: ${name}`);
                    console.log(`[WARN] CharacterSheet onUpdate YearZero - Habilidades do Year Zero nao sao salvas no banco. Apenas logando.`);
                    console.log(`[DEBUG] CharacterSheet onUpdate YearZero - Valor da habilidade: ${value}`);
                    console.log(`[INFO] CharacterSheet onUpdate YearZero - Para salvar habilidades do Year Zero, criar mapeamento no banco.`);
                  }
                }}

                onAttributeRoll={(attributeName, attributeValue) => {
                  console.log('[DEBUG] CharacterSheet - Rolagem de atributo Year Zero:', { attributeName, attributeValue });
                  // Lógica para calcular dados base do Year Zero
                  let baseDice = 0;
                  const value = parseInt(attributeValue) || 0;
                  if (value >= 5) baseDice = 2;
                  else if (value >= 3) baseDice = 1;
                  
                  console.log('[DEBUG] CharacterSheet - Calculando dados base Year Zero:', { value, baseDice });
                  
                  yearZeroDiceModal.appear({
                    characterId: character.id,
                    baseDice: baseDice,
                    skillDice: 0,
                    gearDice: 0,
                    attributeName: attributeName,
                    skillName: null
                  });
                }}
                onSkillRoll={(skillName, skillValue) => {
                  console.log('[DEBUG] CharacterSheet - Rolagem de skill Year Zero:', { skillName, skillValue });
                  // Lógica para calcular dados base + skill do Year Zero
                  const skillToAttributeMap = {
                    'Combate Corpo a Corpo': 'FORÇA',
                    'Maquinario Pesado': 'FORÇA',
                    'Resistencia': 'FORÇA',
                    'Combate a Distancia': 'AGILIDADE',
                    'Mobilidade': 'AGILIDADE',
                    'Pilotagem': 'AGILIDADE',
                    'Observação': 'RACIOCÍNIO',
                    'Sobrevivência': 'RACIOCÍNIO',
                    'Tecnologia': 'RACIOCÍNIO',
                    'Manipulação': 'EMPATIA',
                    'Comando': 'EMPATIA',
                    'Cuidados Médicos': 'EMPATIA'
                  };
                  
                  const relatedAttribute = skillToAttributeMap[skillName] || 'FORÇA';
                  console.log('[DEBUG] CharacterSheet - Skill mapeada para atributo:', { skillName, relatedAttribute });
                  
                  const attribute = character.attributes?.find(attr => 
                    attr.attribute?.name === relatedAttribute
                  );
                  const attributeValue = attribute ? parseInt(attribute.value) || 0 : 0;
                  
                  let baseDice = 0;
                  if (attributeValue >= 5) baseDice = 2;
                  else if (attributeValue >= 3) baseDice = 1;
                  
                  console.log('[DEBUG] CharacterSheet - Calculando dados Year Zero:', {
                    skillName,
                    relatedAttribute,
                    attributeValue,
                    baseDice,
                    skillDice: parseInt(skillValue) || 0
                  });
                  
                  yearZeroDiceModal.appear({
                    characterId: character.id,
                    baseDice: baseDice,
                    skillDice: parseInt(skillValue) || 0,
                    gearDice: 0,
                    attributeName: relatedAttribute,
                    skillName: skillName
                  });
                }}
                onQuickHeal={(amount) => handleQuickHealthChange(amount, 'heal')}
                onQuickDamage={(amount) => handleQuickHealthChange(amount, 'damage')}
                loadingStates={loadingStates}
                errors={errors}
                isMobile={isMobile}
              />
            ) : (
              // SISTEMA CLASSICO - Layout Tradicional
              <Box>
                {/* STATUS BAR - AGORA DENTRO DO SISTEMA CLASSICO */}
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

        {/* Botoes de Rolagem de Dados - SEMPRE VISIVEIS */}
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
