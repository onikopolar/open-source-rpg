import React from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import { Casino } from '@mui/icons-material';

// Helper function
export const formatSkillDisplayName = (skillName) => {
  const nameMap = {
    'COMBATE CORPO A CORPO': 'CORPO A\nCORPO',
    'MAQUINÁRIO PESADO': 'MAQUINÁRIO\nPESADO', 
    'COMBATE À DISTÂNCIA': 'COMBATE\nÀ DISTÂNCIA',
    'AJUDA MÉDICA': 'AJUDA\nMÉDICA'
  };
  return nameMap[skillName] || skillName;
};

// Styles para os componentes - APENAS CORES MAIS VIBRANTES
export const attributeComponentsStyles = (theme) => ({
  attributePosition: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    width: '100px',
    height: '100px'
  },
  positionTop: {
    top: '0%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  },
  positionLeft: {
    top: '50%',
    left: '0%',
    transform: 'translate(-50%, -50%)'
  },
  positionRight: {
    top: '50%',
    right: '0%',
    transform: 'translate(50%, -50%)'
  },
  positionBottom: {
    bottom: '0%',
    left: '50%',
    transform: 'translate(-50%, 50%)'
  },
  attributeOctagonContainer: {
    position: 'relative',
    width: '90px',
    height: '90px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  // ATRIBUTOS: Laranja MESMO, mas MAIS VIBRANTE
  attributeOctagonBorder: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #ff6b35 0%, #e65100 50%, #bf360c 100%)',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 1,
    filter: 'brightness(1.1) saturate(1.2)' // MAIS VIBRANTE
  },
  attributeOctagon: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.95)', // MAIS BRANCO
    color: '#ff6b35',
    textAlign: 'center',
    fontWeight: 'bold',
    width: '82px',
    height: '82px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 2,
    border: '1px solid #ff6b35',
    backdropFilter: 'blur(5px)'
  },
  attributeOctagonContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '100%',
    padding: '6px'
  },
  attributeNameBox: {
    background: '#ff6b35',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '2px',
    fontSize: '0.5rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    marginTop: '3px',
    whiteSpace: 'nowrap',
    border: '1px solid #fff',
    filter: 'brightness(1.1)' // MAIS VIBRANTE
  },
  attributeInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    justifyContent: 'center'
  },
  attributeInput: {
    width: '38px',
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.9)', // MAIS BRANCO
      borderRadius: '2px',
      '& fieldset': {
        borderColor: '#ff6b35',
        borderWidth: '1px'
      },
      '&:hover fieldset': {
        borderColor: '#ff6b35',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#ff6b35',
        borderWidth: '1px'
      }
    },
    '& input': {
      color: '#ff6b35',
      fontWeight: '800',
      fontSize: '0.75rem',
      textAlign: 'center',
      padding: '4px 2px',
      height: '22px'
    }
  },
  attributeDiceButton: {
    padding: '4px',
    minWidth: 'auto',
    color: '#ff6b35',
    background: 'rgba(255, 255, 255, 0.9)', // MAIS BRANCO
    border: '1px solid #ff6b35',
    borderRadius: '2px',
    '& .MuiSvgIcon-root': {
      fontSize: '14px'
    },
    '&:hover': {
      backgroundColor: '#ff6b35',
      color: '#fff'
    }
  },
  skillOctagonContainer: {
    position: 'relative',
    width: '70px',
    height: '70px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  // SKILLS: Azul MESMO, mas MAIS VIBRANTE
  skillOctagonBorder: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 1,
    filter: 'brightness(1.1) saturate(1.2)' // MAIS VIBRANTE
  },
  skillOctagon: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.95)', // MAIS BRANCO
    color: '#1976d2',
    textAlign: 'center',
    fontWeight: 'bold',
    width: '64px',
    height: '64px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 2,
    border: '1px solid #1976d2',
    backdropFilter: 'blur(5px)'
  },
  skillOctagonContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    width: '100%',
    padding: '4px'
  },
  skillNameBox: {
    background: '#1976d2',
    color: '#fff',
    padding: '3px 6px',
    borderRadius: '2px',
    fontSize: '0.45rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    whiteSpace: 'pre-line',
    textAlign: 'center',
    lineHeight: '1.1',
    border: '1px solid #fff',
    minWidth: '70px',
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    wordWrap: 'break-word',
    filter: 'brightness(1.1)' // MAIS VIBRANTE
  },
  skillInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    justifyContent: 'center',
    marginBottom: '1px'
  },
  skillInput: {
    width: '34px',
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.9)', // MAIS BRANCO
      borderRadius: '2px',
      '& fieldset': {
        borderColor: '#1976d2',
        borderWidth: '1px'
      },
      '&:hover fieldset': {
        borderColor: '#1976d2',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1976d2',
        borderWidth: '1px'
      }
    },
    '& input': {
      color: '#1976d2',
      fontWeight: 'bold',
      fontSize: '0.7rem',
      textAlign: 'center',
      padding: '3px 1px',
      height: '20px'
    }
  },
  skillDiceButton: {
    padding: '3px',
    minWidth: 'auto',
    color: '#1976d2',
    background: 'rgba(255, 255, 255, 0.9)', // MAIS BRANCO
    border: '1px solid #1976d2',
    borderRadius: '2px',
    '&:hover': {
      backgroundColor: '#1976d2',
      color: '#fff'
    },
    '& .MuiSvgIcon-root': {
      fontSize: '12px'
    }
  },
  skillGroup: {
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 20
  },
  skillTopLeft: {
    top: '-50px',
    left: '-50px',
    flexDirection: 'row'
  },
  skillTopCenter: {
    top: '-145px',
    left: '50%',
    transform: 'translateX(-50%)',
    flexDirection: 'column'
  },
  skillTopRight: {
    top: '-50px',
    right: '-50px',
    flexDirection: 'row-reverse'
  },
  skillLeftTop: {
    top: '40px',
    left: '-100px',
    flexDirection: 'row'
  },
  skillLeftMiddle: {
    top: '50%',
    left: '-190px',
    transform: 'translateY(-50%)',
    flexDirection: 'row'
  },
  skillLeftBottom: {
    bottom: '40px',
    left: '-100px',
    flexDirection: 'row'
  },
  skillRightTop: {
    top: '40px',
    right: '-100px',
    flexDirection: 'row-reverse'
  },
  skillRightMiddle: {
    top: '50%',
    right: '-190px',
    transform: 'translateY(-50%)',
    flexDirection: 'row-reverse'
  },
  skillRightBottom: {
    bottom: '40px',
    right: '-100px',
    flexDirection: 'row-reverse'
  },
  skillBottomLeft: {
    bottom: '-50px',
    left: '-40px',
    flexDirection: 'row'
  },
  skillBottomCenter: {
    bottom: '-135px',
    left: '50%',
    transform: 'translateX(-50%)',
    flexDirection: 'column-reverse'
  },
  skillBottomRight: {
    bottom: '-50px',
    right: '-40px',
    flexDirection: 'row-reverse'
  }
});

