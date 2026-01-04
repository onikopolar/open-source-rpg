import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import { Casino } from '@mui/icons-material';

// Versão 2.7.0 - FIX: Remoção de debugs poluentes e otimização geral
console.log('[AttributeComponents] Versão 2.7.0 - FIX: Console limpo e performance otimizada');

// Eu formato nomes de skills com quebras de linha
export const formatSkillDisplayName = (skillName) => {
  const nameMap = {
    'COMBATE CORPO A CORPO': 'CORPO A\nCORPO',
    'MAQUINÁRIO PESADO': 'MAQUINÁRIO\nPESADO', 
    'COMBATE À DISTÂNCIA': 'COMBATE\nÀ DISTÂNCIA',
    'AJUDA MÉDICA': 'AJUDA\nMÉDICA'
  };
  return nameMap[skillName] || skillName;
};

// Eu pego valor de atributo com validação de limites
export const getAttributeValue = (attributes, attributeName, defaultAttributes = []) => {
  const validatedAttributes = attributes.length ? attributes : defaultAttributes;
  const attribute = validatedAttributes.find(a => a.name === attributeName);
  const value = attribute?.year_zero_value || 0;
  return Math.max(0, Math.min(6, value));
};

// Eu pego valor de skill com validação de limites
export const getSkillValue = (skills, skillName, defaultSkills = []) => {
  const validatedSkills = skills.length ? skills : defaultSkills;
  const skill = validatedSkills.find(s => s.name === skillName);
  const value = skill?.year_zero_value || 0;
  return Math.max(0, Math.min(6, value));
};

// Eu atualizo atributo com validação e callback
export const updateAttribute = (attributeName, value, onUpdate) => {
  let numValue;
  
  if (value === "" || value === null || value === undefined) {
    numValue = 0;
  } else {
    numValue = parseInt(value);
    if (isNaN(numValue)) numValue = 0;
  }
  
  numValue = Math.max(0, Math.min(6, numValue));
  
  if (onUpdate) {
    onUpdate('attribute', attributeName, numValue);
  }
  
  return numValue;
};

// Eu atualizo skill com validação e callback
export const updateSkill = (skillName, value, onUpdate) => {
  let numValue;
  
  if (value === "" || value === null || value === undefined) {
    numValue = 0;
  } else {
    numValue = parseInt(value);
    if (isNaN(numValue)) numValue = 0;
  }
  
  numValue = Math.max(0, Math.min(6, numValue));
  
  if (onUpdate) {
    onUpdate('skill', skillName, numValue);
  }
  
  return numValue;
};

// Eu mapeio atributos para suas skills correspondentes
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

// Eu defino os estilos dos componentes
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

