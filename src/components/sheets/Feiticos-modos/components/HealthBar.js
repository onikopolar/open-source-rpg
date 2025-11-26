// components/HealthBar.js - VERSÃO CORRIGIDA COM CORES AJUSTADAS
import React from 'react';
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

const HealthBar = React.memo(({ 
  type, 
  data, 
  current, 
  max, 
  onClick, 
  onQuickAction, 
  classes 
}) => {
  
  const getConfig = () => {
    switch (type) {
      case 'hp':
        return {
          title: 'PONTOS DE VIDA',
          icon: React.createElement(Favorite, { className: classes.healthIcon }),
          color: '#f44336', // 🔴 VERMELHO - Vida (dano físico)
          progressClass: classes.healthProgress,
          titleClass: classes.healthTitle,
          cardClass: classes.healthCard,
          buttonColor: 'error'
        };
      case 'soul':
        return {
          title: 'INTEGRIDADE DA ALMA',
          icon: React.createElement(SoulIcon, { className: classes.healthIcon }),
          color: '#9c27b0', // 🟣 ROXO - Alma (dano espiritual)
          progressClass: classes.soulProgress,
          titleClass: classes.soulTitle,
          cardClass: classes.soulCard,
          buttonColor: 'secondary'
        };
      case 'energy':
        return {
          title: 'ENERGIA AMALDIÇOADA (PE)',
          icon: React.createElement(LocalHospital, { className: classes.healthIcon }),
          color: '#2196f3', // 🔵 AZUL - Energia
          progressClass: classes.energyProgress,
          titleClass: classes.energyTitle,
          cardClass: classes.energyCard,
          buttonColor: 'primary'
        };
      default:
        return {};
    }
  };

  const config = getConfig();
  const progress = max > 0 ? (current / max) * 100 : 0;

  const handleMinusClick = (e) => {
    e.stopPropagation();
    
    if (type === 'energy') {
      onQuickAction('energy_remove', 1);
    } else if (type === 'hp') {
      onQuickAction('damage', 1);
    } else if (type === 'soul') {
      onQuickAction('soul_damage', 1);
    }
  };

  const handlePlusClick = (e) => {
    e.stopPropagation();
    
    if (type === 'energy') {
      onQuickAction('energy', 1);
    } else if (type === 'hp') {
      onQuickAction('heal', 1);
    } else if (type === 'soul') {
      onQuickAction('soul_heal', 1);
    }
  };

  // MOSTRAR BOTÕES PARA TODOS AGORA (ambos são recursos variáveis)
  const showActionButtons = true;

  return React.createElement(Grid, { 
    item: true, 
    xs: 12, 
    md: 4,
    style: { display: 'flex' }
  },
    React.createElement(Card, { 
      className: config.cardClass, 
      onClick: onClick,
      style: { 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '200px',
        cursor: 'pointer'
      }
    },
      React.createElement(CardContent, { 
        style: { 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column',
          padding: '16px'
        }
      },
        React.createElement(Box, { 
          className: classes.healthHeader,
          style: { flex: '0 0 auto' }
        },
          React.createElement(Typography, { 
            className: config.titleClass,
            style: { fontSize: '0.9rem' }
          },
            config.icon,
            config.title
          ),
          React.createElement(IconButton, { 
            size: "small",
            style: { flex: '0 0 auto' },
            className: classes.editButton,
            onClick: (e) => {
              e.stopPropagation();
              onClick();
            }
          },
            React.createElement(Edit, { fontSize: "small" })
          )
        ),

        React.createElement(Box, { 
          className: classes.progressContainer,
          style: { 
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            margin: '10px 0'
          }
        },
          React.createElement(Box, { className: classes.progressLabel },
            React.createElement(Typography, { 
              className: classes.progressText,
              style: { fontSize: '0.8rem' }
            },
              `${current} / ${max}`
            ),
            React.createElement(Typography, { 
              className: classes.progressValue, 
              style: { 
                color: config.color,
                fontSize: '0.9rem'
              }
            },
              `${Math.round(progress)}%`
            )
          ),
          React.createElement(LinearProgress, {
            variant: "determinate",
            value: progress,
            className: config.progressClass,
            style: { 
              height: '12px',
              backgroundColor: `${config.color}20`, // Cor de fundo mais clara
              '& .MuiLinearProgress-bar': {
                backgroundColor: config.color
              }
            }
          })
        ),

        React.createElement(Box, { 
          className: classes.quickActions,
          style: { 
            flex: '0 0 auto',
            marginTop: 'auto',
            paddingTop: '12px',
            minHeight: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }
        },
          showActionButtons ? React.createElement(React.Fragment, null,
            React.createElement(Button, {
              size: "small",
              variant: "outlined",
              color: config.buttonColor,
              onClick: handleMinusClick,
              className: classes.quickActionButton,
              startIcon: React.createElement(Remove, { fontSize: "small" }),
              disabled: current <= 0
            }, '-1'),
            React.createElement(Button, {
              size: "small",
              variant: "contained",
              color: config.buttonColor,
              onClick: handlePlusClick,
              className: classes.quickActionButton,
              startIcon: React.createElement(Add, { fontSize: "small" }),
              disabled: current >= max
            }, '+1')
          ) : null
        )
      )
    )
  );
});

export default HealthBar;