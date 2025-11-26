// components/PericiaCardCompact.js
import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Checkbox, 
  TextField, 
  Button 
} from '@mui/material';
import { Casino } from '@mui/icons-material';
import { calcularTotalPericia } from '../utils/characterCalculations';

const PericiaCardCompact = React.memo(({ 
  pericia, 
  attributes, 
  onToggleTreinada, 
  onOutrosChange, 
  onRoll,
  classes,
  character,
  modulo = 'pericias'
}) => {
  const total = calcularTotalPericia(pericia, attributes);
  
  return React.createElement(Card, { 
    className: classes.periciaCardCompact
  },
    React.createElement(CardContent, { style: { padding: '10px' } },
      React.createElement(Box, { 
        className: classes.periciaHeaderCompact
      },
        React.createElement(Box, { style: { flex: 1, minWidth: '100px' } },
          React.createElement(Typography, { 
            className: classes.periciaNameCompact
          }, pericia.nome),
          React.createElement(Typography, { 
            className: classes.periciaAtributoCompact
          }, pericia.atributo)
        ),
        
        React.createElement(Typography, { 
          className: classes.periciaTotalCompact
        }, `${total >= 0 ? '+' : ''}${total}`),
        
        React.createElement(Box, { className: classes.periciaControlsCompact },
          React.createElement(Box, { className: classes.periciaCheckboxContainer },
            React.createElement(Typography, { 
              className: classes.checkboxLabel
            }, 'T'),
            React.createElement(Checkbox, {
              checked: pericia.treinada,
              onChange: (e) => onToggleTreinada(pericia.nome, e.target.checked, 'treinada', modulo),
              size: "small",
              className: classes.treinadaCheckboxCompact
            })
          ),
          
          React.createElement(Box, { className: classes.periciaCheckboxContainer },
            React.createElement(Typography, { 
              className: classes.checkboxLabel
            }, 'M'),
            React.createElement(Checkbox, {
              checked: pericia.mestre,
              onChange: (e) => onToggleTreinada(pericia.nome, e.target.checked, 'mestre', modulo),
              size: "small", 
              className: classes.mestreCheckboxCompact
            })
          ),
          
          React.createElement(TextField, {
            type: "number",
            value: pericia.outros,
            onChange: (e) => onOutrosChange(pericia.nome, parseInt(e.target.value) || 0, modulo),
            className: classes.outrosFieldCompact,
            size: "small",
            variant: "outlined",
            inputProps: { 
              min: -10,
              max: 10,
              style: { textAlign: 'center' }
            }
          }),
          
          React.createElement(Button, {
            className: classes.periciaRollButtonCompact,
            size: "small",
            onClick: () => onRoll(pericia, total),
            disabled: !character,
            title: `Rolar ${pericia.nome}`
          }, React.createElement(Casino, { fontSize: "small" }))
        )
      )
    )
  );
});

export default PericiaCardCompact;