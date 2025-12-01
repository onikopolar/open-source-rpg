// components/PericiaCardCompact.js
import React from 'react';
import { withStyles } from '@mui/styles';
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

const styles = {
  periciaCardCompact: {
    // Estilos para o card compacto de perícia
  },
  periciaHeaderCompact: {
    // Estilos para o cabeçalho compacto
  },
  periciaNameCompact: {
    // Estilos para o nome da perícia
  },
  periciaAtributoCompact: {
    // Estilos para o atributo da perícia
  },
  periciaTotalCompact: {
    // Estilos para o total da perícia
  },
  periciaControlsCompact: {
    // Estilos para os controles da perícia
  },
  periciaCheckboxContainer: {
    // Estilos para o container do checkbox
  },
  checkboxLabel: {
    // Estilos para o label do checkbox
  },
  treinadaCheckboxCompact: {
    // Estilos para o checkbox de treinada
  },
  mestreCheckboxCompact: {
    // Estilos para o checkbox de mestre
  },
  outrosFieldCompact: {
    // Estilos para o campo outros
  },
  periciaRollButtonCompact: {
    // Estilos para o botão de rolar
  },
  cardContent: {
    padding: '10px'
  },
  periciaInfo: {
    flex: 1,
    minWidth: '100px'
  }
};

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
    React.createElement(CardContent, { className: classes.cardContent },
      React.createElement(Box, { 
        className: classes.periciaHeaderCompact
      },
        React.createElement(Box, { className: classes.periciaInfo },
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

export default withStyles(styles)(PericiaCardCompact);