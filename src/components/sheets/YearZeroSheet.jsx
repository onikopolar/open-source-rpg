// src/components/sheets/YearZeroSheet.jsx - VERSÃO 4.7.0 - FIX: Callbacks estabilizados com useRef
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import { Box } from '@mui/material';

// Importar componentes
import HealthStressTracker, { healthStressStyles } from './Yearzero-modos/HealthStressTracker';
import DiamondWeb, { diamondWebStyles } from './Yearzero-modos/DiamondWeb';
import { 
  AttributeWithSkills,
  attributeSkillMap,
  attributeComponentsStyles
} from './Yearzero-modos/AttributeComponents';
import EquipmentNotepad, { equipmentNotepadStyles } from './Yearzero-modos/EquipmentNotepad';
import RadiationTracker, { radiationStyles } from './Yearzero-modos/RadiationTracker';
import ExperienceHistoryTracker, { experienceHistoryStyles } from './Yearzero-modos/ExperienceHistoryTracker';
import PersonalMetaTalents from './Yearzero-modos/PersonalMetaTalents';

console.log('[YearZeroSheet] Versão 4.7.0 - FIX: Callbacks estabilizados com useRef');

const mainStyles = (theme) => ({
  mainContainer: {
    width: '100%',
    maxWidth: '1550px',
    margin: '0 auto',
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  columnsContainer: {
    padding: theme.spacing(2),
    width: '100%',
    display: 'flex',
    gap: theme.spacing(3),
    minHeight: '700px',
    background: 'transparent',
    borderRadius: theme.shape.borderRadius,
    position: 'relative',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    marginTop: theme.spacing(2),
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    width: '320px',
    flexShrink: 0
  },
  centerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    width: '320px',
    flexShrink: 0
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    width: '320px',
    flexShrink: 0,
    alignItems: 'stretch'
  },
  attributesContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.shape.borderRadius,
    position: 'relative',
    padding: theme.spacing(1),
    minHeight: '480px',
  },
  diamondCore: {
    position: 'relative',
    width: '360px',
    height: '270px',
    margin: '0 auto',
    transform: 'scale(0.85)'
  },
  ...healthStressStyles(theme),
  ...diamondWebStyles(theme),
  ...attributeComponentsStyles(theme),
  ...equipmentNotepadStyles(theme),
  ...radiationStyles(theme),
  ...experienceHistoryStyles(theme)
});

