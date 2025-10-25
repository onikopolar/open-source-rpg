import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  LinearProgress,
  Fab,
  Avatar,
  useTheme,
  Container,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Remove,
  Casino,
  Refresh,
  Favorite,
  Psychology,
  FitnessCenter,
  DirectionsRun,
  Security,
  LocalHospital,
  Warning,
  AutoFixHigh,
  Shield,
  FavoriteBorder
} from '@mui/icons-material';

// Configurações do sistema
const YEAR_ZERO_CONFIG = {
  max_stress: 10,
  trauma_levels: {
    0: { level: 'NORMAL', color: 'success', desc: 'Sem efeitos adversos' },
    5: { level: 'MODERADO', color: 'info', desc: 'Penalidades moderadas' },
    7: { level: 'SEVERO', color: 'warning', desc: 'Penalidades severas' },
    9: { level: 'GRAVE', color: 'error', desc: 'Personagem incapacitado' }
  },
  attribute_colors: {
    'FORÇA': '#ff6b6b',
    'AGILIDADE': '#4ecdc4',
    'RACIOCÍNIO': '#45b7d1',
    'EMPATIA': '#96ceb4'
  },
  attribute_icons: {
    'FORÇA': <FitnessCenter />,
    'AGILIDADE': <DirectionsRun />,
    'RACIOCÍNIO': <Psychology />,
    'EMPATIA': <Favorite />
  }
};

