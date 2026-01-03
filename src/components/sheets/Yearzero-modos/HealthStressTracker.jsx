import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';

// Fix: Removidos logs de debug para limpeza do console
console.log('[HealthStressTracker] Versão 1.3.1 - Fix: Logs de debug removidos');

const styles = (theme) => ({
  healthStressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '200px',
    flexShrink: 0
  },
  healthTracker: {
    background: '#655959cc',
    border: '1px solid #4caf50',
    borderRadius: '4px',
    padding: '10px 12px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
    height: 'fit-content',
    backdropFilter: 'blur(10px)'
  },
  stressTracker: {
    background: '#655959cc',
    border: '1px solid #ff6b35',
    borderRadius: '4px',
    padding: '10px 12px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)',
    height: 'fit-content',
    backdropFilter: 'blur(10px)'
  },
  trackerHeader: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    marginBottom: '6px',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: '0.5px'
  },
  healthHeader: {
    color: '#4caf50'
  },
  stressHeader: {
    color: '#ff6b35'
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
    border: '1.5px solid',
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
  healthSquare: {
    borderColor: '#4caf50',
    '&.active': {
      backgroundColor: '#4caf50'
    }
  },
  stressSquare: {
    borderColor: '#ff6b35',
    '&.active': {
      backgroundColor: '#ff6b35'
    }
  },
  trackerLabel: {
    fontSize: '0.5rem',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '1px'
  }
});

const HealthStressTracker = ({ 
  classes, 
  healthSquares = [], 
  stressSquares = [], 
  onHealthUpdate, 
  onStressUpdate 
}) => {
  // Estados internos sincronizados com as props
  const [localHealthSquares, setLocalHealthSquares] = useState(() => 
    healthSquares.length === 10 ? healthSquares : Array(10).fill(false)
  );
  
  const [localStressSquares, setLocalStressSquares] = useState(() => 
    stressSquares.length === 10 ? stressSquares : Array(10).fill(false)
  );

  // Sincroniza quando as props mudam
  useEffect(() => {
    if (healthSquares.length === 10) {
      setLocalHealthSquares([...healthSquares]);
    }
  }, [healthSquares]);

  useEffect(() => {
    if (stressSquares.length === 10) {
      setLocalStressSquares([...stressSquares]);
    }
  }, [stressSquares]);

  const handleSquareClick = (index, squaresArray, setLocalSquares, updateFunction) => {
    if (!updateFunction) return;
    
    const newSquares = [...squaresArray];
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
    updateFunction(newSquares);
  };

  const renderSquares = (squaresArray, type, setLocalSquares, updateFunction) => {
    return squaresArray.map((isActive, index) => {
      const squareNumber = index + 1;
      const squareClass = `${classes.square} ${type === 'health' ? classes.healthSquare : classes.stressSquare} ${isActive ? 'active' : ''}`;
      
      return (
        <Box key={index} display="flex" flexDirection="column" alignItems="center">
          <div 
            className={squareClass}
            onClick={() => handleSquareClick(index, squaresArray, setLocalSquares, updateFunction)}
            style={{
              backgroundColor: isActive ? (type === 'health' ? '#4caf50' : '#ff6b35') : 'transparent'
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
    <Box className={classes.healthStressContainer}>
      <Paper className={classes.healthTracker}>
        <Typography className={`${classes.trackerHeader} ${classes.healthHeader}`}>
          Pontos de Vida
        </Typography>
        <Box className={classes.squaresContainer}>
          {renderSquares(localHealthSquares, 'health', setLocalHealthSquares, onHealthUpdate)}
        </Box>
      </Paper>

      <Paper className={classes.stressTracker}>
        <Typography className={`${classes.trackerHeader} ${classes.stressHeader}`}>
          Nível de Estresse
        </Typography>
        <Box className={classes.squaresContainer}>
          {renderSquares(localStressSquares, 'stress', setLocalStressSquares, onStressUpdate)}
        </Box>
      </Paper>
    </Box>
  );
};

export default HealthStressTracker;
export { styles as healthStressStyles };