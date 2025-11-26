// components/ModuleSection.js
import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import PericiaCardCompact from './PericiaCardCompact';

const ModuleSection = React.memo(({ 
  title, 
  items, 
  attributes, 
  onToggleTreinada, 
  onOutrosChange, 
  onRoll,
  classes,
  character,
  modulo
}) => {
  return React.createElement(Box, { className: classes.moduleSection },
    React.createElement(Typography, { className: classes.moduleTitle },
      title
    ),
    React.createElement(Box, { className: classes.periciasContainer },
      items.map((item) =>
        React.createElement(Grid, { item: true, xs: 20, key: item.nome },
          React.createElement(PericiaCardCompact, {
            key: item.nome,
            pericia: item,
            attributes: attributes,
            onToggleTreinada: onToggleTreinada,
            onOutrosChange: onOutrosChange,
            onRoll: onRoll,
            classes: classes,
            character: character,
            modulo: modulo
          })
        )
      )
    )
  );
});

export default ModuleSection;