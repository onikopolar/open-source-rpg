import React from 'react';
import {
  Box,
  Button,
  Typography,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import {
  SwapHoriz,
  AutoAwesome
} from '@mui/icons-material';

/**
 * Componente bonito para trocar o sistema RPG
 * Design atraente e gostoso de ver
 */
const SystemChanger = ({ currentSystem, onSystemChange, isMobile }) => {
  const theme = useTheme();

  const getSystemDisplayName = (system) => {
    return system === 'year_zero' ? 'Year Zero Engine' : 'Sistema Clássico';
  };

  const getSystemColor = (system) => {
    return system === 'year_zero' ? theme.palette.secondary.main : theme.palette.primary.main;
  };

  const systemColor = getSystemColor(currentSystem);

  return (
    <Fade in timeout={500}>
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4,
        p: 4,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(systemColor, 0.08)} 0%, ${alpha(systemColor, 0.03)} 100%)`,
        border: `1px solid ${alpha(systemColor, 0.2)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${systemColor} 0%, ${alpha(systemColor, 0.7)} 100%)`,
        }
      }}>
        {/* Elemento decorativo */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(systemColor, 0.1)} 0%, transparent 70%)`,
            zIndex: 0
          }}
        />
        
        <AutoAwesome sx={{ 
          fontSize: 32, 
          color: systemColor,
          mb: 2,
          position: 'relative',
          zIndex: 1
        }} />
        
        <Typography 
          variant="h5" 
          color="text.primary"
          sx={{ 
            mb: 1, 
            fontWeight: 700,
            position: 'relative',
            zIndex: 1,
            fontSize: isMobile ? '1.25rem' : '1.5rem'
          }}
        >
          Sistema Atual:{" "}
          <Box 
            component="span" 
            sx={{ 
              color: systemColor,
              background: `linear-gradient(135deg, ${systemColor} 0%, ${alpha(systemColor, 0.8)} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800
            }}
          >
            {getSystemDisplayName(currentSystem)}
          </Box>
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            mb: 3,
            position: 'relative',
            zIndex: 1,
            maxWidth: 400,
            mx: 'auto',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}
        >
          Não é o que você esperava? Experimente outro estilo de jogo!
        </Typography>

        <Button
          variant="outlined"
          size={isMobile ? "medium" : "large"}
          onClick={() => onSystemChange('expand_selector')}
          startIcon={<SwapHoriz />}
          sx={{
            borderRadius: 2,
            border: `2px solid ${alpha(systemColor, 0.3)}`,
            color: systemColor,
            fontWeight: 600,
            textTransform: 'none',
            px: 4,
            py: 1.5,
            background: `linear-gradient(135deg, ${alpha(systemColor, 0.05)} 0%, ${alpha(systemColor, 0.02)} 100%)`,
            fontSize: isMobile ? '0.9rem' : '1rem',
            position: 'relative',
            zIndex: 1,
            '&:hover': {
              border: `2px solid ${systemColor}`,
              background: `linear-gradient(135deg, ${alpha(systemColor, 0.1)} 0%, ${alpha(systemColor, 0.05)} 100%)`,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 25px ${alpha(systemColor, 0.2)}`
            },
            transition: 'all 0.3s ease'
          }}
        >
          Trocar Sistema RPG
        </Button>
      </Box>
    </Fade>
  );
};

export default SystemChanger;
