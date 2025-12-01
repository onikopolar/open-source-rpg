import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Tooltip,
  Grid,
  Button,
  LinearProgress
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Componente para selecao do sistema RPG
 * Permite alternar entre Sistema Classico, Year Zero Engine e Feiticeiros & Maldições
 * Implementacao robusta e acessivel
 */
const SheetSelector = ({ 
  currentSystem, 
  onSystemChange, 
  character, 
  isSaving = false 
}) => {
  // Definicao robusta dos sistemas RPG suportados
  const rpgSystems = [
    {
      id: 'classic',
      name: 'Sistema Classico',
      description: 'Sistema tradicional com atributos e habilidades separadas. Ideal para D&D, Pathfinder e outros sistemas baseados em d20.',
      icon: <CasinoIcon sx={{ fontSize: 40 }} />,
      color: '#639EC2',
      features: [
        'Atributos separados (Forca, Destreza, Constituicao, etc)',
        'Habilidades individuais customizaveis',
        'Sistema d20 tradicional',
        'Ficha detalhada e expansivel'
      ],
      compatibleGames: ['D&D 5e', 'Pathfinder', 'Tormenta RPG', 'Old Dragon', '3D&T']
    },
    {
      id: 'year_zero',
      name: 'Year Zero Engine',
      description: 'Sistema moderno utilizado em Alien RPG, Mutant Year Zero e Forbidden Lands. Foca em dados de habilidade e mecanicas de push.',
      icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
      color: '#E74C3C',
      features: [
        'Sistema de dados base + dados de habilidade',
        'Mecanica de push de dados',
        'Controle de estresse e panes',
        'Sistema baseado em sucessos',
        'Design de diamante para atributos nucleares'
      ],
      compatibleGames: ['Alien RPG', 'Mutant Year Zero', 'Forbidden Lands', 'Vaesen', 'Twilight 2000']
    },
    {
      id: 'feiticeiros',
      name: 'Feiticeiros & Maldições',
      description: 'Sistema baseado no universo de Jujutsu Kaisen, focado em energia amaldiçoada, técnicas únicas e domínios expansion.',
      icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
      color: '#9B59B6',
      features: [
        'Sistema de Energia Amaldiçoada',
        'Técnicas Amaldiçoadas únicas',
        'Domínio Expansion',
        'Sistema de Grade (Grau 4 a Especial)',
        'Combate tático com maldições'
      ],
      compatibleGames: ['Jujutsu Kaisen RPG', 'Sistemas de anime']
    }
  ];

  /**
   * Manipula a mudanca de sistema RPG
   * Implementacao robusta com validacao
   */
  const handleSystemChange = React.useCallback(async (systemId) => {
    // Validacoes robustas
    if (!onSystemChange) {
      console.error('SheetSelector: Funcao onSystemChange nao fornecida');
      return;
    }

    if (isSaving) {
      console.warn('SheetSelector: Alteracao de sistema em andamento, ignorando clique');
      return;
    }

    if (systemId === currentSystem) {
      console.log('SheetSelector: Sistema ja esta selecionado', systemId);
      return;
    }

    if (!rpgSystems.find(system => system.id === systemId)) {
      console.error('SheetSelector: ID de sistema invalido', systemId);
      return;
    }

    try {
      console.log('SheetSelector: Iniciando mudanca para sistema', systemId);
      await onSystemChange(systemId);
      console.log('SheetSelector: Mudanca de sistema concluida com sucesso');
    } catch (error) {
      console.error('SheetSelector: Erro ao mudar sistema:', error);
    }
  }, [currentSystem, isSaving, onSystemChange]);

  /**
   * Retorna os dados do sistema atual
   */
  const getCurrentSystemData = React.useCallback(() => {
    return rpgSystems.find(system => system.id === currentSystem) || rpgSystems[0];
  }, [currentSystem]);

  /**
   * Verifica se um sistema esta atualmente selecionado
   */
  const isSystemSelected = React.useCallback((systemId) => {
    return systemId === currentSystem;
  }, [currentSystem]);

  /**
   * Obtem o texto do tooltip baseado no estado
   */
  const getTooltipTitle = React.useCallback((system) => {
    if (isSaving) {
      return "Aguarde a conclusao da alteracao do sistema";
    }
    
    if (isSystemSelected(system.id)) {
      return "Sistema atualmente em uso";
    }
    
    return `Clique para usar ${system.name}`;
  }, [isSaving, isSystemSelected]);

  const currentSystemData = getCurrentSystemData();

  return (
    <Box sx={{ 
      marginBottom: 4, 
      padding: 3, 
      border: '2px solid #8c8c8c', 
      borderRadius: 2,
      backgroundColor: '#2b2b2b',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      background: 'linear-gradient(135deg, #2b2b2b 0%, #201E1E 100%)'
    }}>
      {/* Cabecalho da secao */}
      <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold', 
            color: '#639EC2', 
            marginBottom: 1,
            fontSize: { xs: '1.75rem', md: '2.125rem' },
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          Sistema RPG
        </Typography>
        <Typography 
          variant="body1" 
          color="#8c8c8c"
          sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
        >
          Selecione o sistema de RPG para adaptar automaticamente sua ficha de personagem
        </Typography>
      </Box>

      {/* Indicador de carregamento */}
      {isSaving && (
        <Box sx={{ marginBottom: 3 }}>
          <Alert 
            severity="info" 
            sx={{ 
              marginBottom: 2, 
              borderRadius: 2,
              backgroundColor: '#181717',
              color: '#639EC2',
              border: '1px solid #639EC2',
              '& .MuiAlert-message': {
                width: '100%',
                color: '#639EC2'
              }
            }}
          >
            Convertendo ficha para o novo sistema... Aguarde.
          </Alert>
          <LinearProgress 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: '#8c8c8c',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#639EC2',
                background: 'linear-gradient(90deg, #639EC2, #9B59B6)'
              }
            }} 
          />
        </Box>
      )}

      {/* Sistema atual selecionado */}
      {currentSystemData && (
        <Box sx={{ 
          marginBottom: 3, 
          padding: 2, 
          backgroundColor: '#181717', 
          borderRadius: 2, 
          border: `2px solid ${currentSystemData.color}`,
          boxShadow: `0 4px 20px ${currentSystemData.color}40`,
          background: 'linear-gradient(135deg, #181717 0%, #201E1E 100%)'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              marginBottom: 1, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flexWrap: 'wrap',
              color: '#FFFFFF'
            }}
          >
            <CheckCircleIcon sx={{ color: currentSystemData.color }} />
            Sistema Atual: 
            <span style={{ color: currentSystemData.color, fontWeight: 'bold' }}>
              {currentSystemData.name}
            </span>
          </Typography>
          <Typography variant="body2" color="#8c8c8c">
            {currentSystemData.description}
          </Typography>
        </Box>
      )}

      {/* Grid de selecao de sistemas */}
      <Grid container spacing={3}>
        {rpgSystems.map((system) => {
          const isSelected = isSystemSelected(system.id);
          const isDisabled = isSaving;
          
          return (
            <Grid item xs={12} md={4} key={system.id}>
              <Tooltip 
                title={getTooltipTitle(system)}
                placement="top"
                arrow
              >
                <Card
                  sx={{
                    cursor: isDisabled ? 'not-allowed' : (isSelected ? 'default' : 'pointer'),
                    border: isSelected ? `3px solid ${system.color}` : '2px solid #8c8c8c',
                    backgroundColor: isSelected ? '#181717' : '#201E1E',
                    background: isSelected ? 
                      `linear-gradient(135deg, #181717 0%, ${system.color}20 100%)` :
                      'linear-gradient(135deg, #201E1E 0%, #2b2b2b 100%)',
                    transition: 'all 0.3s ease',
                    opacity: isDisabled ? 0.6 : 1,
                    height: '100%',
                    '&:hover': {
                      transform: isDisabled || isSelected ? 'none' : 'translateY(-8px)',
                      boxShadow: isDisabled || isSelected ? 
                        `0 4px 20px ${system.color}30` : 
                        `0 12px 40px ${system.color}40`,
                      borderColor: system.color,
                      background: isSelected ? 
                        `linear-gradient(135deg, #181717 0%, ${system.color}20 100%)` :
                        `linear-gradient(135deg, #201E1E 0%, ${system.color}15 100%)`
                    }
                  }}
                  onClick={() => !isDisabled && handleSystemChange(system.id)}
                  role="button"
                  aria-label={`Selecionar sistema ${system.name}`}
                  aria-pressed={isSelected}
                  aria-disabled={isDisabled}
                >
                  <CardContent sx={{ 
                    padding: 3, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column' 
                  }}>
                    {/* Cabecalho do card do sistema */}
                    <Box sx={{ textAlign: 'center', marginBottom: 2 }}>
                      <Box sx={{ 
                        color: system.color, 
                        marginBottom: 1,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                      }}>
                        {system.icon}
                      </Box>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: system.color, 
                          marginBottom: 1,
                          fontSize: { xs: '1.25rem', md: '1.5rem' },
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}
                      >
                        {system.name}
                      </Typography>
                      
                      {isSelected && (
                        <Chip 
                          icon={<CheckCircleIcon />}
                          label="Sistema Ativo" 
                          size="small" 
                          sx={{ 
                            backgroundColor: system.color,
                            color: '#FFFFFF',
                            fontWeight: 'bold',
                            boxShadow: `0 2px 8px ${system.color}60`,
                            '& .MuiChip-icon': {
                              color: '#FFFFFF'
                            }
                          }}
                        />
                      )}
                    </Box>

                    {/* Descricao do sistema */}
                    <Typography 
                      variant="body2" 
                      color="#E0E0E0" 
                      sx={{ 
                        marginBottom: 2, 
                        flexGrow: 1, 
                        lineHeight: 1.6,
                        fontSize: { xs: '0.8rem', md: '0.875rem' }
                      }}
                    >
                      {system.description}
                    </Typography>

                    {/* Lista de caracteristicas */}
                    <Box sx={{ marginBottom: 2 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 'bold', 
                          marginBottom: 1, 
                          color: system.color,
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }}
                      >
                        Caracteristicas Principais:
                      </Typography>
                      <Box component="ul" sx={{ paddingLeft: 2, margin: 0 }}>
                        {system.features.map((feature, index) => (
                          <Typography 
                            key={index}
                            component="li"
                            variant="body2" 
                            sx={{ 
                              marginBottom: 1,
                              fontSize: '0.8rem',
                              lineHeight: 1.4,
                              color: '#E0E0E0'
                            }}
                          >
                            {feature}
                          </Typography>
                        ))}
                      </Box>
                    </Box>

                    {/* Jogos compativeis */}
                    <Box sx={{ marginBottom: 2 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 'bold', 
                          marginBottom: 1, 
                          color: system.color,
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }}
                      >
                        Compativel com:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {system.compatibleGames.map((game, index) => (
                          <Chip
                            key={index}
                            label={game}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              borderColor: system.color,
                              color: system.color,
                              backgroundColor: `${system.color}15`,
                              fontSize: '0.7rem',
                              height: '24px',
                              fontWeight: 'bold'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Botao de acao */}
                    <Box sx={{ textAlign: 'center', marginTop: 'auto' }}>
                      <Button
                        variant={isSelected ? "contained" : "outlined"}
                        size="medium"
                        disabled={isDisabled}
                        fullWidth
                        sx={{ 
                          backgroundColor: isSelected ? system.color : 'transparent',
                          borderColor: system.color,
                          color: isSelected ? '#FFFFFF' : system.color,
                          fontWeight: 'bold',
                          boxShadow: isSelected ? `0 4px 12px ${system.color}60` : 'none',
                          background: isSelected ? 
                            `linear-gradient(135deg, ${system.color} 0%, ${system.color}CC 100%)` : 
                            'transparent',
                          '&:hover': !isDisabled ? {
                            background: `linear-gradient(135deg, ${system.color} 0%, ${system.color}E6 100%)`,
                            color: '#FFFFFF',
                            transform: 'translateY(-2px)',
                            boxShadow: `0 6px 20px ${system.color}80`
                          } : {},
                          transition: 'all 0.3s ease',
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          '&.Mui-disabled': {
                            borderColor: '#8c8c8c',
                            color: '#8c8c8c'
                          }
                        }}
                        aria-label={isSelected ? 
                          `${system.name} - Sistema atual` : 
                          `Selecionar ${system.name}`
                        }
                      >
                        {isSelected ? 'Sistema Atual' : 'Selecionar Sistema'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>

      {/* Informacoes adicionais para o usuario */}
      <Box sx={{ 
        marginTop: 3, 
        padding: 2, 
        backgroundColor: '#181717', 
        borderRadius: 2, 
        border: '1px solid #639EC2',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #181717 0%, #639EC210 100%)'
      }}>
        <Typography 
          variant="caption" 
          color="#E0E0E0"
          sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
        >
          <strong style={{ color: '#639EC2' }}>Nota:</strong> Voce pode alternar entre sistemas a qualquer momento. 
          Sua ficha sera automaticamente adaptada mantendo seus dados principais.
        </Typography>
      </Box>
    </Box>
  );
};

export default SheetSelector;