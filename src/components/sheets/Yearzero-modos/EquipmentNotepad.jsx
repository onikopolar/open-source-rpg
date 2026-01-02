import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

// Estilos para o componente (igual aos trackers)
export const equipmentNotepadStyles = (theme) => ({
  equipmentTracker: {
    background: '#655959cc',
    border: '1px solid #2196f3',
    borderRadius: '4px',
    padding: '10px 12px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
    height: 'fit-content',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
      borderColor: '#1976d2',
      transform: 'translateY(-2px)'
    }
  },
  equipmentHeader: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    marginBottom: '6px',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: '0.5px',
    color: '#2196f3'
  },
  equipmentContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60px'
  },
  equipmentText: {
    fontSize: '0.65rem',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 1.3
  },
  equipmentHint: {
    fontSize: '0.55rem',
    color: 'rgba(33, 150, 243, 0.8)',
    textAlign: 'center',
    marginTop: '4px',
    fontStyle: 'italic'
  }
});

const EquipmentNotepad = ({ character, onSave, classes }) => {
  const [open, setOpen] = useState(false);
  const [equipmentNotes, setEquipmentNotes] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Carregar notas
  useEffect(() => {
    if (character?.equipment_notes) {
      try {
        let notes = character.equipment_notes;
        if (typeof notes === 'string') {
          notes = notes.replace(/^"+|"+$/g, '');
          if (notes.startsWith('{') || notes.startsWith('[')) {
            notes = JSON.parse(notes);
          }
        }
        setEquipmentNotes(typeof notes === 'string' ? notes : '');
        setTempNotes(typeof notes === 'string' ? notes : '');
      } catch (error) {
        console.error('Erro ao carregar notas:', error);
        setEquipmentNotes('');
        setTempNotes('');
      }
    } else {
      setEquipmentNotes('');
      setTempNotes('');
    }
  }, [character]);

  const handleOpen = () => {
    setOpen(true);
    setTempNotes(equipmentNotes);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    setEquipmentNotes(tempNotes);
    if (onSave && character?.id) {
      try {
        await onSave('equipment_notes', tempNotes);
      } catch (error) {
        console.error('Erro ao salvar:', error);
      }
    }
    handleClose();
  };

  const handleCancel = () => {
    setTempNotes(equipmentNotes);
    handleClose();
  };

  const handleNotesChange = (e) => {
    setTempNotes(e.target.value);
  };

  // Contar itens para preview
  const countItems = () => {
    if (!equipmentNotes.trim()) return 0;
    return equipmentNotes.split('\n').filter(line => line.trim()).length;
  };

  return (
    <>
      {/* RETÂNGULO/QUADRADO - Igual aos trackers */}
      <Paper 
        className={classes.equipmentTracker}
        onClick={handleOpen}
      >
        <Typography className={classes.equipmentHeader}>
          <InventoryIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
          Equipamentos
        </Typography>
        
        <Box className={classes.equipmentContent}>
          <Typography className={classes.equipmentText}>
            {countItems() > 0 
              ? `${countItems()} itens anotados` 
              : 'Clique para anotar equipamentos'
            }
          </Typography>
        </Box>
        
        <Typography className={classes.equipmentHint}>
          Abrir notepad
        </Typography>
      </Paper>

      {/* MODAL - É o notepad direto */}
      <Dialog
        open={open}
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            height: isMobile ? '100vh' : '80vh',
            maxHeight: isMobile ? '100vh' : '700px',
            width: isMobile ? '100vw' : '600px',
            margin: isMobile ? 0 : '20px',
            overflow: 'hidden',
            background: '#655959ee',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: '#1976d2',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
            px: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InventoryIcon />
            <Typography variant="h6" component="div">
              Notepad - Equipamentos
            </Typography>
          </Box>
          <IconButton onClick={handleCancel} size="small" sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <TextField
            autoFocus
            multiline
            rows={isMobile ? 20 : 25}
            value={tempNotes}
            onChange={handleNotesChange}
            placeholder="Digite suas anotações sobre equipamentos aqui...

Exemplo:
- Pistola (6 balas)
- Faca de combate
- Kit de primeiros socorros
- Lanterna
- Ração para 3 dias
- Corda (10m)
- Cantil com água
- Mapa da região"
            variant="outlined"
            fullWidth
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                height: '100%',
                alignItems: 'flex-start',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                '& textarea': {
                  height: '100% !important',
                  resize: 'none',
                  padding: 3,
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  fontFamily: 'monospace',
                  color: 'rgba(255, 255, 255, 0.9)'
                },
                '& fieldset': {
                  borderColor: 'rgba(33, 150, 243, 0.3)'
                }
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)'
              }
            }}
          />
        </DialogContent>

        <DialogActions sx={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.3)', 
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Button 
            onClick={handleCancel} 
            startIcon={<CancelIcon />} 
            variant="outlined"
            sx={{
              color: '#ff6b35',
              borderColor: '#ff6b35',
              '&:hover': {
                borderColor: '#ff6b35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            startIcon={<SaveIcon />} 
            variant="contained"
            sx={{
              backgroundColor: '#2196f3',
              '&:hover': {
                backgroundColor: '#1976d2'
              }
            }}
            disabled={tempNotes === equipmentNotes}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EquipmentNotepad;
