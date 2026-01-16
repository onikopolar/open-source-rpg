import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import { Casino } from '@mui/icons-material';

// Versão 3.1.2 - FIX: Removido bloqueio de digitação manual
console.log('[AttributeComponents] Versão 3.1.2 - FIX: Digitação manual liberada');

// Gerenciador global de sessão de cliques
let globalClickSession = {
  active: false,
  fieldId: null,
  startValue: 0,
  accumulated: 0,
  lastClickTime: 0,
  clickIntervals: [],
  timeoutId: null
};

// Reset da sessão global
const resetGlobalSession = () => {
  if (globalClickSession.timeoutId) {
    clearTimeout(globalClickSession.timeoutId);
  }
  globalClickSession = {
    active: false,
    fieldId: null,
    startValue: 0,
    accumulated: 0,
    lastClickTime: 0,
    clickIntervals: [],
    timeoutId: null
  };
};

// Inicia nova sessão
const startNewSession = (fieldId, currentValue, direction) => {
  const now = Date.now();
  
  if (globalClickSession.timeoutId) {
    clearTimeout(globalClickSession.timeoutId);
  }
  
  globalClickSession = {
    active: true,
    fieldId: fieldId,
    startValue: currentValue,
    accumulated: direction,
    lastClickTime: now,
    clickIntervals: [],
    timeoutId: null
  };
};

// Continua sessão existente
const continueSession = (fieldId, direction) => {
  const now = Date.now();
  
  if (globalClickSession.fieldId !== fieldId) {
    return false;
  }
  
  const interval = now - globalClickSession.lastClickTime;
  globalClickSession.clickIntervals.push(interval);
  globalClickSession.accumulated += direction;
  globalClickSession.lastClickTime = now;
  
  if (globalClickSession.clickIntervals.length > 4) {
    globalClickSession.clickIntervals.shift();
  }
  
  return true;
};

// Calcula threshold adaptativo baseado no padrão do usuário
const calculateAdaptiveThreshold = () => {
  if (globalClickSession.clickIntervals.length === 0) {
    return 400;
  }
  
  const sum = globalClickSession.clickIntervals.reduce((a, b) => a + b, 0);
  const average = sum / globalClickSession.clickIntervals.length;
  
  return Math.max(300, Math.min(800, average * 2.5));
};

// Processa clique na seta nativa
const processArrowClick = (fieldId, currentValue, direction, onSaveCallback) => {
  const now = Date.now();
  const isNewSession = !globalClickSession.active || 
                      (now - globalClickSession.lastClickTime > 500) ||
                      globalClickSession.fieldId !== fieldId;
  
  if (isNewSession) {
    startNewSession(fieldId, currentValue, direction);
  } else {
    const continued = continueSession(fieldId, direction);
    if (!continued) {
      startNewSession(fieldId, currentValue, direction);
    }
  }
  
  const finalValue = Math.max(0, Math.min(6, 
    globalClickSession.startValue + globalClickSession.accumulated
  ));
  
  if (globalClickSession.timeoutId) {
    clearTimeout(globalClickSession.timeoutId);
  }
  
  const threshold = calculateAdaptiveThreshold();
  
  globalClickSession.timeoutId = setTimeout(() => {
    if (globalClickSession.active && globalClickSession.accumulated !== 0) {
      onSaveCallback(finalValue);
      resetGlobalSession();
    }
  }, threshold);
  
  return finalValue;
};

// Formato nomes de skills com quebras de linha
export const formatSkillDisplayName = (skillName) => {
  const nameMap = {
    'COMBATE CORPO A CORPO': 'CORPO A\nCORPO',
    'MAQUINÁRIO PESADO': 'MAQUINÁRIO\nPESADO', 
    'COMBATE À DISTÂNCIA': 'COMBATE\nÀ DISTÂNCIA',
    'AJUDA MÉDICA': 'AJUDA MÉDICA'
  };
  return nameMap[skillName] || skillName;
};

// Pega valor de atributo com validação de limites
export const getAttributeValue = (attributes, attributeName, defaultAttributes = []) => {
  const validatedAttributes = attributes.length ? attributes : defaultAttributes;
  const attribute = validatedAttributes.find(a => a.name === attributeName);
  const value = attribute?.year_zero_value || 0;
  return Math.max(0, Math.min(6, value));
};

// Pega valor de skill com validação de limites
export const getSkillValue = (skills, skillName, defaultSkills = []) => {
  const validatedSkills = skills.length ? skills : defaultSkills;
  const skill = validatedSkills.find(s => s.name === skillName);
  const value = skill?.year_zero_value || 0;
  return Math.max(0, Math.min(6, value));
};

