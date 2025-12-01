// sections/SkillsSection.js
import React from 'react';
import { withStyles } from '@mui/styles';
import { Box, Typography, Grid } from '@mui/material';
import PericiaCardCompact from '../components/PericiaCardCompact';
import ModuleSection from '../components/ModuleSection';

const styles = {
  hierarchicalLayout: {
    // Estilos para o layout hierárquico
  },
  leftColumn: {
    // Estilos para a coluna esquerda
  },
  rightColumn: {
    // Estilos para a coluna direita
  },
  rightModulesContainer: {
    // Estilos para o container de módulos da direita
  },
  columnTitle: {
    color: '#960df2',
    borderColor: '#780ac2'
  }
};

const SkillsSection = ({
  pericias,
  oficios,
  resistencias,
  ataques,
  localAttributes,
  handleToggleTreinada,
  handleOutrosChange,
  handlePericiaRoll,
  character,
  classes
}) => {
  return React.createElement(Box, { className: classes.hierarchicalLayout },
    React.createElement(Box, { className: classes.leftColumn },
      React.createElement(Typography, { 
        className: classes.columnTitle
      }, 'PERÍCIAS'),
      
      React.createElement(Grid, { container: true, spacing: 0.5 },
        pericias.map((pericia) =>
          React.createElement(Grid, { item: true, xs: 20, key: pericia.nome },
            React.createElement(PericiaCardCompact, {
              pericia: pericia,
              attributes: localAttributes,
              onToggleTreinada: handleToggleTreinada,
              onOutrosChange: handleOutrosChange,
              onRoll: handlePericiaRoll,
              classes: classes,
              character: character,
              modulo: 'pericias'
            })
          )
        )
      )
    ),

    React.createElement(Box, { className: classes.rightColumn },
      React.createElement(Box, { className: classes.rightModulesContainer },
        React.createElement(ModuleSection, {
          title: 'OFÍCIOS',
          items: oficios,
          attributes: localAttributes,
          onToggleTreinada: handleToggleTreinada,
          onOutrosChange: handleOutrosChange,
          onRoll: handlePericiaRoll,
          classes: classes,
          character: character,
          modulo: 'oficios'
        }),

        React.createElement(ModuleSection, {
          title: 'RESISTÊNCIAS',
          items: resistencias,
          attributes: localAttributes,
          onToggleTreinada: handleToggleTreinada,
          onOutrosChange: handleOutrosChange,
          onRoll: handlePericiaRoll,
          classes: classes,
          character: character,
          modulo: 'resistencias'
        }),

        React.createElement(ModuleSection, {
          title: 'ATAQUES',
          items: ataques,
          attributes: localAttributes,
          onToggleTreinada: handleToggleTreinada,
          onOutrosChange: handleOutrosChange,
          onRoll: handlePericiaRoll,
          classes: classes,
          character: character,
          modulo: 'ataques'
        })
      )
    )
  );
};

export default withStyles(styles)(React.memo(SkillsSection));