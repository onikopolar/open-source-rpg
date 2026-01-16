// Arquivo: src/pages/sheet/YearZeroSheet.js
// Versão: 5.12.2 - FIX: Ajuste de escala dos componentes no layout mobile
console.log('[YearZeroSheet] Versão 5.12.2 - FIX: Ajuste de escala dos componentes no layout mobile');

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import { Box, useMediaQuery, useTheme } from '@mui/material';

import HealthStressTracker, { healthStressStyles } from './Yearzero-modos/HealthStressTracker';
import DiamondWeb, { diamondWebStyles } from './Yearzero-modos/DiamondWeb';
import {
  AttributeWithSkills,
  attributeSkillMap,
  attributeComponentsStyles
} from './Yearzero-modos/AttributeComponents';
import EquipmentNotepad from './Yearzero-modos/EquipmentNotepad';
import RadiationTracker, { radiationStyles } from './Yearzero-modos/RadiationTracker';
import ExperienceHistoryTracker, { experienceHistoryStyles } from './Yearzero-modos/ExperienceHistoryTracker';
import PersonalMetaTalents from './Yearzero-modos/PersonalMetaTalents';
import ArmasArmadura from './Yearzero-modos/ArmasArmadura';
import ConditionsConsumablesTracker from './Yearzero-modos/ConditionsConsumablesTracker';

