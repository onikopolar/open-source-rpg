// components/sheets/Feiticos-modos/modals/DerivedValuesModal.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Psychology as PsychologyIcon,
  Shield as DefenseIcon, 
  FlashOn as InitiativeIcon,
  DirectionsRun as MovementIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const DerivedValuesModal = ({ 
  open, 
  onClose, 
  onSave,
  additionalValues,
  currentBonuses = {}
}) => {
  const [bonuses, setBonuses] = useState(currentBonuses);

  const handleBonusChange = (field, value) => {
    setBonuses(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  const calculateTotal = (baseValue, bonus = 0) => {
    return baseValue + bonus;
  };

  const getValues = () => {
    const baseValues = {
      ATENÇÃO: additionalValues?.ATENÇÃO?.valor || 10,
      DEFESA: additionalValues?.DEFESA?.valor || 10,
      INICIATIVA: additionalValues?.INICIATIVA?.valor || 0,
      DESLOCAMENTO: additionalValues?.DESLOCAMENTO?.valor || 9
    };

    return {
      ATENÇÃO: calculateTotal(baseValues.ATENÇÃO, bonuses.atencao),
      DEFESA: calculateTotal(baseValues.DEFESA, bonuses.defesa),
      INICIATIVA: calculateTotal(baseValues.INICIATIVA, bonuses.iniciativa),
      DESLOCAMENTO: calculateTotal(baseValues.DESLOCAMENTO, bonuses.deslocamento)
    };
  };

  const values = getValues();

  const ValueCard = ({ title, value, baseValue, bonus, icon, description, onBonusChange }) => (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent sx={{ textAlign: 'center', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
            {title}
          </Typography>
          <Tooltip title={description} arrow>
            <IconButton size="small" sx={{ ml: 0.5 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          color: 'primary.main',
          mb: 1 
        }}>
          {value}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Base: {baseValue}
          </Typography>
          <TextField
            size="small"
            label="Bônus Adicional"
            type="number"
            value={bonus}
            onChange={(e) => onBonusChange(e.target.value)}
            sx={{ mt: 1, width: '100%' }}
            inputProps={{ 
              style: { textAlign: 'center' },
              min: -10,
              max: 10
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  const handleSave = () => {
    onSave(bonuses);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        backgroundColor: 'primary.main',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PsychologyIcon sx={{ mr: 1 }} />
          Configurar Valores Derivados
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure os bônus adicionais para cada valor derivado. Os valores base são calculados automaticamente.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <ValueCard
              title="ATENÇÃO"
              value={values.ATENÇÃO}
              baseValue={additionalValues?.ATENÇÃO?.valor || 10}
              bonus={bonuses.atencao || 0}
              icon={<PsychologyIcon color="primary" />}
              description="Percepção passiva do ambiente = 10 + Bônus Percepção + Outros Bônus"
              onBonusChange={(value) => handleBonusChange('atencao', value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <ValueCard
              title="DEFESA"
              value={values.DEFESA}
              baseValue={additionalValues?.DEFESA?.valor || 10}
              bonus={bonuses.defesa || 0}
              icon={<DefenseIcon color="secondary" />}
              description="Dificuldade para ser acertado = 10 + Mod. Destreza + Metade do Nível + Outros Bônus"
              onBonusChange={(value) => handleBonusChange('defesa', value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <ValueCard
              title="INICIATIVA"
              value={`${values.INICIATIVA >= 0 ? '+' : ''}${values.INICIATIVA}`}
              baseValue={additionalValues?.INICIATIVA?.valor || 0}
              bonus={bonuses.iniciativa || 0}
              icon={<InitiativeIcon sx={{ color: '#ff9800' }} />}
              description="Ordem de turno no combate = Mod. Destreza + Outros Bônus"
              onBonusChange={(value) => handleBonusChange('iniciativa', value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <ValueCard
              title="DESLOCAMENTO"
              value={`${values.DESLOCAMENTO}m`}
              baseValue={additionalValues?.DESLOCAMENTO?.valor || 9}
              bonus={bonuses.deslocamento || 0}
              icon={<MovementIcon sx={{ color: '#4caf50' }} />}
              description="Distância por ação de movimento = 9 + Outros Bônus"
              onBonusChange={(value) => handleBonusChange('deslocamento', value)}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Fórmulas Base:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Atenção:</strong> {additionalValues?.ATENÇÃO?.formula}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Defesa:</strong> {additionalValues?.DEFESA?.formula}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Iniciativa:</strong> {additionalValues?.INICIATIVA?.formula}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Deslocamento:</strong> {additionalValues?.DESLOCAMENTO?.formula}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
        >
          Salvar Configurações
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DerivedValuesModal;