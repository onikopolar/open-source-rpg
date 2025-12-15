import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const styles = (theme) => ({
  healthStressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '200px',
    flexShrink: 0
  },
  healthTracker: {
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #4caf50',
    borderRadius: '4px',
    padding: '10px 12px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
    height: 'fit-content',
    backdropFilter: 'blur(10px)'
  },
  stressTracker: {
    background: 'rgba(255, 255, 255, 0.8)',
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

const HealthStressTracker = ({ classes, healthSquares, stressSquares, onHealthUpdate, onStressUpdate }) => {
  const handleSquareClick = (index, currentSquares, updateFunction) => {
    const newSquares = [...currentSquares];
    const isCurrentlyActive = newSquares[index];
    
    if (isCurrentlyActive) {
      for (let i = index; i < newSquares.length; i++) newSquares[i] = false;
    } else {
      for (let i = 0; i <= index; i++) newSquares[i] = true;
    }
    updateFunction(newSquares);
  };

  const renderSquares = (squaresArray, type, updateFunction) => {
    return squaresArray.map((isActive, index) => {
      const squareNumber = index + 1;
      const squareClass = `${classes.square} ${type === 'health' ? classes.healthSquare : classes.stressSquare} ${isActive ? 'active' : ''}`;
      
      return (
        <Box key={index} display="flex" flexDirection="column" alignItems="center">
          <div 
            className={squareClass}
            onClick={() => handleSquareClick(index, squaresArray, updateFunction)}
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
          {renderSquares(healthSquares, 'health', onHealthUpdate)}
        </Box>
      </Paper>

      <Paper className={classes.stressTracker}>
        <Typography className={`${classes.trackerHeader} ${classes.stressHeader}`}>
          Nível de Estresse
        </Typography>
        <Box className={classes.squaresContainer}>
          {renderSquares(stressSquares, 'stress', onStressUpdate)}
        </Box>
      </Paper>
    </Box>
  );
};

export default HealthStressTracker;
export { styles as healthStressStyles };
