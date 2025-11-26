// components/CharacterInfoField.js
import React from 'react';
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

const CharacterInfoField = React.memo(({ field, value, onClick, compact = false, fullWidth = false }) => {
  const config = FIELD_CONFIG[field] || { label: field.toUpperCase() };

  // useCallback seria ideal mas não temos hooks aqui
  const handleClick = React.useCallback(() => {
    onClick?.(field);
  }, [onClick, field]);

  const fieldStyle = React.useMemo(() => ({
    padding: compact ? (fullWidth ? '6px 8px' : '4px 6px') : '8px 12px',
    marginBottom: compact ? (fullWidth ? '4px' : '2px') : '6px',
    border: '1px solid #b39ddb',
    borderRadius: '4px',
    background: 'rgba(245, 245, 245, 0.8)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: compact ? (fullWidth ? '32px' : '28px') : '40px',
    display: 'block',
    '&:hover': {
      background: 'rgba(230, 230, 250, 0.9)',
      borderColor: '#6a1b9a'
    }
  }), [compact, fullWidth]);

  return React.createElement(Box, {
    onClick: handleClick,
    style: fieldStyle
  },
    React.createElement(Typography, {
      variant: 'caption',
      style: {
        fontWeight: 'bold',
        color: '#6a1b9a',
        fontSize: compact ? '0.65rem' : '0.75rem',
        marginRight: '4px',
        display: 'inline'
      }
    }, `${config.label}:`),
    
    React.createElement(Typography, {
      variant: 'body2',
      style: {
        fontSize: compact ? '0.75rem' : '0.85rem',
        color: '#333',
        fontWeight: '500',
        display: 'inline',
        marginLeft: '2px'
      }
    }, value)
  );
});

// Nome para debugging no React DevTools
CharacterInfoField.displayName = 'CharacterInfoField';

export default CharacterInfoField;