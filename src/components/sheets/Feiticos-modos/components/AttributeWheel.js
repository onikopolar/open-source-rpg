// components/AttributeWheel.js
import React from 'react';
import { Box, Typography, Card, CardContent, TextField, IconButton } from '@mui/material';
import { Casino } from '@mui/icons-material';
import { calculateModifier } from '../utils/characterCalculations';

const AttributeWheel = React.memo(({ 
  position, 
  attribute, 
  classes, 
  handleInputChange, 
  handleBlur, 
  handleKeyDown, 
  handleAttributeRoll, 
  updateAttribute 
}) => {
  const modifier = calculateModifier(attribute.value);
  
  const getTextPosition = () => {
    switch (position.name) {
      case 'FORÇA':
        return { top: '-45px', left: '50%', transform: 'translateX(-50%)' };
      case 'DESTREZA':
        return { top: '155px', left: '50%', transform: 'translateX(-50%)' };
      case 'CONSTITUIÇÃO':
        return { top: '155px', left: '50%', transform: 'translateX(-50%)' };
      case 'INTELIGÊNCIA':
        return { bottom: '165px', left: '50%', transform: 'translateX(-50%)' };
      case 'SABEDORIA':
        return { bottom: '-45px', left: '50%', transform: 'translateX(-50%)' };
      case 'PRESENÇA':
        return { bottom: '165px', left: '50%', transform: 'translateX(-50%)' };
      default:
        return { top: '-45px', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  const textPosition = getTextPosition();

  return React.createElement(Box, {
    className: classes.wheelPosition,
    style: { 
      left: `${position.x}px`, 
      top: `${position.y}px`,
      position: 'absolute'
    }
  },
    React.createElement(Box, {
      style: {
        position: 'absolute',
        ...textPosition,
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 25,
        width: 'max-content'
      }
    },
      React.createElement(Typography, {
        style: {
          fontSize: '0.75rem',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          whiteSpace: 'nowrap',
          background: 'rgba(99, 158, 194, 0.9)',
          padding: '4px 10px',
          borderRadius: '12px',
          border: '2px solid #4a7a9c',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          display: 'inline-block'
        }
      }, attribute.name)
    ),

    React.createElement(Card, { className: classes.attributeWheel },
      React.createElement(CardContent, { style: { padding: '8px' } },
        React.createElement(Box, { className: classes.attributeValueContainerWheel },
          React.createElement(TextField, {
            type: "number",
            value: attribute.value,
            onChange: (e) => handleInputChange(e, updateAttribute, attribute.name),
            onBlur: (e) => handleBlur(e, updateAttribute, attribute.name),
            onKeyDown: (e) => handleKeyDown(e, attribute.value, updateAttribute, attribute.name),
            inputProps: { 
              min: 0, 
              max: 30,
              style: { textAlign: 'center' }
            },
            className: classes.attributeInputWheel,
            size: "small"
          }),
          React.createElement(IconButton, {
            className: classes.diceButtonWheel,
            onClick: () => handleAttributeRoll(attribute.name),
            size: "small"
          }, React.createElement(Casino, { fontSize: "small" }))
        ),

        React.createElement(Box, { className: classes.modifierBoxWheel },
          React.createElement(Typography, { className: classes.modifierLabelWheel },
            'MODIFICADOR'
          ),
          React.createElement(Typography, { variant: "h6", style: { fontSize: '0.9rem' } },
            `${modifier >= 0 ? '+' : ''}${modifier}`
          )
        )
      )
    )
  );
});

export default AttributeWheel;