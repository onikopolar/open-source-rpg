import React from 'react';
import { Box, Typography } from '@mui/material';

const AddBox = ({ title, children, onClick, ...props }) => {
  return (
    <Box
      sx={{
        backgroundColor: 'primary.main',
        borderRadius: '8px',
        padding: '20px',
        width: '100%',
        minHeight: '120px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        '&:hover': {
          backgroundColor: 'primary.dark',
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
        transition: 'all 0.3s ease',
        boxShadow: 1,
      }}
      onClick={onClick}
      {...props}
    >
      <Typography 
        variant="h6" 
        component="div"
        sx={{ 
          color: 'white', 
          textAlign: 'center',
          fontWeight: 'bold',
          mb: 1
        }}
      >
        {title || '+'}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'white', 
          textAlign: 'center',
          opacity: 0.9
        }}
      >
        {children || 'Clique para adicionar'}
      </Typography>
    </Box>
  );
};

export default AddBox;
