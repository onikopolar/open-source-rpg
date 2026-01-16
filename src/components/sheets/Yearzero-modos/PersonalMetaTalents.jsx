// Arquivo: PersonalMetaTalents.jsx
// Versão: 5.3.0 - FEAT: Ícones adicionados mantendo layout original
console.log('[PersonalMetaTalents] Versão 5.3.0 - FEAT: Ícones adicionados para melhorar visualização');

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  useTheme, 
  useMediaQuery,
  CircularProgress,
  Fade 
} from '@mui/material';
import {
  Flag as FlagIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Gavel as GavelIcon,
  Work as WorkIcon,
  Face as FaceIcon,
  AutoAwesome as TalentIcon,
  MilitaryTech as MilitaryTechIcon,
  Psychology as PsychologyIcon,
  SportsHandball as SportsIcon
} from '@mui/icons-material';

const PALETA_PRINCIPAL = {
  atributo: '#ff6b35',
  habilidade: '#1976d2',
  fundo: 'rgba(18, 23, 33, 0.98)',
  texto: 'rgba(255, 255, 255, 0.95)',
  borda: 'rgba(255, 107, 53, 0.3)',
  destaque: '#ff8c5a',
  fundo_input: 'rgba(25, 30, 40, 0.9)',
  sucesso: '#2ecc71',
  alterado: '#ff6b35'
};

// Ícones para talentos
const ICONES_TALENTOS = [
  MilitaryTechIcon,
  PsychologyIcon,
  SportsIcon,
  TalentIcon
];

