import React from 'react';
import { Box } from '@mui/material';

const styles = (theme) => ({
  diamondWeb: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    zIndex: 2,
    pointerEvents: 'none'
  },
  webLine: {
    position: 'absolute',
    backgroundColor: 'rgba(252, 80, 22, 1)',
    height: '1px',
    transformOrigin: '0 0'
  }
});

const DiamondWeb = ({ classes }) => {
  const centerX = 150;
  const centerY = 150;
  
  const attributeConnections = [
    { start: { x: centerX, y: 0 }, end: { x: 0, y: centerY } },
    { start: { x: centerX, y: 0 }, end: { x: 300, y: centerY } },
    { start: { x: 0, y: centerY }, end: { x: centerX, y: 300 } },
    { start: { x: 300, y: centerY }, end: { x: centerX, y: 300 } },
    { start: { x: 0, y: centerY }, end: { x: 300, y: centerY } },
    { start: { x: centerX, y: 0 }, end: { x: centerX, y: 300 } }
  ];
  
  const lines = attributeConnections.map((connection, index) => {
    const start = connection.start;
    const end = connection.end;
    
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return (
      <div
        key={`diamond-line-${index}`}
        className={classes.webLine}
        style={{
          width: `${distance}px`,
          left: `${start.x}px`,
          top: `${start.y}px`,
          transform: `rotate(${angle}deg)`
        }}
      />
    );
  });
  
  return <Box className={classes.diamondWeb}>{lines}</Box>;
};

export default DiamondWeb;
export { styles as diamondWebStyles };
