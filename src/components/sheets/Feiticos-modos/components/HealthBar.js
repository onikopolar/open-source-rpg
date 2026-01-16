// components/HealthBar.js - VERSÃO 2.1.1 - Correção de grid para layout horizontal mobile
import React from 'react';
import { withStyles } from '@mui/styles';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  IconButton, 
  Button,
  LinearProgress 
} from '@mui/material';
import { 
  Psychology as SoulIcon, 
  Favorite, 
  LocalHospital, 
  Edit,
  Add,
  Remove
} from '@mui/icons-material';

// Versionamento Semântico: 2.1.1 - Correção de grid para layout horizontal mobile
console.log('[HealthBar] Versão 2.1.1 - Correção de grid para layout horizontal mobile');

// Configurações centralizadas para cada tipo de barra
const HEALTH_BAR_CONFIGS = {
  hp: {
    title: 'PONTOS DE VIDA',
    icon: Favorite,
    color: '#f44336',
    progressClass: 'healthProgress',
    titleClass: 'healthTitle', 
    cardClass: 'healthCard',
    buttonColor: 'error',
    quickActions: {
      minus: { type: 'damage', label: '1' },
      plus: { type: 'heal', label: '1' }
    }
  },
  soul: {
    title: 'INTEGRIDADE DA ALMA',
    icon: SoulIcon,
    color: '#9c27b0',
    progressClass: 'soulProgress',
    titleClass: 'soulTitle',
    cardClass: 'soulCard',
    buttonColor: 'secondary',
    quickActions: {
      minus: { type: 'soul_damage', label: '1' },
      plus: { type: 'soul_heal', label: '1' }
    }
  },
  energy: {
    title: 'ENERGIA AMALDIÇOADA (PE)',
    icon: LocalHospital,
    color: '#2196f3',
    progressClass: 'energyProgress',
    titleClass: 'energyTitle',
    cardClass: 'energyCard',
    buttonColor: 'primary',
    quickActions: {
      minus: { type: 'energy_remove', label: '1' },
      plus: { type: 'energy', label: '1' }
    }
  }
};

const styles = {
  gridItem: {
    display: 'flex'
  },
  healthCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '130px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
    }
  },
  cardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    '&:last-child': {
      paddingBottom: '10px'
    }
  },
  healthHeader: {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  healthTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    lineHeight: 1
  },
  editButton: {
    flex: '0 0 auto',
    color: 'text.secondary',
    padding: '2px',
    minWidth: '24px',
    height: '24px'
  },
  progressContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    margin: '8px 0',
    gap: '4px'
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  progressText: {
    fontSize: '0.7rem',
    color: 'text.secondary',
    fontWeight: '500'
  },
  progressValue: {
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  healthProgress: {
    height: '8px',
    borderRadius: '4px',
    backgroundColor: '#f4433620',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#f44336',
      borderRadius: '4px',
      transition: 'transform 0.2s ease-in-out'
    }
  },
  soulProgress: {
    height: '8px',
    borderRadius: '4px',
    backgroundColor: '#9c27b020',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#9c27b0',
      borderRadius: '4px',
      transition: 'transform 0.2s ease-in-out'
    }
  },
  energyProgress: {
    height: '8px',
    borderRadius: '4px',
    backgroundColor: '#2196f320',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#2196f3',
      borderRadius: '4px',
      transition: 'transform 0.2s ease-in-out'
    }
  },
  descriptionText: {
    fontSize: '0.65rem',
    color: 'text.secondary',
    textAlign: 'center',
    marginTop: '1px',
    fontStyle: 'italic',
    lineHeight: 1
  },
  quickActions: {
    flex: '0 0 auto',
    marginTop: 'auto',
    paddingTop: '6px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px'
  },
  quickActionButton: {
    minWidth: '42px',
    fontWeight: '600',
    fontSize: '0.7rem',
    padding: '2px 6px',
    height: '28px'
  },
  healthIcon: {
    fontSize: '0.9rem'
  }
};

// Hook para gerenciar o estado da barra de saúde
const useHealthBar = (type, current, max, onQuickAction) => {
  const config = HEALTH_BAR_CONFIGS[type] || {};
  
  const progress = React.useMemo(() => {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.max(0, (current / max) * 100));
  }, [current, max]);

  const handleQuickAction = React.useCallback((actionType, amount = 1) => {
    if (onQuickAction && typeof onQuickAction === 'function') {
      onQuickAction(actionType, amount);
    }
  }, [onQuickAction]);

  const handleMinusClick = React.useCallback((e) => {
    e?.stopPropagation();
    const actionType = config.quickActions?.minus?.type;
    if (actionType) {
      handleQuickAction(actionType, 1);
    }
  }, [config.quickActions, handleQuickAction]);

  const handlePlusClick = React.useCallback((e) => {
    e?.stopPropagation();
    const actionType = config.quickActions?.plus?.type;
    if (actionType) {
      handleQuickAction(actionType, 1);
    }
  }, [config.quickActions, handleQuickAction]);

  return {
    config,
    progress,
    handleMinusClick,
    handlePlusClick,
    showActionButtons: true
  };
};

