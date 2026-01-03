import React, { useState, useEffect } from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import { Casino } from '@mui/icons-material';

// Fix: AttributeComponents com estado sincronizado nos componentes visuais
console.log('[AttributeComponents] Versão 1.4.1 - Fix: Estado sincronizado nos componentes visuais');

// Helper function para formatar nomes de skills
export const formatSkillDisplayName = (skillName) => {
  const nameMap = {
    'COMBATE CORPO A CORPO': 'CORPO A\nCORPO',
    'MAQUINÁRIO PESADO': 'MAQUINÁRIO\nPESADO', 
    'COMBATE À DISTÂNCIA': 'COMBATE\nÀ DISTÂNCIA',
    'AJUDA MÉDICA': 'AJUDA\nMÉDICA'
  };
  return nameMap[skillName] || skillName;
};

// Helper para obter valor de atributo com validação
export const getAttributeValue = (attributes, attributeName, defaultAttributes = []) => {
  const validatedAttributes = attributes.length ? attributes : defaultAttributes;
  const attribute = validatedAttributes.find(a => a.name === attributeName);
  const value = attribute?.year_zero_value || 0;
  return Math.max(0, Math.min(6, value));
};

// Helper para obter valor de skill com validação
export const getSkillValue = (skills, skillName, defaultSkills = []) => {
  const validatedSkills = skills.length ? skills : defaultSkills;
  const skill = validatedSkills.find(s => s.name === skillName);
  const value = skill?.year_zero_value || 0;
  return Math.max(0, Math.min(6, value));
};

// Helper para atualizar atributo
export const updateAttribute = (attributeName, value, currentAttributes, onUpdate, setLocalAttributes) => {
  let numValue;
  if (value === "" || value === null || value === undefined) {
    numValue = 0;
  } else {
    numValue = parseInt(value);
    if (isNaN(numValue)) numValue = 0;
  }
  
  numValue = Math.max(0, Math.min(6, numValue));
  
  setLocalAttributes(prev => prev.map(attr => 
    attr.name === attributeName ? { ...attr, year_zero_value: numValue } : attr
  ));
  
  if (onUpdate) {
    onUpdate('attribute', attributeName, numValue);
  }
  
  return numValue;
};

// Helper para atualizar skill
export const updateSkill = (skillName, value, currentSkills, onUpdate, setLocalSkills) => {
  let numValue;
  if (value === "" || value === null || value === undefined) {
    numValue = 0;
  } else {
    numValue = parseInt(value);
    if (isNaN(numValue)) numValue = 0;
  }
  
  numValue = Math.max(0, Math.min(6, numValue));
  
  setLocalSkills(prev => prev.map(skill => 
    skill.name === skillName ? { ...skill, year_zero_value: numValue } : skill
  ));
  
  if (onUpdate) {
    onUpdate('skill', skillName, numValue);
  }
  
  return numValue;
};

// Helper para mudança de input
export const handleInputChange = (e, callback, name, currentValue, setter, onUpdate) => {
  const value = e.target.value;
  
  if (value === '') {
    callback(name, '', currentValue, onUpdate, setter);
    return;
  }
  
  const numValue = parseInt(value);
  if (!isNaN(numValue)) {
    callback(name, numValue, currentValue, onUpdate, setter);
  }
};

// Helper para blur
export const handleBlur = (e, callback, name, currentValue, setter, onUpdate) => {
  let value = e.target.value;
  
  if (value === '') {
    value = '0';
  }
  
  const numValue = parseInt(value);
  if (isNaN(numValue) || numValue < 0) {
    value = '0';
  } else if (numValue > 6) {
    value = '6';
  }
  
  callback(name, value, currentValue, onUpdate, setter);
};

// Helper para teclas de seta
export const handleKeyDown = (e, currentValue, callback, name, setter, onUpdate) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    const newValue = Math.min(6, currentValue + 1);
    callback(name, newValue, setter, onUpdate);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    const newValue = Math.max(0, currentValue - 1);
    callback(name, newValue, setter, onUpdate);
  }
};

// Helper para incrementar
export const handleIncrement = (currentValue, callback, name, setter, onUpdate) => {
  const newValue = Math.min(6, currentValue + 1);
  callback(name, newValue, setter, onUpdate);
};

