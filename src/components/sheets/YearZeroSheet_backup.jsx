import React, { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import { Box, Typography, TextField, Paper, IconButton } from '@mui/material';
import { Casino } from '@mui/icons-material';

const styles = (theme) => ({
  container: {
    padding: '20px',
    maxWidth: '950px',
    margin: '0 auto',
    display: 'flex',
    gap: '20px',
    minHeight: '600px',
    background: 'transparent',
    borderRadius: '8px',
    position: 'relative'
  },
  healthStressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '200px',
    flexShrink: 0
  },
  healthTracker: {
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #4caf50',
    borderRadius: '4px',
    padding: '10px 12px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
    height: 'fit-content',
    backdropFilter: 'blur(10px)'
  },
  stressTracker: {
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #ff6b35',
    borderRadius: '4px',
    padding: '10px 12px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)',
    height: 'fit-content',
    backdropFilter: 'blur(10px)'
  },
  trackerHeader: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    marginBottom: '6px',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: '0.5px'
  },
  healthHeader: {
    color: '#4caf50'
  },
  stressHeader: {
    color: '#ff6b35'
  },
  squaresContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '3px',
    justifyContent: 'center',
    alignItems: 'center'
  },
  square: {
    width: '20px',
    height: '20px',
    border: '1.5px solid',
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.6rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)'
    }
  },
  healthSquare: {
    borderColor: '#4caf50',
    '&.active': {
      backgroundColor: '#4caf50'
    }
  },
  stressSquare: {
    borderColor: '#ff6b35',
    '&.active': {
      backgroundColor: '#ff6b35'
    }
  },
  trackerLabel: {
    fontSize: '0.5rem',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '1px'
  },
  attributesContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    padding: '10px',
    minHeight: '500px',
    backdropFilter: 'blur(10px)'
  },
  diamondCore: {
    position: 'relative',
    width: '300px',
    height: '300px',
    margin: '0 auto'
  },
  diamondWeb: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    zIndex: 2,
    pointerEvents: 'none'
  },
  webLine: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    height: '1px',
    transformOrigin: '0 0'
  },
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
  attributeOctagonBorder: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #ff6b35 0%, #e65100 50%, #bf360c 100%)',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 1
  },
  attributeOctagon: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.9)',
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
    border: '1px solid #fff'
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
      background: 'rgba(255, 255, 255, 0.8)',
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
    background: 'rgba(255, 255, 255, 0.8)',
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
  skillOctagonBorder: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 1
  },
  skillOctagon: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.9)',
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
    wordWrap: 'break-word'
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
      background: 'rgba(255, 255, 255, 0.8)',
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
    background: 'rgba(255, 255, 255, 0.8)',
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

const HealthStressTracker = ({ classes, healthSquares, stressSquares, onHealthUpdate, onStressUpdate }) => {
  const handleSquareClick = (index, currentSquares, updateFunction) => {
    const newSquares = [...currentSquares];
    const isCurrentlyActive = newSquares[index];
    
    if (isCurrentlyActive) {
      for (let i = index; i < newSquares.length; i++) newSquares[i] = false;
    } else {
      for (let i = 0; i <= index; i++) newSquares[i] = true;
    }
    updateFunction(newSquares);
  };

  const renderSquares = (squaresArray, type, updateFunction) => {
    return squaresArray.map((isActive, index) => {
      const squareNumber = index + 1;
      const squareClass = `${classes.square} ${type === 'health' ? classes.healthSquare : classes.stressSquare} ${isActive ? 'active' : ''}`;
      
      return (
        <Box key={index} display="flex" flexDirection="column" alignItems="center">
          <div 
            className={squareClass}
            onClick={() => handleSquareClick(index, squaresArray, updateFunction)}
          />
          <Typography className={classes.trackerLabel}>
            {squareNumber}
          </Typography>
        </Box>
      );
    });
  };

  return (
    <Box className={classes.healthStressContainer}>
      <Paper className={classes.healthTracker}>
        <Typography className={`${classes.trackerHeader} ${classes.healthHeader}`}>
          Pontos de Vida
        </Typography>
        <Box className={classes.squaresContainer}>
          {renderSquares(healthSquares, 'health', onHealthUpdate)}
        </Box>
      </Paper>

      <Paper className={classes.stressTracker}>
        <Typography className={`${classes.trackerHeader} ${classes.stressHeader}`}>
          Nível de Estresse
        </Typography>
        <Box className={classes.squaresContainer}>
          {renderSquares(stressSquares, 'stress', onStressUpdate)}
        </Box>
      </Paper>
    </Box>
  );
};

