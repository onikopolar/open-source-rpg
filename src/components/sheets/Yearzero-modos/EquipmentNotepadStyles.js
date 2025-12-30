// Estilos para o EquipmentNotepad
import { makeStyles } from '@mui/styles';

const equipmentNotepadStyles = makeStyles((theme) => ({
  // Estilos para o botão flutuante
  floatingButton: {
    position: 'fixed',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: theme.zIndex.speedDial,
    borderRadius: theme.shape.borderRadius * 2,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8]
    },
    [theme.breakpoints.down('sm')]: {
      bottom: theme.spacing(2),
      right: theme.spacing(2)
    }
  },
  
  // Estilos para o conteúdo do modal
  modalContent: {
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
  
  // Estilos para o texto das notas
  notesText: {
    fontFamily: '"Roboto Mono", monospace',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: '0.95rem'
  },
  
  // Estilos para o estado vazio
  emptyState: {
    opacity: 0.7,
    textAlign: 'center',
    padding: theme.spacing(4),
    '& svg': {
      fontSize: '3rem',
      marginBottom: theme.spacing(2)
    }
  },
  
  // Estilos para o campo de edição
  editField: {
    '& .MuiOutlinedInput-root': {
      fontFamily: '"Roboto Mono", monospace',
      '& textarea': {
        lineHeight: 1.6,
        fontSize: '0.95rem',
        resize: 'none'
      }
    }
  }
}));

export default equipmentNotepadStyles;
