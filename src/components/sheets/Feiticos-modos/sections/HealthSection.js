// sections/HealthSection.js - VERSÃO CORRIGIDA
import React from 'react';
import { withStyles } from '@mui/styles';
import { Box, Typography, Grid } from '@mui/material';
import HealthBar from '../components/HealthBar';

const styles = {
  healthSection: {},
  sectionTitle: {},
  healthGrid: {}
};

const HealthSection = ({ 
  additionalValues, 
  currentHP, 
  currentSoul, // ← NOVO: valor atual da Integridade
  currentPE, 
  maxHP, 
  maxPE, 
  handleHealthClick, 
  handleSoulClick, 
  handleEnergyClick, 
  handleQuickAction, 
  classes 
}) => {
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
      // PONTOS DE VIDA (dano físico)
      React.createElement(HealthBar, {
        type: "hp",
        data: additionalValues.PONTOS_VIDA,
        current: currentHP,
        max: maxHP,
        onClick: handleHealthClick,
        onQuickAction: handleQuickAction,
        classes
      }),
      // INTEGRIDADE DA ALMA (dano espiritual) - RECURSO SEPARADO
      React.createElement(HealthBar, {
        type: "soul", 
        data: additionalValues.INTEGRIDADE_ALMA,
        current: currentSoul, // ← valor atual separado
        max: maxHP, // ← mesmo máximo que PV
        onClick: handleSoulClick,
        onQuickAction: handleQuickAction,
        classes
      }),
      // ENERGIA AMALDIÇOADA
      React.createElement(HealthBar, {
        type: "energy",
        data: additionalValues.PONTOS_ENERGIA,
        current: currentPE,
        max: maxPE,
        onClick: handleEnergyClick,
        onQuickAction: handleQuickAction,
        classes
      })
    )
  );
};

export default withStyles(styles)(React.memo(HealthSection));