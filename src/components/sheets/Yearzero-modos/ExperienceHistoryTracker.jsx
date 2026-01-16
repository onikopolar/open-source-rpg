import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

console.log('[ExperienceHistoryTracker] Versão 5.0.0 - MAJOR: Redesign minimalista para identidade visual angular e densa do sistema');

const PALETA_PRINCIPAL = {
  atributo: '#ff6b35',
  habilidade: '#1976d2',
  fundo: 'rgba(18, 23, 33, 0.98)',
  texto: 'rgba(255, 255, 255, 0.95)',
  borda: 'rgba(255, 107, 53, 0.3)',
  destaque: '#ff8c5a',
  fundo_input: 'rgba(25, 30, 40, 0.9)'
};

const ExperienceHistoryTracker = ({ 
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

  const getActiveCount = (squares) => squares.filter(s => s).length;

  const renderExperienceSquares = () => {
    return localExperienceSquares.map((isActive, index) => {
      const squareNumber = index + 1;
      
      return (
        <Box key={index} display="flex" flexDirection="column" alignItems="center">
          <Box 
            sx={{
              width: 20,
              height: 20,
              border: `1.5px solid ${isActive ? '#639EC2' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
              backgroundColor: isActive ? '#639EC2' : 'transparent',
              '&:hover': {
                borderColor: '#639EC2',
              }
            }}
            onClick={() => handleSquareClick(index, localExperienceSquares, setLocalExperienceSquares, onExperienceUpdate, 10)}
          >
            <Typography 
              sx={{ 
                color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: isActive ? 800 : 500,
                fontSize: '0.65rem',
              }}
            >
              {squareNumber}
            </Typography>
          </Box>
        </Box>
      );
    });
  };

  const renderHistorySquares = () => {
    return localHistorySquares.map((isActive, index) => {
      const squareNumber = index + 1;
      
      return (
        <Box key={index} sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          flex: '1',
          maxWidth: '33%'
        }}>
          <Box 
            sx={{
              width: 24,
              height: 24,
              border: `1.5px solid ${isActive ? '#4ECDC4' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
              backgroundColor: isActive ? '#4ECDC4' : 'transparent',
              '&:hover': {
                borderColor: '#4ECDC4',
              }
            }}
            onClick={() => handleSquareClick(index, localHistorySquares, setLocalHistorySquares, onHistoryUpdate, 3)}
          >
            <Typography 
              sx={{ 
                color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: isActive ? 800 : 500,
                fontSize: '0.75rem',
              }}
            >
              {squareNumber}
            </Typography>
          </Box>
        </Box>
      );
    });
  };

  return (
    <Box 
      sx={{ 
        width: '100%',
        maxWidth: 360,
        margin: '0 auto',
        fontFamily: '"Segoe UI", Roboto, sans-serif'
      }}
    >
      <Box 
        sx={{ 
          p: 1.5,
          backgroundColor: PALETA_PRINCIPAL.fundo,
          border: `1px solid ${PALETA_PRINCIPAL.borda}`,
          borderRadius: '1px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, ${PALETA_PRINCIPAL.atributo}, ${PALETA_PRINCIPAL.habilidade})`,
          }
        }}
      >
        {/* Cabeçalho minimalista */}
        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
          <Typography 
            sx={{
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: PALETA_PRINCIPAL.texto,
              fontSize: '0.9rem',
              borderBottom: `1px solid ${PALETA_PRINCIPAL.atributo}`,
              display: 'inline-block',
              pb: 0.3
            }}
          >
            Experiência & História
          </Typography>
        </Box>

        {/* Experiência - topo */}
        <Box 
          sx={{ 
            mb: 1.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 1,
              width: '100%',
              justifyContent: 'center',
              gap: 0.5
            }}
          >
            <Box 
              sx={{ 
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: '#639EC2',
              }} 
            />
            <Typography 
              sx={{ 
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: '#639EC2',
                fontSize: '0.75rem',
              }}
            >
              Experiência
            </Typography>
            <Typography 
              sx={{ 
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.6)',
                ml: 0.5,
              }}
            >
              {getActiveCount(localExperienceSquares)}/10
            </Typography>
          </Box>
          
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: '4px',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            {renderExperienceSquares()}
          </Box>
        </Box>

        {/* Separador horizontal sutil */}
        <Box 
          sx={{ 
            height: '1px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            mb: 1.5
          }} 
        />

        {/* História - base */}
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              mb: 1,
              width: '100%',
              justifyContent: 'center',
              gap: 0.5
            }}
          >
            <Box 
              sx={{ 
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: '#4ECDC4',
              }} 
            />
            <Typography 
              sx={{ 
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: '#4ECDC4',
                fontSize: '0.75rem',
              }}
            >
              História
            </Typography>
            <Typography 
              sx={{ 
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.6)',
                ml: 0.5,
              }}
            >
              {getActiveCount(localHistorySquares)}/3
            </Typography>
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              px: 2
            }}
          >
            {renderHistorySquares()}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ExperienceHistoryTracker;

export const experienceHistoryStyles = (theme) => ({
  container: {
    width: '100%',
    maxWidth: 360,
    margin: '0 auto',
  },
  contentBox: {
    p: 1.5,
    backgroundColor: PALETA_PRINCIPAL.fundo,
    border: `1px solid ${PALETA_PRINCIPAL.borda}`,
    borderRadius: '1px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '1px',
      background: `linear-gradient(90deg, ${PALETA_PRINCIPAL.atributo}, ${PALETA_PRINCIPAL.habilidade})`,
    }
  }
});