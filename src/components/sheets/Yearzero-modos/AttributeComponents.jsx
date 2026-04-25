import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import { Casino } from '@mui/icons-material';
import { attributeComponentsStyles } from './design/AttributeDesignStyles.jsx';

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

const startNewSession = (fieldId, currentValue, direction) => {
  const now = Date.now();
  if (globalClickSession.timeoutId) clearTimeout(globalClickSession.timeoutId);
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

const continueSession = (fieldId, direction) => {
  if (globalClickSession.fieldId !== fieldId) return false;
  const now = Date.now();
  const interval = now - globalClickSession.lastClickTime;
  globalClickSession.clickIntervals.push(interval);
  if (globalClickSession.clickIntervals.length > 4) globalClickSession.clickIntervals.shift();
  globalClickSession.accumulated += direction;
  globalClickSession.lastClickTime = now;
  return true;
};

const calculateAdaptiveThreshold = () => {
  if (globalClickSession.clickIntervals.length === 0) return 400;
  const sum = globalClickSession.clickIntervals.reduce((a, b) => a + b, 0);
  const avg = sum / globalClickSession.clickIntervals.length;
  return Math.max(300, Math.min(800, avg * 2.5));
};

const processArrowClick = (fieldId, currentValue, direction, onSaveCallback) => {
  const now = Date.now();
  const isNewSession = !globalClickSession.active ||
    (now - globalClickSession.lastClickTime > 500) ||
    globalClickSession.fieldId !== fieldId;

  if (isNewSession) {
    startNewSession(fieldId, currentValue, direction);
  } else if (!continueSession(fieldId, direction)) {
    startNewSession(fieldId, currentValue, direction);
  }

  const finalValue = Math.min(6, Math.max(0, globalClickSession.startValue + globalClickSession.accumulated));

  if (globalClickSession.timeoutId) clearTimeout(globalClickSession.timeoutId);
  const threshold = calculateAdaptiveThreshold();
  globalClickSession.timeoutId = setTimeout(() => {
    if (globalClickSession.active && globalClickSession.accumulated !== 0) {
      onSaveCallback(finalValue);
      resetGlobalSession();
    }
  }, threshold);

  return finalValue;
};

// ============================================================================
// FUNÇÕES AUXILIARES UNIFICADAS
// ============================================================================
const getValue = (items, name, defaultValue = 0, valueKey = 'year_zero_value') => {
  const validated = items && items.length ? items : [];
  const item = validated.find(i => i.name === name);
  const val = item?.[valueKey] ?? defaultValue;
  return Math.min(6, Math.max(0, val));
};

const updateValue = (type, name, value, onUpdate) => {
  const numValue = Math.min(6, Math.max(0, parseInt(value) || 0));
  if (onUpdate) onUpdate(type, name, numValue);
  return numValue;
};

// Mantém compatibilidade com exportações existentes
export const getAttributeValue = (attributes, attributeName, defaultAttributes = []) =>
  getValue(attributes, attributeName, 0);
export const getSkillValue = (skills, skillName, defaultSkills = []) =>
  getValue(skills, skillName, 0);
export const updateAttribute = (attributeName, value, onUpdate) =>
  updateValue('attribute', attributeName, value, onUpdate);
export const updateSkill = (skillName, value, onUpdate) =>
  updateValue('skill', skillName, value, onUpdate);

// Formatação de nomes de skills
export const formatSkillDisplayName = (skillName) => {
  const nameMap = {
    'COMBATE CORPO A CORPO': 'CORPO A\nCORPO',
    'MAQUINÁRIO PESADO': 'MAQUINÁRIO\nPESADO',
    'COMBATE À DISTÂNCIA': 'COMBATE\nÀ DISTÂNCIA',
    'AJUDA MÉDICA': 'AJUDA MÉDICA'
  };
  return nameMap[skillName] || skillName;
};

// Mapeamento atributo -> skills
export const attributeSkillMap = {
  Força: {
    positionClass: 'positionTop',
    skills: { 0: 'COMBATE CORPO A CORPO', 1: 'MAQUINÁRIO PESADO', 2: 'RESISTÊNCIA' }
  },
  Agilidade: {
    positionClass: 'positionLeft',
    skills: { 0: 'COMBATE À DISTÂNCIA', 1: 'MOBILIDADE', 2: 'PILOTAGEM' }
  },
  Inteligência: {
    positionClass: 'positionRight',
    skills: { 0: 'OBSERVAÇÃO', 1: 'SOBREVIVÊNCIA', 2: 'TECNOLOGIA' }
  },
  Empatia: {
    positionClass: 'positionBottom',
    skills: { 0: 'MANIPULAÇÃO', 1: 'COMANDO', 2: 'AJUDA MÉDICA' }
  }
};

// Gerador de IDs estável
let nextId = 0;
const generateId = (prefix) => `${prefix}_${++nextId}`;

// Componente de atributo
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
  const componentId = useRef(generateId(`attr_${attributeName}`));

  useEffect(() => {
    setLocalValue(attributeValue);
  }, [attributeValue]);

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
          if (onUpdate) onUpdate('attribute', attributeName, finalValueResult);
        }
      );
      setLocalValue(finalValue);
    }
  }, [attributeName, localValue, onUpdate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = processArrowClick(
        componentId.current,
        localValue,
        1,
        (finalValue) => {
          setLocalValue(finalValue);
          if (onUpdate) onUpdate('attribute', attributeName, finalValue);
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
          if (onUpdate) onUpdate('attribute', attributeName, finalValue);
        }
      );
      setLocalValue(newValue);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onAttributeRoll) onAttributeRoll(attributeName, localValue);
    }
  }, [attributeName, localValue, onUpdate, onAttributeRoll]);

  const handleDiceClick = useCallback(() => {
    if (globalClickSession.active && globalClickSession.fieldId === componentId.current) {
      const finalValue = Math.min(6, Math.max(0, globalClickSession.startValue + globalClickSession.accumulated));
      setLocalValue(finalValue);
      if (onUpdate) onUpdate('attribute', attributeName, finalValue);
      resetGlobalSession();
    }
    if (onAttributeRoll) onAttributeRoll(attributeName, localValue);
  }, [attributeName, localValue, onUpdate, onAttributeRoll]);

  const handleFocus = useCallback((e) => {
    e.target.select();
  }, []);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
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
                inputProps={{ min: 0, max: 6, style: { cursor: 'text', caretColor: 'auto' } }}
                className={classes.attributeInput}
                size="small"
                inputRef={inputRef}
              />
              <IconButton className={classes.attributeDiceButton} onClick={handleDiceClick} size="small">
                <Casino />
              </IconButton>
            </Box>
            <Typography className={classes.attributeNameBox}>{attributeName}</Typography>
          </Box>
        </div>
      </Box>
    </Box>
  );
};

