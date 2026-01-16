// sections/HealthSection.js - VERSÃO 1.1.1 - Layout horizontal fixo
import React from 'react';
import { withStyles } from '@mui/styles';
import { Box, Typography, Grid } from '@mui/material';
import HealthBar from '../components/HealthBar';

// Versionamento Semântico: 1.1.1 - Layout horizontal com 3 barras lado a lado
console.log('[HealthSection] Versão 1.1.1 - Layout horizontal com 3 barras lado a lado');

const styles = {
  healthSection: {
    width: '100%',
  },
  sectionTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: '12px',
    fontSize: '1.2rem',
  },
  healthGrid: {
    width: '100%',
  },
  // ESTILOS REVISADOS PARA MOBILE
  healthHorizontalContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap', // MUDADO: agorarap para manter lado a lado
    gap: '8px',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    overflowX: 'auto', // Scroll horizontal se necessário
    padding: '4px 0',
  },
  healthHorizontalItem: {
    flex: '1 0 auto', // MUDADO: flex shrink habilitado
    minWidth: '30%', // MUDADO: porcentagem em vez de pixels fixos
    maxWidth: '32%',
  },
  // NOVO: Estilo para small mobile (vertical)
  healthVerticalContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }
};

const HealthSection = ({ 
  additionalValues = {}, 
  currentHP = 0, 
  currentSoul = 0,
  currentPE = 0, 
  maxHP = 0, 
  maxPE = 0, 
  handleHealthClick, 
  handleSoulClick, 
  handleEnergyClick, 
  handleQuickAction, 
  classes,
  isMobile = false,
  isSmallMobile = false
}) => {
  
  // Dados padrão para evitar erros
  const healthData = {
    PONTOS_VIDA: additionalValues.PONTOS_VIDA || { description: 'Pontos de Vida - Dano Físico' },
    INTEGRIDADE_ALMA: additionalValues.INTEGRIDADE_ALMA || { description: 'Integridade da Alma - Dano Espiritual' },
    PONTOS_ENERGIA: additionalValues.PONTOS_ENERGIA || { description: 'Energia Amaldiçoada (PE)' }
  };

  // LAYOUT PARA MOBILE - Horizontal com 3 barras lado a lado
  if (isMobile) {
    // Para small mobile, mantém vertical
    if (isSmallMobile) {
      return React.createElement(Box, { 
        className: classes.healthSection 
      },
        React.createElement(Box, { 
          className: classes.healthVerticalContainer
        },
          // PONTOS DE VIDA
          React.createElement(HealthBar, {
            type: "hp",
            data: healthData.PONTOS_VIDA,
            current: currentHP,
            max: maxHP,
            onClick: handleHealthClick,
            onQuickAction: handleQuickAction,
            classes: classes,
            compactMode: true,
            verticalSpacing: 0.25
          }),
          
          // INTEGRIDADE DA ALMA
          React.createElement(HealthBar, {
            type: "soul", 
            data: healthData.INTEGRIDADE_ALMA,
            current: currentSoul,
            max: maxHP,
            onClick: handleSoulClick,
            onQuickAction: handleQuickAction,
            classes: classes,
            compactMode: true,
            verticalSpacing: 0.25
          }),
          
          // ENERGIA AMALDIÇOADA
          React.createElement(HealthBar, {
            type: "energy",
            data: healthData.PONTOS_ENERGIA,
            current: currentPE,
            max: maxPE,
            onClick: handleEnergyClick,
            onQuickAction: handleQuickAction,
            classes: classes,
            compactMode: true,
            verticalSpacing: 0.25
          })
        )
      );
    }
    
    // Para mobile normal (não small) - 3 barras lado a lado
    return React.createElement(Box, { 
      className: classes.healthSection 
    },
      React.createElement(Typography, { 
        className: classes.sectionTitle,
        style: { 
          fontSize: '1rem',
          marginBottom: '8px'
        }
      }, 'VIDA E ENERGIA'),
      
      React.createElement(Box, { 
        className: classes.healthHorizontalContainer
      },
        // PONTOS DE VIDA
        React.createElement(Box, { 
          className: classes.healthHorizontalItem,
          style: { 
            minWidth: '30%',
            maxWidth: '32%'
          }
        },
          React.createElement(HealthBar, {
            type: "hp",
            data: healthData.PONTOS_VIDA,
            current: currentHP,
            max: maxHP,
            onClick: handleHealthClick,
            onQuickAction: handleQuickAction,
            classes: classes,
            compactMode: true,
            verticalSpacing: 0.5
          })
        ),
        
        // INTEGRIDADE DA ALMA
        React.createElement(Box, { 
          className: classes.healthHorizontalItem,
          style: { 
            minWidth: '30%',
            maxWidth: '32%'
          }
        },
          React.createElement(HealthBar, {
            type: "soul", 
            data: healthData.INTEGRIDADE_ALMA,
            current: currentSoul,
            max: maxHP,
            onClick: handleSoulClick,
            onQuickAction: handleQuickAction,
            classes: classes,
            compactMode: true,
            verticalSpacing: 0.5
          })
        ),
        
        // ENERGIA AMALDIÇOADA
        React.createElement(Box, { 
          className: classes.healthHorizontalItem,
          style: { 
            minWidth: '30%',
            maxWidth: '32%'
          }
        },
          React.createElement(HealthBar, {
            type: "energy",
            data: healthData.PONTOS_ENERGIA,
            current: currentPE,
            max: maxPE,
            onClick: handleEnergyClick,
            onQuickAction: handleQuickAction,
            classes: classes,
            compactMode: true,
            verticalSpacing: 0.5
          })
        )
      )
    );
  }

  // LAYOUT PARA DESKTOP - Vertical (mantém o original)
  return React.createElement(Box, { className: classes.healthSection },
    React.createElement(Typography, { className: classes.sectionTitle },
      'VIDA E ENERGIA'
    ),
    React.createElement(Grid, { 
      container: true, 
      spacing: 2, 
      className: classes.healthGrid,
      style: { alignItems: 'stretch' }
    },
      // PONTOS DE VIDA
      React.createElement(HealthBar, {
        type: "hp",
        data: healthData.PONTOS_VIDA,
        current: currentHP,
        max: maxHP,
        onClick: handleHealthClick,
        onQuickAction: handleQuickAction,
        classes: classes
      }),
      
      // INTEGRIDADE DA ALMA
      React.createElement(HealthBar, {
        type: "soul", 
        data: healthData.INTEGRIDADE_ALMA,
        current: currentSoul,
        max: maxHP,
        onClick: handleSoulClick,
        onQuickAction: handleQuickAction,
        classes: classes
      }),
      
      // ENERGIA AMALDIÇOADA
      React.createElement(HealthBar, {
        type: "energy",
        data: healthData.PONTOS_ENERGIA,
        current: currentPE,
        max: maxPE,
        onClick: handleEnergyClick,
        onQuickAction: handleQuickAction,
        classes: classes
      })
    )
  );
};

// Adicionar default props
HealthSection.defaultProps = {
  additionalValues: {},
  currentHP: 0,
  currentSoul: 0,
  currentPE: 0,
  maxHP: 0,
  maxPE: 0,
  isMobile: false,
  isSmallMobile: false
};

export default withStyles(styles)(React.memo(HealthSection));