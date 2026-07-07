import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  useMemo
} from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import { Casino } from '@mui/icons-material';
import { attributeComponentsStyles } from './design/AttributeDesignStyles.jsx';

// ============================================================================
// HOOKS AUXILIARES
// ============================================================================

/**
 * Gera um ID estável por instância do componente.
 * Usa useId (React 18+) quando disponível, caso contrário gera um ID aleatório.
 */
const useComponentId = () => {
  const fallbackRef = useRef(null);
  if (typeof React.useId === 'function') {
    return React.useId();
  }
  if (!fallbackRef.current) {
    fallbackRef.current =
      'id_' + Math.random().toString(36).slice(2, 11);
  }
  return fallbackRef.current;
};


const useAccumulatingField = (initialValue, onCommit, onRoll) => {
  const [localValue, setLocalValue] = useState(initialValue);
  const fieldId = useComponentId();

  // Sessão de cliques mantida em refs (não causa re-render)
  const sessionRef = useRef({
    active: false,
    startValue: 0,
    accumulated: 0,
    lastClickTime: 0,
    clickIntervals: [] // últimos intervalos em ms
  });
  const timeoutRef = useRef(null);
  // Callbacks mais recentes
  const onCommitRef = useRef(onCommit);
  const onRollRef = useRef(onRoll);
  onCommitRef.current = onCommit;
  onRollRef.current = onRoll;

  // Sincroniza valor interno com prop externa quando ela muda
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // Limpa timeout e reseta sessão ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const resetSession = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    sessionRef.current = {
      active: false,
      startValue: 0,
      accumulated: 0,
      lastClickTime: 0,
      clickIntervals: []
    };
  }, []);

  const commitValue = useCallback((value) => {
    const clamped = Math.min(6, Math.max(0, value));
    setLocalValue(clamped);
    if (onCommitRef.current) {
      onCommitRef.current(clamped);
    }
    return clamped;
  }, []);

  const startSession = useCallback((direction) => {
    const now = Date.now();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    sessionRef.current = {
      active: true,
      startValue: localValue,
      accumulated: direction,
      lastClickTime: now,
      clickIntervals: []
    };
    timeoutRef.current = null;
  }, [localValue]);

  const continueSession = useCallback((direction) => {
    const s = sessionRef.current;
    const now = Date.now();
    const interval = now - s.lastClickTime;
    s.clickIntervals.push(interval);
    if (s.clickIntervals.length > 4) s.clickIntervals.shift();
    s.accumulated += direction;
    s.lastClickTime = now;
  }, []);

  const calculateThreshold = useCallback(() => {
    const intervals = sessionRef.current.clickIntervals;
    if (intervals.length === 0) return 400;
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.max(300, Math.min(800, avg * 2.5));
  }, []);

  const scheduleCommit = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const threshold = calculateThreshold();
    const session = sessionRef.current;
    timeoutRef.current = setTimeout(() => {
      if (session.active && session.accumulated !== 0) {
        const finalValue = session.startValue + session.accumulated;
        commitValue(finalValue);
        resetSession();
      }
    }, threshold);
  }, [calculateThreshold, commitValue, resetSession]);

  // Processa clique de seta (incremento/decremento unitário)
  const processArrowClick = useCallback((direction) => {
    const s = sessionRef.current;
    const now = Date.now();
    const isNewSession =
      !s.active ||
      now - s.lastClickTime > 500 ||
      s.fieldId !== fieldId; // fieldId check implícito por termos um hook por campo

    if (isNewSession) {
      startSession(direction);
    } else {
      continueSession(direction);
    }

    const newValue = sessionRef.current.startValue + sessionRef.current.accumulated;
    const displayValue = Math.min(6, Math.max(0, newValue));
    setLocalValue(displayValue);

    scheduleCommit();
    return displayValue;
  }, [fieldId, startSession, continueSession, scheduleCommit]);

  // Tratamento de digitação direta – persiste imediatamente
  const handleInputChange = useCallback((e) => {
    const raw = e.target.value;
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      resetSession();
      commitValue(parsed);
    } else if (raw === '' || raw === '-') {
      // Permite campo vazio momentaneamente, mas persiste 0 ao sair
      setLocalValue(0); // opcional: pode manter string vazia e commitar 0 no blur
    }
  }, [resetSession, commitValue]);

  // Teclas: setas e Enter
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      processArrowClick(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      processArrowClick(-1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Rolagem sem alterar valor (mas commita pendências se houver)
      if (sessionRef.current.active && sessionRef.current.accumulated !== 0) {
        const finalValue = sessionRef.current.startValue + sessionRef.current.accumulated;
        commitValue(finalValue);
        resetSession();
      }
      if (onRollRef.current) {
        onRollRef.current(localValue);
      }
    }
  }, [processArrowClick, commitValue, resetSession, localValue]);

  // Clique no dado: commita sessão pendente (para usar o valor mais recente) e rola
  const handleDiceClick = useCallback(() => {
    if (sessionRef.current.active && sessionRef.current.accumulated !== 0) {
      const finalValue = sessionRef.current.startValue + sessionRef.current.accumulated;
      const committed = commitValue(finalValue);
      resetSession();
      if (onRollRef.current) onRollRef.current(committed);
    } else {
      if (onRollRef.current) onRollRef.current(localValue);
    }
  }, [commitValue, resetSession, localValue]);

  // Ao perder o foco, commita qualquer sessão pendente imediatamente
  const handleBlur = useCallback(() => {
    if (sessionRef.current.active && sessionRef.current.accumulated !== 0) {
      const finalValue = sessionRef.current.startValue + sessionRef.current.accumulated;
      commitValue(finalValue);
      resetSession();
    }
  }, [commitValue, resetSession]);

  return {
    localValue,
    handleInputChange,
    handleKeyDown,
    handleDiceClick,
    handleBlur,
    fieldId
  };
};

