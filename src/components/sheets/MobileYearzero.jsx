// Arquivo: src/components/sheets/MobileYearzero.jsx
// Layout mobile completo para Year Zero Sheet
// Autossuficiente em estilos: combina layout mobile + estilos dos subcomponentes

import React from 'react';
import { withStyles } from '@mui/styles';
import { Box } from '@mui/material';

import HealthStressTracker, { healthStressStyles } from './Yearzero-modos/HealthStressTracker';
import ExperienceHistoryTracker, { experienceHistoryStyles } from './Yearzero-modos/ExperienceHistoryTracker';
import RadiationTracker, { radiationStyles } from './Yearzero-modos/RadiationTracker';
import DiamondWeb, { diamondWebStyles } from './Yearzero-modos/DiamondWeb';
import EquipmentNotepad from './Yearzero-modos/EquipmentNotepad';
import ConditionsConsumablesTracker from './Yearzero-modos/ConditionsConsumablesTracker';
import ArmasArmadura from './Yearzero-modos/ArmasArmadura';
import PersonalMetaTalents from './Yearzero-modos/PersonalMetaTalents';
import { attributeComponentsStyles } from './Yearzero-modos/design/AttributeDesignStyles';

// ============================================================
// CONFIGURAÇÕES DE LAYOUT – altere os valores abaixo livremente
// ============================================================

const LAYOUT = {
  // ---- Escalas gerais (use 1 para tamanho original) ----
  PERSONAL_META_SCALE: 0.85,
  TRACKER_SCALE: 0.85,
  DIAMOND_SCALE: 0.5,
  ATTRIBUTES_SCALE: 0.5,
  EQUIPMENT_SCALE: 0.9,
  ARMAS_SCALE: 0.9,

  // ---- Dimensões em px (containers absolutos) ----
  DIAMOND_WIDTH: 300,
  DIAMOND_HEIGHT: 300,
  ATTRIBUTES_WIDTH: 410,
  ATTRIBUTES_HEIGHT: 350,

  // ---- Espaçamentos e tamanhos ----
  MAIN_MAX_WIDTH: 430,
  MAIN_PADDING: 8,
  TRACKER_GAP: 4,
  CENTER_MIN_HEIGHT: 280,
  CONDITIONS_MAX_HEIGHT: 220,
  PERSONAL_META_MARGIN_BOTTOM: -150,

  // ---- Scrollbar ----
  SCROLLBAR_WIDTH: 4,
  SCROLLBAR_RADIUS: 2,
};

// ============================================================
// ESTILOS (combina layout mobile + estilos de todos os subcomponentes)
// ============================================================

const styles = (theme) => ({
  // Layout mobile
  mobileMainContainer: {
    width: '100%',
    maxWidth: `${LAYOUT.MAIN_MAX_WIDTH}px`,
    margin: '0 auto',
    padding: `${LAYOUT.MAIN_PADDING}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  mobilePersonalMetaContainer: {
    width: '100%',
    transform: `scale(${LAYOUT.PERSONAL_META_SCALE})`,
    transformOrigin: 'top center',
    marginBottom: `${LAYOUT.PERSONAL_META_MARGIN_BOTTOM}px`,
  },
  mobileTrackersRow: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: `${LAYOUT.TRACKER_GAP}px`,
    marginBottom: '4px',
  },
  mobileTrackerItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 0,
    transform: `scale(${LAYOUT.TRACKER_SCALE})`,
    transformOrigin: 'top center',
  },
  mobileCenterColumn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: `${LAYOUT.CENTER_MIN_HEIGHT}px`,
    marginBottom: '20px',
  },
  mobileDiamondWrapper: {
    position: 'absolute',
    width: `${LAYOUT.DIAMOND_WIDTH}px`,
    height: `${LAYOUT.DIAMOND_HEIGHT}px`,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${LAYOUT.DIAMOND_SCALE})`,
    transformOrigin: 'center center',
    zIndex: 2,
  },
  mobileAttributesContainer: {
    position: 'absolute',
    width: `${LAYOUT.ATTRIBUTES_WIDTH}px`,
    height: `${LAYOUT.ATTRIBUTES_HEIGHT}px`,
    transform: `translateX(-50%) scale(${LAYOUT.ATTRIBUTES_SCALE})`,
    transformOrigin: 'center center',
    zIndex: 3,
    left: '50%',
  },
  mobileEquipmentSection: {
    width: '100%',
    transform: `scale(${LAYOUT.EQUIPMENT_SCALE})`,
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
    maxHeight: `${LAYOUT.CONDITIONS_MAX_HEIGHT}px`,
    marginBottom: '20px',
    '&::-webkit-scrollbar': {
      width: `${LAYOUT.SCROLLBAR_WIDTH}px`,
    },
    '&::-webkit-scrollbar-track': {
      background: theme.palette.grey[100],
      borderRadius: `${LAYOUT.SCROLLBAR_RADIUS}px`,
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.grey[400],
      borderRadius: `${LAYOUT.SCROLLBAR_RADIUS}px`,
    },
  },
  mobileArmasContainer: {
    width: '100%',
    transform: `scale(${LAYOUT.ARMAS_SCALE})`,
    transformOrigin: 'top center',
  },

  // Estilos dos subcomponentes (garantem que eles recebam as classes esperadas)
  ...healthStressStyles(theme),
  ...experienceHistoryStyles(theme),
  ...radiationStyles(theme),
  ...diamondWebStyles(theme),
  ...attributeComponentsStyles(theme),
});

// ============================================================
// COMPONENTE
// ============================================================

function MobileYearzero({
  classes,
  character,
  attributeComponents,
  parsedCharacterData,
  handlePersonalMetaSave,
  handleHealthUpdate,
  handleStressUpdate,
  handleExperienceUpdate,
  handleHistoryUpdate,
  handleRadiationUpdate,
  handleEquipmentSave,
  initialConditionsData,
  handleConditionsUpdate,
  dadosArmasArmadura,
  handleArmasArmaduraSave,
}) {
  return (
    <Box className={classes.mobileMainContainer}>
      {/* Bloco de informações pessoais e talentos */}
      <Box className={classes.mobilePersonalMetaContainer}>
        <PersonalMetaTalents
          character={character}
          onSave={handlePersonalMetaSave}
          isMobile={true}
        />
      </Box>

      {/* Linha de trackers: Saúde/Estresse, Experiência/História, Radiação */}
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

      {/* Área central: losango + atributos */}
      <Box className={classes.mobileCenterColumn}>
        <Box className={classes.mobileDiamondWrapper}>
          <DiamondWeb classes={classes} />
        </Box>
        <Box className={classes.mobileAttributesContainer}>
          {attributeComponents}
        </Box>
      </Box>

      {/* Equipamento / Anotações */}
      <Box className={classes.mobileEquipmentSection}>
        <EquipmentNotepad
          character={character}
          onSave={handleEquipmentSave}
          isMobile={true}
        />
      </Box>

      {/* Parte inferior: condições + armas/armadura */}
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

// Aplica os estilos mesclados ao componente
export default withStyles(styles)(React.memo(MobileYearzero));