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

const styles = {
  root: {
    position: 'relative'
  },
  configButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'background.paper',
    boxShadow: 1,
    zIndex: 1
  },
  valueCard: {
    height: '100%',
    position: 'relative'
  },
  cardContent: {
    textAlign: 'center',
    padding: '16px'
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px'
  },
  valueText: {
    fontWeight: 'bold',
    marginBottom: '4px'
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
  }
};

const DerivedValuesDisplay = ({ 
  values, 
  onConfigure,
  classes 
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

    return React.createElement(Card, { className: classes.valueCard },
      React.createElement(CardContent, { className: classes.cardContent },
        React.createElement(Box, { className: classes.iconContainer },
          React.cloneElement(icon, { 
            style: { fontSize: 32, color: getColorClass().color } 
          })
        ),
        
        React.createElement(Typography, { 
          variant: "subtitle2", 
          color: "text.secondary",
          gutterBottom: true 
        }, title),
        
        React.createElement(Typography, { 
          variant: "h5",
          className: `${classes.valueText} ${getColorClass()}`
        }, value),

        React.createElement(Typography, { 
          variant: "caption", 
          color: "text.secondary",
          display: "block" 
        }, description)
      )
    );
  };

  return React.createElement(Box, { className: classes.root },
    React.createElement(Tooltip, { title: "Configurar Valores Derivados" },
      React.createElement(IconButton, { 
        size: "small", 
        onClick: onConfigure,
        className: classes.configButton
      },
        React.createElement(SettingsIcon, { fontSize: "small" })
      )
    ),

    React.createElement(Grid, { container: true, spacing: 2 },
      React.createElement(Grid, { item: true, xs: 6, sm: 3 },
        React.createElement(ValueDisplay, {
          title: "ATENÇÃO",
          value: values.ATENÇÃO.valor,
          icon: React.createElement(AttentionIcon),
          description: values.ATENÇÃO.formula,
          color: "primary"
        })
      ),

      React.createElement(Grid, { item: true, xs: 6, sm: 3 },
        React.createElement(ValueDisplay, {
          title: "DEFESA",
          value: values.DEFESA.valor,
          icon: React.createElement(DefenseIcon),
          description: values.DEFESA.formula,
          color: "secondary"
        })
      ),

      React.createElement(Grid, { item: true, xs: 6, sm: 3 },
        React.createElement(ValueDisplay, {
          title: "INICIATIVA",
          value: `${values.INICIATIVA.valor >= 0 ? '+' : ''}${values.INICIATIVA.valor}`,
          icon: React.createElement(InitiativeIcon),
          description: values.INICIATIVA.formula,
          color: "warning"
        })
      ),

      React.createElement(Grid, { item: true, xs: 6, sm: 3 },
        React.createElement(ValueDisplay, {
          title: "DESLOCAMENTO",
          value: `${values.DESLOCAMENTO.valor}m`,
          icon: React.createElement(MovementIcon),
          description: values.DESLOCAMENTO.formula,
          color: "success"
        })
      )
    )
  );
};

export default withStyles(styles)(DerivedValuesDisplay);