import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import { 
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { withStyles } from '@mui/styles';

// Versão 1.0.0 - Fix: Criando EquipmentNotepad com quadrados perfeitos
console.log('[EquipmentNotepad] Versão 1.0.0 - Criando componente com layout igual ao HealthStressTracker');

const equipmentNotepadStyles = (theme) => ({
  equipmentContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '200px',
    flexShrink: 0
  },
  
  equipmentTracker: {
    background: '#655959cc',
    border: '1px solid #9c27b0',
    borderRadius: '4px',
    padding: '10px 12px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(156, 39, 176, 0.3)',
    height: 'fit-content',
    backdropFilter: 'blur(10px)'
  },
  
  equipmentHeader: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    marginBottom: '6px',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: '0.5px',
    color: '#9c27b0'
  },
  
  squaresContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '3px',
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  square: {
    width: '20px',
    height: '20px',
    border: '1.5px solid #9c27b0',
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.6rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)'
    },
    '&.active': {
      backgroundColor: '#9c27b0'
    }
  },
  
  trackerLabel: {
    fontSize: '0.5rem',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '1px',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  
  equipmentNotesContainer: {
    background: '#655959cc',
    border: '1px solid #2196f3',
    borderRadius: '4px',
    padding: '10px 12px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
    height: 'fit-content',
    backdropFilter: 'blur(10px)',
    marginTop: '10px'
  },
  
  equipmentNotesHeader: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    marginBottom: '6px',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: '0.5px',
    color: '#2196f3'
  },
  
  notesContent: {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.7rem',
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '150px',
    overflowY: 'auto',
    padding: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '3px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  
  editButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '8px'
  },
  
  editButton: {
    fontSize: '0.6rem',
    padding: '2px 8px',
    minWidth: '60px'
  },
  
  modalPaper: {
    backgroundColor: '#f9f9f9',
    '&::-webkit-scrollbar': {
      width: '8px'
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: '#f1f1f1'
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#888',
      borderRadius: '4px'
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: '#555'
    }
  },
  
  modalContent: {
    backgroundColor: '#f9f9f9',
    padding: theme.spacing(2)
  },
  
  notesText: {
    fontFamily: '"Roboto Mono", monospace',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: '0.95rem'
  },
  
  emptyState: {
    opacity: 0.7,
    textAlign: 'center',
    padding: theme.spacing(4),
    '& svg': {
      fontSize: '3rem',
      marginBottom: theme.spacing(2)
    }
  },
  
  editField: {
    '& .MuiOutlinedInput-root': {
      fontFamily: '"Roboto Mono", monospace',
      '& textarea': {
        lineHeight: 1.6,
        fontSize: '0.95rem',
        resize: 'none',
        minHeight: '200px'
      }
    }
  }
});