function YearZeroSheet({
  classes,
  character,
  attributes = [],
  skills = [],
  onUpdate,
  onAttributeRoll,
  onSkillRoll
}) {
  // Debug: eu verifico se os callbacks estao mudando
  const prevOnSkillRollRef = useRef();
  const prevOnAttributeRollRef = useRef();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (prevOnSkillRollRef.current !== onSkillRoll) {
        console.log('[YearZeroSheet] onSkillRoll REFERENCIA mudou:', {
          mesmoEndereco: prevOnSkillRollRef.current === onSkillRoll,
          tinhaAntes: !!prevOnSkillRollRef.current,
          temAgora: !!onSkillRoll
        });
      }
      if (prevOnAttributeRollRef.current !== onAttributeRoll) {
        console.log('[YearZeroSheet] onAttributeRoll REFERENCIA mudou:', {
          mesmoEndereco: prevOnAttributeRollRef.current === onAttributeRoll,
          tinhaAntes: !!prevOnAttributeRollRef.current,
          temAgora: !!onAttributeRoll
        });
      }
    }
    
    prevOnSkillRollRef.current = onSkillRoll;
    prevOnAttributeRollRef.current = onAttributeRoll;
  }, [onSkillRoll, onAttributeRoll]);

  // CORREÇÃO CRÍTICA: eu uso ref para callbacks estáveis
  const callbacksRef = useRef({
    onAttributeRoll: null,
    onSkillRoll: null
  });

  // Eu atualizo os callbacks do ref quando as props mudam
  useEffect(() => {
    callbacksRef.current = {
      onAttributeRoll: (name, value) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[YearZeroSheet] Encaminhando onAttributeRoll: ${name}=${value}`);
        }
        
        if (onAttributeRoll) {
          // Eu calculo o stress dentro do callback para não precisar de dependência
          const stressSquares = character?.stress_squares ? 
            JSON.parse(character.stress_squares) : 
            Array(10).fill(false);
          const stressCount = stressSquares.filter(square => square).length;
          
          onAttributeRoll(name, value, stressCount, stressSquares);
        } else {
          console.warn(`[YearZeroSheet] onAttributeRoll não está definido para ${name}`);
        }
      },
      
      onSkillRoll: (name, value) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[YearZeroSheet] Encaminhando onSkillRoll: ${name}=${value}`);
        }
        
        if (onSkillRoll) {
          // Eu calculo o stress dentro do callback para não precisar de dependência
          const stressSquares = character?.stress_squares ? 
            JSON.parse(character.stress_squares) : 
            Array(10).fill(false);
          const stressCount = stressSquares.filter(square => square).length;
          
          onSkillRoll(name, value, stressCount, stressSquares);
        } else {
          console.warn(`[YearZeroSheet] onSkillRoll não está definido para ${name}`);
        }
      }
    };
  }, [onAttributeRoll, onSkillRoll, character?.stress_squares]);

  // CORREÇÃO: eu crio wrappers estáveis que usam o ref
  const handleAttributeRollWrapper = useCallback((name, value) => {
    return callbacksRef.current.onAttributeRoll?.(name, value);
  }, []); // Array vazio - nunca muda!

  const handleSkillRollWrapper = useCallback((name, value) => {
    return callbacksRef.current.onSkillRoll?.(name, value);
  }, []); // Array vazio - nunca muda!

  // CORREÇÃO: eu memoizo os componentes de atributos sem depender de callbacks instáveis
  const attributeComponents = useMemo(() => {
    console.log('[YearZeroSheet] Criando atributos com callbacks estáveis');
    
    return Object.entries(attributeSkillMap).map(([attributeName, config]) => {
      return (
        <AttributeWithSkills
          key={`${attributeName}_${character?.id || 'nochar'}`}
          classes={classes}
          attributeName={attributeName}
          config={config}
          attributes={attributes}
          skills={skills}
          onUpdate={onUpdate}
          // CORREÇÃO: eu uso os wrappers estáveis
          onAttributeRoll={handleAttributeRollWrapper}
          onSkillRoll={handleSkillRollWrapper}
          defaultAttributes={[]}
          defaultSkills={[]}
        />
      );
    });
  }, [
    classes, 
    character?.id, 
    attributes, 
    skills, 
    onUpdate,
    handleAttributeRollWrapper, // Agora estáveis
    handleSkillRollWrapper // Agora estáveis
  ]);

  // Eu parseio todos os dados do character de uma vez só
  const parsedCharacterData = useMemo(() => {
    console.log('[YearZeroSheet] Parseando dados do character');
    
    return {
      healthSquares: character?.health_squares ? JSON.parse(character.health_squares) : Array(10).fill(false),
      stressSquares: character?.stress_squares ? JSON.parse(character.stress_squares) : Array(10).fill(false),
      radiationSquares: character?.radiation_squares ? JSON.parse(character.radiation_squares) : Array(10).fill(false),
      experienceSquares: character?.experience_squares ? JSON.parse(character.experience_squares) : Array(10).fill(false),
      historySquares: character?.history_squares ? JSON.parse(character.history_squares) : Array(3).fill(false)
    };
  }, [
    character?.health_squares,
    character?.stress_squares,
    character?.radiation_squares,
    character?.experience_squares,
    character?.history_squares
  ]);

  // CORREÇÃO: eu estabilizo os handlers da coluna direita também
  const handleHealthUpdate = useCallback((newHealthSquares) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[YearZeroSheet] handleHealthUpdate chamado:', newHealthSquares);
    }
    
    if (onUpdate) {
      onUpdate('health_squares', 'health', newHealthSquares);
    } else {
      console.warn('[YearZeroSheet] onUpdate não está definido para health');
    }
  }, [onUpdate]);

  const handleStressUpdate = useCallback((newStressSquares) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[YearZeroSheet] handleStressUpdate chamado:', newStressSquares);
    }
    
    if (onUpdate) {
      onUpdate('stress_squares', 'stress', newStressSquares);
    } else {
      console.warn('[YearZeroSheet] onUpdate não está definido para stress');
    }
  }, [onUpdate]);

  const handleRadiationUpdate = useCallback((newRadiationSquares) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[YearZeroSheet] handleRadiationUpdate chamado:', newRadiationSquares);
    }
    
    if (onUpdate) {
      onUpdate('radiation_squares', 'radiation', newRadiationSquares);
    } else {
      console.warn('[YearZeroSheet] onUpdate não está definido para radiation');
    }
  }, [onUpdate]);

  const handleExperienceUpdate = useCallback((newExperienceSquares) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[YearZeroSheet] handleExperienceUpdate chamado:', newExperienceSquares);
    }
    
    if (onUpdate) {
      onUpdate('experience_squares', 'experience', newExperienceSquares);
    } else {
      console.warn('[YearZeroSheet] onUpdate não está definido para experience');
    }
  }, [onUpdate]);

  const handleHistoryUpdate = useCallback((newHistorySquares) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[YearZeroSheet] handleHistoryUpdate chamado:', newHistorySquares);
    }
    
    if (onUpdate) {
      onUpdate('history_squares', 'history', newHistorySquares);
    } else {
      console.warn('[YearZeroSheet] onUpdate não está definido para history');
    }
  }, [onUpdate]);

  const handleEquipmentSave = useCallback((type, value) => {
    if (onUpdate) {
      onUpdate(type, 'equipment', value);
    }
  }, [onUpdate]);

  // Eu memoizo os componentes da coluna direita
  const rightColumnComponents = useMemo(() => {
    console.log('[YearZeroSheet] Renderizando coluna direita com dados parseados');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[YearZeroSheet] Valores dos trackers:', {
        healthSquares: parsedCharacterData.healthSquares,
        stressSquares: parsedCharacterData.stressSquares,
        radiationSquares: parsedCharacterData.radiationSquares,
        experienceSquares: parsedCharacterData.experienceSquares,
        historySquares: parsedCharacterData.historySquares
      });
    }
    
    return (
      <>
        <HealthStressTracker 
          classes={classes}
          healthSquares={parsedCharacterData.healthSquares}
          stressSquares={parsedCharacterData.stressSquares}
          onHealthUpdate={handleHealthUpdate}
          onStressUpdate={handleStressUpdate}
        />
        
        <RadiationTracker
          classes={classes}
          radiationSquares={parsedCharacterData.radiationSquares}
          onRadiationUpdate={handleRadiationUpdate}
        />
        
        <ExperienceHistoryTracker
          classes={classes}
          experienceSquares={parsedCharacterData.experienceSquares}
          historySquares={parsedCharacterData.historySquares}
          onExperienceUpdate={handleExperienceUpdate}
          onHistoryUpdate={handleHistoryUpdate}
        />
        
        <EquipmentNotepad
          classes={classes}
          character={character}
          onSave={handleEquipmentSave}
        />
      </>
    );
  }, [
    classes,
    character,
    parsedCharacterData,
    handleHealthUpdate,
    handleStressUpdate,
    handleRadiationUpdate,
    handleExperienceUpdate,
    handleHistoryUpdate,
    handleEquipmentSave
  ]);

  return (
    <>
      <PersonalMetaTalents
        character={character}
        onSave={useCallback((type, value) => onUpdate?.(type, 'personal_meta', value), [onUpdate])}
      />
      
      <Box className={classes.mainContainer}>
        <Box className={classes.columnsContainer}>
          <Box className={classes.leftColumn}>
            <Box className={classes.attributesContainer}>
              <Box className={classes.diamondCore}>
                <DiamondWeb classes={classes} />
                {attributeComponents}
              </Box>
            </Box>
          </Box>

          <Box className={classes.centerColumn} />

          <Box className={classes.rightColumn}>
            {rightColumnComponents}
          </Box>
        </Box>
      </Box>
    </>
  );
}

