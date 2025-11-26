// components/sheets/Feiticos-modos/components/DerivedValuesDisplay.js
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Psychology as AttentionIcon,
  Shield as DefenseIcon,
  FlashOn as InitiativeIcon,
  DirectionsRun as MovementIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const DerivedValuesDisplay = ({ 
  values, 
  onConfigure,
  classes 
}) => {
  const ValueDisplay = ({ title, value, icon, description, color = 'primary' }) => (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent sx={{ textAlign: 'center', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          {React.cloneElement(icon, { color, sx: { fontSize: 32 } })}
        </Box>
        
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 'bold', 
            color: `${color}.main`,
            mb: 0.5
          }}
        >
          {value}
        </Typography>

        <Typography variant="caption" color="text.secondary" display="block">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip title="Configurar Valores Derivados">
        <IconButton 
          size="small" 
          onClick={onConfigure}
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            backgroundColor: 'background.paper',
            boxShadow: 1,
            zIndex: 1
          }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <ValueDisplay
            title="ATENÇÃO"
            value={values.ATENÇÃO.valor}
            icon={<AttentionIcon />}
            description={values.ATENÇÃO.formula}
            color="primary"
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <ValueDisplay
            title="DEFESA"
            value={values.DEFESA.valor}
            icon={<DefenseIcon />}
            description={values.DEFESA.formula}
            color="secondary"
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <ValueDisplay
            title="INICIATIVA"
            value={`${values.INICIATIVA.valor >= 0 ? '+' : ''}${values.INICIATIVA.valor}`}
            icon={<InitiativeIcon />}
            description={values.INICIATIVA.formula}
            color="warning"
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <ValueDisplay
            title="DESLOCAMENTO"
            value={`${values.DESLOCAMENTO.valor}m`}
            icon={<MovementIcon />}
            description={values.DESLOCAMENTO.formula}
            color="success"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DerivedValuesDisplay;