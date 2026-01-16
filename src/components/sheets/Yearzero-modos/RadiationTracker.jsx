import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

console.log('[RadiationTracker] Versão 2.0.3 - PATCH: Corrige espaçamento entre linhas dos quadrados');

const PALETA_PRINCIPAL = {
  atributo: '#ff6b35',
  habilidade: '#1976d2',
  fundo: 'rgba(18, 23, 33, 0.98)',
  texto: 'rgba(255, 255, 255, 0.95)',
  borda: 'rgba(255, 107, 53, 0.3)',
  destaque: '#ff8c5a',
  fundo_input: 'rgba(25, 30, 40, 0.9)'
};

const RadiationTracker = ({ 
  radiationSquares = [], 
  onRadiationUpdate 
}) => {
  const [localSquares, setLocalSquares] = useState(() => 
    radiationSquares.length === 10 ? radiationSquares : Array(10).fill(false)
  );

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
      for (let i = index; i < newSquares.length; i++) {
        newSquares[i] = false;
      }
    } else {
      for (let i = 0; i <= index; i++) {
        newSquares[i] = true;
      }
    }
    
    setLocalSquares(newSquares);
    onRadiationUpdate(newSquares);
  };

  const getActiveCount = (squares) => squares.filter(s => s).length;

  const renderSquares = () => {
    return localSquares.map((isActive, index) => {
      const squareNumber = index + 1;
      const isHighRadiation = squareNumber >= 8;
      
      return (
        <Box key={index} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            height: 51
          }}
        >
          <Box 
            sx={{
              width: 20,
              height: 20,
              border: `1.5px solid ${isActive ? '#9c27b0' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
              backgroundColor: isActive ? '#9c27b0' : 'transparent',
              position: 'relative',
              '&:hover': {
                borderColor: '#9c27b0',
              },
              ...(isHighRadiation && !isActive && {
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 4,
                  height: 4,
                  backgroundColor: '#ff4757',
                  borderRadius: '50%',
                }
              })
            }}
            onClick={() => handleSquareClick(index)}
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
            Radiação
          </Typography>
        </Box>

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
                backgroundColor: '#9c27b0',
              }} 
            />
            <WarningIcon sx={{ 
              fontSize: 14, 
              color: '#9c27b0',
              mr: 0.3
            }} />
            <Typography 
              sx={{ 
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: '#9c27b0',
                fontSize: '0.75rem',
              }}
            >
              Radiação
            </Typography>
            <Typography 
              sx={{ 
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.6)',
                ml: 0.5,
              }}
            >
              {getActiveCount(localSquares)}/10
            </Typography>
          </Box>
          
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridTemplateRows: 'repeat(2, auto)', // Altura automática
              rowGap: '2px', // ESPAÇAMENTO REDUZIDO ENTRE LINHAS
              columnGap: '4px',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            {renderSquares()}
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              mt: 1,
              pt: 1,
              width: '100%',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <Box sx={{ 
              width: 6, 
              height: 6, 
              borderRadius: '50%',
              backgroundColor: '#ff4757'
            }} />
            <Typography sx={{ 
              fontSize: '0.6rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.5)',
            }}>
              Nível 8+ = Perigoso
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RadiationTracker;

export const radiationStyles = (theme) => ({
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