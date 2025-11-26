// modals/EditDialogModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Typography 
} from '@mui/material';
import { Save } from '@mui/icons-material';

const EditDialogModal = React.memo(({ 
  editDialog, 
  setEditDialog, 
  handleSaveEdit, 
  classes 
}) => {
  const [localValue, setLocalValue] = useState('');
  const [localMax, setLocalMax] = useState(0);

  // Sincronizar com editDialog quando abrir
  useEffect(() => {
    if (editDialog.open) {
      setLocalValue(editDialog.current);
      setLocalMax(editDialog.max || 0);
    }
  }, [editDialog.open, editDialog.current, editDialog.max]);

  const handleClose = useCallback(() => {
    setEditDialog({ open: false, type: '', title: '' });
  }, [setEditDialog]);

  const handleSave = useCallback(() => {
    handleSaveEdit(editDialog.type, localValue, localMax, editDialog.field);
    handleClose();
  }, [handleSaveEdit, editDialog.type, localValue, localMax, editDialog.field, handleClose]);

  const handleKeyDown = useCallback((e) => {
    // Prevenir que Enter feche o modal
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Prevenir que Escape feche durante digitação
    if (e.key === 'Escape' && e.target.tagName === 'INPUT') {
      e.stopPropagation();
    }
  }, [handleSave]);

  // Não renderizar se não estiver aberto
  if (!editDialog.open) return null;

  const isCharacterInfo = editDialog.type === 'characterInfo';
  const isMultiline = editDialog.field === 'tecnica' || editDialog.field === 'origem';
  const isReadOnly = editDialog.readOnly;

  return React.createElement(Dialog, {
    open: true,
    onClose: handleClose,
    onKeyDown: handleKeyDown,
    maxWidth: "sm",
    fullWidth: true,
    className: classes.editDialog,
    disableEscapeKeyDown: false // Permitir escape, mas controlamos no handleKeyDown
  },
    React.createElement(DialogTitle, { 
      style: { paddingBottom: editDialog.description ? '8px' : '16px' }
    },
      React.createElement(Typography, { 
        variant: "h6", 
        fontWeight: "bold",
        component: "h2"
      }, editDialog.title),
      
      editDialog.description && React.createElement(Typography, { 
        variant: "body2", 
        color: "textSecondary",
        component: "p",
        style: { marginTop: '4px' }
      }, editDialog.description)
    ),
    
    React.createElement(DialogContent, { style: { paddingTop: '8px' } },
      isCharacterInfo ? (
        React.createElement(TextField, {
          label: "Valor",
          value: localValue,
          onChange: (e) => setLocalValue(e.target.value),
          className: classes.editField,
          fullWidth: true,
          multiline: isMultiline,
          rows: isMultiline ? 3 : 1,
          autoFocus: true,
          onKeyDown: handleKeyDown
        })
      ) : (
        React.createElement(React.Fragment, null,
          React.createElement(TextField, {
            label: "Valor Atual",
            type: "number",
            value: localValue,
            onChange: (e) => setLocalValue(parseInt(e.target.value) || 0),
            className: classes.editField,
            fullWidth: true,
            disabled: isReadOnly,
            autoFocus: true,
            onKeyDown: handleKeyDown,
            inputProps: { 
              min: 0,
              style: { textAlign: 'center' }
            },
            style: { marginBottom: '16px' }
          }),
          
          React.createElement(TextField, {
            label: "Valor Máximo",
            type: "number",
            value: localMax,
            onChange: (e) => setLocalMax(Math.max(1, parseInt(e.target.value) || 1)),
            className: classes.editField,
            fullWidth: true,
            disabled: isReadOnly || editDialog.type === 'soul',
            onKeyDown: handleKeyDown,
            inputProps: { 
              min: 1,
              style: { textAlign: 'center' }
            }
          })
        )
      )
    ),
    
    React.createElement(DialogActions, null,
      React.createElement(Button, {
        onClick: handleClose,
        variant: "outlined",
        onKeyDown: handleKeyDown
      }, 'Cancelar'),
      
      React.createElement(Button, {
        onClick: handleSave,
        variant: "contained",
        startIcon: React.createElement(Save),
        disabled: isReadOnly,
        className: classes.setupButton,
        onKeyDown: handleKeyDown
      }, 'Salvar')
    )
  );
}, (prevProps, nextProps) => {
  // Só rerender se o modal abrir/fechar ou os dados mudarem
  return (
    prevProps.editDialog.open === nextProps.editDialog.open &&
    prevProps.editDialog.current === nextProps.editDialog.current &&
    prevProps.editDialog.max === nextProps.editDialog.max &&
    prevProps.editDialog.type === nextProps.editDialog.type &&
    prevProps.editDialog.field === nextProps.editDialog.field &&
    prevProps.classes === nextProps.classes &&
    prevProps.handleSaveEdit === nextProps.handleSaveEdit &&
    prevProps.setEditDialog === nextProps.setEditDialog
  );
});

EditDialogModal.displayName = 'EditDialogModal';

export default EditDialogModal;