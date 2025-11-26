import React from 'react';
import { withStyles } from '@mui/styles';
import { 
  Box, 
  Typography, 
  Paper, 
  Button 
} from '@mui/material';
import { 
  Shuffle, 
  Casino 
} from '@mui/icons-material';

import { DiceRollModal } from '../../components';
import useModal from '../../hooks/useModal';

// Import dos módulos organizados
import { useFeiticeirosSheet } from './Feiticos-modos/hooks/useFeiticeirosSheet';

// Import das seções organizadas
import CharacterInfoSection from './Feiticos-modos/sections/CharacterInfoSection';
import HealthSection from './Feiticos-modos/sections/HealthSection';
import AttributesSection from './Feiticos-modos/sections/AttributesSection';

// ✅ NOVO: Import dos componentes separados
import PericiasSection from './Feiticos-modos/sections/PericiasSection';
import OficiosSection from './Feiticos-modos/sections/OficiosSection';

// ✅ NOVO: Import dos componentes Derived Values
import DerivedValuesDisplay from './Feiticos-modos/components/DerivedValuesDisplay';
import DerivedValuesModal from './Feiticos-modos/modals/DerivedValuesModal';

// Import dos modals organizados
import EditDialogModal from './Feiticos-modos/modals/EditDialogModal';
import MethodSelectionModal from './Feiticos-modos/modals/MethodSelectionModal';
import DistributionModal from './Feiticos-modos/modals/DistributionModal';

// Import dos estilos organizados
import { styles } from './Feiticos-modos/styles/characterSheetStyles';

// Main Component
function FeiticeirosSheet({
  classes,
  character,
  onUpdate,
  loadingStates = {},
  errors = {}
}) {
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
          // Esta função será passada via hook se necessário
        }
      },
      zIndex: 10000
    });
  }, { defaultZIndex: 10000 });

  const {
    localAttributes,
    showMethodSelection,
    setShowMethodSelection,
    selectedMethod,
    showDistribution,
    setShowDistribution,
    availableValues,
    distributionAttributes,
    pontosDisponiveis,
    isLoading,
    localErrors,
    currentHP,
    currentSoul,
    currentPE,
    maxHP,
    maxPE,
    editDialog,
    setEditDialog,
    pericias,
    oficios,
    resistencias,
    ataques,
    characterInfo,
    canvasRef,
    wheelPositions,
    additionalValues,
    
    // ✅ NOVO: Estados e handlers para Derived Values
    showDerivedValuesModal,
    derivedValuesWithBonuses,
    derivedValuesBonuses,
    handleOpenDerivedValuesModal,
    handleCloseDerivedValuesModal,
    handleSaveDerivedValuesBonuses,
    
    // Handlers existentes
    handleHealthClick,
    handleSoulClick,
    handleEnergyClick,
    handleSaveEdit,
    handleQuickAction,
    handleToggleTreinada,
    handleOutrosChange,
    handlePericiaRoll,
    handleCharacterInfoClick,
    handleMethodSelect,
    assignValueToAttribute,
    ajustarAtributoCompra,
    confirmDistribution,
    resetDistribution,
    updateAttribute,
    handleAttributeRoll,
    handleInputChange,
    handleBlur,
    handleKeyDown,
    canConfirm
  } = useFeiticeirosSheet(character, onUpdate, diceRollModal);

  return React.createElement(Box, { className: classes.container },
    diceRollModal.isOpen && diceRollModal.content,
    
    // ✅ NOVO: Modal de Derived Values
    React.createElement(DerivedValuesModal, {
      open: showDerivedValuesModal,
      onClose: handleCloseDerivedValuesModal,
      onSave: handleSaveDerivedValuesBonuses,
      additionalValues: additionalValues,
      currentBonuses: derivedValuesBonuses,
      classes
    }),
    
    React.createElement(EditDialogModal, {
      editDialog,
      setEditDialog,
      handleSaveEdit,
      classes
    }),
    
    React.createElement(MethodSelectionModal, {
      showMethodSelection,
      setShowMethodSelection,
      selectedMethod,
      handleMethodSelect,
      classes
    }),
    
    React.createElement(DistributionModal, {
      showDistribution,
      setShowDistribution,
      selectedMethod,
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
      classes
    }),
    
    React.createElement(Paper, { className: classes.header },
      React.createElement(Typography, { variant: "h4", fontWeight: "bold" },
        'FEITICEIROS & MALDIÇÕES'
      ),
      React.createElement(Typography, { variant: "subtitle1" },
        'Sistema baseado no universo de Jujutsu Kaisen'
      ),
      React.createElement(Button, {
        className: classes.setupButton,
        startIcon: React.createElement(Shuffle),
        onClick: () => setShowMethodSelection(true)
      }, 'Escolher Método de Criação')
    ),

    React.createElement(CharacterInfoSection, {
      characterInfo,
      handleCharacterInfoClick,
      classes
    }),

    React.createElement(HealthSection, {
      additionalValues,
      currentHP,
      currentSoul,
      currentPE,
      maxHP,
      maxPE,
      handleHealthClick,
      handleSoulClick,
      handleEnergyClick,
      handleQuickAction,
      classes
    }),

    // ✅ NOVO: Seção de Derived Values Display
    React.createElement(Box, { 
      sx: { 
        mb: 3, 
        px: 2 
      } 
    },
      React.createElement(DerivedValuesDisplay, {
        values: derivedValuesWithBonuses,
        onConfigure: handleOpenDerivedValuesModal,
        classes
      })
    ),

    // ✅ ORDEM CORRETA: Perícias | Atributos | Ofícios
    React.createElement(Box, { 
      className: classes.hierarchicalLayout,
      sx: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 3,
        alignItems: 'start'
      }
    },
      // ⬅️ PERÍCIAS - ESQUERDA (APENAS PERÍCIAS)
      React.createElement(PericiasSection, {
        pericias,
        localAttributes,
        handleToggleTreinada,
        handleOutrosChange,
        handlePericiaRoll,
        character,
        classes
      }),

      // 🎯 ATRIBUTOS - CENTRO
      React.createElement(AttributesSection, {
        localAttributes,
        canvasRef,
        wheelPositions,
        handleInputChange,
        handleBlur,
        handleKeyDown,
        handleAttributeRoll,
        updateAttribute,
        classes
      }),

      // ➡️ OFÍCIOS - DIREITA (OFÍCIOS, RESISTÊNCIAS, ATAQUES)
      React.createElement(OficiosSection, {
        oficios,
        resistencias,
        ataques,
        localAttributes,
        handleToggleTreinada,
        handleOutrosChange,
        handlePericiaRoll,
        character,
        classes
      })
    ),

    React.createElement(Box, { className: classes.rollButtonContainer },
      React.createElement(Button, {
        variant: "contained",
        size: "large",
        onClick: () => {
          if (character) {
            diceRollModal.appear({
              characterId: character.id,
              characterName: character.name
            });
          }
        },
        startIcon: React.createElement(Casino),
        className: classes.setupButton,
        disabled: !character
      }, character ? 'Rolar Dados' : 'Carregando...')
    ),

    React.createElement(Box, { 
      sx: { 
        textAlign: 'center', 
        mt: 4, 
        color: 'text.secondary' 
      } 
    },
      React.createElement(Typography, { variant: "body2" },
        'Sistema em desenvolvimento - Layout Hierárquico com Informações do Personagem'
      )
    )
  );
}

export default withStyles(styles)(FeiticeirosSheet);