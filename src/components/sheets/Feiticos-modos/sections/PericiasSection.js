// sections/PericiasSection.js
import React from 'react';
import { withStyles } from '@mui/styles';
import { Box, Typography, Grid } from '@mui/material';
import PericiaCardCompact from '../components/PericiaCardCompact';

const styles = {
  leftColumn: {},
  columnTitle: {}
};

const PericiasSection = ({
  pericias,
  localAttributes,
  handleToggleTreinada,
  handleOutrosChange,
  handlePericiaRoll,
  character,
  classes
}) => {
  return React.createElement(Box, { className: classes.leftColumn },
    React.createElement(Typography, { 
      className: classes.columnTitle,
      style: { color: '#960df2', borderColor: '#780ac2' }
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
  );
};

export default withStyles(styles)(React.memo(PericiasSection));