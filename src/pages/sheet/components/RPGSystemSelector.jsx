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

// Sistema de versionamento: FIX - Corrige problema de primeira visita
// Antes: Usuário via sistema clássico na primeira vez
// Agora: Usuário sempre vê seletor na primeira visita
console.log('[RPGSystemSelector] Versão 1.0.1 - Fix: Primeira visita corrigida');

export const RPGSystemSelector = ({ 
  isSelectorExpanded,
  isFirstTime,
  rpgSystem,
  handleSystemChange,
  character,
  isChangingSystem,
  isMobile
}) => {
  // Debug: Loga o estado atual
  console.log(`[RPGSystemSelector] Estado: firstTime=${isFirstTime}, selectorExpanded=${isSelectorExpanded}, system=${rpgSystem}`);

  // Caso 1: Primeira visita e seletor não está expandido
  // Mostra apenas botão para escolher sistema
  if (isFirstTime && !isSelectorExpanded) {
    console.log('[RPGSystemSelector] Modo: Primeira visita - Botão inicial');
    return (
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
          Escolha seu Sistema RPG
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
          Esta é sua primeira vez nesta ficha! Escolha o sistema RPG que melhor se adapta ao seu personagem.
        </Typography>

        <Button
          variant="contained"
          size={isMobile ? "medium" : "large"}
          onClick={() => {
            console.log('[RPGSystemSelector] Botão clicado: expandir seletor');
            handleSystemChange('expand_selector');
          }}
          startIcon={<ExpandMore />}
          disabled={isChangingSystem}
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
            '&:disabled': {
              backgroundColor: 'action.disabled',
              transform: 'none',
              boxShadow: 'none'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isChangingSystem ? 'Aguarde...' : 'Escolher Sistema RPG'}
        </Button>
      </Box>
    );
  }

  // Caso 2: Seletor está expandido (mostrando opções)
  // Pode ser primeira visita ou usuário clicou em "Trocar Sistema"
  if (isSelectorExpanded) {
    console.log('[RPGSystemSelector] Modo: Seletor expandido');
    return (
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
    );
  }

  // Caso 3: Não é primeira visita, tem sistema escolhido e seletor não está expandido
  // Mostra sistema atual com opção de trocar
  if (rpgSystem && !isFirstTime) {
    console.log(`[RPGSystemSelector] Modo: Sistema atual (${rpgSystem})`);
    return (
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
            {rpgSystem === 'year_zero' ? 'Year Zero Engine' : 
             rpgSystem === 'feiticeiros' ? 'Feiticeiros & Maldições' : 
             'Sistema Clássico'}
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
            console.log('[RPGSystemSelector] Botão clicado: trocar sistema');
            handleSystemChange('expand_selector');
          }}
          startIcon={<ExpandMore />}
          disabled={isChangingSystem}
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
            '&:disabled': {
              backgroundColor: 'action.disabled',
              transform: 'none',
              boxShadow: 'none'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isChangingSystem ? 'Aguarde...' : 'Trocar Sistema RPG'}
        </Button>
      </Box>
    );
  }

  // Caso 4: Fallback - não deveria acontecer
  console.warn('[RPGSystemSelector] Estado inválido detectado');
  return null;
};