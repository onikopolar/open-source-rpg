import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Collapse,
  Alert 
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import SheetSelector from '../../../components/sheets/SheetSelector';

export const RPGSystemSelector = ({ 
  isSelectorExpanded,
  isFirstTime,
  rpgSystem,
  handleSystemChange,
  character,
  isChangingSystem,
  isMobile
}) => {
  return (
    <>
      <Collapse in={isSelectorExpanded} timeout="auto" unmountOnExit>
        <Box sx={{ mb: 4 }}>
          {isFirstTime && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Primeira vez aqui?</strong> Escolha o sistema RPG que melhor se adapta ao seu personagem. 
                Você poderá trocar a qualquer momento!
              </Typography>
            </Alert>
          )}
          <SheetSelector
            currentSystem={rpgSystem}
            onSystemChange={handleSystemChange}
            character={character}
            isSaving={isChangingSystem}
          />
        </Box>
      </Collapse>

      {!isSelectorExpanded && rpgSystem && (
        <Box sx={{ 
          textAlign: 'center', 
          mb: 4,
          p: 4,
          borderRadius: 3,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            opacity: 0.8
          }} />
          
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1, 
              fontWeight: 600,
              color: 'text.primary',
              mt: 1
            }}
          >
            Sistema Atual:{" "}
            <Box 
              component="span" 
              sx={{ 
                color: 'primary.main',
                fontWeight: 700
              }}
            >
              {rpgSystem === 'year_zero' ? 'Year Zero Engine' : rpgSystem === 'feiticeiros' ? 'Feiticeiros & Maldições' : 'Sistema Clássico'}
            </Box>
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 3,
              color: 'text.secondary',
              maxWidth: 400,
              mx: 'auto'
            }}
          >
            Não é o que você esperava? Experimente outro estilo de sistema RPG!
          </Typography>

          <Button
            variant="contained"
            size={isMobile ? "medium" : "large"}
            onClick={() => {
              handleSystemChange('expand_selector');
            }}
            startIcon={<ExpandMore />}
            sx={{
              borderRadius: 2,
              backgroundColor: 'primary.main',
              color: '#fff',
              fontWeight: 600,
              textTransform: 'none',
              px: 4,
              py: 1.5,
              fontSize: isMobile ? '0.9rem' : '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                backgroundColor: 'primary.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Trocar Sistema RPG
          </Button>
        </Box>
      )}
    </>
  );
};
