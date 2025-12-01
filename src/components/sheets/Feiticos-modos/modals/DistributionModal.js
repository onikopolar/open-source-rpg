// modals/DistributionModal.js - VERSÃO LIMPA SEM LOGS
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  Button,
  TextField,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Check,
  Close,
  Casino,
  Shuffle
} from '@mui/icons-material';
import { METODOS_CRIACAO, TABELA_CUSTOS } from '../constants/characterSheet';

const DistributionModal = React.memo(({
  showDistribution,
  setShowDistribution,
  setShowMethodSelection,
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
}) => {
  if (!showDistribution) {
    return null;
  }

  const renderMethodContent = () => {
    switch (selectedMethod?.id) {
      case 'FIXOS':
        return React.createElement(React.Fragment, null,
          React.createElement(Alert, { severity: "info", sx: { mb: 3 } },
            React.createElement('strong', null, 'Método Valores Fixos:'),
            ' Distribua os 6 valores entre os atributos. Todos os jogadores começam com a mesma pontuação total.'
          ),

          React.createElement(Box, { sx: { mb: 3 } },
            React.createElement(Typography, { variant: "h6", gutterBottom: true },
              'Valores Disponíveis:'
            ),
            React.createElement(Box, { className: classes.availableValues },
              availableValues.map((value, index) =>
                React.createElement(Box, {
                  key: index,
                  className: classes.valueChip,
                  onClick: () => {
                    const emptyAttributeIndex = distributionAttributes.findIndex(
                      attr => attr.assignedValue === null
                    );
                    
                    if (emptyAttributeIndex !== -1) {
                      assignValueToAttribute(emptyAttributeIndex, value);
                    }
                  }
                }, value)
              )
            )
          )
        );

      case 'ROLAGEM':
        return React.createElement(Alert, { severity: "warning", sx: { mb: 3 } },
          React.createElement('strong', null, 'Método Rolagem:'),
          ' A sorte decide! Role 4d6 para cada atributo (descarte o menor). Personagens únicos mas podem ser desbalanceados.'
        );

      case 'COMPRA':
        return React.createElement(React.Fragment, null,
          React.createElement(Alert, { severity: "info", sx: { mb: 3 } },
            React.createElement('strong', null, 'Método Compra por Pontos:'),
            ' Use 17 pontos para comprar melhorias. Você pode piorar atributos para ganhar mais pontos!'
          ),

          React.createElement(Box, { className: classes.pointsSystem },
            React.createElement(Box, { className: classes.pointsDisplay },
              `Pontos Disponíveis: ${pontosDisponiveis}`
            ),
            
            React.createElement(Typography, { variant: "body2", color: "textSecondary", sx: { mb: 2 } },
              'Tabela de Custos: 8[+2] 9[+1] 10[0] 11[2] 12[3] 13[4] 14[5] 15[7]'
            )
          )
        );

      default:
        return null;
    }
  };

  const renderAttributeControls = (attribute, index) => {
    if (selectedMethod?.id === 'COMPRA') {
      return React.createElement(Box, { display: "flex", alignItems: "center", gap: 1 },
        React.createElement(IconButton, {
          size: "small",
          onClick: () => {
            ajustarAtributoCompra(index, attribute.value - 1);
          },
          disabled: attribute.value <= 8 || isLoading
        }, React.createElement(Close)),
        
        React.createElement(Typography, {
          fontWeight: "bold",
          minWidth: "30px",
          textAlign: "center",
          color: attribute.value === 10 ? 'text.secondary' : 'primary.main'
        }, attribute.value),
        
        React.createElement(IconButton, {
          size: "small",
          onClick: () => {
            ajustarAtributoCompra(index, attribute.value + 1);
          },
          disabled: attribute.value >= 15 || isLoading
        }, React.createElement(Check))
      );
    }

    return React.createElement(Box, { display: "flex", alignItems: "center", gap: 1 },
      React.createElement(TextField, {
        type: "number",
        value: attribute.value,
        onChange: (e) => {
          const newValue = parseInt(e.target.value) || 0;
        },
        inputProps: { 
          min: 0, 
          max: 30,
          style: { 
            textAlign: 'center',
            width: '60px',
            padding: '4px 8px'
          }
        },
        size: "small",
        variant: "outlined",
        disabled: isLoading
      }),
      React.createElement(IconButton, {
        size: "small",
        onClick: () => {
          if (character && !isLoading) {
            diceRollModal.appear({
              characterId: character.id,
              characterName: character.name,
              skillName: attribute.name,
              skillValue: attribute.value
            });
          }
        },
        className: classes.diceButtonWheel,
        disabled: isLoading
      }, React.createElement(Casino))
    );
  };

  const renderStatusAlerts = () => {
    const canConfirmResult = canConfirm ? canConfirm() : false;

    return React.createElement(React.Fragment, null,
      selectedMethod?.id === 'FIXOS' && availableValues.length === 0 && React.createElement(Alert, { severity: "success", sx: { mt: 2 } },
        'Todos os valores foram distribuídos!'
      ),

      selectedMethod?.id === 'COMPRA' && pontosDisponiveis < 0 && React.createElement(Alert, { severity: "warning", sx: { mt: 2 } },
        `Você está com ${Math.abs(pontosDisponiveis)} pontos negativos! Isso significa que seus atributos estão abaixo da média.`
      )
    );
  };

  const handleConfirmClick = () => {
    if (typeof confirmDistribution !== 'function') {
      return;
    }

    if (!canConfirm) {
      return;
    }

    const canConfirmResult = canConfirm();

    if (!canConfirmResult || isLoading) {
      return;
    }

    confirmDistribution();
  };

  const handleBackClick = () => {
    setShowDistribution(false);
    setShowMethodSelection(true);
  };

  const handleResetClick = () => {
    resetDistribution();
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      setShowDistribution(false);
    }
  };

  return React.createElement(Dialog, {
    open: showDistribution,
    onClose: handleCloseModal,
    maxWidth: "md",
    className: classes.distributionModal,
    sx: {
      zIndex: 9998,
      '& .MuiBackdrop-root': {
        zIndex: 9997
      }
    }
  },
    isLoading && React.createElement(Box, { className: classes.loadingOverlay },
      React.createElement(CircularProgress)
    ),
    
    React.createElement(DialogTitle, { sx: { textAlign: 'center' } },
      React.createElement(Typography, { variant: "h5", component: "div", fontWeight: "bold" },
        selectedMethod?.nome || 'Método Desconhecido'
      ),
      React.createElement(Typography, { variant: "body2", component: "div", color: "textSecondary" },
        selectedMethod?.descricao || 'Descrição não disponível'
      )
    ),
    
    React.createElement(DialogContent, null,
      renderMethodContent(),

      localErrors.distribution && React.createElement(Alert, { severity: "error", sx: { mb: 2 } },
        localErrors.distribution
      ),

      React.createElement(Box, null,
        React.createElement(Typography, { variant: "h6", gutterBottom: true },
          'Atributos:'
        ),
        distributionAttributes.map((attribute, index) =>
          React.createElement(Box, { 
            key: attribute.name, 
            className: classes.attributeDistribution,
            sx: { 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px',
              margin: '5px 0',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              background: 'white',
              '&:hover': {
                backgroundColor: '#f9f9f9'
              }
            }
          },
            React.createElement(Box, { flex: 1 },
              React.createElement(Typography, { fontWeight: "bold", gutterBottom: true },
                attribute.name
              ),
              React.createElement(Typography, { variant: "caption", color: "textSecondary" },
                attribute.description
              )
            ),
            
            React.createElement(Box, { display: "flex", alignItems: "center", gap: 2 },
              renderAttributeControls(attribute, index)
            )
          )
        )
      ),

      renderStatusAlerts()
    ),
    
    React.createElement(DialogActions, { sx: { justifyContent: 'space-between', p: 3 } },
      React.createElement(Button, {
        onClick: handleResetClick,
        startIcon: React.createElement(Shuffle),
        variant: "outlined",
        disabled: isLoading
      }, 'Reiniciar'),
      
      React.createElement(Box, { display: "flex", gap: 1 },
        React.createElement(Button, {
          onClick: handleBackClick,
          variant: "outlined",
          disabled: isLoading
        }, '← Voltar'),
        
        React.createElement(Button, {
          onClick: handleConfirmClick,
          variant: "contained",
          startIcon: React.createElement(Check),
          disabled: !canConfirm || !canConfirm() || isLoading,
          className: classes.setupButton,
          sx: {
            backgroundColor: '#4a148c',
            '&:hover': {
              backgroundColor: '#6a1b9a'
            }
          }
        }, isLoading ? 'Salvando...' : 'Confirmar')
      )
    )
  );
});

export default DistributionModal;