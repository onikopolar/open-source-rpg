// sections/AttributesSection.js
import React from 'react';
import { withStyles } from '@mui/styles';
import { Box } from '@mui/material';
import AttributeWheel from '../components/AttributeWheel';
import EmptyWheel from '../components/EmptyWheel';

const styles = {
  centerColumn: {},
  mahoragaLayout: {},
  wheelCanvas: {}
};

const AttributesSection = ({
  localAttributes,
  canvasRef,
  wheelPositions,
  handleInputChange,
  handleBlur,
  handleKeyDown,
  handleAttributeRoll,
  updateAttribute,
  classes
}) => {
  return React.createElement(Box, { className: classes.centerColumn },
    React.createElement(Box, { 
      className: classes.mahoragaLayout
    },
      React.createElement('canvas', {
        ref: canvasRef,
        width: 520,
        height: 520,
        className: classes.wheelCanvas
      }),
      wheelPositions.map((position, index) => {
        if (position.type === 'attribute') {
          const attribute = localAttributes.find(attr => attr.name === position.name);
          if (attribute) {
            return React.createElement(AttributeWheel, {
              key: position.name,
              position: position,
              attribute: attribute,
              classes,
              handleInputChange,
              handleBlur,
              handleKeyDown,
              handleAttributeRoll,
              updateAttribute
            });
          }
        } else {
          return React.createElement(EmptyWheel, {
            key: `empty-${index}`,
            position: position,
            classes
          });
        }
        return null;
      })
    )
  );
};

export default withStyles(styles)(React.memo(AttributesSection));