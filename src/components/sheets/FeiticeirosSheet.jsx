import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Shuffle, 
  Casino 
} from '@mui/icons-material';

import { DiceRollModal } from '../../components';
import useModal from '../../hooks/useModal';

import { useFeiticeirosSheet } from './Feiticos-modos/hooks/useFeiticeirosSheet';

import CharacterInfoSection from './Feiticos-modos/sections/CharacterInfoSection';
import HealthSection from './Feiticos-modos/sections/HealthSection';
import AttributesSection from './Feiticos-modos/sections/AttributesSection';

import PericiasSection from './Feiticos-modos/sections/PericiasSection';
import OficiosSection from './Feiticos-modos/sections/OficiosSection';

import DerivedValuesDisplay from './Feiticos-modos/components/DerivedValuesDisplay';
import DerivedValuesModal from './Feiticos-modos/modals/DerivedValuesModal';

import EditDialogModal from './Feiticos-modos/modals/EditDialogModal';
import MethodSelectionModal from './Feiticos-modos/modals/MethodSelectionModal';
import DistributionModal from './Feiticos-modos/modals/DistributionModal';

import { styles } from './Feiticos-modos/styles/characterSheetStyles';

const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('MUI: The key') && args[0].includes('provided to the classes prop is not implemented')) {
    return;
  }
  originalWarn.apply(console, args);
};

const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('MUI: The key') && args[0].includes('provided to the classes prop is not implemented')) {
    return;
  }
  originalError.apply(console, args);
};

// Versionamento Semântico: 3.8.0 - FIX: Adicionado priority em imagem do logo para LCP
console.log('[FeiticeirosSheet] Versão 3.8.0 - Adicionado priority em imagem do logo para LCP');

const mainStyles = (theme) => {
  const originalStyles = styles(theme);
  
  return {
    ...originalStyles,
    
    layoutContainer: {
      width: '100%',
      maxWidth: '1800px',
      margin: '0 auto',
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0px',
      position: 'relative',
      left: '0',
      right: '0',
      minHeight: '100vh',
      boxSizing: 'border-box',
    },
    
    layoutTopRow: {
      width: '100%',
      maxWidth: '1200px',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      marginBottom: theme.spacing(0),
      marginLeft: 'auto',
      marginRight: 'auto',
      alignItems: 'center',
    },
    
    topRowComponent: {
      width: '100%',
      maxWidth: '1200px',
      minWidth: '300px',
      margin: '0 auto',
    },
    
    layoutMiddleRow: {
      width: '100%',
      maxWidth: '1600px',
      display: 'grid',
      gridTemplateColumns: '400px auto 400px',
      gap: theme.spacing(6),
      marginBottom: theme.spacing(0.5),
      marginLeft: 'auto',
      marginRight: 'auto',
      alignItems: 'start',
      justifyContent: 'center',
      transform: 'scale(0.85)',
      transformOrigin: 'center center',
    },
    
    middleRowWrapper: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing(0),
    },
    
    layoutBottomRow: {
      width: '100%',
      maxWidth: '1200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing(1),
      marginTop: theme.spacing(0),
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    
    mobileMiddleRow: {
      width: '100%',
      maxWidth: '1600px',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(0.5),
      marginLeft: 'auto',
      marginRight: 'auto',
      alignItems: 'center',
    },
    
    expandedColumn: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    
    expandedPericiasContainer: {
      width: '100%',
      maxWidth: '400px',
      minWidth: '380px',
    },
    
    expandedOficiosContainer: {
      width: '100%',
      maxWidth: '400px',
      minWidth: '380px',
    },
    
    centerColumnWrapper: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: '520px',
      maxWidth: '600px',
      margin: '0',
    }
  };
};

