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
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Inventory as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const EquipmentNotepad = ({ character, onSave }) => {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [equipmentNotes, setEquipmentNotes] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Carregar notas do equipamento quando o componente montar ou o personagem mudar
  useEffect(() => {
    if (character?.equipment_notes) {
      try {
        // Tentar analisar se for JSON string
        let notes = character.equipment_notes;
        if (typeof notes === 'string') {
          notes = notes.replace(/^"+|"+$/g, '');
          if (notes.startsWith('{') || notes.startsWith('[')) {
            notes = JSON.parse(notes);
          }
        }
        setEquipmentNotes(typeof notes === 'string' ? notes : '');
      } catch (error) {
        console.error('Erro ao carregar notas de equipamento:', error);
        setEquipmentNotes('');
      }
    } else {
      setEquipmentNotes('');
    }
  }, [character]);

  const handleOpen = () => {
    setOpen(true);
    setIsEditing(false);
    setTempNotes(equipmentNotes);
  };

  const handleClose = () => {
    setOpen(false);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTempNotes(equipmentNotes);
  };

  const handleSave = async () => {
    setEquipmentNotes(tempNotes);
    setIsEditing(false);
    
    if (onSave && character?.id) {
      try {
        await onSave('equipment_notes', tempNotes);
      } catch (error) {
        console.error('Erro ao salvar notas de equipamento:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempNotes(equipmentNotes);
  };

  const handleNotesChange = (e) => {
    setTempNotes(e.target.value);
  };

  return (
    <>
      {/* Botão para abrir o modal */}
      <Paper
        elevation={2}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 6
          }
        }}
      >
        <Button
          onClick={handleOpen}
          variant="contained"
          startIcon={<InventoryIcon />}
          sx={{
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 2,
            '&:hover': {
              backgroundColor: '#1565c0'
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" fontWeight="bold">
              Equipamentos
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, textAlign: 'left' }}>
              Abra para ler/anotar
            </Typography>
          </Box>
        </Button>
      </Paper>

      {/* Modal/Diálogo */}
      <Dialog
        open={open}
        onClose={handleClose}
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
            overflow: 'hidden'
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
              Equipamentos & Anotações
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {isEditing ? (
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
                  '& textarea': {
                    height: '100% !important',
                    resize: 'none',
                    padding: 3,
                    fontSize: '0.95rem',
                    lineHeight: 1.6
                  }
                }
              }}
            />
          ) : (
            <Box
              sx={{
                flex: 1,
                p: 3,
                overflow: 'auto',
                backgroundColor: '#f9f9f9',
                minHeight: '100%'
              }}
            >
              {equipmentNotes ? (
                <Typography
                  component="div"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    color: 'text.primary'
                  }}
                >
                  {equipmentNotes}
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                    textAlign: 'center',
                    p: 4
                  }}
                >
                  <InventoryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    Nenhuma anotação de equipamentos
                  </Typography>
                  <Typography variant="body2">
                    Clique no botão "Editar" para começar a adicionar seus equipamentos e anotações.
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 2, opacity: 0.7 }}>
                    Dica: Liste seus equipamentos, armas, itens especiais e quaisquer observações importantes.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            backgroundColor: '#f5f5f5',
            borderTop: '1px solid #e0e0e0',
            p: 2,
            justifyContent: 'space-between'
          }}
        >
          {isEditing ? (
            <>
              <Button
                onClick={handleCancelEdit}
                startIcon={<CancelIcon />}
                variant="outlined"
                color="secondary"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                startIcon={<SaveIcon />}
                variant="contained"
                color="primary"
                disabled={tempNotes === equipmentNotes}
              >
                Salvar
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                {equipmentNotes 
                  ? `${equipmentNotes.split('\n').length} linhas, ${equipmentNotes.length} caracteres`
                  : 'Sem anotações'
                }
              </Typography>
              <Button
                onClick={handleEdit}
                startIcon={<EditIcon />}
                variant="contained"
                color="primary"
              >
                {equipmentNotes ? 'Editar' : 'Adicionar Anotações'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EquipmentNotepad;