// Componente individual de atributo
const AttributeOctagonComponent = ({ 
  classes, 
  attributeName, 
  attributeValue, 
  positionClass,
  onUpdate,
  onAttributeRoll
}) => {
  const [localValue, setLocalValue] = useState(attributeValue);
  const inputRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const lastSavedValueRef = useRef(attributeValue);

  useEffect(() => {
    if (lastSavedValueRef.current !== attributeValue) {
      setLocalValue(attributeValue);
      lastSavedValueRef.current = attributeValue;
    }
  }, [attributeName, attributeValue]);

  const saveAttribute = useCallback((value, isFinal = false) => {
    let numValue;
    
    if (value === '' || value === null || value === undefined) {
      numValue = 0;
    } else {
      numValue = parseInt(value);
      if (isNaN(numValue)) numValue = 0;
    }
    
    numValue = Math.max(0, Math.min(6, numValue));
    
    if (numValue === lastSavedValueRef.current) {
      return;
    }
    
    lastSavedValueRef.current = numValue;
    
    if (onUpdate) {
      updateAttribute(attributeName, numValue, onUpdate);
    }
  }, [attributeName, onUpdate]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    
    if (value === '') {
      setLocalValue('');
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        const clampedValue = Math.max(0, Math.min(6, numValue));
        setLocalValue(clampedValue);
      }
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveAttribute(value, true);
    }, 600);
  }, [saveAttribute]);

  const handleBlur = useCallback((e) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    saveAttribute(e.target.value, true);
  }, [saveAttribute]);

  const handleDiceClick = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Eu salvo se necessário
    if (localValue !== lastSavedValueRef.current) {
      saveAttribute(localValue.toString(), true);
    }
    
    // Eu passo o valor atual pro modal
    const valueToRoll = lastSavedValueRef.current;
    
    if (onAttributeRoll) {
      onAttributeRoll(attributeName, valueToRoll);
    }
  }, [attributeName, onAttributeRoll, localValue, saveAttribute]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    let newValue;
    
    if (e.deltaY < 0) {
      newValue = Math.min(6, localValue + 1);
    } else {
      newValue = Math.max(0, localValue - 1);
    }
    
    setLocalValue(newValue);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveAttribute(newValue.toString(), true);
    }, 300);
  }, [localValue, saveAttribute]);

  const handleKeyDown = useCallback((e) => {
    let newValue;
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newValue = Math.min(6, localValue + 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newValue = Math.max(0, localValue - 1);
    } else {
      return;
    }
    
    setLocalValue(newValue);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveAttribute(newValue.toString(), true);
    }, 200);
  }, [localValue, saveAttribute]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onWheel={handleWheel}
                inputProps={{ min: 0, max: 6 }}
                className={classes.attributeInput}
                size="small"
                inputRef={inputRef}
              />
              <IconButton
                className={classes.attributeDiceButton}
                onClick={handleDiceClick}
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

// Função de comparação para AttributeOctagon
const attributeOctagonPropsAreEqual = (prevProps, nextProps) => {
  const attributeValueChanged = prevProps.attributeValue !== nextProps.attributeValue;
  const callbacksChanged = prevProps.onUpdate !== nextProps.onUpdate || 
                          prevProps.onAttributeRoll !== nextProps.onAttributeRoll;
  
  if (!attributeValueChanged && !callbacksChanged) {
    return true;
  }
  
  return false;
};

export const AttributeOctagon = memo(AttributeOctagonComponent, attributeOctagonPropsAreEqual);

// Componente individual de skill
const SkillComponentInternal = ({ 
  classes, 
  skillName, 
  skillValue, 
  positionClass,
  onUpdate,
  onSkillRoll
}) => {
  const [localValue, setLocalValue] = useState(skillValue);
  const inputRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const lastSavedValueRef = useRef(skillValue);

  useEffect(() => {
    if (lastSavedValueRef.current !== skillValue) {
      setLocalValue(skillValue);
      lastSavedValueRef.current = skillValue;
    }
  }, [skillName, skillValue]);

  const saveSkill = useCallback((value, isFinal = false) => {
    let numValue;
    
    if (value === '' || value === null || value === undefined) {
      numValue = 0;
    } else {
      numValue = parseInt(value);
      if (isNaN(numValue)) numValue = 0;
    }
    
    numValue = Math.max(0, Math.min(6, numValue));
    
    if (numValue === lastSavedValueRef.current) {
      return;
    }
    
    lastSavedValueRef.current = numValue;
    
    if (onUpdate) {
      updateSkill(skillName, numValue, onUpdate);
    }
  }, [skillName, onUpdate]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    
    if (value === '') {
      setLocalValue('');
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        const clampedValue = Math.max(0, Math.min(6, numValue));
        setLocalValue(clampedValue);
      }
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveSkill(value, true);
    }, 600);
  }, [saveSkill]);

  const handleBlur = useCallback((e) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    saveSkill(e.target.value, true);
  }, [saveSkill]);

  const handleDiceClick = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Eu salvo antes do roll
    if (localValue !== lastSavedValueRef.current) {
      saveSkill(localValue.toString(), true);
    }
    
    // Eu passo o valor atual pro modal
    const valueToRoll = lastSavedValueRef.current;
    
    // Eu dou um pequeno delay pra garantir que o save foi processado
    setTimeout(() => {
      if (onSkillRoll) {
        onSkillRoll(skillName, valueToRoll);
      }
    }, 50);
  }, [skillName, onSkillRoll, localValue, saveSkill]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    let newValue;
    
    if (e.deltaY < 0) {
      newValue = Math.min(6, localValue + 1);
    } else {
      newValue = Math.max(0, localValue - 1);
    }
    
    setLocalValue(newValue);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveSkill(newValue.toString(), true);
    }, 300);
  }, [localValue, saveSkill]);

  const handleKeyDown = useCallback((e) => {
    let newValue;
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newValue = Math.min(6, localValue + 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newValue = Math.max(0, localValue - 1);
    } else {
      return;
    }
    
    setLocalValue(newValue);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveSkill(newValue.toString(), true);
    }, 200);
  }, [localValue, saveSkill]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onWheel={handleWheel}
                inputProps={{ min: 0, max: 6 }}
                className={classes.skillInput}
                size="small"
                inputRef={inputRef}
              />
              <IconButton
                className={classes.skillDiceButton}
                onClick={handleDiceClick}
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