const attributeOctagonPropsAreEqual = (prev, next) =>
  prev.attributeValue === next.attributeValue &&
  prev.onUpdate === next.onUpdate &&
  prev.onAttributeRoll === next.onAttributeRoll;

export const AttributeOctagon = memo(AttributeOctagonComponent, attributeOctagonPropsAreEqual);

// Componente de skill
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
  const componentId = useRef(generateId(`skill_${skillName}`));

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
          if (onUpdate) onUpdate('skill', skillName, finalValueResult);
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
          if (onUpdate) onUpdate('skill', skillName, finalValue);
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
          if (onUpdate) onUpdate('skill', skillName, finalValue);
        }
      );
      setLocalValue(newValue);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onSkillRoll) onSkillRoll(skillName, localValue);
    }
  }, [skillName, localValue, onUpdate, onSkillRoll]);

  const handleDiceClick = useCallback(() => {
    if (globalClickSession.active && globalClickSession.fieldId === componentId.current) {
      const finalValue = Math.min(6, Math.max(0, globalClickSession.startValue + globalClickSession.accumulated));
      setLocalValue(finalValue);
      if (onUpdate) onUpdate('skill', skillName, finalValue);
      resetGlobalSession();
    }
    if (onSkillRoll) onSkillRoll(skillName, localValue);
  }, [skillName, localValue, onUpdate, onSkillRoll]);

  const handleFocus = useCallback((e) => {
    e.target.select();
  }, []);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
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
                inputProps={{ min: 0, max: 6, style: { cursor: 'text', caretColor: 'auto' } }}
                className={classes.skillInput}
                size="small"
                inputRef={inputRef}
              />
              <IconButton className={classes.skillDiceButton} onClick={handleDiceClick} size="small">
                <Casino fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </div>
      </Box>
      <Typography className={classes.skillNameBox}>{formatSkillDisplayName(skillName)}</Typography>
    </Box>
  );
};