function PersonalMetaTalents({ character, onSave, readOnly = false }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  
  // Controle de logs - exibir apenas uma vez
  const logsExibidosRef = useRef({
    versao: false,
    carregamento: false
  });

  // Hash dos campos relevantes para controle de re-renderização
  const camposRelevantesRef = useRef('');

  // Estados internos
  const [metaPessoal, setMetaPessoal] = useState('');
  const [camarada, setCamarada] = useState('');
  const [rival, setRival] = useState('');
  const [carreira, setCarreira] = useState('');
  const [aparencia, setAparencia] = useState('');
  const [talentos, setTalentos] = useState(['', '', '', '']);

  // Estados de salvamento
  const [salvandoMeta, setSalvandoMeta] = useState(false);
  const [salvandoCamarada, setSalvandoCamarada] = useState(false);
  const [salvandoRival, setSalvandoRival] = useState(false);
  const [salvandoCarreira, setSalvandoCarreira] = useState(false);
  const [salvandoAparencia, setSalvandoAparencia] = useState(false);
  const [salvandoTalentos, setSalvandoTalentos] = useState(false);

  // Estados de alterações pendentes
  const [alteracoesMeta, setAlteracoesMeta] = useState(false);
  const [alteracoesCamarada, setAlteracoesCamarada] = useState(false);
  const [alteracoesRival, setAlteracoesRival] = useState(false);
  const [alteracoesCarreira, setAlteracoesCarreira] = useState(false);
  const [alteracoesAparencia, setAlteracoesAparencia] = useState(false);
  const [alteracoesTalentos, setAlteracoesTalentos] = useState(false);

  // Referências dos valores originais
  const metaPessoalRef = useRef('');
  const camaradaRef = useRef('');
  const rivalRef = useRef('');
  const carreiraRef = useRef('');
  const aparenciaRef = useRef('');
  const talentosRef = useRef(['', '', '', '']);

  // Exibe logs da versão apenas uma vez
  useEffect(() => {
    if (!logsExibidosRef.current.versao) {
      console.log('[PersonalMetaTalents] Versão 5.3.0 - Ícones adicionados mantendo layout');
      logsExibidosRef.current.versao = true;
    }
  }, []);

  const salvarCampo = useCallback(async (campo, valorAtual, valorAnterior, setSalvando, setAlteracoes) => {
    if (!onSave || !character?.id || readOnly || valorAtual === valorAnterior) {
      setAlteracoes(false);
      return;
    }

    setSalvando(true);
    
    try {
      await onSave(campo, valorAtual);
      setAlteracoes(false);
    } catch (error) {
      console.error(`[PersonalMetaTalents] Erro ao salvar ${campo}:`, error);
    } finally {
      setTimeout(() => {
        setSalvando(false);
      }, 300);
    }
  }, [onSave, character, readOnly]);

  // Carrega dados apenas quando campos relevantes mudam
  useEffect(() => {
    if (!character || !character.id) {
      setMetaPessoal('');
      setCamarada('');
      setRival('');
      setCarreira('');
      setAparencia('');
      setTalentos(['', '', '', '']);
      return;
    }

    // Calcula hash dos campos relevantes para este componente
    const camposAtuais = [
      character.personal_goal || '',
      character.camarada || '',
      character.rival || '',
      character.career || '',
      character.appearance || '',
      character.talents || '[]'
    ].join('|');
    
    // Só carrega se os campos relevantes realmente mudaram
    if (camposAtuais === camposRelevantesRef.current) {
      return;
    }
    
    camposRelevantesRef.current = camposAtuais;
    
    if (!logsExibidosRef.current.carregamento) {
      console.log('[PersonalMetaTalents] Carregando dados do personagem');
      logsExibidosRef.current.carregamento = true;
    }
    
    // Carrega meta pessoal
    if (character.personal_goal) {
      setMetaPessoal(character.personal_goal);
      metaPessoalRef.current = character.personal_goal;
    }
    
    // Carrega camarada
    if (character.camarada) {
      setCamarada(character.camarada);
      camaradaRef.current = character.camarada;
    }
    
    // Carrega rival
    if (character.rival) {
      setRival(character.rival);
      rivalRef.current = character.rival;
    }
    
    // Carrega carreira
    if (character.career) {
      setCarreira(character.career);
      carreiraRef.current = character.career;
    }
    
    // Carrega aparência
    if (character.appearance) {
      setAparencia(character.appearance);
      aparenciaRef.current = character.appearance;
    }
    
    // Carrega talentos
    if (character.talents) {
      try {
        let loadedTalents = character.talents;
        
        if (typeof loadedTalents === 'string') {
          loadedTalents = loadedTalents.replace(/^"+|"+$/g, '');
          loadedTalents = JSON.parse(loadedTalents);
        }
        
        if (Array.isArray(loadedTalents)) {
          const paddedTalents = [...loadedTalents];
          while (paddedTalents.length < 4) {
            paddedTalents.push('');
          }
          const talentosFinais = paddedTalents.slice(0, 4);
          setTalentos(talentosFinais);
          talentosRef.current = talentosFinais;
        }
      } catch (error) {
        if (character.talents && typeof character.talents === 'string' && character.talents.length > 0) {
          const talentosIniciais = [character.talents, '', '', ''];
          setTalentos(talentosIniciais);
          talentosRef.current = talentosIniciais;
        }
      }
    }
  }, [character]);

  const handleMetaPessoalChange = useCallback((event) => {
    if (readOnly) return;
    setMetaPessoal(event.target.value);
    setAlteracoesMeta(true);
  }, [readOnly]);

  const handleMetaPessoalBlur = useCallback(() => {
    if (alteracoesMeta && metaPessoal !== metaPessoalRef.current) {
      salvarCampo('personal_goal', metaPessoal, metaPessoalRef.current, 
        setSalvandoMeta, setAlteracoesMeta);
      metaPessoalRef.current = metaPessoal;
    }
  }, [alteracoesMeta, metaPessoal, salvarCampo]);

  const handleCamaradaChange = useCallback((event) => {
    if (readOnly) return;
    setCamarada(event.target.value);
    setAlteracoesCamarada(true);
  }, [readOnly]);

  const handleCamaradaBlur = useCallback(() => {
    if (alteracoesCamarada && camarada !== camaradaRef.current) {
      salvarCampo('camarada', camarada, camaradaRef.current, 
        setSalvandoCamarada, setAlteracoesCamarada);
      camaradaRef.current = camarada;
    }
  }, [alteracoesCamarada, camarada, salvarCampo]);

  const handleRivalChange = useCallback((event) => {
    if (readOnly) return;
    setRival(event.target.value);
    setAlteracoesRival(true);
  }, [readOnly]);

  const handleRivalBlur = useCallback(() => {
    if (alteracoesRival && rival !== rivalRef.current) {
      salvarCampo('rival', rival, rivalRef.current, 
        setSalvandoRival, setAlteracoesRival);
      rivalRef.current = rival;
    }
  }, [alteracoesRival, rival, salvarCampo]);

  const handleCarreiraChange = useCallback((event) => {
    if (readOnly) return;
    setCarreira(event.target.value);
    setAlteracoesCarreira(true);
  }, [readOnly]);

  const handleCarreiraBlur = useCallback(() => {
    if (alteracoesCarreira && carreira !== carreiraRef.current) {
      salvarCampo('career', carreira, carreiraRef.current, 
        setSalvandoCarreira, setAlteracoesCarreira);
      carreiraRef.current = carreira;
    }
  }, [alteracoesCarreira, carreira, salvarCampo]);

  const handleAparenciaChange = useCallback((event) => {
    if (readOnly) return;
    setAparencia(event.target.value);
    setAlteracoesAparencia(true);
  }, [readOnly]);

  const handleAparenciaBlur = useCallback(() => {
    if (alteracoesAparencia && aparencia !== aparenciaRef.current) {
      salvarCampo('appearance', aparencia, aparenciaRef.current, 
        setSalvandoAparencia, setAlteracoesAparencia);
      aparenciaRef.current = aparencia;
    }
  }, [alteracoesAparencia, aparencia, salvarCampo]);

  const handleTalentoChange = useCallback((index) => {
    return (event) => {
      if (readOnly) return;
      const newValue = event.target.value;
      setTalentos(prev => {
        const newTalentos = [...prev];
        newTalentos[index] = newValue;
        
        const algumTalentoAlterado = newTalentos.some((talento, i) => 
          talento !== talentosRef.current[i]
        );
        setAlteracoesTalentos(algumTalentoAlterado);
        
        return newTalentos;
      });
    };
  }, [readOnly]);

  const handleTalentoBlur = useCallback((index) => {
    return () => {
      if (alteracoesTalentos) {
        setSalvandoTalentos(true);
        
        const talentosAlterados = talentos.some((talento, i) => 
          talento !== talentosRef.current[i]
        );
        
        if (talentosAlterados) {
          if (onSave && character?.id) {
            setTimeout(async () => {
              try {
                await onSave('talents', JSON.stringify(talentos));
                talentosRef.current = [...talentos];
                setAlteracoesTalentos(false);
              } catch (error) {
                console.error('[PersonalMetaTalents] Erro ao salvar talentos:', error);
              } finally {
                setSalvandoTalentos(false);
              }
            }, 300);
          } else {
            setSalvandoTalentos(false);
            setAlteracoesTalentos(false);
          }
        } else {
          setSalvandoTalentos(false);
          setAlteracoesTalentos(false);
        }
      }
    };
  }, [alteracoesTalentos, talentos, onSave, character]);

  const getContainerBorderColor = (alteracoes) => {
    return alteracoes ? PALETA_PRINCIPAL.alterado : PALETA_PRINCIPAL.borda;
  };

  const getTalentoAlterado = (index) => {
    if (!alteracoesTalentos) return false;
    return talentos[index] !== talentosRef.current[index];
  };

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      mb: 2,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    }}>
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: isDesktop ? '340px 340px 340px' : 
                         isTablet ? '1fr 1fr' : '1fr',
          gap: isDesktop ? 1.5 : isTablet ? 1 : 0.8,
          p: 1.5,
          width: '100%',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        {/* Coluna 1: Meta Pessoal e Relacionamentos */}
        <Box
          sx={{
            backgroundColor: PALETA_PRINCIPAL.fundo,
            p: 1.5,
            borderRadius: '1px',
            border: `2px solid ${getContainerBorderColor(alteracoesMeta || alteracoesCamarada || alteracoesRival)}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
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
          }}
        >
          {/* Meta Pessoal */}
          <Box sx={{ mb: 2, position: 'relative' }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1,
              pb: 0.8,
              borderBottom: `1px solid rgba(255, 107, 53, 0.3)`,
            }}>
              <FlagIcon sx={{
                fontSize: '0.8rem',
                color: PALETA_PRINCIPAL.atributo,
                mr: 0.8,
              }} />
              <Typography sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: PALETA_PRINCIPAL.atributo,
                fontSize: '0.8rem',
                flexGrow: 1,
              }}>
                Meta Pessoal
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {salvandoMeta ? (
                  <Fade in={salvandoMeta}>
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
                ) : alteracoesMeta ? (
                  <Fade in={alteracoesMeta}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <Box sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: PALETA_PRINCIPAL.alterado,
                      }} />
                      <Typography variant="caption" sx={{
                        color: PALETA_PRINCIPAL.alterado,
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
              variant="outlined"
              placeholder="Qual é o seu objetivo final?"
              value={metaPessoal}
              onChange={handleMetaPessoalChange}
              onBlur={handleMetaPessoalBlur}
              fullWidth
              disabled={readOnly}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: PALETA_PRINCIPAL.fundo_input,
                  border: '1px solid rgba(255, 107, 53, 0.2)',
                  borderRadius: '1px',
                  minHeight: '32px',
                  '&:hover': !readOnly ? {
                    borderColor: 'rgba(255, 107, 53, 0.4)',
                  } : {},
                  '&.Mui-focused': {
                    borderColor: PALETA_PRINCIPAL.atributo,
                  },
                  '& textarea': {
                    fontSize: '0.78rem',
                    lineHeight: 1.4,
                    padding: '6px 8px',
                    color: PALETA_PRINCIPAL.texto,
                    fontWeight: 500,
                    minHeight: '20px',
                    maxHeight: '24px',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    overflowY: 'auto',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
              }}
            />
          </Box>
          
          {/* Relacionamentos */}
          <Box>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1,
              pb: 0.8,
              borderBottom: `1px solid rgba(255, 107, 53, 0.3)`,
            }}>
              <GroupsIcon sx={{
                fontSize: '0.8rem',
                color: PALETA_PRINCIPAL.atributo,
                mr: 0.8,
              }} />
              <Typography sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: PALETA_PRINCIPAL.atributo,
                fontSize: '0.8rem',
                flexGrow: 1
              }}>
                Relacionamentos
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Camarada */}
              <Box position="relative">
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 0.3,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonIcon sx={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                    }} />
                    <Typography sx={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}>
                      Camarada
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {salvandoCamarada ? (
                      <Fade in={salvandoCamarada}>
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
                    ) : alteracoesCamarada ? (
                      <Fade in={alteracoesCamarada}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <Box sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            backgroundColor: PALETA_PRINCIPAL.alterado,
                          }} />
                          <Typography variant="caption" sx={{
                            color: PALETA_PRINCIPAL.alterado,
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
                  variant="outlined"
                  placeholder="Nome do aliado"
                  value={camarada}
                  onChange={handleCamaradaChange}
                  onBlur={handleCamaradaBlur}
                  fullWidth
                  size="small"
                  disabled={readOnly}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: PALETA_PRINCIPAL.fundo_input,
                      border: '1px solid rgba(255, 107, 53, 0.2)',
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
                        height: '32px',
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
              
              {/* Rival */}
              <Box position="relative">
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 0.3,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <GavelIcon sx={{
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                    }} />
                    <Typography sx={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}>
                      Rival
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {salvandoRival ? (
                      <Fade in={salvandoRival}>
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
                    ) : alteracoesRival ? (
                      <Fade in={alteracoesRival}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <Box sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            backgroundColor: PALETA_PRINCIPAL.alterado,
                          }} />
                          <Typography variant="caption" sx={{
                            color: PALETA_PRINCIPAL.alterado,
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
                  variant="outlined"
                  placeholder="Nome do adversário"
                  value={rival}
                  onChange={handleRivalChange}
                  onBlur={handleRivalBlur}
                  fullWidth
                  size="small"
                  disabled={readOnly}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: PALETA_PRINCIPAL.fundo_input,
                      border: '1px solid rgba(255, 107, 53, 0.2)',
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
                        height: '32px',
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
            </Box>
          </Box>
        </Box>

        {/* Coluna 2: Carreira e Aparência */}
        <Box
          sx={{
            backgroundColor: PALETA_PRINCIPAL.fundo,
            p: 1.5,
            borderRadius: '1px',
            border: `2px solid ${getContainerBorderColor(alteracoesCarreira || alteracoesAparencia)}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            transition: 'border-color 0.3s ease',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, ${PALETA_PRINCIPAL.habilidade}, ${PALETA_PRINCIPAL.atributo})`,
            }
          }}
        >
          {/* Carreira */}
          <Box sx={{ mb: 2, position: 'relative' }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1,
              pb: 0.8,
              borderBottom: `1px solid rgba(255, 107, 53, 0.3)`,
            }}>
              <WorkIcon sx={{
                fontSize: '0.8rem',
                color: PALETA_PRINCIPAL.atributo,
                mr: 0.8,
              }} />
              <Typography sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: PALETA_PRINCIPAL.atributo,
                fontSize: '0.8rem',
                flexGrow: 1,
              }}>
                Carreira
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {salvandoCarreira ? (
                  <Fade in={salvandoCarreira}>
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
                ) : alteracoesCarreira ? (
                  <Fade in={alteracoesCarreira}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <Box sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: PALETA_PRINCIPAL.alterado,
                      }} />
                      <Typography variant="caption" sx={{
                        color: PALETA_PRINCIPAL.alterado,
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
              variant="outlined"
              placeholder="Ex: Pilotagem, Engenheiro, Médico"
              value={carreira}
              onChange={handleCarreiraChange}
              onBlur={handleCarreiraBlur}
              fullWidth
              disabled={readOnly}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: PALETA_PRINCIPAL.fundo_input,
                  border: '1px solid rgba(255, 107, 53, 0.2)',
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
                    height: '32px',
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
          
          {/* Aparência */}
          <Box position="relative">
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1,
              pb: 0.8,
              borderBottom: `1px solid rgba(255, 107, 53, 0.3)`,
            }}>
              <FaceIcon sx={{
                fontSize: '0.8rem',
                color: PALETA_PRINCIPAL.atributo,
                mr: 0.8,
              }} />
              <Typography sx={{
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: PALETA_PRINCIPAL.atributo,
                fontSize: '0.8rem',
                flexGrow: 1,
              }}>
                Aparência
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {salvandoAparencia ? (
                  <Fade in={salvandoAparencia}>
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
                ) : alteracoesAparencia ? (
                  <Fade in={alteracoesAparencia}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <Box sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: PALETA_PRINCIPAL.alterado,
                      }} />
                      <Typography variant="caption" sx={{
                        color: PALETA_PRINCIPAL.alterado,
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
              variant="outlined"
              placeholder="Descrição física breve"
              value={aparencia}
              onChange={handleAparenciaChange}
              onBlur={handleAparenciaBlur}
              fullWidth
              disabled={readOnly}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: PALETA_PRINCIPAL.fundo_input,
                  border: '1px solid rgba(255, 107, 53, 0.2)',
                  borderRadius: '1px',
                  minHeight: '32px',
                  '&:hover': !readOnly ? {
                    borderColor: 'rgba(255, 107, 53, 0.4)',
                  } : {},
                  '&.Mui-focused': {
                    borderColor: PALETA_PRINCIPAL.atributo,
                  },
                  '& textarea': {
                    fontSize: '0.78rem',
                    lineHeight: 1.4,
                    padding: '6px 8px',
                    color: PALETA_PRINCIPAL.texto,
                    fontWeight: 500,
                    minHeight: '20px',
                    maxHeight: '24px',
                    fontFamily: '"Segoe UI", Roboto, sans-serif',
                    overflowY: 'auto',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                },
              }}
            />
          </Box>
        </Box>

        {/* Coluna 3: Talentos */}
        <Box
          sx={{
            backgroundColor: PALETA_PRINCIPAL.fundo,
            p: 1.5,
            borderRadius: '1px',
            border: `2px solid ${getContainerBorderColor(alteracoesTalentos)}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            transition: 'border-color 0.3s ease',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, ${PALETA_PRINCIPAL.habilidade}, #ff8c5a)`,
            }
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1,
            pb: 0.8,
            borderBottom: `1px solid rgba(255, 107, 53, 0.3)`,
          }}>
            <TalentIcon sx={{
              fontSize: '0.8rem',
              color: PALETA_PRINCIPAL.atributo,
              mr: 0.8,
            }} />
            <Typography sx={{
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: PALETA_PRINCIPAL.atributo,
              fontSize: '0.8rem',
              flexGrow: 1,
            }}>
              Talentos
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {alteracoesTalentos && !salvandoTalentos && (
                <Fade in={alteracoesTalentos}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mr: 0.5 }}>
                    <Box sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: PALETA_PRINCIPAL.alterado,
                    }} />
                    <Typography variant="caption" sx={{
                      color: PALETA_PRINCIPAL.alterado,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}>
                      alterado
                    </Typography>
                  </Box>
                </Fade>
              )}
              
              <Typography sx={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.5)',
              }}>
                4 slots
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            {talentos.map((talento, index) => {
              const talentoAlterado = getTalentoAlterado(index);
              const IconeTalento = ICONES_TALENTOS[index] || TalentIcon;
              
              return (
                <Box key={`talento-${index}`} position="relative">
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 0.3,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconeTalento sx={{
                        fontSize: '0.7rem',
                        color: PALETA_PRINCIPAL.habilidade,
                      }} />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          width: 12,
                          height: 12,
                          border: `1.5px solid ${PALETA_PRINCIPAL.habilidade}`,
                          borderRadius: '1px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 0.8,
                          backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        }}>
                          <Typography sx={{
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            color: PALETA_PRINCIPAL.habilidade,
                          }}>
                            {index + 1}
                          </Typography>
                        </Box>
                        <Typography sx={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: PALETA_PRINCIPAL.habilidade,
                        }}>
                          Talento {index + 1}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {salvandoTalentos && talentoAlterado ? (
                        <Fade in={salvandoTalentos}>
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
                      ) : talentoAlterado ? (
                        <Fade in={talentoAlterado}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                            <Box sx={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              backgroundColor: PALETA_PRINCIPAL.alterado,
                            }} />
                            <Typography variant="caption" sx={{
                              color: PALETA_PRINCIPAL.alterado,
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
                    variant="outlined"
                    placeholder={`Ex: ${['Liderança', 'Sobrevivência', 'Tecnologia', 'Combate Corpo a Corpo'][index]}`}
                    value={talento}
                    onChange={handleTalentoChange(index)}
                    onBlur={handleTalentoBlur(index)}
                    fullWidth
                    size="small"
                    disabled={readOnly}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: PALETA_PRINCIPAL.fundo_input,
                        border: '1px solid rgba(255, 107, 53, 0.2)',
                        borderRadius: '1px',
                        '&:hover': !readOnly ? {
                          borderColor: 'rgba(255, 107, 53, 0.4)',
                        } : {},
                        '&.Mui-focused': {
                          borderColor: PALETA_PRINCIPAL.habilidade,
                        },
                        '& input': {
                          fontSize: '0.78rem',
                          padding: '6px 8px',
                          height: '32px',
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
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default PersonalMetaTalents;

export const personalMetaTalentsStyles = (theme) => ({
  container: {
    display: 'grid',
    gridTemplateColumns: '340px 340px 340px',
    gap: '12px',
    padding: '12px',
    width: '100%',
    maxWidth: 1080,
    margin: '0 auto',
  },
  column: {
    backgroundColor: PALETA_PRINCIPAL.fundo,
    padding: '12px',
    borderRadius: '1px',
    border: `2px solid ${PALETA_PRINCIPAL.borda}`,
    display: 'flex',
    flexDirection: 'column',
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
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: `1px solid rgba(255, 107, 53, 0.3)`,
  },
  titleText: {
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: PALETA_PRINCIPAL.atributo,
    fontSize: '0.8rem',
    flexGrow: 1
  },
  input: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: PALETA_PRINCIPAL.fundo_input,
      border: '1px solid rgba(255, 107, 53, 0.2)',
      borderRadius: '1px',
      '&:hover': {
        borderColor: 'rgba(255, 107, 53, 0.4)',
      },
      '&.Mui-focused': {
        borderColor: PALETA_PRINCIPAL.atributo,
      },
      '& .MuiOutlinedInput-notchedOutline': {
        border: 'none'
      }
    },
  }
});