// Componente memoizado com comparação otimizada
const YearZeroSheetMemoized = React.memo(
  withStyles(mainStyles)(YearZeroSheet),
  (prevProps, nextProps) => {
    // Comparação otimizada para evitar re-renders desnecessários
    const callbacksChanged = 
      prevProps.onSkillRoll !== nextProps.onSkillRoll ||
      prevProps.onAttributeRoll !== nextProps.onAttributeRoll ||
      prevProps.onUpdate !== nextProps.onUpdate;
    
    const characterChanged = prevProps.character !== nextProps.character;
    const dataChanged = 
      JSON.stringify(prevProps.attributes) !== JSON.stringify(nextProps.attributes) ||
      JSON.stringify(prevProps.skills) !== JSON.stringify(nextProps.skills);
    
    // CORREÇÃO: eu registro mudanças apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development' && callbacksChanged) {
      console.log('[YearZeroSheet] Memo comparação: callbacks mudaram', {
        onSkillRoll: prevProps.onSkillRoll !== nextProps.onSkillRoll,
        onAttributeRoll: prevProps.onAttributeRoll !== nextProps.onAttributeRoll,
        onUpdate: prevProps.onUpdate !== nextProps.onUpdate
      });
    }
    
    // CORREÇÃO: eu só faço re-render se dados importantes mudarem
    // Callbacks mudando não é razão suficiente para re-render
    // porque eu uso refs internamente
    const shouldRerender = characterChanged || dataChanged;
    
    if (process.env.NODE_ENV === 'development' && callbacksChanged && !shouldRerender) {
      console.log('[YearZeroSheet] Callbacks mudaram, mas dados não - mantendo render atual');
    }
    
    // Retorno true para pular re-render, false para fazer re-render
    return !shouldRerender;
  }
);

export default YearZeroSheetMemoized;