const DiamondWeb = ({ classes }) => {
  const centerX = 150;
  const centerY = 150;
  
  const attributeConnections = [
    { start: { x: centerX, y: 0 }, end: { x: 0, y: centerY } },
    { start: { x: centerX, y: 0 }, end: { x: 300, y: centerY } },
    { start: { x: 0, y: centerY }, end: { x: centerX, y: 300 } },
    { start: { x: 300, y: centerY }, end: { x: centerX, y: 300 } },
    { start: { x: 0, y: centerY }, end: { x: 300, y: centerY } },
    { start: { x: centerX, y: 0 }, end: { x: centerX, y: 300 } }
  ];
  
  const lines = attributeConnections.map((connection, index) => {
    const start = connection.start;
    const end = connection.end;
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return (
      <div
        key={`diamond-line-${index}`}
        className={classes.webLine}
        style={{
          width: `${distance}px`,
          left: `${start.x}px`,
          top: `${start.y}px`,
          transform: `rotate(${angle}deg)`
        }}
      />
    );
  });
  
  return <Box className={classes.diamondWeb}>{lines}</Box>;
};

const formatSkillDisplayName = (skillName) => {
  const nameMap = {
    'COMBATE CORPO A CORPO': 'CORPO A\nCORPO',
    'MAQUINÁRIO PESADO': 'MAQUINÁRIO\nPESADO', 
    'COMBATE À DISTÂNCIA': 'COMBATE\nÀ DISTÂNCIA',
    'AJUDA MÉDICA': 'AJUDA\nMÉDICA'
  };
  return nameMap[skillName] || skillName;
};

