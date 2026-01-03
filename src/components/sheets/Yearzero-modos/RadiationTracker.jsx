import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

// Fix: RadiationTracker sem logs de debug
console.log('[RadiationTracker] Versão 1.2.1 - Fix: Logs de debug removidos');

// Estilos para o tracker de radiação
const radiationStyles = (theme) => ({
  radiationContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '200px',
    flexShrink: 0,
    background: '#655959cc',
    border: '1px solid #9c27b0',
    borderRadius: '4px',
    padding: '10px 12px',
    boxShadow: '0 2px 8px rgba(162, 50, 182, 0.3)',
    backdropFilter: 'blur(10px)'
  },
  
  radiationHeader: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    marginBottom: '6px',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: '0.5px',
    color: '#e868ffff'
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
    }
  },
  
  radiationSquare: {
    borderColor: '#d93af5ff',
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
  }
});

const RadiationTracker = ({ 
  classes, 
  radiationSquares = [], 
  onRadiationUpdate 
}) => {
  // Estado interno sincronizado com as props
  const [localSquares, setLocalSquares] = useState(() => 
    radiationSquares.length === 10 ? radiationSquares : Array(10).fill(false)
  );

  // Sincroniza quando a prop muda
  useEffect(() => {
    if (radiationSquares.length === 10) {
      setLocalSquares([...radiationSquares]);
    }
  }, [radiationSquares]);

  const handleSquareClick = (index) => {
    if (!onRadiationUpdate) return;
    
    const newSquares = [...localSquares];
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
    
    // Atualiza estado local primeiro para feedback imediato
    setLocalSquares(newSquares);
    
    // Depois notifica o pai
    onRadiationUpdate(newSquares);
  };

  const renderSquares = () => {
    return localSquares.map((isActive, index) => {
      const squareNumber = index + 1;
      const squareClass = `${classes.square} ${isActive ? 'active' : ''}`;
      
      return (
        <Box key={index} display="flex" flexDirection="column" alignItems="center">
          <div 
            className={squareClass}
            onClick={() => handleSquareClick(index)}
            style={{
              backgroundColor: isActive ? '#9c27b0' : 'transparent'
            }}
          />
          <Typography className={classes.trackerLabel}>
            {squareNumber}
          </Typography>
        </Box>
      );
    });
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
    </Paper>
  );
};

export default RadiationTracker;
export { radiationStyles };