const HealthBar = React.memo(({ 
  type, 
  data, 
  current = 0, 
  max = 0, 
  onClick, 
  onQuickAction, 
  classes,
  compactMode = false,
  verticalSpacing = 1,
  isMobile = false // NOVA PROP: para controle do grid
}) => {
  
  const { 
    config, 
    progress, 
    handleMinusClick, 
    handlePlusClick, 
    showActionButtons 
  } = useHealthBar(type, current, max, onQuickAction);

  if (!config.title) {
    console.warn(`Tipo de HealthBar inválido: ${type}`);
    return null;
  }

  const getCardHeight = () => {
    if (compactMode) {
      if (verticalSpacing <= 0.25) return '110px';
      if (verticalSpacing <= 0.5) return '120px';
      return '125px';
    }
    return '130px';
  };

  const iconElement = React.createElement(config.icon, { 
    className: classes.healthIcon,
    style: { fontSize: compactMode ? '0.8rem' : '0.9rem' }
  });

  const progressStyle = {
    color: config.color
  };

  // CORREÇÃO CRÍTICA: xs: 4 para mobile, 12 para desktop
  const gridXS = isMobile ? 4 : 12;

  return React.createElement(Grid, { 
    item: true, 
    xs: gridXS, // ALTERADO: agora é dinâmico
    md: 4,
    className: classes.gridItem,
    style: {
      marginBottom: compactMode ? `${verticalSpacing * 2}px` : '6px'
    }
  },
    React.createElement(Card, { 
      className: `${classes.healthCard} ${classes[config.cardClass]}`,
      onClick: onClick,
      style: {
        minHeight: getCardHeight()
      }
    },
      React.createElement(CardContent, { 
        className: classes.cardContent,
        style: {
          padding: compactMode ? '6px' : '10px'
        }
      },
        React.createElement(Box, { 
          className: classes.healthHeader,
          style: {
            marginBottom: compactMode ? '4px' : '6px'
          }
        },
          React.createElement(Box, {
            className: classes.headerContent,
            style: {
              gap: compactMode ? '2px' : '4px'
            }
          },
            iconElement,
            React.createElement(Typography, { 
              className: `${classes.healthTitle} ${classes[config.titleClass]}`,
              style: {
                fontSize: compactMode ? '0.75rem' : '0.8rem'
              }
            }, config.title)
          ),
          React.createElement(IconButton, { 
            size: "small",
            className: classes.editButton,
            onClick: (e) => {
              e?.stopPropagation();
              if (onClick && typeof onClick === 'function') {
                onClick();
              }
            }
          }, React.createElement(Edit, { fontSize: "small" }))
        ),

        React.createElement(Box, { 
          className: classes.progressContainer,
          style: {
            margin: compactMode ? '4px 0' : '8px 0',
            gap: compactMode ? '2px' : '4px'
          }
        },
          React.createElement(Box, { 
            className: classes.progressLabel,
            style: {
              marginBottom: compactMode ? '2px' : '4px'
            }
          },
            React.createElement(Typography, { 
              className: classes.progressText,
              style: {
                fontSize: compactMode ? '0.65rem' : '0.7rem'
              }
            }, `${current} / ${max}`),
            React.createElement(Typography, { 
              className: classes.progressValue, 
              style: progressStyle
            }, `${Math.round(progress)}%`)
          ),

          React.createElement(LinearProgress, {
            variant: "determinate",
            value: progress,
            className: classes[config.progressClass],
            style: {
              height: compactMode ? '6px' : '8px'
            }
          }),

          data?.description && React.createElement(Typography, {
            className: classes.descriptionText,
            style: {
              fontSize: compactMode ? '0.6rem' : '0.65rem',
              marginTop: compactMode ? '0px' : '1px'
            }
          }, data.description)
        ),

        showActionButtons && React.createElement(Box, { 
          className: classes.quickActions,
          style: {
            paddingTop: compactMode ? '2px' : '6px',
            gap: compactMode ? '4px' : '6px'
          }
        },
          React.createElement(Button, {
            size: "small",
            variant: "outlined",
            color: config.buttonColor,
            onClick: handleMinusClick,
            className: classes.quickActionButton,
            startIcon: React.createElement(Remove, { fontSize: "small" }),
            disabled: current <= 0,
            style: {
              minWidth: compactMode ? '36px' : '42px',
              fontSize: compactMode ? '0.65rem' : '0.7rem',
              padding: compactMode ? '1px 4px' : '2px 6px',
              height: compactMode ? '24px' : '28px'
            }
          }, config.quickActions.minus.label),

          React.createElement(Button, {
            size: "small",
            variant: "contained",
            color: config.buttonColor,
            onClick: handlePlusClick,
            className: classes.quickActionButton,
            startIcon: React.createElement(Add, { fontSize: "small" }),
            disabled: current >= max,
            style: {
              minWidth: compactMode ? '36px' : '42px',
              fontSize: compactMode ? '0.65rem' : '0.7rem',
              padding: compactMode ? '1px 4px' : '2px 6px',
              height: compactMode ? '24px' : '28px'
            }
          }, config.quickActions.plus.label)
        )
      )
    )
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.type === nextProps.type &&
    prevProps.current === nextProps.current &&
    prevProps.max === nextProps.max &&
    prevProps.classes === nextProps.classes &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.onQuickAction === nextProps.onQuickAction &&
    prevProps.compactMode === nextProps.compactMode &&
    prevProps.verticalSpacing === nextProps.verticalSpacing &&
    prevProps.isMobile === nextProps.isMobile // ADICIONADO: comparar isMobile
  );
});

HealthBar.defaultProps = {
  current: 0,
  max: 0,
  classes: {},
  onQuickAction: () => {},
  onClick: () => {},
  compactMode: false,
  verticalSpacing: 1,
  isMobile: false // ADICIONADO: default false
};

export default withStyles(styles)(HealthBar);