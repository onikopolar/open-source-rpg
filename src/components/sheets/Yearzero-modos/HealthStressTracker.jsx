// Arquivo: HealthStressTracker.jsx
// Versão: 2.3.0 - FEAT: Ícones simples adicionados mantendo minimalismo
console.log('[HealthStressTracker] Versão 2.3.0 - FEAT: Ícones adicionados de forma sutil');

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import {
  Favorite as HealthIcon,
  Psychology as StressIcon,
} from '@mui/icons-material';

const PALETA_PRINCIPAL = {
  atributo: '#ff6b35',
  habilidade: '#1976d2',
  fundo: 'rgba(18, 23, 33, 0.98)',
  texto: 'rgba(255, 255, 255, 0.95)',
  borda: 'rgba(255, 107, 53, 0.3)',
  destaque: '#ff8c5a',
  fundo_input: 'rgba(25, 30, 40, 0.9)'
};

const HealthStressTracker = ({ 
  healthSquares = [], 
  stressSquares = [], 
  onHealthUpdate, 
  onStressUpdate 
}) => {
  const [localHealthSquares, setLocalHealthSquares] = useState(() => 
    healthSquares.length === 10 ? healthSquares : Array(10).fill(false)
  );
  
  const [localStressSquares, setLocalStressSquares] = useState(() => 
    stressSquares.length === 10 ? stressSquares : Array(10).fill(false)
  );

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
      for (let i = index; i < newSquares.length; i++) {
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

  const renderSquares = (squaresArray, type, setLocalSquares, updateFunction) => {
    const isHealth = type === 'health';
    const activeColor = isHealth ? '#4caf50' : '#ff6b35';
    
    return squaresArray.map((isActive, index) => {
      const squareNumber = index + 1;
      
      return (
        <Box key={index} display="flex" flexDirection="column" alignItems="center">
          <Box 
            sx={{
              width: 20,
              height: 20,
              border: `1.5px solid ${isActive ? activeColor : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
              backgroundColor: isActive ? activeColor : 'transparent',
              '&:hover': {
                borderColor: activeColor,
              }
            }}
            onClick={() => handleSquareClick(index, squaresArray, setLocalSquares, updateFunction)}
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

  const getActiveCount = (squares) => squares.filter(s => s).length;

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
            Vida & Estresse
          </Typography>
        </Box>

        {/* Container lado a lado - simplificado */}
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1.5,
            alignItems: 'flex-start'
          }}
        >
          {/* Health Tracker */}
          <Box 
            sx={{ 
              flex: 1,
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
              <HealthIcon sx={{ 
                fontSize: '0.8rem',
                color: '#4caf50',
              }} />
              <Typography 
                sx={{ 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: '#4caf50',
                  fontSize: '0.75rem',
                }}
              >
                Vida
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.6)',
                  ml: 0.5,
                }}
              >
                {getActiveCount(localHealthSquares)}/10
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
              {renderSquares(localHealthSquares, 'health', setLocalHealthSquares, onHealthUpdate)}
            </Box>
          </Box>

          {/* Separador vertical sutil */}
          <Box 
            sx={{ 
              width: '1px',
              height: '100px',
              background: 'rgba(255, 255, 255, 0.05)',
              alignSelf: 'center'
            }} 
          />

          {/* Stress Tracker */}
          <Box 
            sx={{ 
              flex: 1,
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
              <StressIcon sx={{ 
                fontSize: '0.8rem',
                color: '#ff6b35',
              }} />
              <Typography 
                sx={{ 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: '#ff6b35',
                  fontSize: '0.75rem',
                }}
              >
                Estresse
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.6)',
                  ml: 0.5,
                }}
              >
                {getActiveCount(localStressSquares)}/10
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
              {renderSquares(localStressSquares, 'stress', setLocalStressSquares, onStressUpdate)}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HealthStressTracker;

export const healthStressStyles = (theme) => ({
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