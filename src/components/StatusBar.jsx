import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  LinearProgress
} from '@mui/material';
import {
  Favorite,
  Edit,
  Add,
  Remove
} from '@mui/icons-material';

// ====== Versão 2.0 — Design inspirado no Feiticeiros: simples, compacto e dinâmico ======

const getProgressColor = (progress) => {
  if (progress > 70) return '#27ae60';
  if (progress > 40) return '#f39c12';
  if (progress > 20) return '#e74c3c';
  return '#c0392b';
};

const useHPBar = (current, max) => {
  const progress = useMemo(() => {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.max(0, (current / max) * 100));
  }, [current, max]);

  const color = useMemo(() => getProgressColor(progress), [progress]);

  return { progress, color };
};

const StatusBar = ({
  character,
  onStatusBarClick,
  onQuickHeal,
  onQuickDamage,
  isLoading = false,
  isMobile = false
}) => {
  const current = character?.current_hit_points ?? 0;
  const max = character?.max_hit_points ?? 1;

  const { progress, color } = useHPBar(current, max);

  const handleDamage = useCallback((e) => {
    e?.stopPropagation();
    if (onQuickDamage && current > 0) onQuickDamage(1);
  }, [onQuickDamage, current]);

  const handleHeal = useCallback((e) => {
    e?.stopPropagation();
    if (onQuickHeal && current < max) onQuickHeal(1);
  }, [onQuickHeal, current, max]);

  const handleEdit = useCallback((e) => {
    e?.stopPropagation();
    if (onStatusBarClick) onStatusBarClick();
  }, [onStatusBarClick]);

  return (
    <Card
      onClick={onStatusBarClick}
      sx={{
        width: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardContent sx={{ p: isMobile ? '10px 8px' : '14px 16px', '&:last-child': { pb: isMobile ? '10px' : '14px' } }}>
        {/* ====== CABEÇALHO ====== */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Favorite sx={{ color, fontSize: isMobile ? '1.1rem' : '1.3rem' }} />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: isMobile ? '0.85rem' : '1rem',
                color: '#2c3e50',
                letterSpacing: '0.02em'
              }}
            >
              PONTOS DE VIDA
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={handleEdit}
            sx={{
              color: 'text.secondary',
              p: 0.5,
              '&:hover': { color }
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Box>

        {/* ====== BARRA DE PROGRESSO ====== */}
        <Box sx={{ my: isMobile ? 0.75 : 1 }}>
          {/* Labels */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.5
            }}
          >
            <Typography
              sx={{
                fontSize: isMobile ? '0.7rem' : '0.8rem',
                color: 'text.secondary',
                fontWeight: 600
              }}
            >
              {current} / {max}
            </Typography>
            <Typography
              sx={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                fontWeight: 700,
                color
              }}
            >
              {Math.round(progress)}%
            </Typography>
          </Box>

          {/* Barra */}
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: isMobile ? 8 : 10,
              borderRadius: 5,
              backgroundColor: `${color}20`,
              '& .MuiLinearProgress-bar': {
                backgroundColor: color,
                borderRadius: 5,
                transition: 'transform 0.3s ease-in-out'
              }
            }}
          />
        </Box>

        {/* ====== BOTÕES DE AÇÃO RÁPIDA ====== */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1.5,
            mt: isMobile ? 1 : 1.5,
            pt: isMobile ? 1 : 1.5,
            borderTop: '1px solid #f0f0f0'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={handleDamage}
            disabled={current <= 0 || isLoading}
            startIcon={<Remove fontSize="small" />}
            sx={{
              minWidth: isMobile ? 42 : 52,
              fontSize: isMobile ? '0.7rem' : '0.78rem',
              fontWeight: 700,
              borderColor: '#e74c3c',
              color: '#e74c3c',
              '&:hover': { borderColor: '#c0392b', backgroundColor: '#fdf2f2' },
              '&:disabled': { opacity: 0.35 }
            }}
          >
            1
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={handleHeal}
            disabled={current >= max || isLoading}
            startIcon={<Add fontSize="small" />}
            sx={{
              minWidth: isMobile ? 42 : 52,
              fontSize: isMobile ? '0.7rem' : '0.78rem',
              fontWeight: 700,
              backgroundColor: color,
              '&:hover': { backgroundColor: `${color}dd` },
              '&:disabled': { opacity: 0.35, backgroundColor: color }
            }}
          >
            1
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default React.memo(StatusBar);
