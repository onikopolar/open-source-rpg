// modals/MethodSelectionModal.js
import React from 'react';
import { withStyles } from '@mui/styles';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Grid, 
  Card, 
  Typography, 
  Box,
  Alert,
  Button
} from '@mui/material';
import { 
  Psychology, 
  SportsEsports, 
  ShoppingCart 
} from '@mui/icons-material';
import { METODOS_CRIACAO } from '../constants/characterSheet';

const styles = {
  methodSelectionModal: {},
  methodIcon: {},
  methodGrid: {},
  methodCard: {},
  methodBadge: {},
  methodTitle: {},
  methodDescription: {}
};

const MethodSelectionModal = React.memo(({ 
  showMethodSelection, 
  setShowMethodSelection, 
  selectedMethod, 
  handleMethodSelect, 
  classes 
}) => {
  if (!showMethodSelection) return null;

  const getMethodIcon = (iconName) => {
    switch (iconName) {
      case 'Psychology': return React.createElement(Psychology, { className: classes.methodIcon });
      case 'SportsEsports': return React.createElement(SportsEsports, { className: classes.methodIcon });
      case 'ShoppingCart': return React.createElement(ShoppingCart, { className: classes.methodIcon });
      default: return React.createElement(Psychology, { className: classes.methodIcon });
    }
  };

  return React.createElement(Dialog, {
    open: showMethodSelection,
    onClose: () => setShowMethodSelection(false),
    maxWidth: "md",
    fullWidth: true,
    className: classes.methodSelectionModal,
    sx: {
      zIndex: 9998,
      '& .MuiBackdrop-root': {
        zIndex: 9997
      }
    }
  },
    React.createElement(DialogTitle, { sx: { textAlign: 'center' } },
      React.createElement(Typography, { variant: "h4", component: "div", fontWeight: "bold", color: "#6a1b9a" },
        'MODO DE CRIAÇÃO'
      ),
      React.createElement(Typography, { variant: "subtitle1", component: "div", color: "textSecondary" },
        'Escolha como criar seus atributos'
      )
    ),
    
    React.createElement(DialogContent, null,
      React.createElement(Alert, { severity: "info", sx: { mb: 3 } },
        React.createElement('strong', null, 'Converse com seu Mestre!'),
        ' Todos os jogadores do grupo devem usar o mesmo método para manter o equilíbrio.'
      ),

      React.createElement(Grid, { container: true, spacing: 3, className: classes.methodGrid },
        Object.values(METODOS_CRIACAO).map((method) =>
          React.createElement(Grid, { item: true, xs: 12, md: 4, key: method.id },
            React.createElement(Card, {
              className: `${classes.methodCard} ${selectedMethod?.id === method.id ? 'selected' : ''}`,
              onClick: () => handleMethodSelect(method)
            },
              React.createElement(Box, { className: classes.methodIcon },
                getMethodIcon(method.icone)
              ),
              
              React.createElement(Box, {
                className: classes.methodBadge,
                style: { backgroundColor: method.badgeColor, color: 'white' }
              }, method.badge),
              
              React.createElement(Typography, { className: classes.methodTitle },
                method.nome
              ),
              
              React.createElement(Typography, { className: classes.methodDescription },
                method.descricao
              ),
              
              React.createElement(Typography, { variant: "body2", color: "textSecondary" },
                method.detalhes
              )
            )
          )
        )
      )
    ),

    React.createElement(DialogActions, null,
      React.createElement(Button, {
        onClick: () => setShowMethodSelection(false),
        variant: "outlined"
      }, 'Cancelar')
    )
  );
});

export default withStyles(styles)(MethodSelectionModal);