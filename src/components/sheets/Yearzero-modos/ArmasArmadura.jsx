// Arquivo: src/components/sheets/Yearzero-modos/ArmasArmadura.jsx
// Versão: 3.5.2 - FIX: Removida coluna 'Ação' desnecessária
console.log('[ArmasArmadura] Versao 3.5.2 - FIX: Removida coluna Acao desnecessaria');

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Fade,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Shield as ShieldIcon,
  LocalFireDepartment as FireIcon,
  FitnessCenter as WeightIcon,
  Close as CloseIcon,
  SportsMma as WeaponIcon,
  Straighten as DistanceIcon,
  TrendingUp as BonusIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// Paleta principal
const PALETA_PRINCIPAL = {
  atributo: '#ff6b35',
  habilidade: '#1976d2',
  fundo: 'rgba(18, 23, 33, 0.98)',
  texto: 'rgba(255, 255, 255, 0.95)',
  borda: 'rgba(255, 107, 53, 0.3)',
  destaque: '#ff8c5a',
  fundo_input: 'rgba(25, 30, 40, 0.9)',
  cabecalho: 'rgba(255, 107, 53, 0.15)',
  sucesso: '#4caf50',
  alerta: '#ff9800'
};

const ArmasArmadura = ({
  initialData = {},
  onChange = () => {},
  readOnly = false
}) => {
  // Parse inicial das armas
  const parseInitialArmas = (armasData) => {
    try {
      if (!armasData) return [];
      
      let rawArmas = armasData;
      
      if (typeof rawArmas === 'string') {
        rawArmas = rawArmas.trim();
        
        if (!rawArmas || rawArmas === '[]' || rawArmas === '{}') return [];
        
        rawArmas = rawArmas.replace(/^["']+|["']+$/g, '').replace(/\\"/g, '"');
        
        if (rawArmas) {
          const parsed = JSON.parse(rawArmas);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch (e) {
      // Falha silenciosa
    }
    
    return [];
  };

  // Estado local
  const [armadura, setArmadura] = useState(initialData.armadura || '');
  const [nivel, setNivel] = useState(initialData.nivel || '');
  const [carga, setCarga] = useState(initialData.carga || '');
  const [armas, setArmas] = useState(() => {
    const parsedArmas = parseInitialArmas(initialData.armas);
    const result = [...parsedArmas];
    while (result.length < 4) {
      result.push({ id: result.length + 1, nome: '', bonus: '', distancia: '' });
    }
    return result.slice(0, 4);
  });
  
  // Estado de UI
  const [alterado, setAlterado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  // Hooks do Material-UI
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Função de salvamento
  const salvarTudo = () => {
    if (readOnly || !alterado) return;
    
    setSalvando(true);
    setAlterado(false);
    
    const dadosParaSalvar = {
      armadura,
      nivel,
      carga,
      armas: armas.map(arma => ({ ...arma }))
    };
    
    setTimeout(() => {
      onChange(dadosParaSalvar);
      setSalvando(false);
    }, 300);
  };

  // Handlers
  const handleArmaduraChange = (e) => {
    if (readOnly) return;
    setArmadura(e.target.value);
    setAlterado(true);
  };

  const handleArmaduraBlur = () => {
    if (alterado) {
      salvarTudo();
    }
  };

  const handleNivelChange = (e) => {
    if (readOnly) return;
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    setNivel(value);
    setAlterado(true);
  };

  const handleNivelBlur = () => {
    if (alterado) {
      salvarTudo();
    }
  };

  const handleCargaChange = (e) => {
    if (readOnly) return;
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    setCarga(value);
    setAlterado(true);
  };

  const handleCargaBlur = () => {
    if (alterado) {
      salvarTudo();
    }
  };

  const handleArmaChange = (id, field) => (e) => {
    if (readOnly) return;
    
    const novoValor = e.target.value;
    const armaIndex = armas.findIndex(a => a.id === id);
    
    if (armaIndex !== -1) {
      const newArmas = [...armas];
      newArmas[armaIndex] = { ...newArmas[armaIndex], [field]: novoValor };
      setArmas(newArmas);
      setAlterado(true);
    }
  };

  const handleArmaBlur = () => {
    if (alterado) {
      salvarTudo();
    }
  };

  // Handler para clique no container
  const handleContainerBlur = () => {
    if (alterado) {
      salvarTudo();
    }
  };

  // Limpar arma
  const limparArma = (id) => {
    if (readOnly) return;
    
    const armaIndex = armas.findIndex(a => a.id === id);
    if (armaIndex !== -1) {
      const newArmas = [...armas];
      newArmas[armaIndex] = { 
        ...newArmas[armaIndex], 
        nome: '', 
        bonus: '', 
        distancia: '' 
      };
      setArmas(newArmas);
      setAlterado(true);
      salvarTudo();
    }
  };

  // Calcula se tem carga excedente
  const temCargaExcedente = parseInt(carga) > 0 && parseInt(carga) > parseInt(nivel) * 2;
  const armasPreenchidas = armas.filter(a => a.nome.trim() !== '').length;

  return (
    <Box sx={{
      width: '100%',
      maxWidth: 360,
      margin: '0 auto',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      position: 'relative'
    }}>
      {/* Indicador de estado com ícones */}
      <Fade in={salvando || alterado || temCargaExcedente}>
        <Box sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}>
          {temCargaExcedente && (
            <Tooltip title="Carga pode estar excedente">
              <WarningIcon sx={{ 
                fontSize: 12, 
                color: PALETA_PRINCIPAL.alerta,
                animation: 'pulse 2s infinite'
              }} />
            </Tooltip>
          )}
          
          {salvando ? (
            <>
              <CircularProgress size={12} thickness={4} sx={{ color: PALETA_PRINCIPAL.habilidade }} />
              <SaveIcon sx={{ fontSize: 12, color: PALETA_PRINCIPAL.habilidade }} />
              <Typography variant="caption" sx={{
                color: PALETA_PRINCIPAL.texto,
                fontSize: '0.65rem',
                opacity: 0.7
              }}>
                salvando...
              </Typography>
            </>
          ) : alterado ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <EditIcon sx={{ fontSize: 12, color: PALETA_PRINCIPAL.atributo }} />
              <Typography variant="caption" sx={{
                color: PALETA_PRINCIPAL.atributo,
                fontSize: '0.65rem',
                opacity: 0.8
              }}>
                alterado
              </Typography>
            </Box>
          ) : armasPreenchidas > 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <CheckIcon sx={{ fontSize: 12, color: PALETA_PRINCIPAL.sucesso }} />
              <Typography variant="caption" sx={{
                color: PALETA_PRINCIPAL.sucesso,
                fontSize: '0.65rem',
                opacity: 0.8
              }}>
                {armasPreenchidas}
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Fade>

      <Box 
        sx={{
          p: 1.5,
          backgroundColor: PALETA_PRINCIPAL.fundo,
          border: `1px solid ${alterado ? PALETA_PRINCIPAL.atributo : 
                   temCargaExcedente ? PALETA_PRINCIPAL.alerta : 
                   PALETA_PRINCIPAL.borda}`,
          borderRadius: '1px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          position: 'relative',
          transition: 'border-color 0.2s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, ${PALETA_PRINCIPAL.atributo}, ${PALETA_PRINCIPAL.habilidade})`,
          }
        }}
        onClick={handleContainerBlur}
        tabIndex={-1}
      >
        {/* Cabeçalho sem ícones laterais */}
        <Box sx={{ 
          textAlign: 'center', 
          mb: 1.5
        }}>
          <Typography variant="h6" sx={{
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: PALETA_PRINCIPAL.texto,
            fontSize: '0.95rem',
            borderBottom: `1px solid ${PALETA_PRINCIPAL.atributo}`,
            display: 'inline-block',
            pb: 0.3
          }}>
            Armas & Armadura
          </Typography>
        </Box>

        {/* Seção de Armadura */}
        <Box sx={{
          mb: 2,
          pb: 1.5,
          borderBottom: `1px solid rgba(255, 107, 53, 0.2)`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0,
        }}>
          {/* Nome da Armadura */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: isMobile ? '100%' : 'auto',
            mb: isMobile ? 1 : 0,
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 0.5,
              gap: 0.5
            }}>
              <ShieldIcon sx={{ 
                fontSize: '0.7rem',
                color: PALETA_PRINCIPAL.atributo 
              }} />
              <Typography sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: PALETA_PRINCIPAL.atributo,
                fontSize: '0.8rem',
              }}>
                Armadura
              </Typography>
            </Box>
            <TextField
              value={armadura}
              onChange={handleArmaduraChange}
              onBlur={handleArmaduraBlur}
              placeholder="Nome / tipo"
              variant="outlined"
              size="small"
              disabled={readOnly}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: PALETA_PRINCIPAL.fundo_input,
                  border: `1px solid rgba(255, 107, 53, 0.2)`,
                  borderRadius: '1px',
                  '&:hover': !readOnly ? {
                    borderColor: 'rgba(255, 107, 53, 0.4)',
                  } : {},
                  '&.Mui-focused': {
                    borderColor: PALETA_PRINCIPAL.atributo,
                  },
                  '& input': {
                    fontSize: '0.78rem',
                    padding: '6px 8px',
                    color: PALETA_PRINCIPAL.texto,
                    fontWeight: 500,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
              }}
            />
          </Box>

          {/* Nível e Carga */}
          <Box sx={{
            display: 'flex',
            gap: 1.5,
            justifyContent: isMobile ? 'space-between' : 'flex-end',
            width: isMobile ? '100%' : 'auto',
          }}>
            {/* Nível */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mb: 0.3 }}>
                <FireIcon sx={{ 
                  fontSize: '0.6rem', 
                  color: 'rgba(255, 255, 255, 0.6)' 
                }} />
                <Typography sx={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}>
                  Nível
                </Typography>
              </Box>
              <TextField
                value={nivel}
                onChange={handleNivelChange}
                onBlur={handleNivelBlur}
                variant="outlined"
                disabled={readOnly}
                inputProps={{ 
                  maxLength: 2,
                  style: { textAlign: 'center' }
                }}
                sx={{
                  width: 42,
                  height: 42,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: PALETA_PRINCIPAL.fundo_input,
                    border: `1px solid rgba(255, 107, 53, 0.2)`,
                    borderRadius: '1px',
                    height: '100%',
                    '&:hover': !readOnly ? {
                      borderColor: 'rgba(255, 107, 53, 0.4)',
                    } : {},
                    '&.Mui-focused': {
                      borderColor: PALETA_PRINCIPAL.atributo,
                    },
                    '& input': {
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      padding: '4px',
                      color: PALETA_PRINCIPAL.texto,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  },
                }}
              />
            </Box>

            {/* Carga */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mb: 0.3 }}>
                <WeightIcon sx={{ 
                  fontSize: '0.6rem', 
                  color: temCargaExcedente ? PALETA_PRINCIPAL.alerta : 'rgba(255, 255, 255, 0.6)' 
                }} />
                <Typography sx={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: temCargaExcedente ? PALETA_PRINCIPAL.alerta : 'rgba(255, 255, 255, 0.6)',
                }}>
                  Carga
                </Typography>
              </Box>
              <TextField
                value={carga}
                onChange={handleCargaChange}
                onBlur={handleCargaBlur}
                variant="outlined"
                disabled={readOnly}
                inputProps={{ 
                  maxLength: 2,
                  style: { textAlign: 'center' }
                }}
                sx={{
                  width: 42,
                  height: 42,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: temCargaExcedente ? 'rgba(255, 152, 0, 0.1)' : PALETA_PRINCIPAL.fundo_input,
                    border: `1px solid ${temCargaExcedente ? PALETA_PRINCIPAL.alerta : 'rgba(255, 107, 53, 0.2)'}`,
                    borderRadius: '1px',
                    height: '100%',
                    '&:hover': !readOnly ? {
                      borderColor: temCargaExcedente ? PALETA_PRINCIPAL.alerta : 'rgba(255, 107, 53, 0.4)',
                    } : {},
                    '&.Mui-focused': {
                      borderColor: temCargaExcedente ? PALETA_PRINCIPAL.alerta : PALETA_PRINCIPAL.atributo,
                    },
                    '& input': {
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      padding: '4px',
                      color: temCargaExcedente ? PALETA_PRINCIPAL.alerta : PALETA_PRINCIPAL.texto,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Tabela de Armas - sem coluna Ação */}
        <TableContainer sx={{
          border: `1px solid rgba(25, 118, 210, 0.2)`,
          borderRadius: '1px',
          backgroundColor: 'transparent',
        }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ 
                backgroundColor: PALETA_PRINCIPAL.cabecalho,
                '& th': {
                  borderBottom: `1px solid rgba(25, 118, 210, 0.3)`,
                }
              }}>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    color: PALETA_PRINCIPAL.texto,
                    width: 35,
                    py: 0.5,
                    px: 0.5,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  #
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    color: PALETA_PRINCIPAL.texto,
                    py: 0.5,
                    px: 0.5,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}>
                    <WeaponIcon sx={{ fontSize: '0.7rem' }} />
                    Arma
                  </Box>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    color: PALETA_PRINCIPAL.texto,
                    py: 0.5,
                    px: 0.5,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}>
                    <BonusIcon sx={{ fontSize: '0.7rem' }} />
                    Bônus
                  </Box>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    color: PALETA_PRINCIPAL.texto,
                    py: 0.5,
                    px: 0.5,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}>
                    <DistanceIcon sx={{ fontSize: '0.7rem' }} />
                    Distância
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {armas.map((arma) => (
                <TableRow 
                  key={arma.id}
                  sx={{ 
                    '&:nth-of-type(even)': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    },
                    '&:hover': !readOnly ? {
                      backgroundColor: 'rgba(25, 118, 210, 0.05)',
                    } : {},
                    '& td': {
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      py: 0.3,
                      px: 0.5,
                      position: 'relative'
                    }
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 800,
                      width: 35,
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'relative' 
                    }}>
                      {arma.id}
                      {!readOnly && (arma.nome || arma.bonus || arma.distancia) && (
                        <Tooltip title="Limpar arma">
                          <IconButton
                            size="small"
                            onClick={() => limparArma(arma.id)}
                            sx={{
                              position: 'absolute',
                              right: -4,
                              padding: '1px',
                              minWidth: 'auto',
                              width: 16,
                              height: 16,
                              backgroundColor: 'rgba(18, 23, 33, 0.8)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 107, 53, 0.2)'
                              }
                            }}
                          >
                            <CloseIcon sx={{ fontSize: '0.6rem', color: PALETA_PRINCIPAL.atributo }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={arma.nome}
                      onChange={handleArmaChange(arma.id, 'nome')}
                      onBlur={handleArmaBlur}
                      placeholder="Nome"
                      variant="outlined"
                      size="small"
                      disabled={readOnly}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: PALETA_PRINCIPAL.fundo_input,
                          border: `1px solid rgba(255, 255, 255, 0.1)`,
                          borderRadius: '1px',
                          '&:hover': !readOnly ? {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          } : {},
                          '&.Mui-focused': {
                            borderColor: PALETA_PRINCIPAL.habilidade,
                          },
                          '& input': {
                            fontSize: '0.75rem',
                            padding: '4px 6px',
                            color: PALETA_PRINCIPAL.texto,
                            fontWeight: 500,
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none'
                          }
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={arma.bonus}
                      onChange={handleArmaChange(arma.id, 'bonus')}
                      onBlur={handleArmaBlur}
                      placeholder="+0"
                      variant="outlined"
                      size="small"
                      disabled={readOnly}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: PALETA_PRINCIPAL.fundo_input,
                          border: `1px solid rgba(255, 255, 255, 0.1)`,
                          borderRadius: '1px',
                          '&:hover': !readOnly ? {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          } : {},
                          '&.Mui-focused': {
                            borderColor: PALETA_PRINCIPAL.habilidade,
                          },
                          '& input': {
                            fontSize: '0.75rem',
                            padding: '4px 6px',
                            color: PALETA_PRINCIPAL.texto,
                            fontWeight: 500,
                            textAlign: 'center',
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none'
                          }
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={arma.distancia}
                      onChange={handleArmaChange(arma.id, 'distancia')}
                      onBlur={handleArmaBlur}
                      placeholder="Dist."
                      variant="outlined"
                      size="small"
                      disabled={readOnly}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: PALETA_PRINCIPAL.fundo_input,
                          border: `1px solid rgba(255, 255, 255, 0.1)`,
                          borderRadius: '1px',
                          '&:hover': !readOnly ? {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          } : {},
                          '&.Mui-focused': {
                            borderColor: PALETA_PRINCIPAL.habilidade,
                          },
                          '& input': {
                            fontSize: '0.75rem',
                            padding: '4px 6px',
                            color: PALETA_PRINCIPAL.texto,
                            fontWeight: 500,
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none'
                          }
                        },
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Rodapé sutil */}
        {temCargaExcedente && (
          <Box sx={{ 
            mt: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 0.5
          }}>
            <WarningIcon sx={{ fontSize: 10, color: PALETA_PRINCIPAL.alerta }} />
            <Typography variant="caption" sx={{
              color: PALETA_PRINCIPAL.alerta,
              fontSize: '0.6rem',
              fontStyle: 'italic'
            }}>
              Carga pode estar excedente
            </Typography>
          </Box>
        )}
      </Box>

      {/* Animação de pulso para alerta */}
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </Box>
  );
};

// Versão simplificada do hook
export const useArmasArmadura = (initialData = {}) => {
  return {
    data: initialData,
    updateData: () => {},
    resetData: () => {},
    getData: () => initialData
  };
};

// Wrapper mínimo
export const ArmasArmaduraWrapper = ({ initialData, onDataChange, readOnly = false }) => {
  return (
    <ArmasArmadura
      initialData={initialData}
      onChange={onDataChange}
      readOnly={readOnly}
    />
  );
};

export default ArmasArmadura;