function YearZeroSheet({
  classes,
  character,
  attributes = [],
  skills = [],
  onUpdate,
  onAttributeRoll,
  onSkillRoll
}) {
  const [localAttributes, setLocalAttributes] = useState([]);
  const [localSkills, setLocalSkills] = useState([]);
  const [stressSquares, setStressSquares] = useState(Array(10).fill(false));
  const [healthSquares, setHealthSquares] = useState(Array(10).fill(false));

  useEffect(() => {
    setLocalAttributes(attributes);
    setLocalSkills(skills);
    
    // Carregar quadrados do banco se existirem - CORRIGIDO
    if (character?.stress_squares) {
      try {
        let savedStressSquares = character.stress_squares;
        
        // Se for string, tenta fazer parse
        if (typeof savedStressSquares === 'string') {
          // Remove possíveis aspas extras
          savedStressSquares = savedStressSquares.replace(/^"+|"+$/g, '');
          savedStressSquares = JSON.parse(savedStressSquares);
        }
        
        // Garantir que é um array válido
        if (Array.isArray(savedStressSquares) && savedStressSquares.length === 10) {
          console.log('[DEBUG] YearZeroSheet - Stress squares carregados do banco:', savedStressSquares);
          setStressSquares(savedStressSquares);
        } else {
          console.log('[DEBUG] YearZeroSheet - Stress squares inválidos, usando padrão');
          setStressSquares(Array(10).fill(false));
        }
      } catch (error) {
        console.error('[ERROR] YearZeroSheet - Erro ao carregar stress_squares:', error, 'Valor:', character.stress_squares);
        setStressSquares(Array(10).fill(false));
      }
    } else {
      console.log('[DEBUG] YearZeroSheet - Nenhum stress_squares encontrado, usando padrão');
      setStressSquares(Array(10).fill(false));
    }
    
    if (character?.health_squares) {
      try {
        let savedHealthSquares = character.health_squares;
        
        // Se for string, tenta fazer parse
        if (typeof savedHealthSquares === 'string') {
          // Remove possíveis aspas extras
          savedHealthSquares = savedHealthSquares.replace(/^"+|"+$/g, '');
          savedHealthSquares = JSON.parse(savedHealthSquares);
        }
        
        // Garantir que é um array válido
        if (Array.isArray(savedHealthSquares) && savedHealthSquares.length === 10) {
          console.log('[DEBUG] YearZeroSheet - Health squares carregados do banco:', savedHealthSquares);
          setHealthSquares(savedHealthSquares);
        } else {
          console.log('[DEBUG] YearZeroSheet - Health squares inválidos, usando padrão');
          setHealthSquares(Array(10).fill(false));
        }
      } catch (error) {
        console.error('[ERROR] YearZeroSheet - Erro ao carregar health_squares:', error, 'Valor:', character.health_squares);
        setHealthSquares(Array(10).fill(false));
      }
    } else {
      console.log('[DEBUG] YearZeroSheet - Nenhum health_squares encontrado, usando padrão');
      setHealthSquares(Array(10).fill(false));
    }
  }, [attributes, skills, character]);

  const defaultAttributes = [
    { name: 'Força', year_zero_value: 1 },
    { name: 'Agilidade', year_zero_value: 1 },
    { name: 'Inteligência', year_zero_value: 1 },
    { name: 'Empatia', year_zero_value: 1 }
  ];

  const defaultSkills = [
    { name: 'COMBATE CORPO A CORPO', year_zero_value: 1 },
    { name: 'MAQUINÁRIO PESADO', year_zero_value: 1 },
    { name: 'RESISTÊNCIA', year_zero_value: 1 },
    { name: 'COMBATE À DISTÂNCIA', year_zero_value: 1 },
    { name: 'MOBILIDADE', year_zero_value: 1 },
    { name: 'PILOTAGEM', year_zero_value: 1 },
    { name: 'OBSERVAÇÃO', year_zero_value: 1 },
    { name: 'SOBREVIVÊNCIA', year_zero_value: 1 },
    { name: 'TECNOLOGIA', year_zero_value: 1 },
    { name: 'MANIPULAÇÃO', year_zero_value: 1 },
    { name: 'COMANDO', year_zero_value: 1 },
    { name: 'AJUDA MÉDICA', year_zero_value: 1 }
  ];

  const validatedAttributes = localAttributes.length ? localAttributes : defaultAttributes;
  const validatedSkills = localSkills.length ? localSkills : defaultSkills;

  const getAttributeValue = (attributeName) => {
    const attribute = validatedAttributes.find(a => a.name === attributeName);
    return Math.max(1, Math.min(6, attribute?.year_zero_value || 1));
  };

  const getSkillValue = (skillName) => {
    const skill = validatedSkills.find(s => s.name === skillName);
    return Math.max(1, Math.min(6, skill?.year_zero_value || 1));
  };

  const updateAttribute = (attributeName, value) => {
    const numValue = value === "" ? 1 : Math.max(1, Math.min(6, parseInt(value) || 1));
    setLocalAttributes(prev => prev.map(attr => 
      attr.name === attributeName ? { ...attr, year_zero_value: numValue } : attr
    ));
    if (onUpdate) onUpdate('attribute', attributeName, numValue);
  };

  const updateSkill = (skillName, value) => {
    const numValue = value === "" ? 1 : Math.max(1, Math.min(6, parseInt(value) || 1));
    setLocalSkills(prev => prev.map(skill => 
      skill.name === skillName ? { ...skill, year_zero_value: numValue } : skill
    ));
    if (onUpdate) onUpdate('skill', skillName, numValue);
  };

  const handleHealthUpdate = (newHealthSquares) => {
    console.log('[DEBUG] YearZeroSheet - handleHealthUpdate chamado:', newHealthSquares);
    setHealthSquares(newHealthSquares);
    if (onUpdate) {
      console.log('[DEBUG] YearZeroSheet - Chamando onUpdate com health_squares');
      onUpdate('health_squares', 'health_squares', newHealthSquares);
    }
  };

  const handleStressUpdate = (newStressSquares) => {
    console.log('[DEBUG] YearZeroSheet - handleStressUpdate chamado:', newStressSquares);
    setStressSquares(newStressSquares);
    if (onUpdate) {
      console.log('[DEBUG] YearZeroSheet - Chamando onUpdate com stress_squares');
      onUpdate('stress_squares', 'stress_squares', newStressSquares);
    }
  };

  const handleInputChange = (e, callback, name) => {
    const value = e.target.value;
    if (value === '') {
      callback(name, '');
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue)) callback(name, numValue);
  };

  const handleBlur = (e, callback, name) => {
    let value = e.target.value;
    if (value === '') value = '1';
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) value = '1';
    else if (numValue > 6) value = '6';
    callback(name, value);
  };

  const handleKeyDown = (e, currentValue, callback, name) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      callback(name, Math.min(6, currentValue + 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      callback(name, Math.max(1, currentValue - 1));
    }
  };

  const handleAttributeRoll = (attributeName) => {
    if (onAttributeRoll) {
      const value = getAttributeValue(attributeName);
      const stressCount = stressSquares.filter(Boolean).length;
      onAttributeRoll(attributeName, value, stressCount, stressSquares);
    }
  };

  const handleSkillRoll = (skillName) => {
    if (onSkillRoll) {
      const value = getSkillValue(skillName);
      const stressCount = stressSquares.filter(Boolean).length;
      onSkillRoll(skillName, value, stressCount, stressSquares);
    }
  };

  const SkillComponent = ({ skillName, skillValue, positionClass }) => (
    <Box className={`${classes.skillGroup} ${positionClass}`}>
      <Box className={classes.skillOctagonContainer}>
        <div className={classes.skillOctagonBorder} />
        <div className={classes.skillOctagon}>
          <Box className={classes.skillOctagonContent}>
            <Box className={classes.skillInputRow}>
              <TextField
                type="number"
                value={skillValue}
                onChange={(e) => handleInputChange(e, updateSkill, skillName)}
                onBlur={(e) => handleBlur(e, updateSkill, skillName)}
                onKeyDown={(e) => handleKeyDown(e, skillValue, updateSkill, skillName)}
                inputProps={{ min: 1, max: 6 }}
                className={classes.skillInput}
                size="small"
              />
              <IconButton
                className={classes.skillDiceButton}
                onClick={() => handleSkillRoll(skillName)}
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

  const AttributeOctagon = ({ attributeName, attributeValue, positionClass }) => (
    <Box className={`${classes.attributePosition} ${positionClass}`}>
      <Box className={classes.attributeOctagonContainer}>
        <div className={classes.attributeOctagonBorder} />
        <div className={classes.attributeOctagon}>
          <Box className={classes.attributeOctagonContent}>
            <Box className={classes.attributeInputRow}>
              <TextField
                type="number"
                value={attributeValue}
                onChange={(e) => handleInputChange(e, updateAttribute, attributeName)}
                onBlur={(e) => handleBlur(e, updateAttribute, attributeName)}
                onKeyDown={(e) => handleKeyDown(e, attributeValue, updateAttribute, attributeName)}
                inputProps={{ min: 1, max: 6 }}
                className={classes.attributeInput}
                size="small"
              />
              <IconButton
                className={classes.attributeDiceButton}
                onClick={() => handleAttributeRoll(attributeName)}
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

  const AttributeWithSkills = ({ attributeName, config }) => {
    const currentAttributeValue = getAttributeValue(attributeName);
    const skillValues = Object.values(config.skills).map(skillName => ({
      name: skillName,
      value: getSkillValue(skillName)
    }));

    const getSkillPositions = () => {
      const positionMap = {
        'Força': [classes.skillTopLeft, classes.skillTopCenter, classes.skillTopRight],
        'Agilidade': [classes.skillLeftTop, classes.skillLeftMiddle, classes.skillLeftBottom],
        'Inteligência': [classes.skillRightTop, classes.skillRightMiddle, classes.skillRightBottom],
        'Empatia': [classes.skillBottomLeft, classes.skillBottomCenter, classes.skillBottomRight]
      };
      return positionMap[attributeName] || [];
    };

    const skillPositions = getSkillPositions();

    return (
      <>
        <AttributeOctagon
          attributeName={attributeName}
          attributeValue={currentAttributeValue}
          positionClass={config.position}
        />

        {skillValues.map((skill, index) => (
          <SkillComponent
            key={skill.name}
            skillName={skill.name}
            skillValue={skill.value}
            positionClass={skillPositions[index]}
          />
        ))}
      </>
    );
  };

  return (
    <Box className={classes.container}>
      <HealthStressTracker 
        classes={classes}
        healthSquares={healthSquares}
        stressSquares={stressSquares}
        onHealthUpdate={handleHealthUpdate}
        onStressUpdate={handleStressUpdate}
      />
      <Box className={classes.attributesContainer}>
        <Box className={classes.diamondCore}>
          <DiamondWeb classes={classes} />
          {Object.entries({
            'Força': { 
              position: classes.positionTop, 
              skills: { 
                0: 'COMBATE CORPO A CORPO', 
                1: 'MAQUINÁRIO PESADO', 
                2: 'RESISTÊNCIA' 
              }
            },
            'Agilidade': { 
              position: classes.positionLeft, 
              skills: { 
                0: 'COMBATE À DISTÂNCIA', 
                1: 'MOBILIDADE', 
                2: 'PILOTAGEM' 
              }
            },
            'Inteligência': { 
              position: classes.positionRight, 
              skills: { 
                0: 'OBSERVAÇÃO', 
                1: 'SOBREVIVÊNCIA', 
                2: 'TECNOLOGIA' 
              }
            },
            'Empatia': { 
              position: classes.positionBottom, 
              skills: { 
                0: 'MANIPULAÇÃO', 
                1: 'COMANDO', 
                2: 'AJUDA MÉDICA' 
              }
            }
          }).map(([attributeName, config]) => (
            <AttributeWithSkills
              key={attributeName}
              attributeName={attributeName}
              config={config}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default withStyles(styles)(YearZeroSheet);