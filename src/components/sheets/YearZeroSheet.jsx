// Arquivo: src/pages/sheet/YearZeroSheet.js
// Versão: 5.14.0 - FIX: Correção de renderização de atributos e preservação de scroll
console.log('[YearZeroSheet] Versão 5.14.0 - FIX: Correção de renderização de atributos e preservação de scroll');

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
  mobileMainContainer: {
    width: '100%',
    maxWidth: '430px',
    margin: '0 auto',
    padding: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  mobilePersonalMetaContainer: {
    width: '100%',
    transform: 'scale(0.85)',
    transformOrigin: 'top center',
    marginBottom: '-150px',
  },
  mobileTrackersRow: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing(0.5),
    marginBottom: '4px',
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
    marginBottom: '20px',
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
    marginBottom: '4px',
  },
  mobileBottomSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  mobileConditionsContainer: {
    width: '100%',
    overflowY: 'auto',
    maxHeight: '220px',
    marginBottom: '20px',
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
  console.log('[YearZeroSheet] Versão 5.14.0 - FIX: Correção de renderização de atributos e preservação de scroll');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Ref para manter posição do scroll
  const scrollPositionRef = useRef({ x: 0, y: 0 });
  const hasRestoredScrollRef = useRef(false);

  // Salvar posição do scroll antes de desmontar
  useEffect(() => {
    const handleBeforeUnload = () => {
      scrollPositionRef.current = {
        x: window.scrollX,
        y: window.scrollY
      };
    };

    window.addEventListener('scroll', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('scroll', handleBeforeUnload);
      scrollPositionRef.current = {
        x: window.scrollX,
        y: window.scrollY
      };
    };
  }, []);

  // Restaurar posição do scroll após renderização
  useEffect(() => {
    if (!hasRestoredScrollRef.current && (scrollPositionRef.current.x > 0 || scrollPositionRef.current.y > 0)) {
      const timer = setTimeout(() => {
        window.scrollTo({
          left: scrollPositionRef.current.x,
          top: scrollPositionRef.current.y,
          behavior: 'auto'
        });
        hasRestoredScrollRef.current = true;
        console.log('[YearZeroSheet] Scroll restaurado para:', scrollPositionRef.current);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [character?.id]);

  const callbacksRef = useRef({
    onAttributeRoll: null,
    onSkillRoll: null,
    onUpdate: null
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
      },
      
      onUpdate: (type, name, value) => {
        if (onUpdate) {
          onUpdate(type, name, value);
        }
      }
    };
  }, [onAttributeRoll, onSkillRoll, onUpdate, character?.stress_squares]);

  const handleAttributeRollWrapper = useCallback((name, value) => {
    return callbacksRef.current.onAttributeRoll?.(name, value);
  }, []);

  const handleSkillRollWrapper = useCallback((name, value) => {
    return callbacksRef.current.onSkillRoll?.(name, value);
  }, []);

  const handleUpdateWrapper = useCallback((type, name, value) => {
    return callbacksRef.current.onUpdate?.(type, name, value);
  }, []);

  const attributeComponents = useMemo(() => {
    console.log('[YearZeroSheet] Criando atributos components');
    
    return Object.entries(attributeSkillMap).map(([attributeName, config]) => {
      return (
        <AttributeWithSkills
          key={`${attributeName}_${character?.id || 'nochar'}`}
          classes={classes}
          attributeName={attributeName}
          config={config}
          attributes={attributes}
          skills={skills}
          onUpdate={handleUpdateWrapper}
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
    handleUpdateWrapper,
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
        console.warn('[YearZeroSheet] Erro ao processar squares, usando padrao:', error);
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
    if (handleUpdateWrapper) {
      handleUpdateWrapper('health_squares', 'health', newHealthSquares);
    }
  }, [handleUpdateWrapper]);

  const handleStressUpdate = useCallback((newStressSquares) => {
    if (handleUpdateWrapper) {
      handleUpdateWrapper('stress_squares', 'stress', newStressSquares);
    }
  }, [handleUpdateWrapper]);

  const handleRadiationUpdate = useCallback((newRadiationSquares) => {
    if (handleUpdateWrapper) {
      handleUpdateWrapper('radiation_squares', 'radiation', newRadiationSquares);
    }
  }, [handleUpdateWrapper]);

  const handleExperienceUpdate = useCallback((newExperienceSquares) => {
    if (handleUpdateWrapper) {
      handleUpdateWrapper('experience_squares', 'experience', newExperienceSquares);
    }
  }, [handleUpdateWrapper]);

  const handleHistoryUpdate = useCallback((newHistorySquares) => {
    if (handleUpdateWrapper) {
      handleUpdateWrapper('history_squares', 'history', newHistorySquares);
    }
  }, [handleUpdateWrapper]);

  const handleEquipmentSave = useCallback((type, value) => {
    if (handleUpdateWrapper) {
      handleUpdateWrapper(type, 'equipment', value);
    }
  }, [handleUpdateWrapper]);

  const handleArmasArmaduraSave = useCallback((dados) => {
    if (handleUpdateWrapper && character?.id) {
      handleUpdateWrapper('armas_armaduras_batch', 'armas_armadura', {
        armadura: dados.armadura || '',
        nivel: dados.nivel || '',
        carga: dados.carga || '',
        armas: dados.armas || []
      });
    }
  }, [handleUpdateWrapper, character?.id]);

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
    if (handleUpdateWrapper) {
      if (data.condicoes) {
        handleUpdateWrapper('conditions', 'conditions', data.condicoes);
      }
      if (data.consumiveis) {
        handleUpdateWrapper('consumables', 'consumables', data.consumiveis);
      }
      if (data.lesoes) {
        handleUpdateWrapper('injuries', 'injuries', data.lesoes);
      }
    }
  }, [handleUpdateWrapper]);

  const handlePersonalMetaSave = useCallback((type, value) => {
    if (handleUpdateWrapper) {
      handleUpdateWrapper(type, 'personal_meta', value);
    }
  }, [handleUpdateWrapper]);

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

const YearZeroSheetMemoized = React.memo(
  withStyles(mainStyles)(YearZeroSheet),
  (prevProps, nextProps) => {
    // Função auxiliar para comparar valores
    const compararCampo = (prevVal, nextVal) => {
      if (prevVal === nextVal) return true;
      if (!prevVal && !nextVal) return true;
      if (!prevVal || !nextVal) return false;
      
      // Para arrays vazios ou nulos, considerar iguais
      if (Array.isArray(prevVal) && Array.isArray(nextVal)) {
        if (prevVal.length === 0 && nextVal.length === 0) return true;
        return JSON.stringify(prevVal) === JSON.stringify(nextVal);
      }
      
      return JSON.stringify(prevVal) === JSON.stringify(nextVal);
    };
    
    // Verificar se o character relevante mudou
    const characterRelevanteMudou = () => {
      const prevChar = prevProps.character;
      const nextChar = nextProps.character;
      
      // Ambos nulos = não mudou
      if (!prevChar && !nextChar) return false;
      // Um é nulo e outro não = mudou
      if (!prevChar || !nextChar) return true;
      
      // ID diferente = character diferente
      if (prevChar.id !== nextChar.id) return true;
      
      // Lista de campos críticos que disparam re-render
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
      
      // Verificar cada campo crítico
      for (const campo of camposCriticos) {
        if (!compararCampo(prevChar[campo], nextChar[campo])) {
          return true;
        }
      }
      
      // Verificar condições, consumíveis e lesões
      if (!compararCampo(prevChar.conditions, nextChar.conditions)) return true;
      if (!compararCampo(prevChar.consumables, nextChar.consumables)) return true;
      if (!compararCampo(prevChar.injuries, nextChar.injuries)) return true;
      
      return false;
    };
    
    // Verificar mudanças em attributes e skills
    // IMPORTANTE: Só considerar como mudança se já tivermos dados
    const prevAttributes = prevProps.attributes || [];
    const nextAttributes = nextProps.attributes || [];
    const prevSkills = prevProps.skills || [];
    const nextSkills = nextProps.skills || [];
    
    // Attributes mudou? Só considerar se já tínhamos dados
    const attributesChanged = prevAttributes.length > 0 && 
                             JSON.stringify(prevAttributes) !== JSON.stringify(nextAttributes);
    
    // Skills mudou? Só considerar se já tínhamos dados
    const skillsChanged = prevSkills.length > 0 && 
                         JSON.stringify(prevSkills) !== JSON.stringify(nextSkills);
    
    // Callbacks nunca disparam re-render (já estável via refs)
    const callbacksChanged = false;
    
    // Decisão final: re-renderizar?
    const shouldRerender = characterRelevanteMudou() || attributesChanged || skillsChanged;
    
    // Log apenas em desenvolvimento
    if (shouldRerender && process.env.NODE_ENV === 'development') {
      console.log('[YearZeroSheet] Re-renderizando devido a:', {
        characterRelevanteMudou: characterRelevanteMudou(),
        attributesChanged,
        skillsChanged,
        callbacksChanged
      });
    }
    
    // Retornar true para SKIP re-render (React.memo funciona ao contrário)
    // Queremos skip se NÃO deve re-renderizar
    return !shouldRerender;
  }
);

export default YearZeroSheetMemoized;