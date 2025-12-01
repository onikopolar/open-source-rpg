// components/CharacterInfoField.js
import React from 'react';
import { withStyles } from '@mui/styles';
import { Box, Typography } from '@mui/material';

// Mapeamento fora do componente para não recriar sempre
const FIELD_CONFIG = {
  nivel: { label: 'NÍVEL' },
  origem: { label: 'ORIGEM' },
  treino: { label: 'TREINO' },
  especializacao: { label: 'ESPECIALIZAÇÃO' },
  tecnica: { label: 'TÉCNICA' },
  experiencia: { label: 'EXPERIÊNCIA' },
  multiclasse: { label: 'MULTICLASSE' },
  grau: { label: 'GRAU' }
};

const styles = {
  fieldContainer: {
    padding: '8px 12px',
    marginBottom: '6px',
    border: '1px solid #b39ddb',
    borderRadius: '4px',
    background: 'rgba(245, 245, 245, 0.8)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: '40px',
    display: 'block',
    '&:hover': {
      background: 'rgba(230, 230, 250, 0.9)',
      borderColor: '#6a1b9a'
    }
  },
  fieldContainerCompact: {
    padding: '4px 6px',
    marginBottom: '2px',
    minHeight: '28px'
  },
  fieldContainerFullWidth: {
    padding: '6px 8px',
    marginBottom: '4px',
    minHeight: '32px'
  },
  labelText: {
    fontWeight: 'bold',
    color: '#6a1b9a',
    fontSize: '0.75rem',
    marginRight: '4px',
    display: 'inline'
  },
  labelTextCompact: {
    fontSize: '0.65rem'
  },
  valueText: {
    fontSize: '0.85rem',
    color: '#333',
    fontWeight: '500',
    display: 'inline',
    marginLeft: '2px'
  },
  valueTextCompact: {
    fontSize: '0.75rem'
  }
};

const CharacterInfoField = React.memo(({ 
  field, 
  value, 
  onClick, 
  compact = false, 
  fullWidth = false,
  classes 
}) => {
  const config = FIELD_CONFIG[field] || { label: field.toUpperCase() };

  const handleClick = React.useCallback(() => {
    onClick?.(field);
  }, [onClick, field]);

  const getContainerClassName = () => {
    if (compact) {
      return fullWidth ? `${classes.fieldContainer} ${classes.fieldContainerFullWidth}` : `${classes.fieldContainer} ${classes.fieldContainerCompact}`;
    }
    return classes.fieldContainer;
  };

  const getLabelClassName = () => {
    return compact ? `${classes.labelText} ${classes.labelTextCompact}` : classes.labelText;
  };

  const getValueClassName = () => {
    return compact ? `${classes.valueText} ${classes.valueTextCompact}` : classes.valueText;
  };

  return React.createElement(Box, {
    onClick: handleClick,
    className: getContainerClassName()
  },
    React.createElement(Typography, {
      variant: 'caption',
      className: getLabelClassName()
    }, `${config.label}:`),
    
    React.createElement(Typography, {
      variant: 'body2',
      className: getValueClassName()
    }, value)
  );
});

// Nome para debugging no React DevTools
CharacterInfoField.displayName = 'CharacterInfoField';

export default withStyles(styles)(CharacterInfoField);