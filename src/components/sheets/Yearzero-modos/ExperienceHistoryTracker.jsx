import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';

console.log('[ExperienceHistoryTracker] Versão 4.0 - Fix: Paleta FODA alinhada com tema');

const styles = (theme) => ({
  experienceHistoryContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '200px',
    flexShrink: 0
  },
  experienceTracker: {
    background: '#655959cc',
    // COR PRIMÁRIA DO TEMA: #639EC2 (azul claro)
    border: '1px solid #639EC2',
    borderRadius: '4px',
    padding: '10px 12px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(99, 158, 194, 0.3)',
    height: 'fit-content',
    backdropFilter: 'blur(10px)'
  },
  historyTracker: {
    background: '#655959cc',
    // COR COMPLEMENTAR: #4ECDC4 (verde azulado turquesa)
    border: '1px solid #4ECDC4',
    borderRadius: '4px',
    padding: '10px 12px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(78, 205, 196, 0.3)',
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
  experienceHeader: {
    // COR PRIMÁRIA: #639EC2
    color: '#639EC2'
  },
  historyHeader: {
    // COR COMPLEMENTAR: #4ECDC4
    color: '#4ECDC4'
  },
  squaresContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '3px',
    justifyContent: 'center',
    alignItems: 'center'
  },
  historySquaresContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    width: '100%',
    boxSizing: 'border-box'
  },
  square: {
    width: '20px',
    height: '20px',
    border: '1.5px solid',
    borderRadius: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)'
    }
  },
  experienceSquare: {
    // COR PRIMÁRIA: #639EC2
    borderColor: '#639EC2',
    '&.active': {
      backgroundColor: '#639EC2'
    }
  },
  historySquare: {
    // COR COMPLEMENTAR: #4ECDC4
    borderColor: '#4ECDC4',
    '&.active': {
      backgroundColor: '#4ECDC4'
    }
  },
  trackerLabel: {
    fontSize: '0.5rem',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '2px',
    display: 'block'
  }
});

const ExperienceHistoryTracker = ({ 
  classes, 
  experienceSquares = [], 
  historySquares = [], 
  onExperienceUpdate,
  onHistoryUpdate
}) => {
  const [localExperienceSquares, setLocalExperienceSquares] = useState(() => 
    experienceSquares.length === 10 ? experienceSquares : Array(10).fill(false)
  );
  
  const [localHistorySquares, setLocalHistorySquares] = useState(() => 
    historySquares.length === 3 ? historySquares : Array(3).fill(false)
  );

  useEffect(() => {
    if (experienceSquares.length === 10) {
      setLocalExperienceSquares([...experienceSquares]);
    }
  }, [experienceSquares]);

  useEffect(() => {
    if (historySquares.length === 3) {
      setLocalHistorySquares([...historySquares]);
    }
  }, [historySquares]);

  const handleSquareClick = (index, squaresArray, setLocalSquares, updateFunction, maxSquares) => {
    if (!updateFunction) return;
    
    const newSquares = [...squaresArray];
    const isCurrentlyActive = newSquares[index];
    
    if (isCurrentlyActive) {
      for (let i = index; i < maxSquares; i++) {
        newSquares[i] = false;
      }
    } else {
      for (let i = 0; i <= index; i++) {
        newSquares[i] = true;
      }
    }
    
    setLocalSquares(newSquares);
    updateFunction(newSquares);
  };

  // Experience - cor primária do tema #639EC2
  const renderExperienceSquares = () => {
    return localExperienceSquares.map((isActive, index) => {
      const squareNumber = index + 1;
      const squareClass = `${classes.square} ${classes.experienceSquare} ${isActive ? 'active' : ''}`;
      
      return (
        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div 
            className={squareClass}
            onClick={() => handleSquareClick(index, localExperienceSquares, setLocalExperienceSquares, onExperienceUpdate, 10)}
            style={{
              backgroundColor: isActive ? '#639EC2' : 'transparent'
            }}
          />
          <Typography className={classes.trackerLabel}>
            {squareNumber}
          </Typography>
        </div>
      );
    });
  };

  // History - cor complementar #4ECDC4
  const renderHistorySquares = () => {
    return localHistorySquares.map((isActive, index) => {
      const squareNumber = index + 1;
      const squareClass = `${classes.square} ${classes.historySquare} ${isActive ? 'active' : ''}`;
      
      return (
        <div key={index} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          flex: '1',
          maxWidth: '33%'
        }}>
          <div 
            className={squareClass}
            onClick={() => handleSquareClick(index, localHistorySquares, setLocalHistorySquares, onHistoryUpdate, 3)}
            style={{
              backgroundColor: isActive ? '#4ECDC4' : 'transparent'
            }}
          />
          <Typography className={classes.trackerLabel}>
            {squareNumber}
          </Typography>
        </div>
      );
    });
  };

  return (
    <Box className={classes.experienceHistoryContainer}>
      <Paper className={classes.experienceTracker}>
        <Typography className={`${classes.trackerHeader} ${classes.experienceHeader}`}>
          Pontos de Experiência
        </Typography>
        <Box className={classes.squaresContainer}>
          {renderExperienceSquares()}
        </Box>
      </Paper>

      <Paper className={classes.historyTracker}>
        <Typography className={`${classes.trackerHeader} ${classes.historyHeader}`}>
          Pontos de História
        </Typography>
        <Box className={classes.historySquaresContainer}>
          {renderHistorySquares()}
        </Box>
      </Paper>
    </Box>
  );
};

export default ExperienceHistoryTracker;
export { styles as experienceHistoryStyles };