// Atualiza atributo
export const updateAttribute = (attributeName, value, onUpdate) => {
  const numValue = Math.max(0, Math.min(6, parseInt(value) || 0));
  
  if (onUpdate) {
    onUpdate('attribute', attributeName, numValue);
  }
  
  return numValue;
};

// Atualiza skill
export const updateSkill = (skillName, value, onUpdate) => {
  const numValue = Math.max(0, Math.min(6, parseInt(value) || 0));
  
  if (onUpdate) {
    onUpdate('skill', skillName, numValue);
  }
  
  return numValue;
};

// Mapeia atributos para suas skills correspondentes
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

// Estilos dos componentes
export const attributeComponentsStyles = (theme) => ({
  attributePosition: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    width: '110px',
    height: '110px'
  },
  positionTop: {
    top: '5px',
    left: '50%',
    transform: 'translateX(-50%)'
  },
  positionLeft: {
    top: '50%',
    left: '5px',
    transform: 'translateY(-50%)'
  },
  positionRight: {
    top: '50%',
    right: '5px',
    transform: 'translateY(-50%)'
  },
  positionBottom: {
    bottom: '5px',
    left: '50%',
    transform: 'translateX(-50%)'
  },
  attributeOctagonContainer: {
    position: 'relative',
    width: '100px',
    height: '100px',
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
    fontWeight: '900',
    width: '90px',
    height: '90px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 2,
    border: '2px solid #ff6b35',
    backdropFilter: 'blur(5px)'
  },
  attributeOctagonContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    width: '100%',
    padding: '8px'
  },
  attributeNameBox: {
    background: '#ff6b35',
    color: '#fff',
    padding: '3px 10px',
    borderRadius: '3px',
    fontSize: '0.7rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '4px',
    whiteSpace: 'nowrap',
    border: '2px solid #fff',
    filter: 'brightness(1.1)',
    textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
  },
  attributeInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    justifyContent: 'center'
  },
  attributeInput: {
    width: '50px',
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '4px',
      '& fieldset': {
        borderColor: '#ff6b35',
        borderWidth: '2px'
      },
      '&:hover fieldset': {
        borderColor: '#ff6b35',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#ff6b35',
        borderWidth: '2px'
      }
    },
    '& input': {
      color: '#ff6b35',
      fontWeight: '900',
      fontSize: '1.2rem',
      textAlign: 'center',
      padding: '6px 4px',
      height: '28px',
      fontFamily: '"Roboto", "Arial", sans-serif',
      cursor: 'text',
      caretColor: 'auto',
      userSelect: 'auto',
      MozAppearance: 'textfield',
      '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
        WebkitAppearance: 'auto',
        margin: 0
      }
    }
  },
  attributeDiceButton: {
    padding: '6px',
    minWidth: 'auto',
    color: '#ff6b35',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid #ff6b35',
    borderRadius: '4px',
    '& .MuiSvgIcon-root': {
      fontSize: '16px',
      fontWeight: 'bold'
    },
    '&:hover': {
      backgroundColor: '#ff6b35',
      color: '#fff'
    }
  },
  skillOctagonContainer: {
    position: 'relative',
    width: '90px',
    height: '90px',
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
    fontWeight: '800',
    width: '82px',
    height: '82px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    zIndex: 2,
    border: '2px solid #1976d2',
    backdropFilter: 'blur(5px)'
  },
  skillOctagonContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '100%',
    padding: '8px'
  },
  skillNameBox: {
    background: '#1976d2',
    color: '#fff',
    padding: '5px 10px',
    borderRadius: '3px',
    fontSize: '0.7rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'pre-line',
    textAlign: 'center',
    lineHeight: '1.3',
    border: '2px solid #fff',
    minWidth: '85px',
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    wordWrap: 'break-word',
    filter: 'brightness(1.1)',
    textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
  },
  skillInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    justifyContent: 'center',
    marginBottom: '3px'
  },
  skillInput: {
    width: '45px',
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '4px',
      '& fieldset': {
        borderColor: '#1976d2',
        borderWidth: '2px'
      },
      '&:hover fieldset': {
        borderColor: '#1976d2',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1976d2',
        borderWidth: '2px'
      }
    },
    '& input': {
      color: '#1976d2',
      fontWeight: '800',
      fontSize: '1.2rem',
      textAlign: 'center',
      padding: '6px 4px',
      height: '28px',
      fontFamily: '"Roboto", "Arial", sans-serif',
      cursor: 'text',
      caretColor: 'auto',
      userSelect: 'auto',
      MozAppearance: 'textfield',
      '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
        WebkitAppearance: 'auto',
        margin: 0
      }
    }
  },
  skillDiceButton: {
    padding: '6px',
    minWidth: 'auto',
    color: '#1976d2',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid #1976d2',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#1976d2',
      color: '#fff'
    },
    '& .MuiSvgIcon-root': {
      fontSize: '16px',
      fontWeight: 'bold'
    }
  },
  skillGroup: {
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 20
  },
  skillTopLeft: {
    top: '-45px',
    left: '-25px',
    flexDirection: 'row'
  },
  skillTopCenter: {
    top: '-125px',
    left: '50%',
    transform: 'translateX(-50%)',
    flexDirection: 'column'
  },
  skillTopRight: {
    top: '-45px',
    right: '-37px',
    flexDirection: 'row-reverse'
  },
  skillLeftTop: {
    top: '55px',
    left: '-95px',
    flexDirection: 'row'
  },
  skillLeftMiddle: {
    top: '50%',
    left: '-180px',
    transform: 'translateY(-50%)',
    flexDirection: 'row'
  },
  skillLeftBottom: {
    bottom: '55px',
    left: '-95px',
    flexDirection: 'row'
  },
  skillRightTop: {
    top: '55px',
    right: '-95px',
    flexDirection: 'row-reverse'
  },
  skillRightMiddle: {
    top: '50%',
    right: '-200px',
    transform: 'translateY(-50%)',
    flexDirection: 'row-reverse'
  },
  skillRightBottom: {
    bottom: '55px',
    right: '-95px',
    flexDirection: 'row-reverse'
  },
  skillBottomLeft: {
    bottom: '-45px',
    left: '-35px',
    flexDirection: 'row'
  },
  skillBottomCenter: {
    bottom: '-110px',
    left: '50%',
    transform: 'translateX(-50%)',
    flexDirection: 'column-reverse'
  },
  skillBottomRight: {
    bottom: '-45px',
    right: '-35px',
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
  const componentId = useRef(`attr_${attributeName}_${Math.random().toString(36).substr(2, 9)}`);

  // Sincroniza com valor externo
  useEffect(() => {
    setLocalValue(attributeValue);
  }, [attributeValue]);

  // Handler para mudanças no input (setas nativas e digitação)
  const handleInputChange = useCallback((e) => {
    const newValue = parseInt(e.target.value);
    
    if (!isNaN(newValue)) {
      const direction = newValue > localValue ? 1 : -1;
      const absoluteDirection = Math.abs(newValue - localValue);
      
      const finalValue = processArrowClick(
        componentId.current,
        localValue,
        direction * absoluteDirection,
        (finalValueResult) => {
          setLocalValue(finalValueResult);
          if (onUpdate) {
            onUpdate('attribute', attributeName, finalValueResult);
          }
        }
      );
      
      setLocalValue(finalValue);
    }
  }, [attributeName, localValue, onUpdate]);

  // Handler para teclado
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = processArrowClick(
        componentId.current,
        localValue,
        1,
        (finalValue) => {
          setLocalValue(finalValue);
          if (onUpdate) {
            onUpdate('attribute', attributeName, finalValue);
          }
        }
      );
      setLocalValue(newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = processArrowClick(
        componentId.current,
        localValue,
        -1,
        (finalValue) => {
          setLocalValue(finalValue);
          if (onUpdate) {
            onUpdate('attribute', attributeName, finalValue);
          }
        }
      );
      setLocalValue(newValue);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onAttributeRoll) {
        onAttributeRoll(attributeName, localValue);
      }
    }
    // REMOVIDO: Bloqueio de digitação manual
  }, [attributeName, localValue, onUpdate, onAttributeRoll]);

  // Handler para clique no dado
  const handleDiceClick = useCallback(() => {
    if (globalClickSession.active && globalClickSession.fieldId === componentId.current) {
      const finalValue = Math.max(0, Math.min(6, 
        globalClickSession.startValue + globalClickSession.accumulated
      ));
      setLocalValue(finalValue);
      if (onUpdate) {
        onUpdate('attribute', attributeName, finalValue);
      }
      resetGlobalSession();
    }
    
    if (onAttributeRoll) {
      onAttributeRoll(attributeName, localValue);
    }
  }, [attributeName, localValue, onUpdate, onAttributeRoll]);

  // Handler para foco
  const handleFocus = useCallback((e) => {
    e.target.select();
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
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
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                inputProps={{ 
                  min: 0, 
                  max: 6,
                  style: { 
                    cursor: 'text',
                    caretColor: 'auto'
                  }
                }}
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

const attributeOctagonPropsAreEqual = (prevProps, nextProps) => {
  return prevProps.attributeValue === nextProps.attributeValue &&
         prevProps.onUpdate === nextProps.onUpdate &&
         prevProps.onAttributeRoll === nextProps.onAttributeRoll;
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
  const componentId = useRef(`skill_${skillName}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    setLocalValue(skillValue);
  }, [skillValue]);

  const handleInputChange = useCallback((e) => {
    const newValue = parseInt(e.target.value);
    
    if (!isNaN(newValue)) {
      const direction = newValue > localValue ? 1 : -1;
      const absoluteDirection = Math.abs(newValue - localValue);
      
      const finalValue = processArrowClick(
        componentId.current,
        localValue,
        direction * absoluteDirection,
        (finalValueResult) => {
          setLocalValue(finalValueResult);
          if (onUpdate) {
            onUpdate('skill', skillName, finalValueResult);
          }
        }
      );
      
      setLocalValue(finalValue);
    }
  }, [skillName, localValue, onUpdate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = processArrowClick(
        componentId.current,
        localValue,
        1,
        (finalValue) => {
          setLocalValue(finalValue);
          if (onUpdate) {
            onUpdate('skill', skillName, finalValue);
          }
        }
      );
      setLocalValue(newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = processArrowClick(
        componentId.current,
        localValue,
        -1,
        (finalValue) => {
          setLocalValue(finalValue);
          if (onUpdate) {
            onUpdate('skill', skillName, finalValue);
          }
        }
      );
      setLocalValue(newValue);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onSkillRoll) {
        onSkillRoll(skillName, localValue);
      }
    }
    // REMOVIDO: Bloqueio de digitação manual
  }, [skillName, localValue, onUpdate, onSkillRoll]);

  const handleDiceClick = useCallback(() => {
    if (globalClickSession.active && globalClickSession.fieldId === componentId.current) {
      const finalValue = Math.max(0, Math.min(6, 
        globalClickSession.startValue + globalClickSession.accumulated
      ));
      setLocalValue(finalValue);
      if (onUpdate) {
        onUpdate('skill', skillName, finalValue);
      }
      resetGlobalSession();
    }
    
    if (onSkillRoll) {
      onSkillRoll(skillName, localValue);
    }
  }, [skillName, localValue, onUpdate, onSkillRoll]);

  const handleFocus = useCallback((e) => {
    e.target.select();
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
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
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                inputProps={{ 
                  min: 0, 
                  max: 6,
                  style: { 
                    cursor: 'text',
                    caretColor: 'auto'
                  }
                }}
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

const skillComponentPropsAreEqual = (prevProps, nextProps) => {
  return prevProps.skillValue === nextProps.skillValue &&
         prevProps.onUpdate === nextProps.onUpdate &&
         prevProps.onSkillRoll === nextProps.onSkillRoll;
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
  
  const handleAttributeUpdate = useCallback((type, name, value) => {
    if (onUpdate) {
      onUpdate(type, name, value);
    }
  }, [onUpdate]);
  
  const handleAttributeRoll = useCallback((attributeNameParam, attributeValue) => {
    if (onAttributeRoll) {
      onAttributeRoll(attributeNameParam, attributeValue);
    }
  }, [onAttributeRoll]);
  
  const handleSkillRoll = useCallback((skillName, skillValue) => {
    if (onSkillRoll) {
      onSkillRoll(skillName, skillValue);
    }
  }, [onSkillRoll]);
  
  const memoizedSkillComponents = useMemo(() => {
    return attributeSkills.map((skill, index) => (
      <SkillComponent
        key={skill.name}
        classes={classes}
        skillName={skill.name}
        skillValue={skill.value}
        positionClass={skillPositions[index]}
        onUpdate={handleAttributeUpdate}
        onSkillRoll={handleSkillRoll}
      />
    ));
  }, [attributeSkills, classes, skillPositions, handleAttributeUpdate, handleSkillRoll]);

  return (
    <>
      <AttributeOctagon
        classes={classes}
        attributeName={attributeName}
        attributeValue={currentAttributeValue}
        positionClass={classes[config.positionClass]}
        onUpdate={handleAttributeUpdate}
        onAttributeRoll={handleAttributeRoll}
      />

      {memoizedSkillComponents}
    </>
  );
};

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
  
  return !shouldUpdate;
};

export const AttributeWithSkills = memo(AttributeWithSkillsComponent, attributeWithSkillsPropsAreEqual);

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