function FeiticeirosSheet({
  classes,
  character,
  onUpdate,
  loadingStates = {},
  errors = {}
}) {
  console.log('[FeiticeirosSheet] Iniciando com character ID:', character?.id);
  console.log('[FeiticeirosSheet] Versão 3.8.0 - Callbacks estáveis via refs e priority no logo');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery('(max-width: 430px)');
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const diceRollModal = useModal(({ close, custom }) => {
    return React.createElement(DiceRollModal, {
      handleClose: close,
      characterId: custom.characterId,
      characterName: custom.characterName,
      skillName: custom.skillName,
      skillValue: custom.skillValue,
      onDiceRoll: (rollResult) => {
        if (custom.skillName && rollResult) {
          const rollValue = rollResult.total;
        }
      },
      zIndex: 10000
    });
  }, { defaultZIndex: 10000 });

  // Callback estável via ref para evitar mudanças de referência
  const onUpdateRef = useRef(onUpdate);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Wrapper estável para onUpdate
  const stableOnUpdate = useCallback((type, name, value) => {
    if (onUpdateRef.current) {
      onUpdateRef.current(type, name, value);
    }
  }, []);

  const {
    localAttributes = {
      forca: { value: 0, modifier: 0 },
      agilidade: { value: 0, modifier: 0 },
      intelecto: { value: 0, modifier: 0 },
      presenca: { value: 0, modifier: 0 },
      vigor: { value: 0, modifier: 0 }
    },
    showMethodSelection,
    setShowMethodSelection,
    selectedMethod,
    showDistribution,
    setShowDistribution,
    availableValues = [],
    distributionAttributes = {},
    pontosDisponiveis = 0,
    isLoading = false,
    localErrors = {},
    currentHP = 0,
    currentSoul = 0,
    currentPE = 0,
    maxHP = 0,
    maxPE = 0,
    editDialog,
    setEditDialog,
    pericias = [],
    oficios = [],
    resistencias = [],
    ataques = [],
    characterInfo = {},
    canvasRef,
    wheelPositions = [],
    additionalValues = {},
    showDerivedValuesModal,
    derivedValuesWithBonuses = [],
    derivedValuesBonuses = {},
    handleOpenDerivedValuesModal = () => {},
    handleCloseDerivedValuesModal = () => {},
    handleSaveDerivedValuesBonuses = () => {},
    handleHealthClick = () => {},
    handleSoulClick = () => {},
    handleEnergyClick = () => {},
    handleSaveEdit = () => {},
    handleQuickAction = () => {},
    handleToggleTreinada = () => {},
    handleOutrosChange = () => {},
    handlePericiaRoll = () => {},
    handleCharacterInfoClick = () => {},
    handleMethodSelect = () => {},
    assignValueToAttribute = () => {},
    ajustarAtributoCompra = () => {},
    confirmDistribution = () => {},
    resetDistribution = () => {},
    updateAttribute = () => {},
    handleAttributeRoll = () => {},
    handleInputChange = () => {},
    handleBlur = () => {},
    handleKeyDown = () => {},
    canConfirm = false
  } = useFeiticeirosSheet(character, stableOnUpdate, diceRollModal);

  const modalsContent = useMemo(() => {
    return (
      <>
        {diceRollModal.isOpen && diceRollModal.content}
        
        <DerivedValuesModal
          open={showDerivedValuesModal}
          onClose={handleCloseDerivedValuesModal}
          onSave={handleSaveDerivedValuesBonuses}
          additionalValues={additionalValues}
          currentBonuses={derivedValuesBonuses}
          classes={classes}
          isMobile={isMobile}
        />
        
        <EditDialogModal
          editDialog={editDialog}
          setEditDialog={setEditDialog}
          handleSaveEdit={handleSaveEdit}
          classes={classes}
          isMobile={isMobile}
        />
        
        <MethodSelectionModal
          showMethodSelection={showMethodSelection}
          setShowMethodSelection={setShowMethodSelection}
          selectedMethod={selectedMethod}
          handleMethodSelect={handleMethodSelect}
          classes={classes}
          isMobile={isMobile}
        />
        
        <DistributionModal
          showDistribution={showDistribution}
          setShowDistribution={setShowDistribution}
          setShowMethodSelection={setShowMethodSelection}
          selectedMethod={selectedMethod}
          availableValues={availableValues}
          distributionAttributes={distributionAttributes}
          pontosDisponiveis={pontosDisponiveis}
          isLoading={isLoading}
          localErrors={localErrors}
          character={character}
          diceRollModal={diceRollModal}
          assignValueToAttribute={assignValueToAttribute}
          ajustarAtributoCompra={ajustarAtributoCompra}
          confirmDistribution={confirmDistribution}
          resetDistribution={resetDistribution}
          canConfirm={canConfirm}
          classes={classes}
          isMobile={isMobile}
        />
      </>
    );
  }, [
    diceRollModal.isOpen,
    diceRollModal.content,
    showDerivedValuesModal,
    handleCloseDerivedValuesModal,
    handleSaveDerivedValuesBonuses,
    additionalValues,
    derivedValuesBonuses,
    classes,
    editDialog,
    setEditDialog,
    handleSaveEdit,
    showMethodSelection,
    setShowMethodSelection,
    selectedMethod,
    handleMethodSelect,
    showDistribution,
    setShowDistribution,
    availableValues,
    distributionAttributes,
    pontosDisponiveis,
    isLoading,
    localErrors,
    character,
    diceRollModal,
    assignValueToAttribute,
    ajustarAtributoCompra,
    confirmDistribution,
    resetDistribution,
    canConfirm,
    isMobile
  ]);

  const scaleValue = isSmallMobile ? 0.65 : isMobile ? 0.75 : isTablet ? 0.85 : 0.85;

  return (
    <Box 
      className={classes.layoutContainer}
      sx={{
        transform: `scale(${scaleValue})`,
        transformOrigin: 'top center',
        minHeight: '100vh',
        pb: 1,
      }}
    >
      {modalsContent}
      
      <Box sx={{ 
        width: '100%', 
        mb: 0.5,
        display: 'flex', 
        justifyContent: 'center' 
      }}>
        <Paper className={classes.header}
          sx={{
            p: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
            width: '100%',
            maxWidth: '1200px',
          }}
        >
          <Typography 
            variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h4"} 
            fontWeight="bold"
            sx={{ 
              fontSize: isSmallMobile ? '1.1rem' : isMobile ? '1.3rem' : '1.8rem', 
              textAlign: 'center',
              lineHeight: 1.1
            }}
          >
            FEITICEIROS & MALDIÇÕES
          </Typography>
          <Typography 
            variant="subtitle1"
            sx={{ 
              fontSize: isSmallMobile ? '0.7rem' : isMobile ? '0.8rem' : '0.9rem', 
              textAlign: 'center',
              mt: 0.5
            }}
          >
            Sistema baseado no universo de Jujutsu Kaisen
          </Typography>
          <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 0.5
            }}
          >
            <Button
              className={classes.setupButton}
              startIcon={!isSmallMobile && <Shuffle />}
              onClick={() => setShowMethodSelection(true)}
              size={isSmallMobile ? "small" : isMobile ? "small" : "medium"}
              fullWidth={isSmallMobile}
              sx={isSmallMobile ? { maxWidth: '280px' } : {}}
            >
              {isSmallMobile ? 'Método de Criação' : 'Escolher Método de Criação'}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Box className={classes.layoutTopRow}>
        <Box className={classes.topRowComponent}>
          <CharacterInfoSection
            characterInfo={characterInfo}
            handleCharacterInfoClick={handleCharacterInfoClick}
            classes={classes}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
        </Box>
        
        <Box className={classes.topRowComponent}>
          <HealthSection
            additionalValues={additionalValues}
            currentHP={currentHP}
            currentSoul={currentSoul}
            currentPE={currentPE}
            maxHP={maxHP}
            maxPE={maxPE}
            handleHealthClick={handleHealthClick}
            handleSoulClick={handleSoulClick}
            handleEnergyClick={handleEnergyClick}
            handleQuickAction={handleQuickAction}
            classes={classes}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
        </Box>
        
        <Box className={classes.topRowComponent}>
          <DerivedValuesDisplay
            values={derivedValuesWithBonuses}
            onConfigure={handleOpenDerivedValuesModal}
            classes={classes}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
        </Box>
      </Box>

      {isMobile ? (
        <Box className={classes.mobileMiddleRow}>
          <Box className={classes.expandedPericiasContainer}>
            <PericiasSection
              pericias={pericias}
              localAttributes={localAttributes}
              handleToggleTreinada={handleToggleTreinada}
              handleOutrosChange={handleOutrosChange}
              handlePericiaRoll={handlePericiaRoll}
              character={character}
              classes={classes}
              isMobile={true}
              isSmallMobile={isSmallMobile}
            />
          </Box>
          <Box className={classes.centerColumnWrapper}>
            <AttributesSection
              localAttributes={localAttributes}
              canvasRef={canvasRef}
              wheelPositions={wheelPositions}
              handleInputChange={handleInputChange}
              handleBlur={handleBlur}
              handleKeyDown={handleKeyDown}
              handleAttributeRoll={handleAttributeRoll}
              updateAttribute={updateAttribute}
              classes={classes}
              isMobile={true}
              isSmallMobile={isSmallMobile}
              isTablet={false}
            />
          </Box>
          <Box className={classes.expandedOficiosContainer}>
            <OficiosSection
              oficios={oficios}
              resistencias={resistencias}
              ataques={ataques}
              localAttributes={localAttributes}
              handleToggleTreinada={handleToggleTreinada}
              handleOutrosChange={handleOutrosChange}
              handlePericiaRoll={handlePericiaRoll}
              character={character}
              classes={classes}
              isMobile={true}
              isSmallMobile={isSmallMobile}
            />
          </Box>
        </Box>
      ) : (
        <Box className={classes.middleRowWrapper}>
          <Box className={classes.layoutMiddleRow}>
            <Box className={classes.expandedColumn}>
              <Box className={classes.expandedPericiasContainer}>
                <PericiasSection
                  pericias={pericias}
                  localAttributes={localAttributes}
                  handleToggleTreinada={handleToggleTreinada}
                  handleOutrosChange={handleOutrosChange}
                  handlePericiaRoll={handlePericiaRoll}
                  character={character}
                  classes={classes}
                  isMobile={false}
                  isSmallMobile={false}
                />
              </Box>
            </Box>
            
            <Box className={classes.centerColumnWrapper}>
              <AttributesSection
                localAttributes={localAttributes}
                canvasRef={canvasRef}
                wheelPositions={wheelPositions}
                handleInputChange={handleInputChange}
                handleBlur={handleBlur}
                handleKeyDown={handleKeyDown}
                handleAttributeRoll={handleAttributeRoll}
                updateAttribute={updateAttribute}
                classes={classes}
                isMobile={false}
                isSmallMobile={false}
                isTablet={isTablet}
              />
            </Box>
            
            <Box className={classes.expandedColumn}>
              <Box className={classes.expandedOficiosContainer}>
                <OficiosSection
                  oficios={oficios}
                  resistencias={resistencias}
                  ataques={ataques}
                  localAttributes={localAttributes}
                  handleToggleTreinada={handleToggleTreinada}
                  handleOutrosChange={handleOutrosChange}
                  handlePericiaRoll={handlePericiaRoll}
                  character={character}
                  classes={classes}
                  isMobile={false}
                  isSmallMobile={false}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      <Box className={classes.layoutBottomRow}>
        <Box 
          className={classes.rollButtonContainer}
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Button
            variant="contained"
            size={isSmallMobile ? "small" : isMobile ? "medium" : "medium"}
            onClick={() => {
              if (character) {
                diceRollModal.appear({
                  characterId: character.id,
                  characterName: character.name
                });
              }
            }}
            startIcon={<Casino />}
            className={classes.setupButton}
            disabled={!character}
            fullWidth={isSmallMobile}
            sx={isSmallMobile ? { maxWidth: '280px' } : {}}
          >
            {character ? 'Rolar Dados' : 'Carregando...'}
          </Button>
        </Box>
        <Box sx={{ 
            textAlign: 'center', 
            color: 'text.secondary',
            width: '100%'
          }}
        >
          <Typography variant="body2"
            sx={{ 
              fontSize: isSmallMobile ? '0.6rem' : isMobile ? '0.7rem' : '0.8rem'
            }}
          >
            Sistema em desenvolvimento - Layout Hierárquico com Informações do Personagem
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// Componente memoizado sem função de comparação personalizada
// Deixa o React fazer a comparação padrão
const FeiticeirosSheetMemoized = React.memo(withStyles(mainStyles)(FeiticeirosSheet));

export default FeiticeirosSheetMemoized;