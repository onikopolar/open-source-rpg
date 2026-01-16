// Arquivo: ConditionsConsumablesTracker.jsx
// Versão: 3.8.1 - FIX: Corrigido cores e layout para manter originalidade
console.log('[ConditionsConsumablesTracker] Versão 3.8.1 - FIX: Ícones adicionados mantendo cores originais');

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  CheckBoxOutlineBlank as EmptyBoxIcon,
  CheckBox as FilledBoxIcon,
  LocalHospital as InjuryIcon,
  Healing as HealingIcon,
  Restaurant as FoodIcon,
  BatteryFull as EnergyIcon,
  WaterDrop as WaterIcon,
  Inbox as CargoIcon,
  Radioactive as RadiationIcon,
  Air as AirIcon,
  AcUnit as FreezingIcon,
  Opacity as DehydratedIcon,
  MoodBad as ExhaustedIcon
} from '@mui/icons-material';

// Paleta principal (mantida exatamente como original)
const PALETA_PRINCIPAL = {
  atributo: '#ff6b35',
  habilidade: '#1976d2',
  fundo: 'rgba(18, 23, 33, 0.98)',
  texto: 'rgba(255, 255, 255, 0.95)',
  borda: 'rgba(255, 107, 53, 0.3)',
  destaque: '#ff8c5a',
  perigo: '#ff4757',
  fundo_input: 'rgba(25, 30, 40, 0.9)'
};

// Constantes para exportar
export const CONDICOES_INICIAIS = {
  faminto: false,
  desidratado: false,
  exausto: false,
  congelando: false,
};

export const CONSUMIVEIS_INICIAIS = {
  ar: 0,
  comida: 0,
  energia: 0,
  agua: 0,
  carga: 0,
  radiacao: 0,
};

export const LESOES_INICIAIS = ['', ''];

// Mapeamento de ícones para consumíveis
const ICONES_CONSUMIVEIS = {
  ar: AirIcon,
  comida: FoodIcon,
  energia: EnergyIcon,
  agua: WaterIcon,
  carga: CargoIcon,
  radiacao: RadiationIcon
};

// Mapeamento de ícones para condições
const ICONES_CONDICOES = {
  faminto: FoodIcon,
  desidratado: DehydratedIcon,
  exausto: ExhaustedIcon,
  congelando: FreezingIcon
};

// Funções utilitárias (mantidas exatamente como original)
export const toggleCondicao = (condicoesAtuais, condicao) => {
  if (!CONDICOES_INICIAIS.hasOwnProperty(condicao)) return condicoesAtuais;
  return {
    ...condicoesAtuais,
    [condicao]: !condicoesAtuais[condicao]
  };
};

export const atualizarConsumivel = (consumiveisAtuais, consumivel, valor) => {
  if (!CONSUMIVEIS_INICIAIS.hasOwnProperty(consumivel)) return consumiveisAtuais;
  const numero = parseInt(valor.toString().replace(/[^0-9]/g, '')) || 0;
  const valorFinal = Math.min(numero, 999);
  return {
    ...consumiveisAtuais,
    [consumivel]: valorFinal
  };
};

export const atualizarLesao = (lesoesAtuais, index, descricao) => {
  if (index < 0 || index > 1) return lesoesAtuais;
  const novasLesoes = [...lesoesAtuais];
  novasLesoes[index] = descricao.substring(0, 60);
  return novasLesoes;
};

export const resetarTudo = () => {
  return {
    condicoes: { ...CONDICOES_INICIAIS },
    consumiveis: { ...CONSUMIVEIS_INICIAIS },
    lesoes: [...LESOES_INICIAIS]
  };
};

export const carregarDados = (dadosAtuais, novosDados) => {
  const resultado = { ...dadosAtuais };
  if (novosDados.condicoes) {
    resultado.condicoes = { ...resultado.condicoes, ...novosDados.condicoes };
  }
  if (novosDados.consumiveis) {
    resultado.consumiveis = { ...resultado.consumiveis, ...novosDados.consumiveis };
  }
  if (novosDados.lesoes && Array.isArray(novosDados.lesoes)) {
    resultado.lesoes = [...novosDados.lesoes];
  }
  return resultado;
};

export const obterCondicoes = (dados) => ({ ...dados.condicoes });
export const obterConsumiveis = (dados) => ({ ...dados.consumiveis });
export const obterLesoes = (dados) => [...dados.lesoes];
export const temCondicaoAtiva = (condicoes) => Object.values(condicoes).some(c => c === true);
export const temConsumivelBaixo = (consumiveis, limite = 10) => Object.values(consumiveis).some(v => v < limite);

