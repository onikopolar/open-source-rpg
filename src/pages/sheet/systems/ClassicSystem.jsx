import React from 'react';
import { Grid, Box, Typography, TextField, Button, CircularProgress } from '@mui/material';

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
  handleQuickHealthChange,
  attributeValues,
  skillValues
}) => {
  
  // Renderização de atributos
  const renderAttribute = (charAttr) => {
    if (!charAttr?.attribute?.id) {
      return null;
    }

    const attributeId = charAttr.attribute.id;
    const isLoading = loadingStates[`attribute-${attributeId}`];
    const error = errors[`attribute-${attributeId}`];
    const attributeValue = getAttributeValue(charAttr, attributeValues);

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
              saveAttributeValue(
                character, 
                attributeValues, 
                attributeId, 
                (key, loading) => loadingStates[`attribute-${attributeId}`] = loading,
                () => {}, // clearError function
                (error, context) => errors[context] = error,
                () => {}, // setCharacter function
                'classic'
              );
            }}
            onChange={(event) => handleAttributeChange(attributeId, event.target.value, () => {})}
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

  // Renderização de habilidades
  const renderSkill = (charSkill) => {
    if (!charSkill?.skill?.id) return null;
    
    const skillId = charSkill.skill.id;
    const isLoading = loadingStates[`skill-${skillId}`];
    const error = errors[`skill-${skillId}`];
    const skillValue = getSkillValue(charSkill, skillValues);

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
              saveSkillValue(
                character,
                skillValues,
                skillId,
                (key, loading) => loadingStates[`skill-${skillId}`] = loading,
                () => {}, // clearError function
                (error, context) => errors[context] = error,
                () => {}, // setCharacter function
                'classic'
              );
            }}
            onChange={(event) => handleSkillChange(skillId, event.target.value, () => {})}
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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }}>
          Ficha - Sistema Clássico
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Status
        </Typography>
        {/* StatusBar seria importado aqui */}
        <Box sx={{ 
          p: 2, 
          border: '1px solid #e0e0e0', 
          borderRadius: 1,
          backgroundColor: 'background.paper'
        }}>
          <Typography>Pontos de Vida: {character.current_hit_points || 0}/{character.max_hit_points || 0}</Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button 
              size="small" 
              variant="contained" 
              color="success"
              onClick={() => handleQuickHealthChange(character, 1, 'heal')}
            >
              +1 HP
            </Button>
            <Button 
              size="small" 
              variant="contained" 
              color="error"
              onClick={() => handleQuickHealthChange(character, 1, 'damage')}
            >
              -1 HP
            </Button>
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => {
                statusBarModal.appear({
                  characterId: character.id,
                  characterName: character.name,
                  currentHitPoints: character.current_hit_points,
                  maxHitPoints: character.max_hit_points
                });
              }}
            >
              Editar
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Atributos
        </Typography>
        <Grid container spacing={2}>
          {character.attributes?.map(renderAttribute)}
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Habilidades
        </Typography>
        <Grid container spacing={2}>
          {character.skills?.map(renderSkill)}
        </Grid>
      </Box>
    </Box>
  );
};