// ============================================================================
// FUNÇÕES AUXILIARES UNIFICADAS
// ============================================================================
export const getAttributeValue = (attributes, attributeName, defaultAttributes = []) => {
  const items = attributes && attributes.length ? attributes : defaultAttributes;
  const item = items.find(i => i.name === attributeName);
  const val = item?.year_zero_value ?? 0;
  return Math.min(6, Math.max(0, val));
};

export const getSkillValue = (skills, skillName, defaultSkills = []) => {
  const items = skills && skills.length ? skills : defaultSkills;
  const item = items.find(i => i.name === skillName);
  const val = item?.year_zero_value ?? 0;
  return Math.min(6, Math.max(0, val));
};

export const updateAttribute = (attributeName, value, onUpdate) => {
  const numValue = Math.min(6, Math.max(0, parseInt(value, 10) || 0));
  if (onUpdate) onUpdate('attribute', attributeName, numValue);
  return numValue;
};

export const updateSkill = (skillName, value, onUpdate) => {
  const numValue = Math.min(6, Math.max(0, parseInt(value, 10) || 0));
  if (onUpdate) onUpdate('skill', skillName, numValue);
  return numValue;
};

export const formatSkillDisplayName = (skillName) => {
  const nameMap = {
    'COMBATE CORPO A CORPO': 'CORPO A\nCORPO',
    'MAQUINÁRIO PESADO': 'MAQUINÁRIO\nPESADO',
    'COMBATE À DISTÂNCIA': 'COMBATE\nÀ DISTÂNCIA',
    'AJUDA MÉDICA': 'AJUDA MÉDICA'
  };
  return nameMap[skillName] || skillName;
};

export const attributeSkillMap = {
  Força: {
    positionClass: 'positionTop',
    skills: {
      0: 'COMBATE CORPO A CORPO',
      1: 'MAQUINÁRIO PESADO',
      2: 'RESISTÊNCIA'
    }
  },
  Agilidade: {
    positionClass: 'positionLeft',
    skills: {
      0: 'COMBATE À DISTÂNCIA',
      1: 'MOBILIDADE',
      2: 'PILOTAGEM'
    }
  },
  Inteligência: {
    positionClass: 'positionRight',
    skills: {
      0: 'OBSERVAÇÃO',
      1: 'SOBREVIVÊNCIA',
      2: 'TECNOLOGIA'
    }
  },
  Empatia: {
    positionClass: 'positionBottom',
    skills: {
      0: 'MANIPULAÇÃO',
      1: 'COMANDO',
      2: 'AJUDA MÉDICA'
    }
  }
};

// COMPONENTE DE ATRIBUTO