const ConditionsConsumablesTracker = ({
  initialData = {},
  onChange = () => {},
  readOnly = false,
  autoSaveDelay = 300
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Funções de parse simples e diretas (mantidas exatamente como original)
  const parseLesoes = (lesoesData) => {
    if (!lesoesData) return [...LESOES_INICIAIS];
    
    if (Array.isArray(lesoesData)) {
      return lesoesData.length >= 2 ? lesoesData : [...LESOES_INICIAIS];
    }
    
    if (typeof lesoesData === 'string') {
      try {
        const trimmed = lesoesData.trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
          return [...LESOES_INICIAIS];
        }
        
        const parsed = JSON.parse(trimmed);
        
        if (Array.isArray(parsed)) {
          return parsed.length >= 2 ? parsed : [...LESOES_INICIAIS];
        }
      } catch (error) {
        console.error('[ConditionsConsumablesTracker] Erro ao parsear lesoes:', error);
      }
    }
    
    return [...LESOES_INICIAIS];
  };

  const parseCondicoes = (condicoesData) => {
    if (!condicoesData) return { ...CONDICOES_INICIAIS };
    
    if (typeof condicoesData === 'object' && condicoesData !== null) {
      return { ...CONDICOES_INICIAIS, ...condicoesData };
    }
    
    if (typeof condicoesData === 'string') {
      try {
        const trimmed = condicoesData.trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
          return { ...CONDICOES_INICIAIS };
        }
        const parsed = JSON.parse(trimmed);
        return { ...CONDICOES_INICIAIS, ...parsed };
      } catch (error) {
        console.error('[ConditionsConsumablesTracker] Erro ao parsear condicoes:', error);
        return { ...CONDICOES_INICIAIS };
      }
    }
    
    return { ...CONDICOES_INICIAIS };
  };

  const parseConsumiveis = (consumiveisData) => {
    if (!consumiveisData) return { ...CONSUMIVEIS_INICIAIS };
    
    if (typeof consumiveisData === 'object' && consumiveisData !== null) {
      return { ...CONSUMIVEIS_INICIAIS, ...consumiveisData };
    }
    
    if (typeof consumiveisData === 'string') {
      try {
        const trimmed = consumiveisData.trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
          return { ...CONSUMIVEIS_INICIAIS };
        }
        const parsed = JSON.parse(trimmed);
        return { ...CONSUMIVEIS_INICIAIS, ...parsed };
      } catch (error) {
        console.error('[ConditionsConsumablesTracker] Erro ao parsear consumiveis:', error);
        return { ...CONSUMIVEIS_INICIAIS };
      }
    }
    
    return { ...CONSUMIVEIS_INICIAIS };
  };

  // Estados iniciais parseados uma vez (mantido como original)
  const [condicoes, setCondicoes] = useState(() => parseCondicoes(initialData.condicoes));
  const [consumiveis, setConsumiveis] = useState(() => parseConsumiveis(initialData.consumiveis));
  const [lesoes, setLesoes] = useState(() => parseLesoes(initialData.lesoes));

  const [salvando, setSalvando] = useState(false);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Estado anterior para comparação (mantido como original)
  const estadoAnteriorRef = useRef({
    condicoes: parseCondicoes(initialData.condicoes),
    consumiveis: parseConsumiveis(initialData.consumiveis),
    lesoes: parseLesoes(initialData.lesoes)
  });

  // Sincroniza quando initialData muda (apenas uma vez por atualização real) (mantido como original)
  useEffect(() => {
    const novasCondicoes = parseCondicoes(initialData.condicoes);
    const novosConsumiveis = parseConsumiveis(initialData.consumiveis);
    const novasLesoes = parseLesoes(initialData.lesoes);

    // Verifica se houve mudança real nos dados
    const condicoesMudaram = JSON.stringify(novasCondicoes) !== JSON.stringify(condicoes);
    const consumiveisMudaram = JSON.stringify(novosConsumiveis) !== JSON.stringify(consumiveis);
    const lesoesMudaram = JSON.stringify(novasLesoes) !== JSON.stringify(lesoes);

    if (condicoesMudaram || consumiveisMudaram || lesoesMudaram) {
      setCondicoes(novasCondicoes);
      setConsumiveis(novosConsumiveis);
      setLesoes(novasLesoes);
      estadoAnteriorRef.current = {
        condicoes: novasCondicoes,
        consumiveis: novosConsumiveis,
        lesoes: novasLesoes
      };
      setAlteracoesPendentes(false);
    }
  }, [initialData]);

  // Verifica se houve alterações reais (mantido como original)
  const houveAlteracoes = () => {
    const estadoAtual = { condicoes, consumiveis, lesoes };
    const anterior = estadoAnteriorRef.current;
    
    const condicoesDiferentes = Object.keys(condicoes).some(
      key => condicoes[key] !== anterior.condicoes[key]
    );
    
    const consumiveisDiferentes = Object.keys(consumiveis).some(
      key => consumiveis[key] !== anterior.consumiveis[key]
    );
    
    const lesoesDiferentes = lesoes.some(
      (lesao, index) => lesao !== anterior.lesoes[index]
    );
    
    return condicoesDiferentes || consumiveisDiferentes || lesoesDiferentes;
  };

  // Salva alterações (SOMENTE chamado por onBlur) (mantido como original)
  const salvarAlteracoes = () => {
    if (readOnly || !houveAlteracoes()) {
      setAlteracoesPendentes(false);
      return;
    }

    console.log('[ConditionsConsumablesTracker] Salvando alteracoes...');
    setSalvando(true);
    
    // Atualiza estado anterior
    estadoAnteriorRef.current = {
      condicoes: { ...condicoes },
      consumiveis: { ...consumiveis },
      lesoes: [...lesoes]
    };

    // Dispara callback de salvamento
    setTimeout(() => {
      onChange({ condicoes, consumiveis, lesoes });
      setSalvando(false);
      setAlteracoesPendentes(false);
      console.log('[ConditionsConsumablesTracker] Alteracoes salvas');
    }, autoSaveDelay);
  };

  // Handler para onBlur (SALVA) (mantido como original)
  const handleBlur = () => {
    if (alteracoesPendentes) {
      salvarAlteracoes();
    }
  };

  // Handler para toggle de condicoes (APENAS MARCA COMO ALTERADO) (mantido como original)
  const handleToggleCondicao = (condicao) => {
    if (readOnly || !CONDICOES_INICIAIS.hasOwnProperty(condicao)) return;
    
    setCondicoes(prev => ({ ...prev, [condicao]: !prev[condicao] }));
    setAlteracoesPendentes(true);
  };

  // Handler para atualizar consumiveis (APENAS MARCA COMO ALTERADO) (mantido como original)
  const handleAtualizarConsumivel = (consumivel, valor) => {
    if (readOnly || !CONSUMIVEIS_INICIAIS.hasOwnProperty(consumivel)) return;
    
    const numero = parseInt(valor.toString().replace(/[^0-9]/g, '')) || 0;
    const valorFinal = Math.min(numero, 999);
    
    setConsumiveis(prev => ({ ...prev, [consumivel]: valorFinal }));
    setAlteracoesPendentes(true);
  };

  // Handler para atualizar lesoes (APENAS MARCA COMO ALTERADO) (mantido como original)
  const handleAtualizarLesao = (index, descricao) => {
    if (readOnly || index < 0 || index > 1) return;
    
    const novasLesoes = [...lesoes];
    novasLesoes[index] = descricao.substring(0, 60);
    
    setLesoes(novasLesoes);
    setAlteracoesPendentes(true);
  };

  // Handler para reset via teclado (Ctrl+R) (mantido como original)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'r' && !readOnly) {
        e.preventDefault();
        setCondicoes({ ...CONDICOES_INICIAIS });
        setConsumiveis({ ...CONSUMIVEIS_INICIAIS });
        setLesoes([...LESOES_INICIAIS]);
        setAlteracoesPendentes(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly]);

  // Limpa timeout ao desmontar (mantido como original)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{
      width: '100%',
      maxWidth: 360,
      margin: '0 auto',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      position: 'relative'
    }}>
      {/* Indicador de estado (mantido exatamente como original) */}
      <Fade in={salvando || alteracoesPendentes}>
        <Box sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}>
          {salvando ? (
            <>
              <CircularProgress size={12} thickness={4} sx={{ color: PALETA_PRINCIPAL.habilidade }} />
              <Typography variant="caption" sx={{
                color: PALETA_PRINCIPAL.texto,
                fontSize: '0.65rem',
                opacity: 0.7
              }}>
                salvando...
              </Typography>
            </>
          ) : alteracoesPendentes ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.3
            }}>
              <Box sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: PALETA_PRINCIPAL.atributo,
                opacity: 0.7
              }} />
              <Typography variant="caption" sx={{
                color: PALETA_PRINCIPAL.atributo,
                fontSize: '0.65rem',
                opacity: 0.8
              }}>
                alterado
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Fade>

      <Box 
        ref={containerRef}
        sx={{
          p: 1.5,
          backgroundColor: PALETA_PRINCIPAL.fundo,
          border: `1px solid ${alteracoesPendentes ? PALETA_PRINCIPAL.atributo : PALETA_PRINCIPAL.borda}`,
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
        onBlur={handleBlur}
        tabIndex={-1}
      >
        {/* Cabeçalho compacto (mantido exatamente como original, sem ícones laterais) */}
        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
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
            Status
          </Typography>
        </Box>

        {/* Lesões Críticas (com ícones adicionados) */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1,
          }}>
            <InjuryIcon sx={{ 
              fontSize: '0.8rem',
              color: PALETA_PRINCIPAL.perigo,
              mr: 0.8
            }} />
            <Typography sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: PALETA_PRINCIPAL.perigo,
              fontSize: '0.8rem',
              flexGrow: 1
            }}>
              Lesões
            </Typography>
          </Box>
          <Grid container spacing={1}>
            {lesoes.map((lesao, index) => (
              <Grid item xs={12} key={index}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder={`Lesão ${index + 1}`}
                  value={lesao || ''}
                  onChange={(e) => handleAtualizarLesao(index, e.target.value)}
                  onBlur={handleBlur}
                  disabled={readOnly}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: PALETA_PRINCIPAL.fundo_input,
                      border: `1px solid rgba(255, 71, 87, 0.2)`,
                      borderRadius: '1px',
                      '&:hover': {
                        borderColor: 'rgba(255, 71, 87, 0.4)',
                      },
                      '&.Mui-focused': {
                        borderColor: PALETA_PRINCIPAL.perigo,
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
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{
          my: 1.5,
          borderColor: 'rgba(255, 107, 53, 0.15)',
          borderWidth: '0.5px',
        }} />

        {/* Condições (com ícones adicionados) */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1,
          }}>
            <Box sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: PALETA_PRINCIPAL.atributo,
              mr: 0.8,
            }} />
            <Typography sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: PALETA_PRINCIPAL.atributo,
              fontSize: '0.8rem',
              flexGrow: 1
            }}>
              Condições
            </Typography>
          </Box>
          <Grid container spacing={1}>
            {Object.entries(condicoes).map(([nome, ativa]) => {
              const IconeCondicao = ICONES_CONDICOES[nome] || EmptyBoxIcon;
              return (
                <Grid item xs={6} key={nome}>
                  <Box
                    onClick={() => handleToggleCondicao(nome)}
                    onBlur={handleBlur}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0.8,
                      backgroundColor: ativa
                        ? `rgba(255, 107, 53, 0.12)`
                        : 'transparent',
                      border: `1px solid ${ativa ? PALETA_PRINCIPAL.atributo : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '1px',
                      cursor: readOnly ? 'default' : 'pointer',
                      transition: 'border-color 0.15s ease',
                      minHeight: 32,
                      '&:hover': readOnly ? {} : {
                        borderColor: ativa ? PALETA_PRINCIPAL.atributo : PALETA_PRINCIPAL.destaque,
                      },
                      '&:focus-within': {
                        outline: `1px solid ${PALETA_PRINCIPAL.atributo}`,
                        outlineOffset: 1
                      }
                    }}
                    tabIndex={readOnly ? -1 : 0}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconeCondicao sx={{ 
                        fontSize: '0.7rem',
                        color: ativa ? PALETA_PRINCIPAL.atributo : 'rgba(255, 255, 255, 0.6)' 
                      }} />
                      <Typography sx={{
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        color: ativa ? PALETA_PRINCIPAL.atributo : 'rgba(255, 255, 255, 0.75)',
                        fontSize: '0.72rem',
                      }}>
                        {nome}
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 16,
                      height: 16,
                      border: `1.5px solid ${ativa ? PALETA_PRINCIPAL.atributo : 'rgba(255, 255, 255, 0.4)'}`,
                      borderRadius: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: ativa ? PALETA_PRINCIPAL.atributo : 'transparent',
                    }}>
                      {ativa ? (
                        <FilledBoxIcon sx={{
                          color: '#fff',
                          fontSize: 12,
                        }} />
                      ) : null}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <Divider sx={{
          my: 1.5,
          borderColor: 'rgba(25, 118, 210, 0.15)',
          borderWidth: '0.5px',
        }} />

        {/* Consumíveis (com ícones adicionados) */}
        <Box sx={{ mb: 0 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1,
          }}>
            <Box sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: PALETA_PRINCIPAL.habilidade,
              mr: 0.8,
            }} />
            <Typography sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: PALETA_PRINCIPAL.habilidade,
              fontSize: '0.8rem',
              flexGrow: 1
            }}>
              Recursos
            </Typography>
          </Box>
          <Grid container spacing={1}>
            {Object.entries(consumiveis).map(([nome, valor]) => {
              const IconeConsumivel = ICONES_CONSUMIVEIS[nome] || EnergyIcon;
              return (
                <Grid item xs={6} key={nome}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 0.8,
                    minHeight: 32,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconeConsumivel sx={{ 
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.8)' 
                      }} />
                      <Typography sx={{
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.72rem',
                      }}>
                        {nome}
                      </Typography>
                    </Box>
                    <TextField
                      variant="outlined"
                      size="small"
                      value={valor}
                      onChange={(e) => handleAtualizarConsumivel(nome, e.target.value)}
                      onBlur={handleBlur}
                      disabled={readOnly}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          width: 52,
                          minHeight: 28,
                          backgroundColor: PALETA_PRINCIPAL.fundo_input,
                          border: `1px solid rgba(25, 118, 210, 0.2)`,
                          borderRadius: '1px',
                          '&:hover': {
                            borderColor: 'rgba(25, 118, 210, 0.4)',
                          },
                          '&.Mui-focused': {
                            borderColor: PALETA_PRINCIPAL.habilidade,
                          },
                          '& input': {
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            padding: '4px 2px',
                            color: PALETA_PRINCIPAL.texto,
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none'
                          }
                        }
                      }}
                      inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        maxLength: 3,
                        style: { textAlign: 'center' }
                      }}
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default ConditionsConsumablesTracker;

export const SimpleConditionsTracker = ({ condicoes, onChange, readOnly = false }) => {
  const handleChange = (nome, novaAtiva) => {
    if (onChange) {
      onChange(nome, novaAtiva);
    }
  };

  return (
    <Box display="flex" flexWrap="wrap" gap={0.5}>
      {Object.entries(condicoes || CONDICOES_INICIAIS).map(([nome, ativa]) => {
        const IconeCondicao = ICONES_CONDICOES[nome] || EmptyBoxIcon;
        return (
          <Box
            key={nome}
            display="flex"
            alignItems="center"
            gap={0.3}
            sx={{
              cursor: readOnly ? 'default' : 'pointer',
              padding: '2px 6px',
              backgroundColor: ativa
                ? `rgba(255, 107, 53, 0.15)`
                : 'transparent',
              border: `1px solid ${ativa ? PALETA_PRINCIPAL.atributo : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: '1px',
              '&:hover': {
                borderColor: readOnly
                  ? (ativa ? PALETA_PRINCIPAL.atributo : 'rgba(255, 255, 255, 0.15)')
                  : PALETA_PRINCIPAL.destaque,
              }
            }}
            onClick={() => !readOnly && handleChange(nome, !ativa)}
          >
            <IconeCondicao sx={{ 
              fontSize: '0.7rem',
              color: ativa ? PALETA_PRINCIPAL.atributo : 'rgba(255, 255, 255, 0.6)' 
            }} />
            <Box
              sx={{
                width: 12,
                height: 12,
                border: `1.5px solid ${ativa ? PALETA_PRINCIPAL.atributo : 'rgba(255, 255, 255, 0.4)'}`,
                borderRadius: '1px',
                backgroundColor: ativa ? PALETA_PRINCIPAL.atributo : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {ativa && <FilledBoxIcon sx={{ color: '#fff', fontSize: 8 }} />}
            </Box>
            <Typography
              variant="caption"
              sx={{
                textTransform: 'uppercase',
                fontWeight: 600,
                color: ativa ? PALETA_PRINCIPAL.atributo : 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.65rem',
                letterSpacing: '0.4px'
              }}
            >
              {nome}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};