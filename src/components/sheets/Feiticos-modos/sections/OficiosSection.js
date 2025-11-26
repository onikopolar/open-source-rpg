// sections/OficiosSection.js
import React from 'react';
import { withStyles } from '@mui/styles';
import { Box, Typography } from '@mui/material';
import ModuleSection from '../components/ModuleSection';

const styles = {
  rightColumn: {},
  rightModulesContainer: {}
};

const OficiosSection = ({
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
  return React.createElement(Box, { className: classes.rightColumn },
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
  );
};

export default withStyles(styles)(React.memo(OficiosSection));