const mainStyles = (theme) => ({
  // ESTILOS DESKTOP (mantidos da versão 5.12.1)
  mainContainer: {
    width: '100%',
    maxWidth: '1600px',
    margin: '0 auto',
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  topRow: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: theme.spacing(1),
  },
  topRowContent: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    flexWrap: 'nowrap',
    marginLeft: '40px',
  },
  leftColumn: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    marginTop: '30px',
    marginLeft: '-80px',
    zIndex: 1,
  },
  centerColumn: {
    width: '400px',
    height: '350px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: '30px',
    zIndex: 2,
    marginLeft: '0',
    marginRight: '0',
  },
  rightColumn: {
    width: '280px',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    marginTop: '30px',
    marginRight: '-50px',
    zIndex: 1,
  },
  diamondWrapper: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) scale(0.72)',
    transformOrigin: 'center center',
    zIndex: 2,
  },
  attributesContainer: {
    position: 'absolute',
    width: '410px',
    height: '350px',
    transform: 'translateX(-50%) scale(0.72)',
    transformOrigin: 'center center',
    zIndex: 3,
    left: '50%',
  },
  trackersRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(2),
    width: '100%',
    alignItems: 'flex-start',
  },
  bottomRow: {
    width: '70%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: theme.spacing(2),
    gap: '20px',
    marginLeft: '20px',
  },
  bottomLeft: {
    flex: 1,
    minWidth: 0,
    marginTop: 0,
  },
  bottomRight: {
    flex: 1,
    minWidth: 0,
    marginTop: 0,
  },
  conditionsScrollContainer: {
    height: '328px',
    overflowY: 'auto',
    padding: '0',
    backgroundColor: 'transparent',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: theme.palette.grey[100],
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.grey[400],
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: theme.palette.grey[500],
    },
  },
  
  // ESTILOS PARA MOBILE - ATUALIZADOS
  mobileMainContainer: {
    width: '100%',
    maxWidth: '430px',
    margin: '0 auto',
    padding: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    // REMOVIDO: gap - vamos controlar individualmente
  },
  mobilePersonalMetaContainer: {
    width: '100%',
    transform: 'scale(0.85)',
    transformOrigin: 'top center',
    marginBottom: '-150px', // ESPAÇO CONTROLADO: 4px abaixo
  },
  mobileTrackersRow: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing(0.5),
    marginBottom: '4px', // ESPAÇO CONTROLADO: 4px abaixo
  },
  mobileTrackerItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 0,
    transform: 'scale(0.85)',
    transformOrigin: 'top center',
  },
  mobileCenterColumn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: '280px',
    marginBottom: '20px', // ESPAÇO CONTROLADO: 4px abaixo
  },
  mobileDiamondWrapper: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) scale(0.5)',
    transformOrigin: 'center center',
    zIndex: 2,
  },
  mobileAttributesContainer: {
    position: 'absolute',
    width: '410px',
    height: '350px',
    transform: 'translateX(-50%) scale(0.5)',
    transformOrigin: 'center center',
    zIndex: 3,
    left: '50%',
  },
  mobileEquipmentSection: {
    width: '100%',
    transform: 'scale(0.9)',
    transformOrigin: 'top center',
    marginBottom: '4px', // ESPAÇO CONTROLADO: 4px abaixo
  },
  mobileBottomSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    // gap removido - vamos controlar individualmente
  },
  mobileConditionsContainer: {
    width: '100%',
    overflowY: 'auto',
    maxHeight: '220px',
    marginBottom: '20px', // ESPAÇO CONTROLADO: 4px abaixo do Conditions
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-track': {
      background: theme.palette.grey[100],
      borderRadius: '2px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.grey[400],
      borderRadius: '2px',
    },
  },
  mobileArmasContainer: {
    width: '100%',
    transform: 'scale(0.9)',
    transformOrigin: 'top center',
    // Sem margin bottom - último elemento
  },
  
  ...healthStressStyles(theme),
  ...diamondWebStyles(theme),
  ...attributeComponentsStyles(theme),
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
  console.log('[YearZeroSheet] Iniciando com character ID:', character?.id);
  console.log('[YearZeroSheet] Versão 5.12.2 - Ajuste de escala mobile aplicado');

  // DETECÇÃO DE MOBILE - DEVE SER EXECUTADO SEMPRE
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ========== TODOS OS HOOKS DEVEM VIR AQUI ==========
  const prevOnSkillRollRef = useRef();
  const prevOnAttributeRollRef = useRef();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (prevOnSkillRollRef.current !== onSkillRoll) {
        console.log('[YearZeroSheet] onSkillRoll referência atualizada');
      }
      if (prevOnAttributeRollRef.current !== onAttributeRoll) {
        console.log('[YearZeroSheet] onAttributeRoll referência atualizada');
      }
    }
    
    prevOnSkillRollRef.current = onSkillRoll;
    prevOnAttributeRollRef.current = onAttributeRoll;
  }, [onSkillRoll, onAttributeRoll]);

  const callbacksRef = useRef({
    onAttributeRoll: null,
    onSkillRoll: null
  });

  useEffect(() => {
    callbacksRef.current = {
      onAttributeRoll: (name, value) => {
        if (onAttributeRoll) {
          const stressSquares = character?.stress_squares ? 
            JSON.parse(character.stress_squares) : 
            Array(10).fill(false);
          const stressCount = stressSquares.filter(square => square).length;
          
          onAttributeRoll(name, value, stressCount, stressSquares);
        }
      },
      
      onSkillRoll: (name, value) => {
        if (onSkillRoll) {
          const stressSquares = character?.stress_squares ? 
            JSON.parse(character.stress_squares) : 
            Array(10).fill(false);
          const stressCount = stressSquares.filter(square => square).length;
          
          onSkillRoll(name, value, stressCount, stressSquares);
        }
      }
    };
  }, [onAttributeRoll, onSkillRoll, character?.stress_squares]);

  const handleAttributeRollWrapper = useCallback((name, value) => {
    return callbacksRef.current.onAttributeRoll?.(name, value);
  }, []);

  const handleSkillRollWrapper = useCallback((name, value) => {
    return callbacksRef.current.onSkillRoll?.(name, value);
  }, []);

  const attributeComponents = useMemo(() => {
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
    handleAttributeRollWrapper,
    handleSkillRollWrapper
  ]);

  const dadosArmasArmadura = useMemo(() => {
    if (!character) {
      return {};
    }
    
    const dados = {
      armadura: character.armadura || '',
      nivel: character.nivel_armadura || '',
      carga: character.carga_armadura || '',
      armas: character.armas || '[]'
    };
    
    return dados;
  }, [character]);

  const parsedCharacterData = useMemo(() => {
    const processarSquares = (squares, defaultLength) => {
      if (!squares) return Array(defaultLength).fill(false);
      
      try {
        if (typeof squares === 'string') {
          const cleaned = squares.trim();
          if (cleaned === '' || cleaned === '""' || cleaned === "''") {
            return Array(defaultLength).fill(false);
          }
          
          const parsed = JSON.parse(cleaned.replace(/^"+|"+$/g, ''));
          if (Array.isArray(parsed) && parsed.length === defaultLength) {
            return parsed;
          }
        }
      } catch (error) {
        console.warn('[YearZeroSheet] Erro ao processar squares, usando padrão:', error);
      }
      
      return Array(defaultLength).fill(false);
    };

    return {
      healthSquares: processarSquares(character?.health_squares, 10),
      stressSquares: processarSquares(character?.stress_squares, 10),
      radiationSquares: processarSquares(character?.radiation_squares, 10),
      experienceSquares: processarSquares(character?.experience_squares, 10),
      historySquares: processarSquares(character?.history_squares, 3)
    };
  }, [
    character?.health_squares,
    character?.stress_squares,
    character?.radiation_squares,
    character?.experience_squares,
    character?.history_squares
  ]);

  const handleHealthUpdate = useCallback((newHealthSquares) => {
    if (onUpdate) {
      onUpdate('health_squares', 'health', newHealthSquares);
    }
  }, [onUpdate]);

  const handleStressUpdate = useCallback((newStressSquares) => {
    if (onUpdate) {
      onUpdate('stress_squares', 'stress', newStressSquares);
    }
  }, [onUpdate]);

  const handleRadiationUpdate = useCallback((newRadiationSquares) => {
    if (onUpdate) {
      onUpdate('radiation_squares', 'radiation', newRadiationSquares);
    }
  }, [onUpdate]);

  const handleExperienceUpdate = useCallback((newExperienceSquares) => {
    if (onUpdate) {
      onUpdate('experience_squares', 'experience', newExperienceSquares);
    }
  }, [onUpdate]);

  const handleHistoryUpdate = useCallback((newHistorySquares) => {
    if (onUpdate) {
      onUpdate('history_squares', 'history', newHistorySquares);
    }
  }, [onUpdate]);

  const handleEquipmentSave = useCallback((type, value) => {
    if (onUpdate) {
      onUpdate(type, 'equipment', value);
    }
  }, [onUpdate]);

  const handleArmasArmaduraSave = useCallback((dados) => {
    if (onUpdate && character?.id) {
      onUpdate('armas_armaduras_batch', 'armas_armadura', {
        armadura: dados.armadura || '',
        nivel: dados.nivel || '',
        carga: dados.carga || '',
        armas: dados.armas || []
      });
    }
  }, [onUpdate, character?.id]);

  const initialConditionsData = useMemo(() => {
    if (!character) return {};
    
    const data = {};
    
    if (character.conditions) {
      data.condicoes = character.conditions;
    }
    
    if (character.consumables) {
      data.consumiveis = character.consumables;
    }
    
    if (character.injuries) {
      data.lesoes = character.injuries;
    }
    
    return data;
  }, [
    character?.conditions,
    character?.consumables,
    character?.injuries
  ]);

  const handleConditionsUpdate = useCallback((data) => {
    if (onUpdate) {
      if (data.condicoes) {
        onUpdate('conditions', 'conditions', data.condicoes);
      }
      if (data.consumiveis) {
        onUpdate('consumables', 'consumables', data.consumiveis);
      }
      if (data.lesoes) {
        onUpdate('injuries', 'injuries', data.lesoes);
      }
    }
  }, [onUpdate]);

  const handlePersonalMetaSave = useCallback((type, value) => {
    if (onUpdate) {
      onUpdate(type, 'personal_meta', value);
    }
  }, [onUpdate]);

  // ========== HOOKS ESPECÍFICOS PARA MOBILE ==========
  const mobileTrackersContent = useMemo(() => {
    return (
      <Box className={classes.mobileTrackersRow}>
        <Box className={classes.mobileTrackerItem}>
          <HealthStressTracker 
            classes={classes}
            healthSquares={parsedCharacterData.healthSquares}
            stressSquares={parsedCharacterData.stressSquares}
            onHealthUpdate={handleHealthUpdate}
            onStressUpdate={handleStressUpdate}
            isMobile={true}
          />
        </Box>
        
        <Box className={classes.mobileTrackerItem}>
          <ExperienceHistoryTracker
            classes={classes}
            experienceSquares={parsedCharacterData.experienceSquares}
            historySquares={parsedCharacterData.historySquares}
            onExperienceUpdate={handleExperienceUpdate}
            onHistoryUpdate={handleHistoryUpdate}
            isMobile={true}
          />
        </Box>
        
        <Box className={classes.mobileTrackerItem}>
          <RadiationTracker
            classes={classes}
            radiationSquares={parsedCharacterData.radiationSquares}
            onRadiationUpdate={handleRadiationUpdate}
            isMobile={true}
          />
        </Box>
      </Box>
    );
  }, [
    classes,
    parsedCharacterData,
    handleHealthUpdate,
    handleStressUpdate,
    handleRadiationUpdate,
    handleExperienceUpdate,
    handleHistoryUpdate
  ]);

  // ========== HOOKS ESPECÍFICOS PARA DESKTOP ==========
  const leftColumnContent = useMemo(() => {
    return (
      <>
        <HealthStressTracker 
          classes={classes}
          healthSquares={parsedCharacterData.healthSquares}
          stressSquares={parsedCharacterData.stressSquares}
          onHealthUpdate={handleHealthUpdate}
          onStressUpdate={handleStressUpdate}
        />
        
        <Box className={classes.trackersRow}>
          <ExperienceHistoryTracker
            classes={classes}
            experienceSquares={parsedCharacterData.experienceSquares}
            historySquares={parsedCharacterData.historySquares}
            onExperienceUpdate={handleExperienceUpdate}
            onHistoryUpdate={handleHistoryUpdate}
          />
          
          <RadiationTracker
            classes={classes}
            radiationSquares={parsedCharacterData.radiationSquares}
            onRadiationUpdate={handleRadiationUpdate}
          />
        </Box>
      </>
    );
  }, [
    classes,
    parsedCharacterData,
    handleHealthUpdate,
    handleStressUpdate,
    handleRadiationUpdate,
    handleExperienceUpdate,
    handleHistoryUpdate
  ]);

  const bottomRowContent = useMemo(() => {
    return (
      <>
        <Box className={classes.bottomLeft}>
          <Box className={classes.conditionsScrollContainer}>
            <ConditionsConsumablesTracker
              initialData={initialConditionsData}
              onChange={handleConditionsUpdate}
              readOnly={false}
              autoSaveDelay={300}
            />
          </Box>
        </Box>
        
        <Box className={classes.bottomRight}>
          <ArmasArmadura
            initialData={dadosArmasArmadura}
            onChange={handleArmasArmaduraSave}
            readOnly={false}
            autoSaveDelay={300}
          />
        </Box>
      </>
    );
  }, [
    classes.bottomLeft,
    classes.bottomRight,
    classes.conditionsScrollContainer,
    initialConditionsData,
    handleConditionsUpdate,
    dadosArmasArmadura,
    handleArmasArmaduraSave
  ]);

  // ========== RENDERIZAÇÃO CONDICIONAL ==========
  // AGORA podemos ter retorno condicional porque TODOS os hooks já foram executados
  
  if (isMobile) {
    console.log('[YearZeroSheet] Renderizando layout mobile com escala ajustada');
    
    return (
      <Box className={classes.mobileMainContainer}>
        <Box className={classes.mobilePersonalMetaContainer}>
          <PersonalMetaTalents
            character={character}
            onSave={handlePersonalMetaSave}
            isMobile={true}
          />
        </Box>
        
        {mobileTrackersContent}
        
        <Box className={classes.mobileCenterColumn}>
          <Box className={classes.mobileDiamondWrapper}>
            <DiamondWeb classes={classes} />
          </Box>
          <Box className={classes.mobileAttributesContainer}>
            {attributeComponents}
          </Box>
        </Box>
        
        <Box className={classes.mobileEquipmentSection}>
          <EquipmentNotepad
            character={character}
            onSave={handleEquipmentSave}
            isMobile={true}
          />
        </Box>
        
        <Box className={classes.mobileBottomSection}>
          <Box className={classes.mobileConditionsContainer}>
            <ConditionsConsumablesTracker
              initialData={initialConditionsData}
              onChange={handleConditionsUpdate}
              readOnly={false}
              autoSaveDelay={300}
              isMobile={true}
            />
          </Box>
          
          <Box className={classes.mobileArmasContainer}>
            <ArmasArmadura
              initialData={dadosArmasArmadura}
              onChange={handleArmasArmaduraSave}
              readOnly={false}
              autoSaveDelay={300}
              isMobile={true}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  // RENDERIZAÇÃO DESKTOP
  console.log('[YearZeroSheet] Renderizando layout desktop');
  
  return (
    <>
      <PersonalMetaTalents
        character={character}
        onSave={handlePersonalMetaSave}
      />
      
      <Box className={classes.mainContainer}>
        <Box className={classes.topRow}>
          <Box className={classes.topRowContent}>
            <Box className={classes.leftColumn}>
              {leftColumnContent}
            </Box>
            
            <Box className={classes.centerColumn}>
              <Box className={classes.diamondWrapper}>
                <DiamondWeb classes={classes} />
              </Box>
              <Box className={classes.attributesContainer}>
                {attributeComponents}
              </Box>
            </Box>
            
            <Box className={classes.rightColumn}>
              <EquipmentNotepad
                character={character}
                onSave={handleEquipmentSave}
              />
            </Box>
          </Box>
        </Box>
        
        <Box className={classes.bottomRow}>
          {bottomRowContent}
        </Box>
      </Box>
    </>
  );
}

// Função de comparação otimizada (mantida da versão 5.12.1)
const YearZeroSheetMemoized = React.memo(
  withStyles(mainStyles)(YearZeroSheet),
  (prevProps, nextProps) => {
    const compararCampo = (prevVal, nextVal) => {
      if (prevVal === nextVal) return true;
      if (!prevVal && !nextVal) return true;
      if (!prevVal || !nextVal) return false;
      return JSON.stringify(prevVal) === JSON.stringify(nextVal);
    };
    
    const characterRelevanteMudou = () => {
      const prevChar = prevProps.character;
      const nextChar = nextProps.character;
      
      if (!prevChar && !nextChar) return false;
      if (!prevChar || !nextChar) return true;
      
      if (prevChar.id !== nextChar.id) return true;
      
      const camposCriticos = [
        'armadura',
        'nivel_armadura',
        'carga_armadura',
        'armas',
        'health_squares',
        'stress_squares',
        'radiation_squares',
        'experience_squares',
        'history_squares'
      ];
      
      for (const campo of camposCriticos) {
        if (!compararCampo(prevChar[campo], nextChar[campo])) {
          return true;
        }
      }
      
      if (!compararCampo(prevChar.conditions, nextChar.conditions)) return true;
      if (!compararCampo(prevChar.consumables, nextChar.consumables)) return true;
      if (!compararCampo(prevChar.injuries, nextChar.injuries)) return true;
      
      return false;
    };
    
    const attributesChanged = 
      JSON.stringify(prevProps.attributes) !== JSON.stringify(nextProps.attributes);
    const skillsChanged = 
      JSON.stringify(prevProps.skills) !== JSON.stringify(nextProps.skills);
    const callbacksChanged = 
      prevProps.onUpdate !== nextProps.onUpdate ||
      prevProps.onAttributeRoll !== nextProps.onAttributeRoll ||
      prevProps.onSkillRoll !== nextProps.onSkillRoll;
    
    const shouldRerender = characterRelevanteMudou() || attributesChanged || skillsChanged || callbacksChanged;
    
    if (shouldRerender && process.env.NODE_ENV === 'development') {
      console.log('[YearZeroSheet] Re-renderizando devido a:', {
        characterRelevanteMudou: characterRelevanteMudou(),
        attributesChanged,
        skillsChanged,
        callbacksChanged
      });
    }
    
    return !shouldRerender;
  }
);

export default YearZeroSheetMemoized;