// Função de comparação para SkillComponent
const skillComponentPropsAreEqual = (prevProps, nextProps) => {
  const skillValueChanged = prevProps.skillValue !== nextProps.skillValue;
  const callbacksChanged = prevProps.onUpdate !== nextProps.onUpdate || 
                          prevProps.onSkillRoll !== nextProps.onSkillRoll;
  
  if (!skillValueChanged && !callbacksChanged) {
    return true;
  }
  
  return false;
};

export const SkillComponent = memo(SkillComponentInternal, skillComponentPropsAreEqual);

// Componente principal que agrupa atributo com suas skills
const AttributeWithSkillsComponent = ({ 
  classes,
  attributeName,
  config,
  attributes,
  skills,
  onUpdate,
  onAttributeRoll,
  onSkillRoll,
  defaultAttributes,
  defaultSkills
}) => {
  const currentAttributeValue = useMemo(() => {
    return getAttributeValue(attributes, attributeName, defaultAttributes);
  }, [attributes, attributeName, defaultAttributes]);
  
  const attributeSkills = useMemo(() => {
    return Object.values(config.skills).map(skillName => ({
      name: skillName,
      value: getSkillValue(skills, skillName, defaultSkills)
    }));
  }, [config.skills, skills, defaultSkills]);
  
  const skillPositions = useMemo(() => {
    const positionMap = {
      'Força': [classes.skillTopLeft, classes.skillTopCenter, classes.skillTopRight],
      'Agilidade': [classes.skillLeftTop, classes.skillLeftMiddle, classes.skillLeftBottom],
      'Inteligência': [classes.skillRightTop, classes.skillRightMiddle, classes.skillRightBottom],
      'Empatia': [classes.skillBottomLeft, classes.skillBottomCenter, classes.skillBottomRight]
    };
    return positionMap[attributeName] || [];
  }, [attributeName, classes]);
  
  const memoizedOnUpdate = useMemo(() => onUpdate, [onUpdate]);
  const memoizedOnAttributeRoll = useMemo(() => onAttributeRoll, [onAttributeRoll]);
  const memoizedOnSkillRoll = useMemo(() => onSkillRoll, [onSkillRoll]);
  
  const handleAttributeUpdate = useCallback((type, name, value) => {
    if (type === 'attribute' && name === attributeName) {
      if (memoizedOnUpdate) {
        memoizedOnUpdate(type, name, value);
      }
    }
  }, [memoizedOnUpdate, attributeName]);
  
  const handleAttributeRoll = useCallback((attributeNameParam, attributeValue) => {
    if (memoizedOnAttributeRoll) {
      memoizedOnAttributeRoll(attributeNameParam, attributeValue);
    }
  }, [memoizedOnAttributeRoll]);
  
  const handleSkillRoll = useCallback((skillName, skillValue) => {
    if (memoizedOnSkillRoll) {
      memoizedOnSkillRoll(skillName, skillValue);
    }
  }, [memoizedOnSkillRoll]);
  
  const skillUpdateHandlers = useMemo(() => {
    const handlers = {};
    
    attributeSkills.forEach(skill => {
      handlers[skill.name] = (type, name, value) => {
        if (type === 'skill' && name === skill.name) {
          if (memoizedOnUpdate) {
            const numValue = typeof value === 'number' ? value : parseInt(value);
            
            if (isNaN(numValue)) {
              return;
            }
            
            memoizedOnUpdate(type, name, numValue);
          }
        }
      };
    });
    
    return handlers;
  }, [attributeSkills, memoizedOnUpdate, attributeName]);
  
  const memoizedSkillComponents = useMemo(() => {
    return attributeSkills.map((skill, index) => {
      const skillUpdateHandler = skillUpdateHandlers[skill.name];
      
      return (
        <SkillComponent
          key={skill.name}
          classes={classes}
          skillName={skill.name}
          skillValue={skill.value}
          positionClass={skillPositions[index]}
          onUpdate={skillUpdateHandler}
          onSkillRoll={(skillNameParam, skillValueParam) => handleSkillRoll(skillNameParam, skillValueParam)}
        />
      );
    });
  }, [attributeSkills, classes, skillPositions, skillUpdateHandlers, handleSkillRoll]);

  return (
    <>
      <AttributeOctagon
        classes={classes}
        attributeName={attributeName}
        attributeValue={currentAttributeValue}
        positionClass={classes[config.positionClass]}
        onUpdate={handleAttributeUpdate}
        onAttributeRoll={(attributeNameParam, attributeValueParam) => handleAttributeRoll(attributeNameParam, attributeValueParam)}
      />

      {memoizedSkillComponents}
    </>
  );
};

