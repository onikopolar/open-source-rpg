import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

// Estilos para o tracker de radiação
const radiationStyles = (theme) => ({
  radiationContainer: {
    background: '#655959cc',
    border: '1px solid #9c27b0',
    borderRadius: '4px',
    padding: '10px 12px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(162, 50, 182, 0.3)',
    height: 'fit-content',
    backdropFilter: 'blur(10px)',
    marginBottom: '15px'
  },
  radiationHeader: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    marginBottom: '6px',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: '0.5px',
    color: '#e868ffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px'
  },
  squaresContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '3px',
    justifyContent: 'center',
    alignItems: 'center'
  },
  square: {
    width: '20px',
    height: '20px',
    border: '1.5px solid #d93af5ff',
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.6rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)'
    },
    '&.active': {
      backgroundColor: '#9c27b0'
    }
  },
  trackerLabel: {
    fontSize: '0.5rem',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '1px',
    color: '#edddf0ff'
  },
  radiationEffects: {
    fontSize: '0.55rem',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: '8px',
    paddingTop: '5px',
    borderTop: '1px dashed rgba(156, 39, 176, 0.3)'
  }
});

const RadiationTracker = ({ 
  classes, 
  radiationSquares = [], 
  onRadiationUpdate 
}) => {
  // Inicializar squares se não estiver definido
  const squares = radiationSquares.length === 10 ? radiationSquares : Array(10).fill(false);

  const handleSquareClick = (index) => {
    if (!onRadiationUpdate) return;
    
    const newSquares = [...squares];
    const isCurrentlyActive = newSquares[index];
    
    if (isCurrentlyActive) {
      // Desmarcar este e todos após
      for (let i = index; i < newSquares.length; i++) {
        newSquares[i] = false;
      }
    } else {
      // Marcar este e todos antes
      for (let i = 0; i <= index; i++) {
        newSquares[i] = true;
      }
    }
    
    onRadiationUpdate(newSquares);
  };

  const renderSquares = () => {
    return squares.map((isActive, index) => {
      const squareNumber = index + 1;
      const squareClass = `${classes.square} ${isActive ? 'active' : ''}`;
      
      return (
        <Box key={index} display="flex" flexDirection="column" alignItems="center">
          <div 
            className={squareClass}
            onClick={() => handleSquareClick(index)}
          />
          <Typography className={classes.trackerLabel}>
            {squareNumber}
          </Typography>
        </Box>
      );
    });
  };

  // Determinar efeitos baseados no nível de radiação
  const getRadiationEffects = () => {
    const activeSquares = squares.filter(Boolean).length;
    
    if (activeSquares === 0) return "Normal";
    if (activeSquares <= 3) return "Leve (+1 stress)";
    if (activeSquares <= 6) return "Moderado (+2 stress)";
    if (activeSquares <= 8) return "Grave (+3 stress, -1 atributo)";
    return "Crítico (+4 stress, -1 atributo, risco de morte)";
  };

  return (
    <Paper className={classes.radiationContainer}>
      <Typography className={classes.radiationHeader}>
        <WarningIcon sx={{ fontSize: 14 }} />
        Radiação
      </Typography>
      <Box className={classes.squaresContainer}>
        {renderSquares()}
      </Box>
      <Typography className={classes.radiationEffects}>
        Efeito: {getRadiationEffects()}
      </Typography>
    </Paper>
  );
};

// Versão corrigida
console.log('[RadiationTracker] Versão 1.0.2 - Fix: Exportação corrigida');

export default RadiationTracker;
export { radiationStyles };