// Componentes individuais - EXATAMENTE OS MESMOS
export const AttributeOctagon = ({ 
  classes, 
  attributeName, 
  attributeValue, 
  positionClass,
  onInputChange,
  onBlur,
  onKeyDown,
  onDiceClick
}) => (
  <Box className={`${classes.attributePosition} ${positionClass}`}>
    <Box className={classes.attributeOctagonContainer}>
      <div className={classes.attributeOctagonBorder} />
      <div className={classes.attributeOctagon}>
        <Box className={classes.attributeOctagonContent}>
          <Box className={classes.attributeInputRow}>
            <TextField
              type="number"
              value={attributeValue}
              onChange={(e) => onInputChange(e, attributeName)}
              onBlur={(e) => onBlur(e, attributeName)}
              onKeyDown={(e) => onKeyDown(e, attributeValue, attributeName)}
              inputProps={{ min: 0, max: 6 }}
              className={classes.attributeInput}
              size="small"
            />
            <IconButton
              className={classes.attributeDiceButton}
              onClick={() => onDiceClick(attributeName)}
              size="small"
            >
              <Casino />
            </IconButton>
          </Box>
          <Typography className={classes.attributeNameBox}>
            {attributeName}
          </Typography>
        </Box>
      </div>
    </Box>
  </Box>
);

export const SkillComponent = ({ 
  classes, 
  skillName, 
  skillValue, 
  positionClass,
  onInputChange,
  onBlur,
  onKeyDown,
  onDiceClick
}) => (
  <Box className={`${classes.skillGroup} ${positionClass}`}>
    <Box className={classes.skillOctagonContainer}>
      <div className={classes.skillOctagonBorder} />
      <div className={classes.skillOctagon}>
        <Box className={classes.skillOctagonContent}>
          <Box className={classes.skillInputRow}>
            <TextField
              type="number"
              value={skillValue}
              onChange={(e) => onInputChange(e, skillName)}
              onBlur={(e) => onBlur(e, skillName)}
              onKeyDown={(e) => onKeyDown(e, skillValue, skillName)}
              inputProps={{ min: 0, max: 6 }}
              className={classes.skillInput}
              size="small"
            />
            <IconButton
              className={classes.skillDiceButton}
              onClick={() => onDiceClick(skillName)}
              size="small"
            >
              <Casino fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </div>
    </Box>
    <Typography className={classes.skillNameBox}>
      {formatSkillDisplayName(skillName)}
    </Typography>
  </Box>
);