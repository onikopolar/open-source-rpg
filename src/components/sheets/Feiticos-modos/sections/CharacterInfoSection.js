// sections/CharacterInfoSection.js
import React from 'react';
import { withStyles } from '@mui/styles';
import { Box, Typography, Grid } from '@mui/material';
import CharacterInfoField from '../components/CharacterInfoField';

const styles = {
  characterInfoSection: {
    marginBottom: '20px'
  },
  sectionTitle: {
    marginBottom: '10px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#639EC2', // Azul principal do tema
    textShadow: '0 0 8px rgba(99, 158, 194, 0.4)',
    letterSpacing: '0.5px'
  },
  infoContainer: {
    padding: '12px',
    background: 'linear-gradient(135deg, rgba(43, 43, 43, 0.95) 0%, rgba(32, 30, 30, 0.98) 100%)', // Gradiente usando as cores do tema
    border: '1px solid rgba(99, 158, 194, 0.3)', // Borda com azul principal
    borderRadius: '8px',
    boxShadow: `
      0 2px 12px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 0 20px rgba(99, 158, 194, 0.1)
    `,
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '1px',
      background: 'linear-gradient(90deg, transparent, #639EC2, transparent)',
      borderRadius: '8px 8px 0 0'
    }
  }
};

const CharacterInfoSection = React.memo(({ 
  characterInfo, 
  handleCharacterInfoClick, 
  classes 
}) => {
  console.log('🔴 CharacterInfoSection RENDER - origem:', characterInfo.origem);
  
  const fieldProps = React.useMemo(() => {
    console.log('🟡 fieldProps RECALCULADO');
    return {
      origem: {
        field: 'origem',
        value: characterInfo.origem,
        onClick: () => handleCharacterInfoClick('origem'),
        compact: true
      },
      treino: {
        field: 'treino', 
        value: characterInfo.treino,
        onClick: () => handleCharacterInfoClick('treino'),
        compact: true
      },
      nivel: {
        field: 'nivel',
        value: characterInfo.nivel,
        onClick: () => handleCharacterInfoClick('nivel'),
        compact: true
      },
      grau: {
        field: 'grau',
        value: characterInfo.grau,
        onClick: () => handleCharacterInfoClick('grau'),
        compact: true
      },
      tecnica: {
        field: 'tecnica',
        value: characterInfo.tecnica,
        onClick: () => handleCharacterInfoClick('tecnica'),
        compact: true
      },
      experiencia: {
        field: 'experiencia',
        value: characterInfo.experiencia,
        onClick: () => handleCharacterInfoClick('experiencia'),
        compact: true
      },
      multiclasse: {
        field: 'multiclasse',
        value: characterInfo.multiclasse,
        onClick: () => handleCharacterInfoClick('multiclasse'),
        compact: true,
        fullWidth: true
      },
      especializacao: {
        field: 'especializacao',
        value: characterInfo.especializacao,
        onClick: () => handleCharacterInfoClick('especializacao'),
        compact: true,
        fullWidth: true
      }
    };
  }, [
    characterInfo.origem,
    characterInfo.treino,
    characterInfo.nivel,
    characterInfo.grau,
    characterInfo.tecnica,
    characterInfo.experiencia,
    characterInfo.multiclasse,
    characterInfo.especializacao,
    handleCharacterInfoClick
  ]);

  return (
    <Box className={classes.characterInfoSection}>
      <Typography className={classes.sectionTitle}>
        INFORMAÇÕES DO PERSONAGEM
      </Typography>
      
      <Box className={classes.infoContainer}>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <CharacterInfoField
              {...fieldProps.origem}
              classes={classes}
            />
          </Grid>
          <Grid item xs={6}>
            <CharacterInfoField
              {...fieldProps.treino}
              classes={classes}
            />
          </Grid>
          <Grid item xs={6}>
            <CharacterInfoField
              {...fieldProps.nivel}
              classes={classes}
            />
          </Grid>
          <Grid item xs={6}>
            <CharacterInfoField
              {...fieldProps.grau}
              classes={classes}
            />
          </Grid>
          <Grid item xs={6}>
            <CharacterInfoField
              {...fieldProps.tecnica}
              classes={classes}
            />
          </Grid>
          <Grid item xs={6}>
            <CharacterInfoField
              {...fieldProps.experiencia}
              classes={classes}
            />
          </Grid>
          <Grid item xs={12}>
            <CharacterInfoField
              {...fieldProps.multiclasse}
              classes={classes}
            />
          </Grid>
          <Grid item xs={12}>
            <CharacterInfoField
              {...fieldProps.especializacao}
              classes={classes}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}, (prevProps, nextProps) => {
  const isEqual = (
    prevProps.classes === nextProps.classes &&
    prevProps.handleCharacterInfoClick === nextProps.handleCharacterInfoClick &&
    prevProps.characterInfo.origem === nextProps.characterInfo.origem &&
    prevProps.characterInfo.treino === nextProps.characterInfo.treino &&
    prevProps.characterInfo.nivel === nextProps.characterInfo.nivel &&
    prevProps.characterInfo.grau === nextProps.characterInfo.grau &&
    prevProps.characterInfo.tecnica === nextProps.characterInfo.tecnica &&
    prevProps.characterInfo.experiencia === nextProps.characterInfo.experiencia &&
    prevProps.characterInfo.multiclasse === nextProps.characterInfo.multiclasse &&
    prevProps.characterInfo.especializacao === nextProps.characterInfo.especializacao
  );
  console.log('🔵 CharacterInfoSection SHOULD_UPDATE:', !isEqual);
  return isEqual;
});

export default withStyles(styles)(CharacterInfoSection);