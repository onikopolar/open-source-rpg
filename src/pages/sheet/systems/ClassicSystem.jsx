import React from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress
} from '@mui/material';
import { Section, StatusBar } from '../../../components';

export const ClassicSystem = ({ 
  character, 
  attributeDiceModal, 
  diceRollModal,
  statusBarModal,
  loadingStates,
  errors,
  isMobile,
  getAttributeValue,
  getSkillValue,
  handleAttributeChange,
  handleSkillChange,
  saveAttributeValue,
  saveSkillValue,
  validateNumericInput,
  handleQuickHealthChange
}) => {
  
  // Renderização de atributos - IDÊNTICO AO ORIGINAL
  const renderAttribute = (charAttr) => {
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
  };

  // Renderização de habilidades - IDÊNTICO AO ORIGINAL
  const renderSkill = (charSkill) => {
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
  };

  // Retorno IDÊNTICO ao original
  return (
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
  );
};
