// Arquivo: src/pages/sheet/YearZeroSheet.jsx
// Versão: 5.15.0 - REFACTOR: Layout mobile extraído para MobileYearzero.jsx
console.log('[YearZeroSheet] Versão 5.15.0 - REFACTOR: Layout mobile extraído para MobileYearzero.jsx');

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import { Box, useMediaQuery, useTheme } from '@mui/material';

import HealthStressTracker, { healthStressStyles } from './Yearzero-modos/HealthStressTracker';
import DiamondWeb, { diamondWebStyles } from './Yearzero-modos/DiamondWeb';
import {
  AttributeWithSkills,
  attributeSkillMap,
  getAttributeValue,
  getSkillValue
} from './Yearzero-modos/AttributeComponents';
import EquipmentNotepad from './Yearzero-modos/EquipmentNotepad';
import RadiationTracker, { radiationStyles } from './Yearzero-modos/RadiationTracker';
import ExperienceHistoryTracker, { experienceHistoryStyles } from './Yearzero-modos/ExperienceHistoryTracker';
import PersonalMetaTalents from './Yearzero-modos/PersonalMetaTalents';
import ArmasArmadura from './Yearzero-modos/ArmasArmadura';
import ConditionsConsumablesTracker from './Yearzero-modos/ConditionsConsumablesTracker';

import { attributeComponentsStyles } from './Yearzero-modos/design/AttributeDesignStyles';
import MobileYearzero from './MobileYearzero';

// Estilos exclusivos do layout DESKTOP
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
  // Espalha os estilos importados dos subcomponentes (necessário para injeção de classes)
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Callbacks estáveis via refs (evita re-renderização dos filhos)
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
    return Object.entries(attributeSkillMap).map(([attributeName, config]) => {
      const attributeValue = getAttributeValue(attributes, attributeName, []);
      const skillValues = Object.values(config.skills).map(skillName =>
        getSkillValue(skills, skillName, [])
      );

      return (
        <AttributeWithSkills
          key={`${attributeName}_${character?.id || 'nochar'}`}
          classes={classes}
          attributeName={attributeName}
          config={config}
          attributeValue={attributeValue}
          skillValues={skillValues}
          onUpdate={handleUpdateWrapper}
          onAttributeRoll={handleAttributeRollWrapper}
          onSkillRoll={handleSkillRollWrapper}
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
    if (!character) return {};

    return {
      armadura: character.armadura || '',
      nivel: character.nivel_armadura || '',
      carga: character.carga_armadura || '',
      armas: character.armas || '[]'
    };
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

  // ===================== RENDERIZAÇÃO CONDICIONAL =====================
  // Mobile: delega totalmente para o componente MobileYearzero
  if (isMobile) {
    return (
      <MobileYearzero
        classes={classes}
        character={character}
        attributeComponents={attributeComponents}
        parsedCharacterData={parsedCharacterData}
        handlePersonalMetaSave={handlePersonalMetaSave}
        handleHealthUpdate={handleHealthUpdate}
        handleStressUpdate={handleStressUpdate}
        handleExperienceUpdate={handleExperienceUpdate}
        handleHistoryUpdate={handleHistoryUpdate}
        handleRadiationUpdate={handleRadiationUpdate}
        handleEquipmentSave={handleEquipmentSave}
        initialConditionsData={initialConditionsData}
        handleConditionsUpdate={handleConditionsUpdate}
        dadosArmasArmadura={dadosArmasArmadura}
        handleArmasArmaduraSave={handleArmasArmaduraSave}
      />
    );
  }

  // Desktop: layout original mantido integralmente
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
        </Box>
      </Box>
    </>
  );
}

// React.memo sem comparador customizado - shallow compare das props é suficiente
const YearZeroSheetMemoized = React.memo(withStyles(mainStyles)(YearZeroSheet));

export default YearZeroSheetMemoized;