const skillComponentPropsAreEqual = (prev, next) =>
  prev.skillValue === next.skillValue &&
  prev.onUpdate === next.onUpdate &&
  prev.onSkillRoll === next.onSkillRoll;

export const SkillComponent = memo(SkillComponentInternal, skillComponentPropsAreEqual);

// Componente agregador de atributo e suas skills
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
  const currentAttributeValue = useMemo(
    () => getAttributeValue(attributes, attributeName, defaultAttributes),
    [attributes, attributeName, defaultAttributes]
  );

  const attributeSkills = useMemo(
    () => Object.values(config.skills).map(skillName => ({
      name: skillName,
      value: getSkillValue(skills, skillName, defaultSkills)
    })),
    [config.skills, skills, defaultSkills]
  );

  const skillPositions = useMemo(() => {
    const positionMap = {
      Força: [classes.skillTopLeft, classes.skillTopCenter, classes.skillTopRight],
      Agilidade: [classes.skillLeftTop, classes.skillLeftMiddle, classes.skillLeftBottom],
      Inteligência: [classes.skillRightTop, classes.skillRightMiddle, classes.skillRightBottom],
      Empatia: [classes.skillBottomLeft, classes.skillBottomCenter, classes.skillBottomRight]
    };
    return positionMap[attributeName] || [];
  }, [attributeName, classes]);

  const handleAttributeUpdate = useCallback((type, name, value) => {
    if (onUpdate) onUpdate(type, name, value);
  }, [onUpdate]);

  const handleAttributeRoll = useCallback((name, value) => {
    if (onAttributeRoll) onAttributeRoll(name, value);
  }, [onAttributeRoll]);

  const handleSkillRoll = useCallback((name, value) => {
    if (onSkillRoll) onSkillRoll(name, value);
  }, [onSkillRoll]);

  const memoizedSkills = useMemo(
    () => attributeSkills.map((skill, idx) => (
      <SkillComponent
        key={skill.name}
        classes={classes}
        skillName={skill.name}
        skillValue={skill.value}
        positionClass={skillPositions[idx]}
        onUpdate={handleAttributeUpdate}
        onSkillRoll={handleSkillRoll}
      />
    )),
    [attributeSkills, classes, skillPositions, handleAttributeUpdate, handleSkillRoll]
  );

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
      {memoizedSkills}
    </>
  );
};

const attributeWithSkillsPropsAreEqual = (prev, next) => {
  const getAttr = (attrs, name, def) => getAttributeValue(attrs, name, def);
  const getSk = (skillsList, name, def) => getSkillValue(skillsList, name, def);

  const attrChanged = getAttr(prev.attributes, prev.attributeName, prev.defaultAttributes) !==
                      getAttr(next.attributes, next.attributeName, next.defaultAttributes);

  let skillChanged = false;
  for (const skillName of Object.values(prev.config.skills)) {
    if (getSk(prev.skills, skillName, prev.defaultSkills) !==
        getSk(next.skills, skillName, next.defaultSkills)) {
      skillChanged = true;
      break;
    }
  }

  const callbacksChanged = prev.onUpdate !== next.onUpdate ||
                           prev.onAttributeRoll !== next.onAttributeRoll ||
                           prev.onSkillRoll !== next.onSkillRoll;

  return !(attrChanged || skillChanged || callbacksChanged);
};

export const AttributeWithSkills = memo(AttributeWithSkillsComponent, attributeWithSkillsPropsAreEqual);

export default {
  AttributeWithSkills,
  AttributeOctagon,
  SkillComponent,
  attributeSkillMap,
  formatSkillDisplayName,
  getAttributeValue,
  getSkillValue,
  updateAttribute,
  updateSkill
};