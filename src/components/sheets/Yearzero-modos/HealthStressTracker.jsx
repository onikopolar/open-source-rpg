// Arquivo: HealthStressTracker.jsx
// Versão: 2.3.2 - REFACTOR: Correção de layout Mobile x Desktop, padding interno
import React, { useState, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import {
  Favorite as HealthIcon,
  Psychology as StressIcon,
} from '@mui/icons-material';

// Paleta de cores (fallback, caso o tema MUI não seja usado diretamente)
const DEFAULT_PALETTE = {
  atributo: '#ff6b35',
  habilidade: '#1976d2',
  fundo: 'rgba(18, 23, 33, 0.98)',
  texto: 'rgba(255, 255, 255, 0.95)',
  borda: 'rgba(255, 107, 53, 0.3)',
  destaque: '#ff8c5a',
  fundo_input: 'rgba(25, 30, 40, 0.9)'
};

/**
 * Converte qualquer entrada em um array de 10 booleanos normalizado.
 * Preenche com false se o array for inválido, menor que 10, ou nulo.
 */
const normalizeSquares = (input) => {
  const arr = Array.isArray(input) ? input : [];
  const normalized = Array(10).fill(false);
  for (let i = 0; i < Math.min(arr.length, 10); i++) {
    normalized[i] = Boolean(arr[i]);
  }
  return normalized;
};

/**
 * Subcomponente individual para rastreador de Vida ou Estresse.
 * Evita duplicação de lógica e JSX.
 */
const Tracker = memo(({ label, icon, type, squares, onUpdate }) => {
  const activeColor = type === 'health' ? '#4caf50' : '#ff6b35';
  const IconComponent = icon;

  const getActiveCount = (squares) => squares.filter(s => s).length;

  /**
   * Lógica de clique:
   * - Se o quadrado clicado está ativo, desativa ele e todos à direita.
   * - Se está inativo, ativa ele e todos à esquerda.
   */
  const handleSquareClick = (index) => {
    if (!onUpdate) return;
    const newSquares = [...squares];
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
    onUpdate(newSquares);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" width="100%">
      {/* Cabeçalho com ícone e contagem */}
      <Box display="flex" alignItems="center" mb={1} justifyContent="center" gap={0.5}>
        <IconComponent sx={{ fontSize: '0.8rem', color: activeColor }} />
        <Typography
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: activeColor,
            fontSize: '0.75rem',
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.6)',
            ml: 0.5,
          }}
        >
          {getActiveCount(squares)}/10
        </Typography>
      </Box>

      {/* Grade de quadrados numerados - CORREÇÃO DE PADDING INTERNO */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(5, 1fr)"
        gridTemplateRows="repeat(2, 1fr)"
        gap="4px"
        justifyContent="center"
        width="100%"
        padding="0 4px" 
      >
        {squares.map((isActive, index) => {
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
                  cursor: onUpdate ? 'pointer' : 'not-allowed',
                  transition: 'border-color 0.15s ease',
                  backgroundColor: isActive ? activeColor : 'transparent',
                  '&:hover': {
                    borderColor: onUpdate ? activeColor : 'rgba(255, 255, 255, 0.2)',
                  },
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
        })}
      </Box>
    </Box>
  );
});

Tracker.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  type: PropTypes.oneOf(['health', 'stress']).isRequired,
  squares: PropTypes.arrayOf(PropTypes.bool).isRequired,
  onUpdate: PropTypes.func,
};

/**
 * Componente principal HealthStressTracker
 * Exibe dois rastreadores lado a lado ou empilhados, dependendo do dispositivo.
 */
const HealthStressTracker = memo(({
  healthSquares = [],
  stressSquares = [],
  onHealthUpdate,
  onStressUpdate,
  isMobile = false // <--- Agora aceita a prop para controle de layout
}) => {
  const [localHealthSquares, setLocalHealthSquares] = useState(() =>
    normalizeSquares(healthSquares)
  );
  const [localStressSquares, setLocalStressSquares] = useState(() =>
    normalizeSquares(stressSquares)
  );

  // Sincroniza com props externas sempre que mudarem
  useEffect(() => {
    setLocalHealthSquares(normalizeSquares(healthSquares));
  }, [healthSquares]);

  useEffect(() => {
    setLocalStressSquares(normalizeSquares(stressSquares));
  }, [stressSquares]);

  // Callbacks estáveis para atualização
  const handleHealthUpdate = useCallback((newSquares) => {
    setLocalHealthSquares(newSquares);
    onHealthUpdate?.(newSquares);
  }, [onHealthUpdate]);

  const handleStressUpdate = useCallback((newSquares) => {
    setLocalStressSquares(newSquares);
    onStressUpdate?.(newSquares);
  }, [onStressUpdate]);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 360,
        margin: '0 auto',
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      }}
    >
      <Box
        sx={{
          p: 1.5,
          backgroundColor: DEFAULT_PALETTE.fundo,
          border: `1px solid ${DEFAULT_PALETTE.borda}`,
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
            background: `linear-gradient(90deg, ${DEFAULT_PALETTE.atributo}, ${DEFAULT_PALETTE.habilidade})`,
          },
        }}
      >
        {/* Cabeçalho */}
        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
          <Typography
            sx={{
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: DEFAULT_PALETTE.texto,
              fontSize: '0.9rem',
              borderBottom: `1px solid ${DEFAULT_PALETTE.atributo}`,
              display: 'inline-block',
              pb: 0.3,
            }}
          >
            Vida & Estresse
          </Typography>
        </Box>

        {/* Container com flexbox responsivo (Correção de layout PC x Mobile) */}
        <Box
          display="flex"
          flexDirection={isMobile ? 'column' : 'row'}
          gap={isMobile ? 2 : 1.5}
          alignItems={isMobile ? 'center' : 'flex-start'}
          width="100%"
        >
          {/* Track 1: Vida */}
          <Box flex={isMobile ? '0 0 auto' : 1} minWidth={0} width={isMobile ? '100%' : 'auto'}>
            <Tracker
              label="Vida"
              icon={HealthIcon}
              type="health"
              squares={localHealthSquares}
              onUpdate={handleHealthUpdate}
            />
          </Box>

          {/* Separador vertical - Condicional (Só aparece no Desktop) */}
          {!isMobile && (
            <Box
              sx={{
                width: '1px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.05)',
                alignSelf: 'center',
              }}
            />
          )}

          {/* Track 2: Estresse */}
          <Box flex={isMobile ? '0 0 auto' : 1} minWidth={0} width={isMobile ? '100%' : 'auto'}>
            <Tracker
              label="Estresse"
              icon={StressIcon}
              type="stress"
              squares={localStressSquares}
              onUpdate={handleStressUpdate}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

HealthStressTracker.propTypes = {
  healthSquares: PropTypes.arrayOf(PropTypes.bool),
  stressSquares: PropTypes.arrayOf(PropTypes.bool),
  onHealthUpdate: PropTypes.func,
  onStressUpdate: PropTypes.func,
  isMobile: PropTypes.bool, // <--- Adicionado ao PropTypes
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
    backgroundColor: DEFAULT_PALETTE.fundo,
    border: `1px solid ${DEFAULT_PALETTE.borda}`,
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
      background: `linear-gradient(90deg, ${DEFAULT_PALETTE.atributo}, ${DEFAULT_PALETTE.habilidade})`,
    }
  }
});