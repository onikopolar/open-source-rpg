import React, { useCallback } from 'react';
import {
  Grid,
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress
} from '@mui/material';
import { Section, StatusBar } from '../../components';

const ClassicSheet = ({ 
  character, 
  onRoll,
  onSkillChange,
  onAttributeChange,
  onQuickHeal,
  onQuickDamage,
  attributeValues,
  skillValues,
  loadingStates,
  errors,
  isMobile,
  onStatusBarClick,
  attributeDiceModal,
  diceRollModal,
  statusBarModal,
  saveAttributeValue,
  saveSkillValue
}) => {

  const getAttributeValue = useCallback((charAttr) => {
    if (!charAttr?.attribute) {
      console.warn('[WARN] ClassicSheet getAttributeValue - Atributo invalido:', charAttr);
      return '';
    }
    
    const attributeId = charAttr.attribute.id;
    const value = attributeValues[attributeId] !== undefined 
      ? attributeValues[attributeId] 
      : charAttr.value;
    
    const result = value === 0 || value === '0' || value === '' ? '' : String(value);
    console.log(`[DEBUG] ClassicSheet getAttributeValue - ${charAttr.attribute.name}: ${result}`);
    
    return result;
  }, [attributeValues]);

  const getSkillValue = useCallback((charSkill) => {
    if (!charSkill?.skill) {
      console.warn('[WARN] ClassicSheet getSkillValue - Habilidade invalida:', charSkill);
      return '';
    }
    
    const skillId = charSkill.skill.id;
    const value = skillValues[skillId] !== undefined 
      ? skillValues[skillId] 
      : charSkill.value;
    
    const result = value === 0 || value === '0' || value === '' ? '' : String(value);
    console.log(`[DEBUG] ClassicSheet getSkillValue - ${charSkill.skill.name}: ${result}`);
    
    return result;
  }, [skillValues]);

  const validateNumericInput = useCallback((event) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (!/[0-9]/.test(event.key)) {
      console.log(`[DEBUG] ClassicSheet validateNumericInput - Tecla bloqueada: ${event.key}`);
      event.preventDefault();
    }
  }, []);

  const renderAttribute = useCallback((charAttr) => {
    if (!charAttr?.attribute?.id) {
      console.error('[ERROR] ClassicSheet renderAttribute - Atributo invalido:', charAttr);
      return null;
    }

    const attributeId = charAttr.attribute.id;
    const isLoading = loadingStates[`attribute-${attributeId}`];
    const error = errors[`attribute-${attributeId}`];
    const attributeValue = getAttributeValue(charAttr);

    console.log(`[DEBUG] ClassicSheet renderAttribute - Renderizando ${charAttr.attribute.name}:`, {
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
              console.log(`[DEBUG] ClassicSheet renderAttribute - Clicou em rolar atributo ${charAttr.attribute.name}`);
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
              console.log(`[DEBUG] ClassicSheet renderAttribute - Salvando atributo ${charAttr.attribute.name}`);
              saveAttributeValue(attributeId);
            }}
            onChange={(event) => onAttributeChange(attributeId, event.target.value)}
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
  }, [character, attributeDiceModal, getAttributeValue, onAttributeChange, saveAttributeValue, validateNumericInput, loadingStates, errors, isMobile]);

  const renderSkill = useCallback((charSkill) => {
    const skillId = charSkill.skill.id;
    const isLoading = loadingStates[`skill-${skillId}`];
    const error = errors[`skill-${skillId}`];
    const skillValue = getSkillValue(charSkill);

    console.log(`[DEBUG] ClassicSheet renderSkill - Renderizando ${charSkill.skill.name}:`, {
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
              console.log(`[DEBUG] ClassicSheet renderSkill - Clicou em rolar habilidade ${charSkill.skill.name}`);
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
              console.log(`[DEBUG] ClassicSheet renderSkill - Salvando habilidade ${charSkill.skill.name}`);
              saveSkillValue(skillId);
            }}
            onChange={(event) => onSkillChange(skillId, event.target.value)}
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
  }, [character, diceRollModal, getSkillValue, onSkillChange, saveSkillValue, validateNumericInput, loadingStates, errors, isMobile]);

  return (
    <>
      <Section title="Status">
        <StatusBar
          character={character}
          onStatusBarClick={() => {
            console.log('[DEBUG] ClassicSheet - Clicou na status bar');
            statusBarModal.appear({
              characterId: character.id,
              characterName: character.name,
              currentHitPoints: character.current_hit_points,
              maxHitPoints: character.max_hit_points
            });
          }}
          onQuickHeal={onQuickHeal}
          onQuickDamage={onQuickDamage}
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
    </>
  );
};

export default ClassicSheet;