function EquipmentNotepad({ classes, character, onSave }) {
  // Estado para os quadrados de equipamento
  const [equipmentSquares, setEquipmentSquares] = useState(Array(10).fill(false));
  // Estado para as notas
  const [notes, setNotes] = useState('');
  // Estado para edição das notas
  const [editNotes, setEditNotes] = useState('');
  // Estado para o modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Carregar dados iniciais
  useEffect(() => {
    console.log('[EquipmentNotepad] Carregando dados do personagem');
    
    // Carregar equipamentos do banco
    if (character?.equipment_squares) {
      try {
        let savedEquipmentSquares = character.equipment_squares;
        
        if (typeof savedEquipmentSquares === 'string') {
          savedEquipmentSquares = savedEquipmentSquares.replace(/^"+|"+$/g, '');
          savedEquipmentSquares = JSON.parse(savedEquipmentSquares);
        }
        
        if (Array.isArray(savedEquipmentSquares) && savedEquipmentSquares.length === 10) {
          console.log('[EquipmentNotepad] Equipment squares carregados:', savedEquipmentSquares);
          setEquipmentSquares(savedEquipmentSquares);
        } else {
          console.log('[EquipmentNotepad] Equipment squares inválidos, usando padrão');
          setEquipmentSquares(Array(10).fill(false));
        }
      } catch (error) {
        console.error('[EquipmentNotepad] Erro ao carregar equipment_squares:', error);
        setEquipmentSquares(Array(10).fill(false));
      }
    }
    
    // Carregar notas do banco
    if (character?.equipment_notes) {
      try {
        let savedNotes = character.equipment_notes;
        
        if (typeof savedNotes === 'string') {
          savedNotes = savedNotes.replace(/^"+|"+$/g, '');
        }
        
        console.log('[EquipmentNotepad] Equipment notes carregados:', savedNotes);
        setNotes(savedNotes || '');
        setEditNotes(savedNotes || '');
      } catch (error) {
        console.error('[EquipmentNotepad] Erro ao carregar equipment_notes:', error);
        setNotes('');
        setEditNotes('');
      }
    } else {
      setNotes('');
      setEditNotes('');
    }
  }, [character]);
  
  // Manipular clique nos quadrados
  const handleSquareClick = (index) => {
    const newSquares = [...equipmentSquares];
    const isCurrentlyActive = newSquares[index];
    
    if (isCurrentlyActive) {
      // Desmarcar este e todos os seguintes
      for (let i = index; i < newSquares.length; i++) {
        newSquares[i] = false;
      }
    } else {
      // Marcar este e todos os anteriores
      for (let i = 0; i <= index; i++) {
        newSquares[i] = true;
      }
    }
    
    setEquipmentSquares(newSquares);
    
    // Salvar no banco
    if (onSave) {
      onSave('equipment_squares', newSquares);
    }
  };
  
  // Abrir modal de edição
  const handleOpenEditModal = () => {
    setEditNotes(notes);
    setEditModalOpen(true);
  };
  
  // Fechar modal de edição
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
  };
  
  // Salvar notas
  const handleSaveNotes = () => {
    setNotes(editNotes);
    setEditModalOpen(false);
    
    // Salvar no banco
    if (onSave) {
      onSave('equipment_notes', editNotes);
    }
    
    console.log('[EquipmentNotepad] Notas salvas:', editNotes);
  };
  
  // Renderizar quadrados
  const renderSquares = () => {
    return equipmentSquares.map((isActive, index) => {
      const squareNumber = index + 1;
      const squareClass = `${classes.square} ${isActive ? 'active' : ''}`;
      
      return (
        <Box key={index} display="flex" flexDirection="column" alignItems="center">
          <div 
            className={squareClass}
            onClick={() => handleSquareClick(index)}
          />
          <Typography className={classes.trackerLabel}>
            {squareNumber}
          </Typography>
        </Box>
      );
    });
  };
  
  console.log('[EquipmentNotepad] Renderizando com quadrados perfeitos');
  
  return (
    <Box className={classes.equipmentContainer}>
      {/* Tracker de equipamentos */}
      <Paper className={classes.equipmentTracker}>
        <Typography className={classes.equipmentHeader}>
          Equipamentos
        </Typography>
        <Box className={classes.squaresContainer}>
          {renderSquares()}
        </Box>
      </Paper>
      
      {/* Notas de equipamento */}
      <Paper className={classes.equipmentNotesContainer}>
        <Typography className={classes.equipmentNotesHeader}>
          Notas de Equipamento
        </Typography>
        
        <Box className={classes.notesContent}>
          {notes ? (
            <Typography variant="body2" style={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.7rem' }}>
              {notes}
            </Typography>
          ) : (
            <Typography variant="body2" style={{ opacity: 0.6, textAlign: 'center', fontStyle: 'italic' }}>
              Clique em Editar para adicionar notas...
            </Typography>
          )}
        </Box>
        
        <Box className={classes.editButtonContainer}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon fontSize="small" />}
            onClick={handleOpenEditModal}
            className={classes.editButton}
          >
            Editar
          </Button>
        </Box>
      </Paper>
      
      {/* Modal de edição */}
      <Dialog 
        open={editModalOpen} 
        onClose={handleCloseEditModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: classes.modalPaper }}
      >
        <DialogTitle style={{ fontFamily: '"Roboto Mono", monospace' }}>
          Editar Notas de Equipamento
        </DialogTitle>
        
        <DialogContent className={classes.modalContent}>
          <TextField
            multiline
            rows={10}
            fullWidth
            variant="outlined"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            className={classes.editField}
            placeholder="Digite suas notas de equipamento aqui..."
          />
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleCloseEditModal} 
            startIcon={<CloseIcon />}
            color="secondary"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveNotes} 
            startIcon={<SaveIcon />}
            variant="contained"
            color="primary"
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default withStyles(equipmentNotepadStyles)(EquipmentNotepad);
export { equipmentNotepadStyles };