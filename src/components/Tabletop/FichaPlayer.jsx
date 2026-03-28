// src/components/Tabletop/FichaPlayer.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { Casino } from '@mui/icons-material';
import YearZeroSheet from '../sheets/YearZeroSheet';
import FeiticeirosSheet from '../sheets/FeiticeirosSheet';
import { 
  ClassicSystem,
  useCharacterSheet,
  createHandlers,
  createModals,
  validateNumericInput,
  safeSerializeCharacter
} from '../../index[id]';
import { api } from '../../utils';
import socket from '../../utils/socket';
import useModal from '../../hooks/useModal';

export default function FichaPlayer({ sheetId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawCharacter, setRawCharacter] = useState(null);

  // Refs para controle
  const scrollPositionRef = useRef(0);
  const hasRestoredScrollRef = useRef(false);

  // Função para recarregar dados do personagem
  const refreshData = useCallback(async () => {
    if (!sheetId) return;
    
    try {
      const response = await fetch(`/api/character/${sheetId}`);
      const data = await response.json();
      if (response.ok) {
        const serializedData = safeSerializeCharacter(data);
        setRawCharacter(serializedData);
      }
    } catch (err) {
      console.error('[FichaPlayer] refreshData - erro:', err);
    }
  }, [sheetId]);

  // Carregar personagem
  useEffect(() => {
    if (!sheetId) return;

    const fetchCharacter = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/character/${sheetId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao carregar ficha');
        }
        
        const serializedData = safeSerializeCharacter(data);
        setRawCharacter(serializedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [sheetId]);

  // Hook useCharacterSheet
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
    setLoading: setLoadingState,
    errors,
    handleApiError,
    clearError,
    isInitialized
  } = useCharacterSheet(rawCharacter, refreshData);

  // Criar handlers
  const handlers = createHandlers({
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
    setLoading: setLoadingState,
    clearError,
    handleApiError,
    loadingStates,
    errors
  });

  // Criar modais
  const modals = createModals(useModal, handlers);

  // Adicionar yearZeroDiceModal aos handlers
  const enhancedHandlers = {
    ...handlers,
    handleYearZeroAttributeRoll: (attributeName, attributeValue, stressCount, stressSquares) => {
      if (!character?.id) return;
      
      modals.yearZeroDiceModal.appear({
        characterId: character.id,
        baseDice: attributeValue,
        skillDice: 0,
        gearDice: 0,
        attributeName: attributeName,
        skillName: '',
        character: character,
        stressSquares: stressSquares
      });
    },
    handleYearZeroSkillRoll: (skillName, skillValue, stressCount, stressSquares) => {
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
      
      modals.yearZeroDiceModal.appear({
        characterId: character.id,
        baseDice: attributeValue,
        skillDice: parseInt(skillValue) || 0,
        gearDice: 0,
        attributeName: relatedAttribute,
        skillName: skillName,
        character: character,
        stressSquares: stressSquares
      });
    }
  };

  // Socket para atualizações em tempo real
  useEffect(() => {
    if (!socket || !character?.id) return;

    const handleCharacterUpdated = (data) => {
      if (data.id === character.id) {
        setCharacter(prev => ({ ...prev, ...data }));
      }
    };

    socket.on('characterUpdated', handleCharacterUpdated);

    return () => {
      socket.off('characterUpdated', handleCharacterUpdated);
    };
  }, [character, setCharacter]);

  if (loading || !isInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando ficha...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Erro ao carregar ficha: {error}</Alert>
      </Box>
    );
  }

  if (!character) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">Personagem não encontrado</Alert>
      </Box>
    );
  }

  // Renderização da ficha conforme o sistema
  const renderFicha = () => {
    if (rpgSystem === 'year_zero') {
      return (
        <YearZeroSheet 
          character={character}
          attributes={character.yearzero_attributes?.map(attr => ({
            name: attr.attribute?.name,
            year_zero_value: yearZeroAttributeValues[attr.attribute_id] || attr.value || 0
          })) || []}
          skills={character.yearzero_skills?.map(skill => ({
            name: skill.skill?.name,
            year_zero_value: yearZeroSkillValues[skill.skill_id] || skill.value || 0
          })) || []}
          onUpdate={enhancedHandlers.handleYearZeroUpdate}
          onAttributeRoll={(attributeName, attributeValue, stressCount, stressSquares) => 
            enhancedHandlers.handleYearZeroAttributeRoll(attributeName, attributeValue, stressCount, stressSquares)
          }
          onSkillRoll={(skillName, skillValue, stressCount, stressSquares) => 
            enhancedHandlers.handleYearZeroSkillRoll(skillName, skillValue, stressCount, stressSquares)
          }
          onQuickHeal={(amount) => enhancedHandlers.handleQuickHealthChange(amount, 'heal')}
          onQuickDamage={(amount) => enhancedHandlers.handleQuickHealthChange(amount, 'damage')}
          loadingStates={loadingStates}
          errors={errors}
          isMobile={false}
        />
      );
    }

    if (rpgSystem === 'feiticeiros') {
      return (
        <FeiticeirosSheet 
          character={character}
          onUpdate={enhancedHandlers.handleFeiticeirosUpdate}
          onQuickHeal={(amount) => enhancedHandlers.handleQuickHealthChange(amount, 'heal')}
          onQuickDamage={(amount) => enhancedHandlers.handleQuickHealthChange(amount, 'damage')}
          loadingStates={loadingStates}
          errors={errors}
          isMobile={false}
        />
      );
    }

    return (
      <ClassicSystem
        character={character}
        attributeDiceModal={modals.attributeDiceModal}
        diceRollModal={modals.diceRollModal}
        statusBarModal={modals.statusBarModal}
        loadingStates={loadingStates}
        errors={errors}
        isMobile={false}
        getAttributeValue={(charAttr) => enhancedHandlers.getAttributeValue(charAttr)}
        getSkillValue={(charSkill) => enhancedHandlers.getSkillValue(charSkill)}
        handleAttributeChange={(attributeId, newValue) => enhancedHandlers.handleAttributeChange(attributeId, newValue)}
        handleSkillChange={(skillId, newValue) => enhancedHandlers.handleSkillChange(skillId, newValue)}
        saveAttributeValue={(attributeId) => enhancedHandlers.saveAttributeValue(attributeId)}
        saveSkillValue={(skillId) => enhancedHandlers.saveSkillValue(skillId)}
        validateNumericInput={validateNumericInput}
        handleQuickHealthChange={(amount, type) => enhancedHandlers.handleQuickHealthChange(amount, type)}
        attributeValues={attributeValues}
        skillValues={skillValues}
      />
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Alertas de erro */}
      {Object.keys(errors).map(errorKey => (
        <Alert 
          key={errorKey} 
          severity="error" 
          sx={{ mb: 2, mx: 2 }}
          onClose={() => clearError(errorKey)}
        >
          {errors[errorKey]}
        </Alert>
      ))}

      {/* Ficha */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
        {renderFicha()}
      </Box>

      {/* Botão de rolagem de dados */}
      <Box sx={{ textAlign: 'center', py: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button
          variant="contained"
          size="medium"
          onClick={() => {
            modals.diceRollModal.appear({
              characterId: character.id,
              characterName: character.name
            });
          }}
          startIcon={<Casino />}
        >
          Rolar Dados
        </Button>
      </Box>

      {/* Modais */}
      {modals.attributeDiceModal.isOpen && modals.attributeDiceModal.content}
      {modals.diceRollModal.isOpen && modals.diceRollModal.content}
      {modals.statusBarModal.isOpen && modals.statusBarModal.content}
      {modals.changePictureModal.isOpen && modals.changePictureModal.content}
      {modals.yearZeroDiceModal.isOpen && modals.yearZeroDiceModal.content}
    </Box>
  );
}