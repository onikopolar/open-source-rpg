// Arquivo: EquipmentNotepad.jsx
// Versão 2.3.0 - FIX: Corrigido uso excessivo de console.log durante digitação
// FIX: Logs exibidos apenas uma vez ao carregar componente
// FIX: Salvamento permanece apenas no onBlur como desejado

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  useMediaQuery,
  useTheme,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';

const PALETA_PRINCIPAL = {
  atributo: '#ff6b35',
  habilidade: '#1976d2',
  fundo: 'rgba(18, 23, 33, 0.98)',
  texto: 'rgba(255, 255, 255, 0.95)',
  borda: 'rgba(255, 107, 53, 0.3)',
  destaque: '#ff8c5a',
  fundo_input: 'rgba(25, 30, 40, 0.9)',
  sucesso: '#2ecc71'
};

const EquipmentNotepad = ({ 
  character, 
  onSave,
  readOnly = false
}) => {
  const [open, setOpen] = useState(false);
  const [equipmentNotes, setEquipmentNotes] = useState('');
  const [tinyItems, setTinyItems] = useState('');
  const [emotionalItem, setEmotionalItem] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  
  const [salvandoTinyItems, setSalvandoTinyItems] = useState(false);
  const [salvandoEmotionalItem, setSalvandoEmotionalItem] = useState(false);
  const [salvandoNotas, setSalvandoNotas] = useState(false);
  
  const [alteracoesPendentesTiny, setAlteracoesPendentesTiny] = useState(false);
  const [alteracoesPendentesEmotional, setAlteracoesPendentesEmotional] = useState(false);
  const [alteracoesPendentesNotas, setAlteracoesPendentesNotas] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const tinyItemsRef = useRef('');
  const emotionalItemRef = useRef('');
  const equipmentNotesRef = useRef('');
  const tempNotesRef = useRef('');
  
  // Controle de logs para exibir apenas uma vez
  const logsExibidosRef = useRef({
    versao: false,
    carregamentoDados: false
  });

  // Exibe logs da versão apenas uma vez
  useEffect(() => {
    if (!logsExibidosRef.current.versao) {
      console.log('[EquipmentNotepad] Versão 2.3.0 - Logs otimizados');
      console.log('FIX: Console.log exibido apenas uma vez ao carregar');
      console.log('FIX: Nenhum log durante digitação');
      console.log('FIX: Salvamento permanece apenas no onBlur');
      logsExibidosRef.current.versao = true;
    }
  }, []);

  const sanitizeString = useCallback((str) => {
    if (!str || typeof str !== 'string') return '';
    let sanitized = str.replace(/^"+|"+$/g, '');
    try {
      if ((sanitized.startsWith('{') && sanitized.endsWith('}')) || 
          (sanitized.startsWith('[') && sanitized.endsWith(']'))) {
        const parsed = JSON.parse(sanitized);
        return typeof parsed === 'string' ? parsed : sanitized;
      }
      return sanitized;
    } catch (error) {
      return sanitized;
    }
  }, []);

  const salvarCampo = useCallback(async (campo, valorAtual, valorAnterior, setSalvando, setAlteracoesPendentes) => {
    if (!onSave || !character?.id || readOnly || valorAtual === valorAnterior) {
      setAlteracoesPendentes(false);
      return;
    }

    setSalvando(true);
    
    try {
      await onSave(campo, valorAtual);
      setAlteracoesPendentes(false);
    } catch (error) {
      console.error(`[EquipmentNotepad] Erro ao salvar ${campo}:`, error);
      setAlteracoesPendentes(true);
    } finally {
      setTimeout(() => {
        setSalvando(false);
      }, 300);
    }
  }, [onSave, character, readOnly]);

  useEffect(() => {
    if (!character) {
      setEquipmentNotes('');
      setTinyItems('');
      setEmotionalItem('');
      return;
    }

    try {
      if (!logsExibidosRef.current.carregamentoDados) {
        console.log('[EquipmentNotepad] Carregando dados do personagem:', character.id);
        logsExibidosRef.current.carregamentoDados = true;
      }
      
      const equipmentData = character.equipment_notes || '';
      const parsedEquipment = typeof equipmentData === 'string' 
        ? sanitizeString(equipmentData)
        : '';
      setEquipmentNotes(parsedEquipment);
      setTempNotes(parsedEquipment);
      equipmentNotesRef.current = parsedEquipment;
      tempNotesRef.current = parsedEquipment;

      const tinyData = character.tiny_items || '';
      const parsedTiny = sanitizeString(tinyData);
      setTinyItems(parsedTiny);
      tinyItemsRef.current = parsedTiny;

      const emotionalData = character.emotional_item || '';
      const parsedEmotional = sanitizeString(emotionalData);
      setEmotionalItem(parsedEmotional);
      emotionalItemRef.current = parsedEmotional;

    } catch (error) {
      console.error('[EquipmentNotepad] Erro ao carregar dados:', error);
      setEquipmentNotes('');
      setTinyItems('');
      setEmotionalItem('');
    }
  }, [character, sanitizeString]);

  const handleTinyItemsChange = (e) => {
    const value = e.target.value;
    setTinyItems(value);
    setAlteracoesPendentesTiny(true);
  };

  const handleTinyItemsBlur = () => {
    if (alteracoesPendentesTiny && tinyItems !== tinyItemsRef.current) {
      salvarCampo('tiny_items', tinyItems, tinyItemsRef.current, 
        setSalvandoTinyItems, setAlteracoesPendentesTiny);
      tinyItemsRef.current = tinyItems;
    }
  };

  const handleEmotionalItemChange = (e) => {
    const value = e.target.value;
    setEmotionalItem(value);
    setAlteracoesPendentesEmotional(true);
  };

  const handleEmotionalItemBlur = () => {
    if (alteracoesPendentesEmotional && emotionalItem !== emotionalItemRef.current) {
      salvarCampo('emotional_item', emotionalItem, emotionalItemRef.current, 
        setSalvandoEmotionalItem, setAlteracoesPendentesEmotional);
      emotionalItemRef.current = emotionalItem;
    }
  };

  const handleOpen = () => {
    if (readOnly) return;
    setOpen(true);
    setTempNotes(equipmentNotes);
    tempNotesRef.current = equipmentNotes;
    setAlteracoesPendentesNotas(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSaveModal = async () => {
    setSalvandoNotas(true);
    
    const novaNotas = tempNotes;
    setEquipmentNotes(novaNotas);
    setAlteracoesPendentesNotas(false);
    
    if (onSave && character?.id) {
      try {
        await onSave('equipment_notes', novaNotas);
        equipmentNotesRef.current = novaNotas;
      } catch (error) {
        console.error('[EquipmentNotepad] Erro ao salvar equipamentos:', error);
      }
    }
    
    setSalvandoNotas(false);
    handleClose();
  };

  const handleCancelModal = () => {
    setTempNotes(equipmentNotes);
    tempNotesRef.current = equipmentNotes;
    setAlteracoesPendentesNotas(false);
    handleClose();
  };

  const handleNotesChange = (e) => {
    const value = e.target.value;
    setTempNotes(value);
    setAlteracoesPendentesNotas(value !== equipmentNotesRef.current);
  };

  const handleModalBlur = () => {
    setAlteracoesPendentesNotas(tempNotes !== equipmentNotesRef.current);
  };

  const countItems = useCallback((text) => {
    if (!text || !text.trim()) return 0;
    return text.split('\n').filter(line => line.trim()).length;
  }, []);

  const getBorderColor = () => {
    const algumaAlteracao = alteracoesPendentesTiny || alteracoesPendentesEmotional || alteracoesPendentesNotas;
    return algumaAlteracao ? PALETA_PRINCIPAL.atributo : PALETA_PRINCIPAL.borda;
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: 360,
      margin: '0 auto',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      position: 'relative'
    }}>
      <Box sx={{
        p: 1.5,
        backgroundColor: PALETA_PRINCIPAL.fundo,
        border: `2px solid ${getBorderColor()}`,
        borderRadius: '1px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        position: 'relative',
        transition: 'border-color 0.3s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, ${PALETA_PRINCIPAL.atributo}, ${PALETA_PRINCIPAL.habilidade})`,
        }
      }}>
        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: PALETA_PRINCIPAL.texto,
            fontSize: '0.95rem',
            borderBottom: `1px solid ${PALETA_PRINCIPAL.habilidade}`,
            display: 'inline-block',
            pb: 0.3
          }}>
            Itens & Equipamentos
          </Typography>
        </Box>

        <Box sx={{ mb: 2, position: 'relative' }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1,
            pb: 0.8,
            borderBottom: `1px solid rgba(255, 107, 53, 0.3)`,
          }}>
            <Box sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: PALETA_PRINCIPAL.atributo,
              mr: 0.8,
            }} />
            <CategoryIcon sx={{ 
              fontSize: 14, 
              color: PALETA_PRINCIPAL.atributo,
              mr: 0.5,
            }} />
            <Typography sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: PALETA_PRINCIPAL.atributo,
              fontSize: '0.8rem',
              flexGrow: 1,
            }}>
              Minúsculos
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {salvandoTinyItems ? (
                <Fade in={salvandoTinyItems}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <CircularProgress size={8} thickness={4} sx={{ color: PALETA_PRINCIPAL.habilidade }} />
                    <Typography variant="caption" sx={{
                      color: PALETA_PRINCIPAL.habilidade,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}>
                      salvando
                    </Typography>
                  </Box>
                </Fade>
              ) : alteracoesPendentesTiny ? (
                <Fade in={alteracoesPendentesTiny}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <Box sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: PALETA_PRINCIPAL.atributo,
                    }} />
                    <Typography variant="caption" sx={{
                      color: PALETA_PRINCIPAL.atributo,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}>
                      alterado
                    </Typography>
                  </Box>
                </Fade>
              ) : null}
            </Box>
          </Box>
          
          <TextField
            multiline
            rows={2}
            value={tinyItems}
            onChange={handleTinyItemsChange}
            onBlur={handleTinyItemsBlur}
            placeholder="Ex: chave mestra, foto em miniatura, chip criptográfico..."
            variant="outlined"
            fullWidth
            size="small"
            disabled={readOnly}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: PALETA_PRINCIPAL.fundo_input,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1px',
                '&:hover': !readOnly ? {
                  borderColor: 'rgba(255, 107, 53, 0.4)',
                } : {},
                '&.Mui-focused': {
                  borderColor: PALETA_PRINCIPAL.habilidade,
                },
                '& textarea': {
                  fontSize: '0.78rem',
                  color: PALETA_PRINCIPAL.texto,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  padding: '6px 8px',
                  minHeight: '40px'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              },
            }}
          />
        </Box>

        <Box sx={{ mb: 2, position: 'relative' }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1,
            pb: 0.8,
            borderBottom: `1px solid rgba(255, 107, 53, 0.3)`,
          }}>
            <Box sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: PALETA_PRINCIPAL.atributo,
              mr: 0.8,
            }} />
            <FavoriteIcon sx={{ 
              fontSize: 14, 
              color: PALETA_PRINCIPAL.atributo,
              mr: 0.5,
            }} />
            <Typography sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: PALETA_PRINCIPAL.atributo,
              fontSize: '0.8rem',
              flexGrow: 1,
            }}>
              Emocional
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {salvandoEmotionalItem ? (
                <Fade in={salvandoEmotionalItem}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <CircularProgress size={8} thickness={4} sx={{ color: PALETA_PRINCIPAL.habilidade }} />
                    <Typography variant="caption" sx={{
                      color: PALETA_PRINCIPAL.habilidade,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}>
                      salvando
                    </Typography>
                  </Box>
                </Fade>
              ) : alteracoesPendentesEmotional ? (
                <Fade in={alteracoesPendentesEmotional}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <Box sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: PALETA_PRINCIPAL.atributo,
                    }} />
                    <Typography variant="caption" sx={{
                      color: PALETA_PRINCIPAL.atributo,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}>
                      alterado
                    </Typography>
                  </Box>
                </Fade>
              ) : null}
            </Box>
          </Box>
          
          <TextField
            multiline
            rows={1}
            value={emotionalItem}
            onChange={handleEmotionalItemChange}
            onBlur={handleEmotionalItemBlur}
            placeholder="Ex: anel de casamento, foto dos filhos, diário pessoal..."
            variant="outlined"
            fullWidth
            size="small"
            disabled={readOnly}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: PALETA_PRINCIPAL.fundo_input,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1px',
                '&:hover': !readOnly ? {
                  borderColor: 'rgba(255, 107, 53, 0.4)',
                } : {},
                '&.Mui-focused': {
                  borderColor: PALETA_PRINCIPAL.habilidade,
                },
                '& textarea': {
                  fontSize: '0.78rem',
                  color: PALETA_PRINCIPAL.texto,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  padding: '6px 8px',
                  minHeight: '24px'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              }
            }}
          />
        </Box>

        <Box
          onClick={handleOpen}
          sx={{
            backgroundColor: PALETA_PRINCIPAL.fundo_input,
            border: `1px solid ${readOnly ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '1px',
            p: 1.2,
            cursor: readOnly ? 'default' : 'pointer',
            transition: 'all 0.15s ease',
            position: 'relative',
            '&:hover': !readOnly ? {
              borderColor: PALETA_PRINCIPAL.destaque,
              backgroundColor: 'rgba(255, 107, 53, 0.05)',
            } : {},
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 0.5,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <InventoryIcon sx={{ 
                fontSize: 16, 
                color: PALETA_PRINCIPAL.texto,
              }} />
              <Typography sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: PALETA_PRINCIPAL.texto,
                fontSize: '0.8rem',
              }}>
                Inventário Completo
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {alteracoesPendentesNotas && (
                <Fade in={alteracoesPendentesNotas}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mr: 0.5 }}>
                    <Box sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: PALETA_PRINCIPAL.atributo,
                    }} />
                    <Typography variant="caption" sx={{
                      color: PALETA_PRINCIPAL.atributo,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}>
                      alterado
                    </Typography>
                  </Box>
                </Fade>
              )}
              
              <Typography sx={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 600,
              }}>
                {countItems(equipmentNotes)} itens
              </Typography>
            </Box>
          </Box>
          
          <Typography sx={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontStyle: 'italic',
            lineHeight: 1.3,
          }}>
            {readOnly 
              ? 'Modo leitura - inventário não editável'
              : equipmentNotes && equipmentNotes.trim() 
                ? 'Clique para editar o inventário completo'
                : 'Clique para adicionar equipamentos'
            }
          </Typography>
        </Box>
      </Box>

      <Dialog
        open={open}
        onClose={handleCancelModal}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: '1px',
            backgroundColor: PALETA_PRINCIPAL.fundo,
            border: `2px solid ${alteracoesPendentesNotas ? PALETA_PRINCIPAL.atributo : PALETA_PRINCIPAL.borda}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden',
            height: isMobile ? '100vh' : '80vh',
            width: isMobile ? '100vw' : 700,
            margin: isMobile ? 0 : 2,
            display: 'flex',
            flexDirection: 'column',
            transition: 'border-color 0.3s ease',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, ${PALETA_PRINCIPAL.atributo}, ${PALETA_PRINCIPAL.habilidade})`,
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: 'rgba(18, 23, 33, 0.95)',
            color: PALETA_PRINCIPAL.texto,
            p: isMobile ? 1.5 : 2,
            borderBottom: `1px solid ${PALETA_PRINCIPAL.borda}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            backdropFilter: 'blur(8px)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <InventoryIcon sx={{ 
              color: PALETA_PRINCIPAL.texto, 
              fontSize: 24,
            }} />
            <Box>
              <Typography sx={{ 
                fontWeight: 800, 
                fontSize: '1.1rem',
                color: PALETA_PRINCIPAL.texto,
                lineHeight: 1.2,
                letterSpacing: '0.5px'
              }}>
                Inventário Completo
              </Typography>
              <Typography sx={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8rem',
                mt: 0.3
              }}>
                {character?.name || 'Personagem'} • {countItems(tempNotes)} itens listados
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {salvandoNotas ? (
              <Fade in={salvandoNotas}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                  <CircularProgress size={14} thickness={4} sx={{ color: PALETA_PRINCIPAL.habilidade }} />
                  <Typography variant="caption" sx={{
                    color: PALETA_PRINCIPAL.habilidade,
                    fontSize: '0.7rem',
                  }}>
                    salvando...
                  </Typography>
                </Box>
              </Fade>
            ) : null}
            
            <IconButton 
              onClick={handleCancelModal} 
              size="small"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  color: PALETA_PRINCIPAL.texto,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ 
          p: 0, 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            flex: 1,
            p: isMobile ? 1.5 : 2.5,
            overflow: 'auto',
            backgroundColor: PALETA_PRINCIPAL.fundo_input,
          }}>
            <TextField
              autoFocus
              multiline
              rows={isMobile ? 18 : 24}
              value={tempNotes}
              onChange={handleNotesChange}
              onBlur={handleModalBlur}
              placeholder="Liste seus equipamentos, um por linha.\nExemplo:\n- Rifle de assalto (munição: 30)\n- Kit médico básico\n- Roupas de camuflagem\n- Mochila tática\n- Ração para 3 dias"
              variant="outlined"
              fullWidth
              disabled={readOnly}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '100%',
                  alignItems: 'flex-start',
                  backgroundColor: 'rgba(15, 20, 30, 0.7)',
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                  borderRadius: '1px',
                  '& textarea': {
                    height: '100% !important',
                    resize: 'none',
                    padding: 2,
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    fontFamily: '"Segoe UI", Roboto, monospace',
                    color: PALETA_PRINCIPAL.texto,
                    fontWeight: 400,
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.3)',
                      fontFamily: '"Segoe UI", Roboto, sans-serif',
                      lineHeight: 1.6
                    }
                  },
                  '&:hover': !readOnly ? {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  } : {},
                  '&.Mui-focused': {
                    borderColor: PALETA_PRINCIPAL.habilidade,
                  }
                }
              }}
              InputProps={{
                sx: {
                  height: '100%'
                }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          backgroundColor: 'rgba(18, 23, 33, 0.95)', 
          p: isMobile ? 1.5 : 2,
          borderTop: `1px solid ${PALETA_PRINCIPAL.borda}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          flexShrink: 0,
          backdropFilter: 'blur(8px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {alteracoesPendentesNotas && !salvandoNotas && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%',
                  backgroundColor: PALETA_PRINCIPAL.atributo,
                  animation: 'pulse 1.5s infinite'
                }} />
                <Typography sx={{ 
                  color: PALETA_PRINCIPAL.atributo, 
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>
                  Alterações não salvas
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={handleCancelModal} 
              variant="outlined"
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                backgroundColor: 'transparent',
                fontWeight: 600,
                p: '6px 16px',
                minWidth: 100,
                fontSize: '0.8rem',
                borderRadius: '1px',
                '&:hover': {
                  borderColor: PALETA_PRINCIPAL.texto,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              Cancelar
            </Button>
            
            <Button 
              onClick={handleSaveModal} 
              variant="contained"
              size="small"
              startIcon={salvandoNotas ? <CircularProgress size={14} color="inherit" /> : <SaveIcon fontSize="small" />}
              sx={{
                background: PALETA_PRINCIPAL.habilidade,
                border: 'none',
                fontWeight: 700,
                p: '6px 20px',
                minWidth: 120,
                fontSize: '0.8rem',
                borderRadius: '1px',
                '&:hover': {
                  background: '#1565c0',
                },
                '&.Mui-disabled': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.3)'
                }
              }}
              disabled={!alteracoesPendentesNotas || salvandoNotas || readOnly}
            >
              {salvandoNotas ? 'Salvando...' : 'Salvar'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EquipmentNotepad;