// Helper para decrementar
export const handleDecrement = (currentValue, callback, name, setter, onUpdate) => {
  const newValue = Math.max(0, currentValue - 1);
  callback(name, newValue, setter, onUpdate);
};

// Configurações de mapeamento de atributos para skills
export const attributeSkillMap = {
  'Força': { 
    positionClass: 'positionTop', 
    skills: { 
      0: 'COMBATE CORPO A CORPO', 
      1: 'MAQUINÁRIO PESADO', 
      2: 'RESISTÊNCIA' 
    }
  },
  'Agilidade': { 
    positionClass: 'positionLeft', 
    skills: { 
      0: 'COMBATE À DISTÂNCIA', 
      1: 'MOBILIDADE', 
      2: 'PILOTAGEM' 
    }
  },
  'Inteligência': { 
    positionClass: 'positionRight', 
    skills: { 
      0: 'OBSERVAÇÃO', 
      1: 'SOBREVIVÊNCIA', 
      2: 'TECNOLOGIA' 
    }
  },
  'Empatia': { 
    positionClass: 'positionBottom', 
    skills: { 
      0: 'MANIPULAÇÃO', 
      1: 'COMANDO', 
      2: 'AJUDA MÉDICA' 
    }
  }
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
    filter: 'brightness(1.1) saturate(1.2)'
  },
  attributeOctagon: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.95)',
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
    filter: 'brightness(1.1)'
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
      background: 'rgba(255, 255, 255, 0.9)',
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
    background: 'rgba(255, 255, 255, 0.9)',
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
    filter: 'brightness(1.1) saturate(1.2)'
  },
  skillOctagon: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.95)',
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
    filter: 'brightness(1.1)'
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
      background: 'rgba(255, 255, 255, 0.9)',
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
    background: 'rgba(255, 255, 255, 0.9)',
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

// Componentes individuais COM ESTADO SINCRONIZADO
export const AttributeOctagon = ({ 
  classes, 
  attributeName, 
  attributeValue, 
  positionClass,
  onInputChange,
  onBlur,
  onKeyDown,
  onIncrement,
  onDecrement,
  onDiceClick
}) => {
  // Fix: Estado local sincronizado
  const [localValue, setLocalValue] = useState(attributeValue);
  
  // Fix: Sincroniza quando a prop muda
  useEffect(() => {
    setLocalValue(attributeValue);
  }, [attributeValue]);

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      onIncrement(localValue, attributeName);
    } else {
      onDecrement(localValue, attributeName);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // Atualiza estado local primeiro para feedback imediato
    if (value === '') {
      setLocalValue('');
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        const clampedValue = Math.max(0, Math.min(6, numValue));
        setLocalValue(clampedValue);
      }
    }
    
    // Depois chama o handler original
    onInputChange(e, attributeName);
  };

  return (
    <Box className={`${classes.attributePosition} ${positionClass}`}>
      <Box className={classes.attributeOctagonContainer}>
        <div className={classes.attributeOctagonBorder} />
        <div className={classes.attributeOctagon}>
          <Box className={classes.attributeOctagonContent}>
            <Box className={classes.attributeInputRow}>
              <TextField
                type="number"
                value={localValue}
                onChange={handleInputChange}
                onBlur={(e) => onBlur(e, attributeName)}
                onKeyDown={(e) => onKeyDown(e, localValue, attributeName)}
                onWheel={handleWheel}
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
};

export const SkillComponent = ({ 
  classes, 
  skillName, 
  skillValue, 
  positionClass,
  onInputChange,
  onBlur,
  onKeyDown,
  onIncrement,
  onDecrement,
  onDiceClick
}) => {
  // Fix: Estado local sincronizado
  const [localValue, setLocalValue] = useState(skillValue);
  
  // Fix: Sincroniza quando a prop muda
  useEffect(() => {
    setLocalValue(skillValue);
  }, [skillValue]);

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      onIncrement(localValue, skillName);
    } else {
      onDecrement(localValue, skillName);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // Atualiza estado local primeiro para feedback imediato
    if (value === '') {
      setLocalValue('');
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        const clampedValue = Math.max(0, Math.min(6, numValue));
        setLocalValue(clampedValue);
      }
    }
    
    // Depois chama o handler original
    onInputChange(e, skillName);
  };

  return (
    <Box className={`${classes.skillGroup} ${positionClass}`}>
      <Box className={classes.skillOctagonContainer}>
        <div className={classes.skillOctagonBorder} />
        <div className={classes.skillOctagon}>
          <Box className={classes.skillOctagonContent}>
            <Box className={classes.skillInputRow}>
              <TextField
                type="number"
                value={localValue}
                onChange={handleInputChange}
                onBlur={(e) => onBlur(e, skillName)}
                onKeyDown={(e) => onKeyDown(e, localValue, skillName)}
                onWheel={handleWheel}
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
};

