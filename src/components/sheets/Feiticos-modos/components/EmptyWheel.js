// components/EmptyWheel.js
import React from 'react';
import { Box, Card } from '@mui/material';

const EmptyWheel = React.memo(({ position, classes }) => {
  return React.createElement(Box, {
    className: classes.wheelPosition,
    style: { 
      left: `${position.x}px`, 
      top: `${position.y}px` 
    }
  }, React.createElement(Card, { className: classes.emptyWheel }));
});

export default EmptyWheel;