// Função de comparação otimizada para AttributeWithSkills
const attributeWithSkillsPropsAreEqual = (prevProps, nextProps) => {
  const getAttributeValueLocal = (attrs, name, defaultAttrs) => {
    const validatedAttributes = attrs.length ? attrs : defaultAttrs;
    const attribute = validatedAttributes.find(a => a.name === name);
    const value = attribute?.year_zero_value || 0;
    return Math.max(0, Math.min(6, value));
  };
  
  const getSkillValueLocal = (skillsList, skillName, defaultSkillsList) => {
    const validatedSkills = skillsList.length ? skillsList : defaultSkillsList;
    const skill = validatedSkills.find(s => s.name === skillName);
    const value = skill?.year_zero_value || 0;
    return Math.max(0, Math.min(6, value));
  };
  
  const prevAttributeValue = getAttributeValueLocal(
    prevProps.attributes, 
    prevProps.attributeName, 
    prevProps.defaultAttributes
  );
  
  const nextAttributeValue = getAttributeValueLocal(
    nextProps.attributes, 
    nextProps.attributeName, 
    nextProps.defaultAttributes
  );
  
  const attributeValueChanged = prevAttributeValue !== nextAttributeValue;
  
  const skillNames = Object.values(prevProps.config.skills);
  let anySkillChanged = false;
  
  for (const skillName of skillNames) {
    const prevSkillValue = getSkillValueLocal(
      prevProps.skills, 
      skillName, 
      prevProps.defaultSkills
    );
    
    const nextSkillValue = getSkillValueLocal(
      nextProps.skills, 
      skillName, 
      nextProps.defaultSkills
    );
    
    if (prevSkillValue !== nextSkillValue) {
      anySkillChanged = true;
      break;
    }
  }
  
  const callbacksChanged = 
    prevProps.onUpdate !== nextProps.onUpdate ||
    prevProps.onAttributeRoll !== nextProps.onAttributeRoll ||
    prevProps.onSkillRoll !== nextProps.onSkillRoll;
  
  const shouldUpdate = attributeValueChanged || anySkillChanged || callbacksChanged;
  
  if (!shouldUpdate) {
    return true;
  }
  
  return false;
};

export const AttributeWithSkills = memo(AttributeWithSkillsComponent, attributeWithSkillsPropsAreEqual);

// Export default pra manter compatibilidade
export default {
  AttributeWithSkills,
  AttributeOctagon,
  SkillComponent,
  attributeComponentsStyles,
  attributeSkillMap,
  formatSkillDisplayName,
  getAttributeValue,
  getSkillValue,
  updateAttribute,
  updateSkill
};