// Componente que agrupa atributo com suas skills
export const AttributeWithSkills = ({ 
  classes,
  attributeName,
  config,
  attributes,
  skills,
  onUpdate,
  setLocalAttributes,
  setLocalSkills,
  onAttributeRoll,
  onSkillRoll,
  defaultAttributes,
  defaultSkills
}) => {
  // Helpers adaptados para este componente
  const getSkillPositions = () => {
    const positionMap = {
      'Força': [classes.skillTopLeft, classes.skillTopCenter, classes.skillTopRight],
      'Agilidade': [classes.skillLeftTop, classes.skillLeftMiddle, classes.skillLeftBottom],
      'Inteligência': [classes.skillRightTop, classes.skillRightMiddle, classes.skillRightBottom],
      'Empatia': [classes.skillBottomLeft, classes.skillBottomCenter, classes.skillBottomRight]
    };
    return positionMap[attributeName] || [];
  };

  const currentAttributeValue = getAttributeValue(attributes, attributeName, defaultAttributes);
  const skillValues = Object.values(config.skills).map(skillName => ({
    name: skillName,
    value: getSkillValue(skills, skillName, defaultSkills)
  }));

  const skillPositions = getSkillPositions();

  // Handlers específicos para este componente
  const handleAttributeInputChange = (e, name) => 
    handleInputChange(e, updateAttribute, name, attributes, setLocalAttributes, onUpdate);
  
  const handleAttributeBlur = (e, name) => 
    handleBlur(e, updateAttribute, name, attributes, setLocalAttributes, onUpdate);
  
  const handleAttributeKeyDown = (e, currentValue, name) => 
    handleKeyDown(e, currentValue, updateAttribute, name, setLocalAttributes, onUpdate);
  
  const handleAttributeIncrement = (currentValue, name) => 
    handleIncrement(currentValue, updateAttribute, name, setLocalAttributes, onUpdate);
  
  const handleAttributeDecrement = (currentValue, name) => 
    handleDecrement(currentValue, updateAttribute, name, setLocalAttributes, onUpdate);

  const handleSkillInputChange = (e, name) => 
    handleInputChange(e, updateSkill, name, skills, setLocalSkills, onUpdate);
  
  const handleSkillBlur = (e, name) => 
    handleBlur(e, updateSkill, name, skills, setLocalSkills, onUpdate);
  
  const handleSkillKeyDown = (e, currentValue, name) => 
    handleKeyDown(e, currentValue, updateSkill, name, setLocalSkills, onUpdate);
  
  const handleSkillIncrement = (currentValue, name) => 
    handleIncrement(currentValue, updateSkill, name, setLocalSkills, onUpdate);
  
  const handleSkillDecrement = (currentValue, name) => 
    handleDecrement(currentValue, updateSkill, name, setLocalSkills, onUpdate);

  return (
    <>
      <AttributeOctagon
        classes={classes}
        attributeName={attributeName}
        attributeValue={currentAttributeValue}
        positionClass={classes[config.positionClass]}
        onInputChange={handleAttributeInputChange}
        onBlur={handleAttributeBlur}
        onKeyDown={handleAttributeKeyDown}
        onIncrement={handleAttributeIncrement}
        onDecrement={handleAttributeDecrement}
        onDiceClick={onAttributeRoll}
      />

      {skillValues.map((skill, index) => (
        <SkillComponent
          key={skill.name}
          classes={classes}
          skillName={skill.name}
          skillValue={skill.value}
          positionClass={skillPositions[index]}
          onInputChange={handleSkillInputChange}
          onBlur={handleSkillBlur}
          onKeyDown={handleSkillKeyDown}
          onIncrement={handleSkillIncrement}
          onDecrement={handleSkillDecrement}
          onDiceClick={onSkillRoll}
        />
      ))}
    </>
  );
};