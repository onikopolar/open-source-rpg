// sections/PericiasSection.js
import React from 'react';
import { withStyles } from '@mui/styles';
import { Box, Typography, Grid } from '@mui/material';
import PericiaCardCompact from '../components/PericiaCardCompact';

const styles = {
  leftColumn: {},
  columnTitle: {
    color: '#639EC2',
    borderColor: '#639EC2',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '16px',
    padding: '8px 16px',
    border: '2px solid #639EC2',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, rgba(99, 158, 194, 0.1) 0%, rgba(74, 122, 156, 0.2) 100%)',
    textAlign: 'center',
    textShadow: '0 0 8px rgba(99, 158, 194, 0.4)'
  }
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
  );
};

export default withStyles(styles)(React.memo(PericiasSection));