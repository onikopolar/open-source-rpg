// components/sheets/Feiticos-modos/components/DerivedValuesDisplay.js
import React from 'react';
import { withStyles } from '@mui/styles';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Psychology as AttentionIcon,
  Shield as DefenseIcon,
  FlashOn as InitiativeIcon,
  DirectionsRun as MovementIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// VERSÃO: 1.1.1 - Ajuste de altura: menos achatado, mais equilibrado
const styles = {
  root: {
    position: 'relative',
    marginBottom: '12px'
  },
  configButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'background.paper',
    boxShadow: 1,
    zIndex: 1,
    padding: '6px'
  },
  valueCard: {
    height: '100%',
    position: 'relative',
    minHeight: '140px' // Ajustado: era 120px
  },
  cardContent: {
    textAlign: 'center',
    padding: '14px 10px', // Ajustado: era 12px 8px
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between'
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px', // Ajustado: era 6px
    flex: '0 0 auto'
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '4px' // Adicionado para espaçamento interno
  },
  valueText: {
    fontWeight: 'bold',
    marginBottom: '4px', // Ajustado: era 2px
    lineHeight: 1.2
  },
  primaryColor: {
    color: '#1976d2'
  },
  secondaryColor: {
    color: '#9c27b0'
  },
  warningColor: {
    color: '#ed6c02'
  },
  successColor: {
    color: '#2e7d32'
  },
  titleText: {
    fontSize: '0.85rem', // Ajustado: era 0.8rem
    lineHeight: 1.2,
    marginBottom: '6px' // Ajustado: era 4px
  },
  descriptionText: {
    fontSize: '0.75rem', // Ajustado: era 0.7rem
    lineHeight: 1.1,
    marginTop: '4px' // Ajustado: era 2px
  }
};

const DerivedValuesDisplay = ({ 
  values, 
  onConfigure,
  classes,
  compact = false,
  itemSpacing = 2
}) => {
  const ValueDisplay = ({ title, value, icon, description, color = 'primary' }) => {
    const getColorClass = () => {
      switch (color) {
        case 'primary': return classes.primaryColor;
        case 'secondary': return classes.secondaryColor;
        case 'warning': return classes.warningColor;
        case 'success': return classes.successColor;
        default: return classes.primaryColor;
      }
    };

    const cardHeight = compact ? '130px' : '140px'; // Ajustado
    const iconSize = compact ? 26 : 30; // Ajustado: era 24/28
    const titleSize = compact ? '0.8rem' : '0.85rem'; // Ajustado
    const valueSize = compact ? '1.25rem' : '1.5rem'; // Ajustado: era 1.1/1.25
    const descSize = compact ? '0.7rem' : '0.75rem'; // Ajustado

    return React.createElement(Card, { 
      className: classes.valueCard,
      style: { minHeight: cardHeight }
    },
      React.createElement(CardContent, { 
        className: classes.cardContent,
        style: { padding: compact ? '10px 8px' : '14px 10px' }
      },
        React.createElement(Box, { className: classes.iconContainer },
          React.cloneElement(icon, { 
            style: { 
              fontSize: iconSize, 
              color: getColorClass().color 
            } 
          })
        ),
        
        React.createElement(Box, { className: classes.contentWrapper },
          React.createElement(Typography, { 
            variant: "subtitle2", 
            color: "text.secondary",
            className: classes.titleText,
            style: { fontSize: titleSize }
          }, title),
          
          React.createElement(Typography, { 
            variant: compact ? "h5" : "h5", // Mantido h5
            className: `${classes.valueText} ${getColorClass()}`,
            style: { fontSize: valueSize }
          }, value),

          React.createElement(Typography, { 
            variant: "caption", 
            color: "text.secondary",
            className: classes.descriptionText,
            style: { fontSize: descSize }
          }, description)
        )
      )
    );
  };

  // Garante que os valores existam
  const safeValues = values || {
    ATENÇÃO: { valor: 0, formula: '' },
    DEFESA: { valor: 0, formula: '' },
    INICIATIVA: { valor: 0, formula: '' },
    DESLOCAMENTO: { valor: 0, formula: '' }
  };

  return React.createElement(Box, { 
    className: classes.root,
    style: { marginBottom: compact ? '8px' : '12px' }
  },
    React.createElement(Tooltip, { title: "Configurar Valores Derivados" },
      React.createElement(IconButton, { 
        size: "small", 
        onClick: onConfigure,
        className: classes.configButton,
        style: { 
          top: compact ? -6 : -8, 
          right: compact ? -6 : -8,
          padding: compact ? '4px' : '6px'
        }
      },
        React.createElement(SettingsIcon, { 
          fontSize: compact ? "small" : "small" 
        })
      )
    ),

    React.createElement(Grid, { 
      container: true, 
      spacing: compact ? 1.5 : itemSpacing 
    },
      React.createElement(Grid, { item: true, xs: 6, sm: 3 },
        React.createElement(ValueDisplay, {
          title: "ATENÇÃO",
          value: safeValues.ATENÇÃO.valor,
          icon: React.createElement(AttentionIcon),
          description: safeValues.ATENÇÃO.formula || "Intelecto + Presença",
          color: "primary",
          compact
        })
      ),

      React.createElement(Grid, { item: true, xs: 6, sm: 3 },
        React.createElement(ValueDisplay, {
          title: "DEFESA",
          value: safeValues.DEFESA.valor,
          icon: React.createElement(DefenseIcon),
          description: safeValues.DEFESA.formula || "Agilidade + Vigor",
          color: "secondary",
          compact
        })
      ),

      React.createElement(Grid, { item: true, xs: 6, sm: 3 },
        React.createElement(ValueDisplay, {
          title: "INICIATIVA",
          value: `${safeValues.INICIATIVA.valor >= 0 ? '+' : ''}${safeValues.INICIATIVA.valor}`,
          icon: React.createElement(InitiativeIcon),
          description: safeValues.INICIATIVA.formula || "Agilidade + Presença",
          color: "warning",
          compact
        })
      ),

      React.createElement(Grid, { item: true, xs: 6, sm: 3 },
        React.createElement(ValueDisplay, {
          title: "DESLOCAMENTO",
          value: `${safeValues.DESLOCAMENTO.valor}m`,
          icon: React.createElement(MovementIcon),
          description: safeValues.DESLOCAMENTO.formula || "Força + Agilidade",
          color: "success",
          compact
        })
      )
    )
  );
};

// Props padrão
DerivedValuesDisplay.defaultProps = {
  values: {
    ATENÇÃO: { valor: 0, formula: 'Intelecto + Presença' },
    DEFESA: { valor: 0, formula: 'Agilidade + Vigor' },
    INICIATIVA: { valor: 0, formula: 'Agilidade + Presença' },
    DESLOCAMENTO: { valor: 0, formula: 'Força + Agilidade' }
  },
  onConfigure: () => {},
  compact: false,
  itemSpacing: 2
};

export default withStyles(styles)(DerivedValuesDisplay);