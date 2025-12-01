// components/HealthBar.js - VERSÃO MUI 4
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
    minHeight: '200px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }
  },
  cardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    '&:last-child': {
      paddingBottom: '16px'
    }
  },
  healthHeader: {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  healthTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    lineHeight: 1.2
  },
  editButton: {
    flex: '0 0 auto',
    color: 'text.secondary'
  },
  progressContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    margin: '16px 0',
    gap: '8px'
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  progressText: {
    fontSize: '0.8rem',
    color: 'text.secondary',
    fontWeight: '500'
  },
  progressValue: {
    fontSize: '0.9rem',
    fontWeight: 'bold'
  },
  healthProgress: {
    height: '12px',
    borderRadius: '6px',
    backgroundColor: '#f4433620',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#f44336',
      borderRadius: '6px',
      transition: 'transform 0.4s ease-in-out'
    }
  },
  soulProgress: {
    height: '12px',
    borderRadius: '6px',
    backgroundColor: '#9c27b020',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#9c27b0',
      borderRadius: '6px',
      transition: 'transform 0.4s ease-in-out'
    }
  },
  energyProgress: {
    height: '12px',
    borderRadius: '6px',
    backgroundColor: '#2196f320',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#2196f3',
      borderRadius: '6px',
      transition: 'transform 0.4s ease-in-out'
    }
  },
  descriptionText: {
    fontSize: '0.75rem',
    color: 'text.secondary',
    textAlign: 'center',
    marginTop: '4px',
    fontStyle: 'italic'
  },
  quickActions: {
    flex: '0 0 auto',
    marginTop: 'auto',
    paddingTop: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px'
  },
  quickActionButton: {
    minWidth: '60px',
    fontWeight: '600'
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
  classes 
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

  const iconElement = React.createElement(config.icon, { 
    className: classes.healthIcon 
  });

  const progressStyle = {
    color: config.color
  };

  return React.createElement(Grid, { 
    item: true, 
    xs: 12, 
    md: 4,
    className: classes.gridItem
  },
    React.createElement(Card, { 
      className: `${classes.healthCard} ${classes[config.cardClass]}`,
      onClick: onClick
    },
      React.createElement(CardContent, { 
        className: classes.cardContent
      },
        React.createElement(Box, { 
          className: classes.healthHeader
        },
          React.createElement(Box, {
            className: classes.headerContent
          },
            iconElement,
            React.createElement(Typography, { 
              className: `${classes.healthTitle} ${classes[config.titleClass]}`
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
          className: classes.progressContainer
        },
          React.createElement(Box, { 
            className: classes.progressLabel
          },
            React.createElement(Typography, { 
              className: classes.progressText
            }, `${current} / ${max}`),
            React.createElement(Typography, { 
              className: classes.progressValue, 
              style: progressStyle
            }, `${Math.round(progress)}%`)
          ),

          React.createElement(LinearProgress, {
            variant: "determinate",
            value: progress,
            className: classes[config.progressClass]
          }),

          data?.description && React.createElement(Typography, {
            className: classes.descriptionText
          }, data.description)
        ),

        React.createElement(Box, { 
          className: classes.quickActions
        },
          showActionButtons && React.createElement(React.Fragment, null,
            React.createElement(Button, {
              size: "small",
              variant: "outlined",
              color: config.buttonColor,
              onClick: handleMinusClick,
              className: classes.quickActionButton,
              startIcon: React.createElement(Remove, { fontSize: "small" }),
              disabled: current <= 0
            }, config.quickActions.minus.label),

            React.createElement(Button, {
              size: "small",
              variant: "contained",
              color: config.buttonColor,
              onClick: handlePlusClick,
              className: classes.quickActionButton,
              startIcon: React.createElement(Add, { fontSize: "small" }),
              disabled: current >= max
            }, config.quickActions.plus.label)
          )
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
    prevProps.onQuickAction === nextProps.onQuickAction
  );
});

HealthBar.defaultProps = {
  current: 0,
  max: 0,
  classes: {},
  onQuickAction: () => {},
  onClick: () => {}
};

export default withStyles(styles)(HealthBar);