const AttributeOctagonComponent = ({
  classes,
  attributeName,
  attributeValue,
  positionClass,
  onUpdate,
  onAttributeRoll
}) => {
  const handleCommit = useCallback(
    (value) => {
      if (onUpdate) onUpdate('attribute', attributeName, value);
    },
    [attributeName, onUpdate]
  );

  const handleRoll = useCallback(
    () => {
      if (onAttributeRoll) onAttributeRoll(attributeName, attributeValue);
    },
    [attributeName, attributeValue, onAttributeRoll]
  );

  const {
    localValue,
    handleInputChange,
    handleKeyDown,
    handleDiceClick,
    handleBlur
  } = useAccumulatingField(attributeValue, handleCommit, handleRoll);

  const inputRef = useRef(null);

  const handleFocus = useCallback((e) => {
    e.target.select();
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
                onBlur={handleBlur}
                inputProps={{
                  min: 0,
                  max: 6,
                  style: { cursor: 'text', caretColor: 'auto' }
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

const attributeOctagonPropsAreEqual = (prev, next) =>
  prev.attributeValue === next.attributeValue &&
  prev.onUpdate === next.onUpdate &&
  prev.onAttributeRoll === next.onAttributeRoll;

export const AttributeOctagon = memo(
  AttributeOctagonComponent,
  attributeOctagonPropsAreEqual
);

// COMPONENTE DE SKILL

const SkillComponentInternal = ({
  classes,
  skillName,
  skillValue,
  positionClass,
  onUpdate,
  onSkillRoll
}) => {
  const handleCommit = useCallback(
    (value) => {
      if (onUpdate) onUpdate('skill', skillName, value);
    },
    [skillName, onUpdate]
  );

  const handleRoll = useCallback(
    () => {
      if (onSkillRoll) onSkillRoll(skillName, skillValue);
    },
    [skillName, skillValue, onSkillRoll]
  );

  const {
    localValue,
    handleInputChange,
    handleKeyDown,
    handleDiceClick,
    handleBlur
  } = useAccumulatingField(skillValue, handleCommit, handleRoll);

  const inputRef = useRef(null);

  const handleFocus = useCallback((e) => {
    e.target.select();
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
                onBlur={handleBlur}
                inputProps={{
                  min: 0,
                  max: 6,
                  style: { cursor: 'text', caretColor: 'auto' }
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

const skillComponentPropsAreEqual = (prev, next) =>
  prev.skillValue === next.skillValue &&
  prev.onUpdate === next.onUpdate &&
  prev.onSkillRoll === next.onSkillRoll;

export const SkillComponent = memo(
  SkillComponentInternal,
  skillComponentPropsAreEqual
);

// COMPONENTE AGREGADOR (ATRIBUTO + SKILLS)

const AttributeWithSkillsComponent = ({
  classes,
  attributeName,
  config,
  attributeValue,
  skillValues,    // array com 3 valores numéricos
  onUpdate,
  onAttributeRoll,
  onSkillRoll
}) => {
  // Memoiza os nomes das skills a partir do config
  const skillNames = useMemo(
    () => Object.values(config.skills),
    [config.skills]
  );

  // Mapeamento de posições CSS para cada atributo
  const skillPositions = useMemo(() => {
    const positionMap = {
      Força: [classes.skillTopLeft, classes.skillTopCenter, classes.skillTopRight],
      Agilidade: [classes.skillLeftTop, classes.skillLeftMiddle, classes.skillLeftBottom],
      Inteligência: [classes.skillRightTop, classes.skillRightMiddle, classes.skillRightBottom],
      Empatia: [classes.skillBottomLeft, classes.skillBottomCenter, classes.skillBottomRight]
    };
    return positionMap[attributeName] || [];
  }, [attributeName, classes]);

  const handleAttributeUpdate = useCallback(
    (type, name, value) => {
      if (onUpdate) onUpdate(type, name, value);
    },
    [onUpdate]
  );

  const handleAttributeRoll = useCallback(
    (name, value) => {
      if (onAttributeRoll) onAttributeRoll(name, value);
    },
    [onAttributeRoll]
  );

  const handleSkillRoll = useCallback(
    (name, value) => {
      if (onSkillRoll) onSkillRoll(name, value);
    },
    [onSkillRoll]
  );

  // Geração dos componentes de skill memoizados
  const memoizedSkills = useMemo(
    () =>
      skillNames.map((skillName, idx) => (
        <SkillComponent
          key={skillName}
          classes={classes}
          skillName={skillName}
          skillValue={skillValues[idx] ?? 0}
          positionClass={skillPositions[idx]}
          onUpdate={handleAttributeUpdate}
          onSkillRoll={handleSkillRoll}
        />
      )),
    [skillNames, skillValues, skillPositions, classes, handleAttributeUpdate, handleSkillRoll]
  );

  return (
    <>
      <AttributeOctagon
        classes={classes}
        attributeName={attributeName}
        attributeValue={attributeValue}
        positionClass={classes[config.positionClass]}
        onUpdate={handleAttributeUpdate}
        onAttributeRoll={handleAttributeRoll}
      />
      {memoizedSkills}
    </>
  );
};

const attributeWithSkillsPropsAreEqual = (prev, next) =>
  prev.attributeValue === next.attributeValue &&
  prev.skillValues?.length === next.skillValues?.length &&
  prev.skillValues?.every((v, i) => v === next.skillValues[i]) &&
  prev.onUpdate === next.onUpdate &&
  prev.onAttributeRoll === next.onAttributeRoll &&
  prev.onSkillRoll === next.onSkillRoll;

export const AttributeWithSkills = memo(
  AttributeWithSkillsComponent,
  attributeWithSkillsPropsAreEqual
);

// EXPORTAÇÕES DEFAULT (para facilitar importação conjunta)

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