// Serviço de API robusto
const YearZeroAPIService = {
  async request(endpoint, options = {}) {
    const url = `/api/yearzero/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API returned unsuccessful response');
      }

      return result;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  async getCharacterData(characterId) {
    return this.request(`attributes?character_id=${characterId}`);
  },

  async updateAttribute(characterId, attributeName, value) {
    return this.request('attributes', {
      method: 'PUT',
      body: JSON.stringify({
        character_id: characterId,
        name: attributeName,
        value: value
      })
    });
  },

  async getStress(characterId) {
    return this.request(`stress?character_id=${characterId}`);
  },

  async updateStress(characterId, stress, action = 'set') {
    return this.request('stress', {
      method: 'POST',
      body: JSON.stringify({
        character_id: characterId,
        stress: stress,
        action: action
      })
    });
  },

  async rollDice(characterId, baseDice, skillDice, stress, attributeName) {
    return this.request('roll', {
      method: 'POST',
      body: JSON.stringify({
        character_id: characterId,
        base_dice: baseDice,
        skill_dice: skillDice,
        stress: stress,
        attribute_name: attributeName
      })
    });
  },

  async setupCharacter(characterId) {
    return this.request('attributes', {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId })
    });
  }
};

// Hook personalizado para gerenciamento de estado
const useYearZeroCharacter = (characterId) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const loadData = useCallback(async () => {
    if (!characterId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [charData, stressData] = await Promise.all([
        YearZeroAPIService.getCharacterData(characterId),
        YearZeroAPIService.getStress(characterId)
      ]);

      setState({
        data: {
          ...charData.data,
          stress: stressData.stress
        },
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [characterId]);

  const updateAttribute = async (attributeName, value) => {
    try {
      await YearZeroAPIService.updateAttribute(characterId, attributeName, value);
      await loadData(); // Recarrega dados atualizados
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateStress = async (newStress, action = 'set') => {
    try {
      await YearZeroAPIService.updateStress(characterId, newStress, action);
      
      // Atualiza localmente sem recarregar tudo
      setState(prev => ({
        ...prev,
        data: prev.data ? {
          ...prev.data,
          stress: { ...prev.data.stress, value: newStress }
        } : null
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    ...state,
    loadData,
    updateAttribute,
    updateStress
  };
};

/**
 * Componente de ficha Year Zero Engine - VERDADEIRAMENTE Robusto
 * Completamente alinhado com a API e mecânicas do sistema
 */
const YearZeroSheet = ({ 
  character, 
  diceRollModal 
}) => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState({ error: null, success: null });
  const [selectedAttribute, setSelectedAttribute] = useState(null);

  const {
    data: yearZeroData,
    loading,
    error,
    loadData,
    updateAttribute,
    updateStress
  } = useYearZeroCharacter(character?.id);

  // Utilidades
  const showNotification = (type, message) => {
    setNotifications(prev => ({ ...prev, [type]: message }));
    setTimeout(() => {
      setNotifications(prev => ({ ...prev, [type]: null }));
    }, type === 'error' ? 6000 : 3000);
  };

  const getTraumaLevel = useCallback((stressValue) => {
    const stress = stressValue || yearZeroData?.stress?.value || 0;
    const level = Object.entries(YEAR_ZERO_CONFIG.trauma_levels)
      .reverse()
      .find(([threshold]) => stress >= parseInt(threshold));
    
    return level ? YEAR_ZERO_CONFIG.trauma_levels[level[0]] : YEAR_ZERO_CONFIG.trauma_levels[0];
  }, [yearZeroData?.stress?.value]);

  const handleRoll = async (baseDice, skillDice, attributeName) => {
    if (!yearZeroData) return;

    try {
      const stressValue = yearZeroData.stress?.value || 0;
      const result = await YearZeroAPIService.rollDice(
        character.id,
        baseDice,
        skillDice,
        stressValue,
        attributeName
      );

      if (diceRollModal) {
        diceRollModal(result);
      }
    } catch (error) {
      showNotification('error', `Erro na rolagem: ${error.message}`);
    }
  };

  const handleSetupCharacter = async () => {
    try {
      await YearZeroAPIService.setupCharacter(character.id);
      showNotification('success', 'Personagem configurado para Year Zero!');
      await loadData();
    } catch (error) {
      showNotification('error', `Erro na configuração: ${error.message}`);
    }
  };

  // Componente de Diamante do Atributo
  const AttributeDiamond = ({ attribute }) => (
    <Box 
      sx={{ 
        position: 'relative',
        width: 140,
        height: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'rotate(45deg)',
        backgroundColor: YEAR_ZERO_CONFIG.attribute_colors[attribute.name] + '20',
        border: `3px solid ${YEAR_ZERO_CONFIG.attribute_colors[attribute.name]}`,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'rotate(45deg) scale(1.05)',
          backgroundColor: YEAR_ZERO_CONFIG.attribute_colors[attribute.name] + '30',
        }
      }}
      onClick={() => setSelectedAttribute(attribute)}
    >
      <Box sx={{ transform: 'rotate(-45deg)', textAlign: 'center' }}>
        <Box sx={{ color: YEAR_ZERO_CONFIG.attribute_colors[attribute.name], mb: 0.5 }}>
          {YEAR_ZERO_CONFIG.attribute_icons[attribute.name]}
        </Box>
        <Typography variant="caption" display="block" fontWeight="bold">
          {attribute.name}
        </Typography>
        <Typography variant="h6" fontWeight="bold" color={YEAR_ZERO_CONFIG.attribute_colors[attribute.name]}>
          {attribute.value}
        </Typography>
        <Typography variant="caption" display="block">
          {attribute.base_dice} dado(s) base
        </Typography>
      </Box>

      <Chip
        label={attribute.base_dice}
        size="small"
        sx={{
          position: 'absolute',
          top: -8,
          right: -8,
          backgroundColor: YEAR_ZERO_CONFIG.attribute_colors[attribute.name],
          color: 'white',
          fontWeight: 'bold',
          transform: 'rotate(-45deg)'
        }}
      />
    </Box>
  );

  // Componente de Habilidade Orbital
  const SkillOrb = ({ skill, angle, distance, attributeColor }) => {
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * distance;
    const y = Math.sin(rad) * distance;

    return (
      <Box
        sx={{
          position: 'absolute',
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          transform: 'translate(-50%, -50%)',
          zIndex: 2
        }}
      >
        <Tooltip title={`${skill.name}: ${skill.value} (Rolar com ${skill.linked_attribute})`}>
          <Chip
            label={skill.value}
            size="small"
            variant="outlined"
            sx={{
              backgroundColor: 'background.paper',
              borderColor: attributeColor,
              color: attributeColor,
              fontWeight: 'bold',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: attributeColor + '20'
              }
            }}
            onClick={() => {
              const baseDice = yearZeroData?.attributes?.find(a => a.name === skill.linked_attribute)?.base_dice || 0;
              handleRoll(baseDice, parseInt(skill.value) || 0, skill.linked_attribute);
            }}
          />
        </Tooltip>
        <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 0.5, maxWidth: 80 }}>
          {skill.name.split(' ')[0]}
        </Typography>
      </Box>
    );
  };

  // Cluster de Atributo com Diamante e Habilidades
  const AttributeCluster = ({ attribute }) => {
    const skills = attribute.skills || [];
    const skillAngles = skills.map((_, index) => (360 / skills.length) * index);
    const attributeColor = YEAR_ZERO_CONFIG.attribute_colors[attribute.name];

    return (
      <Box sx={{ position: 'relative', width: 200, height: 200, margin: 3 }}>
        {skills.map((skill, index) => (
          <SkillOrb 
            key={skill.name}
            skill={skill}
            angle={skillAngles[index]}
            distance={85}
            attributeColor={attributeColor}
          />
        ))}
        
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <AttributeDiamond attribute={attribute} />
        </Box>
      </Box>
    );
  };

  // Modal de Detalhes do Atributo
  const AttributeDetailModal = () => {
    if (!selectedAttribute) return null;
    const attributeColor = YEAR_ZERO_CONFIG.attribute_colors[selectedAttribute.name];

    return (
      <Dialog open={!!selectedAttribute} onClose={() => setSelectedAttribute(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          backgroundColor: attributeColor + '20',
          borderBottom: `2px solid ${attributeColor}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {YEAR_ZERO_CONFIG.attribute_icons[selectedAttribute.name]}
            <Typography variant="h6">{selectedAttribute.name}</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            {selectedAttribute.description}
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color={attributeColor}>
                  {selectedAttribute.value}
                </Typography>
                <Typography variant="caption">Valor do Atributo</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color={attributeColor}>
                  {selectedAttribute.base_dice}
                </Typography>
                <Typography variant="caption">Dados Base</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Habilidades Vinculadas
          </Typography>
          
          {selectedAttribute.skills?.map((skill) => (
            <Box key={skill.name} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight="medium">
                  {skill.name}
                </Typography>
                <Chip 
                  label={skill.value} 
                  size="small" 
                  sx={{ borderColor: attributeColor, color: attributeColor }}
                />
              </Box>
            </Box>
          ))}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setSelectedAttribute(null)}>
            Fechar
          </Button>
          <Button 
            variant="contained"
            startIcon={<Casino />}
            onClick={() => {
              handleRoll(selectedAttribute.base_dice, 0, selectedAttribute.name);
              setSelectedAttribute(null);
            }}
            sx={{ backgroundColor: attributeColor }}
          >
            Rolagem Rápida
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Estados de renderização
  if (loading && !yearZeroData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Carregando dados Year Zero Engine...
        </Typography>
      </Box>
    );
  }

  if (error && !yearZeroData) {
    return (
      <Alert 
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={loadData}>
            <Refresh />
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!yearZeroData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Personagem não configurado para Year Zero Engine
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AutoFixHigh />}
          onClick={handleSetupCharacter}
          disabled={loading}
        >
          {loading ? 'Configurando...' : 'Configurar para Year Zero'}
        </Button>
      </Box>
    );
  }

  const trauma = getTraumaLevel();
  const currentStress = yearZeroData.stress?.value || 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Sistema de Notificações */}
      <Snackbar open={!!notifications.error} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => showNotification('error', null)}>
          {notifications.error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!notifications.success} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => showNotification('success', null)}>
          {notifications.success}
        </Alert>
      </Snackbar>

      {/* Cabeçalho */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar sx={{ width: 60, height: 60, bgcolor: 'white', color: '#764ba2' }}>
              <Security />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" color="white" fontWeight="bold">
              {yearZeroData.character.name}
            </Typography>
            <Typography variant="subtitle1" color="white">
              Year Zero Engine • Atualizado: {new Date().toLocaleTimeString()}
            </Typography>
          </Grid>
          <Grid item>
            <Tooltip title="Recarregar dados">
              <IconButton onClick={loadData} sx={{ color: 'white' }} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Stress e Trauma */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Nível de Stress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={() => updateStress(Math.max(0, currentStress - 1), 'modify')}
                disabled={currentStress === 0 || loading}
              >
                <Remove />
              </IconButton>
              
              <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h4" color={trauma.color}>
                  {currentStress}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(currentStress / YEAR_ZERO_CONFIG.max_stress) * 100} 
                  color={trauma.color}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <IconButton 
                size="small" 
                onClick={() => updateStress(Math.min(YEAR_ZERO_CONFIG.max_stress, currentStress + 1), 'modify')}
                disabled={currentStress === YEAR_ZERO_CONFIG.max_stress || loading}
              >
                <Add />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={8}>
            <Alert 
              severity={trauma.color} 
              icon={<Warning />}
              sx={{ height: '100%' }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                TRAUMA {trauma.level}
              </Typography>
              <Typography variant="body2">
                {trauma.desc}
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Paper>

      {/* Atributos Nucleares */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 4 }}>
          Atributos Nucleares
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          gap: 2
        }}>
          {yearZeroData.attributes?.map((attribute) => (
            <AttributeCluster 
              key={attribute.name} 
              attribute={attribute}
            />
          ))}
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            💎 Clique nos diamantes para detalhes • 🎲 Clique nas habilidades para rolar dados
          </Typography>
        </Box>
      </Paper>

      <AttributeDetailModal />

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleRoll(1, 0, 'GERAL')}
      >
        <Casino />
      </Fab>
    </Container>
  );
};

export default YearZeroSheet;
