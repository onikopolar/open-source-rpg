import React from 'react';
import { Box, Typography } from '@mui/material';

const Section = ({ title, children, renderButton, ...props }) => {
  return (
    <Box
      sx={{
        padding: 3,
        margin: 2,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
      {...props}
    >
      {title && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 2 
        }}>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              color: 'primary.main',
              fontWeight: 'bold',
            }}
          >
            {title}
          </Typography>
          
          {renderButton && renderButton()}
        </Box>
      )}
      {children}
    </Box>
  );
};

export default Section;
