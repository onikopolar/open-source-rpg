import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { withStyles } from '@mui/styles';
import { 
  Box, 
  Typography, 
  TextField, 
  Paper, 
  IconButton,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { 
  Casino, 
  Shuffle, 
  Check, 
  Close, 
  Psychology, 
  SportsEsports, 
  ShoppingCart,
  Visibility,
  Security,
  DirectionsRun,
  Update,
  Favorite,
  Psychology as SoulIcon,
  LocalHospital,
  Edit,
  Save
} from '@mui/icons-material';

import { DiceRollModal } from '../../components';
import useModal from '../../hooks/useModal';

// Constants
const ESPECIALIZACOES_PV = {
  'Lutador': { pv: 12, dadoVida: 'd10' },
  'Especialista em Combate': { pv: 12, dadoVida: 'd10' },
  'Especialista em Técnica': { pv: 10, dadoVida: 'd8' },
  'Controlador': { pv: 10, dadoVida: 'd8' },
  'Suporte': { pv: 10, dadoVida: 'd8' },
  'Restringido': { pv: 16, dadoVida: 'd12' }
};

const ESPECIALIZACOES_PE = {
  'Lutador': { pe: 4, modAtributo: false },
  'Especialista em Combate': { pe: 4, modAtributo: false },
  'Especialista em Técnica': { pe: 6, modAtributo: true },
  'Controlador': { pe: 5, modAtributo: true },
  'Suporte': { pe: 5, modAtributo: true },
  'Restringido': { pe: 0, modAtributo: false }
};

const DEFAULT_ATTRIBUTES = [
  { 
    name: 'FORÇA', 
    description: 'Poder muscular, físico e bruto. Usado para aumentar dano, aplicações de força bruta, peso levantado, altura do pulo.',
    value: 10,
    assignedValue: null
  },
  { 
    name: 'DESTREZA', 
    description: 'Agilidade, reflexos e rapidez. Usado para equilíbrio, esquivar, manuseio de armas leves, acrobacias.',
    value: 10,
    assignedValue: null
  },
  { 
    name: 'CONSTITUIÇÃO', 
    description: 'Resistência e vigor. Aplicado aos pontos de vida, testes de fortitude, resistência a venenos, fôlego.',
    value: 10,
    assignedValue: null
  },
  { 
    name: 'INTELIGÊNCIA', 
    description: 'Raciocínio e intelecto. Permite aprendizado, uso de perícias, assimilação de informações, velocidade mental.',
    value: 10,
    assignedValue: null
  },
  { 
    name: 'SABEDORIA', 
    description: 'Conhecimento pela experiência, observação. Mede atenção aos arredores, usado em perícias de percepção.',
    value: 10,
    assignedValue: null
  },
  { 
    name: 'PRESENÇA', 
    description: 'Força da personalidade e influência. Capacidade de influenciar outros com palavras, gestos, simpatia ou beleza.',
    value: 10,
    assignedValue: null
  }
];

const FIXED_VALUES = [15, 14, 13, 12, 10, 8];
const TABELA_CUSTOS = {
  8: -2,
  9: -1,
  10: 0,
  11: 2,
  12: 3,
  13: 4,
  14: 5,
  15: 7
};

const METODOS_CRIACAO = {
  FIXOS: {
    id: 'FIXOS',
    nome: 'VALORES FIXOS',
    icone: React.createElement(Psychology),
    descricao: 'Balanceado e justo para todos os jogadores',
    detalhes: 'Receba 6 valores pré-definidos [15,14,13,12,10,8] e distribua entre os atributos.',
    badge: 'RECOMENDADO',
    badgeColor: '#4caf50'
  },
  ROLAGEM: {
    id: 'ROLAGEM', 
    nome: 'ROLAGEM',
    icone: React.createElement(SportsEsports),
    descricao: 'Aventure-se e deixe a sorte decidir seu destino',
    detalhes: 'Role 4d6 para cada atributo (descarte o menor). Personagens únicos e imprevisíveis!',
    badge: 'AVENTUREIRO',
    badgeColor: '#ff9800'
  },
  COMPRA: {
    id: 'COMPRA',
    nome: 'COMPRA POR PONTOS',
    icone: React.createElement(ShoppingCart),
    descricao: 'Controle total sobre seu personagem',
    detalhes: 'Comece com 10 em tudo e use 17 pontos pra comprar melhorias seguindo uma tabela de custos.',
    badge: 'EXPERT',
    badgeColor: '#9c27b0'
  }
};

// Utility Functions
const calculateModifier = (value) => {
  const numValue = Number(value) || 0;
  
  if (numValue === 1) return -5;
  if (numValue >= 2 && numValue <= 3) return -4;
  if (numValue >= 4 && numValue <= 5) return -3;
  if (numValue >= 6 && numValue <= 7) return -2;
  if (numValue >= 8 && numValue <= 9) return -1;
  if (numValue >= 10 && numValue <= 11) return 0;
  if (numValue >= 12 && numValue <= 13) return 1;
  if (numValue >= 14 && numValue <= 15) return 2;
  if (numValue >= 16 && numValue <= 17) return 3;
  if (numValue >= 18 && numValue <= 19) return 4;
  if (numValue >= 20 && numValue <= 21) return 5;
  if (numValue >= 22 && numValue <= 23) return 6;
  if (numValue >= 24 && numValue <= 25) return 7;
  if (numValue >= 26 && numValue <= 27) return 8;
  if (numValue >= 28 && numValue <= 29) return 9;
  if (numValue >= 30) return 10;
  
  return 0;
};

const calculateAdditionalValues = (attributes, nivel = 1, especializacao = '', outrosBonus = {}) => {
  const modDestreza = calculateModifier(attributes.find(attr => attr.name === 'DESTREZA')?.value || 10);
  const modSabedoria = calculateModifier(attributes.find(attr => attr.name === 'SABEDORIA')?.value || 10);
  const modConstituicao = calculateModifier(attributes.find(attr => attr.name === 'CONSTITUIÇÃO')?.value || 10);
  const modInteligencia = calculateModifier(attributes.find(attr => attr.name === 'INTELIGÊNCIA')?.value || 10);
  
  const basePV = ESPECIALIZACOES_PV[especializacao]?.pv || 10;
  const pvMaximo = basePV + modConstituicao;
  
  const basePE = ESPECIALIZACOES_PE[especializacao]?.pe || 0;
  const usaModAtributo = ESPECIALIZACOES_PE[especializacao]?.modAtributo || false;
  const peMaximo = basePE + (usaModAtributo ? modInteligencia : 0);
  
  const bonusPercepcao = modSabedoria + (outrosBonus.percepcao || 0);
  
  return {
    ATENÇÃO: {
      valor: 10 + bonusPercepcao + (outrosBonus.atencao || 0),
      formula: '10 + Bônus Percepção + Outros Bônus',
      descricao: 'Percepção passiva do ambiente'
    },
    DEFESA: {
      valor: 10 + modDestreza + Math.floor(nivel / 2) + (outrosBonus.defesa || 0),
      formula: '10 + Mod. Destreza + Metade do Nível + Outros Bônus',
      descricao: 'Dificuldade para ser acertado em combate'
    },
    DESLOCAMENTO: {
      valor: 9 + (outrosBonus.deslocamento || 0),
      formula: '9 + Outros Bônus',
      descricao: 'Distância por ação de movimento (metros)'
    },
    INICIATIVA: {
      valor: modDestreza + (outrosBonus.iniciativa || 0),
      formula: 'Mod. Destreza + Outros Bônus',
      descricao: 'Bônus para ordem de turno no combate'
    },
    PONTOS_VIDA: {
      max: pvMaximo,
      base: basePV,
      modificador: modConstituicao,
      dadoVida: ESPECIALIZACOES_PV[especializacao]?.dadoVida || 'd8',
      descricao: `PV = ${basePV} (${especializacao}) + ${modConstituicao} (Constituição)`
    },
    INTEGRIDADE_ALMA: {
      valor: pvMaximo,
      formula: 'Igual ao máximo de Pontos de Vida',
      descricao: 'Estabilidade da alma do personagem'
    },
    PONTOS_ENERGIA: {
      max: peMaximo,
      base: basePE,
      usaModAtributo: usaModAtributo,
      descricao: `PE = ${basePE} (${especializacao})${usaModAtributo ? ' + ' + modInteligencia + ' (Inteligência)' : ''}`
    }
  };
};

// Styles
const styles = (theme) => ({
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    background: 'transparent',
    borderRadius: '8px',
    position: 'relative',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)',
    borderRadius: '8px',
    color: 'white',
    boxShadow: '0 4px 12px rgba(106, 27, 154, 0.3)'
  },
  setupButton: {
    background: 'linear-gradient(135deg, #ff6b35 0%, #e65100 100%)',
    color: 'white',
    fontWeight: 'bold',
    marginTop: '10px',
    '&:hover': {
      background: 'linear-gradient(135deg, #e65100 0%, #bf360c 100%)',
    },
    '&:disabled': {
      background: '#cccccc',
      color: '#666666'
    }
  },
  mahoragaLayout: {
    position: 'relative',
    width: '1000px',
    height: '700px',
    margin: '30px auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelCanvas: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 8px 32px rgba(106, 27, 154, 0.1)',
    zIndex: 1,
  },
  wheelPosition: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    zIndex: 10,
  },
  attributeWheel: {
    background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)',
    border: '4px solid #4a148c',
    borderRadius: '50%',
    padding: '25px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    width: '140px',
    height: '140px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 6px 25px rgba(106, 27, 154, 0.3)',
    position: 'relative',
    '&:hover': {
      transform: 'translateY(-8px) scale(1.08)',
      boxShadow: '0 12px 35px rgba(106, 27, 154, 0.5)',
      borderColor: '#7b1fa2',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-6px',
      left: '-6px',
      right: '-6px',
      bottom: '-6px',
      background: 'linear-gradient(135deg, transparent 30%, #4a148c 100%)',
      borderRadius: '50%',
      zIndex: -1,
      opacity: 0.7,
    }
  },
  emptyWheel: {
    background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)',
    border: '4px solid #4a148c',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    width: '120px',
    height: '120px',
    boxShadow: '0 6px 25px rgba(106, 27, 154, 0.3)',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-6px',
      left: '-6px',
      right: '-6px',
      bottom: '-6px',
      background: 'linear-gradient(135deg, transparent 30%, #4a148c 100%)',
      borderRadius: '50%',
      zIndex: -1,
      opacity: 0.7,
    }
  },
  attributeNameWheel: {
    position: 'absolute',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    whiteSpace: 'nowrap',
    zIndex: 20,
  },
  attributeValueContainerWheel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '8px',
    flexDirection: 'column',
  },
  attributeInputWheel: {
    width: '70px',
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '8px',
      '& fieldset': {
        borderColor: '#4a148c',
        borderWidth: '2px'
      },
      '&:hover fieldset': {
        borderColor: '#7b1fa2',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#6a1b9a',
        borderWidth: '2px'
      }
    },
    '& input': {
      color: '#6a1b9a',
      fontWeight: 'bold',
      fontSize: '1.1rem',
      textAlign: 'center',
      padding: '8px'
    }
  },
  diceButtonWheel: {
    color: 'white',
    background: 'rgba(106, 27, 154, 0.8)',
    border: '2px solid white',
    borderRadius: '50%',
    padding: '6px',
    marginTop: '5px',
    '&:hover': {
      backgroundColor: 'white',
      color: '#6a1b9a'
    },
  },
  modifierBoxWheel: {
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#6a1b9a',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginTop: '5px',
    border: '2px solid #4a148c'
  },
  modifierLabelWheel: {
    fontSize: '0.5rem',
    opacity: 0.8,
    marginBottom: '1px',
    textTransform: 'uppercase'
  },
  healthSection: {
    marginBottom: '30px',
  },
  healthGrid: {
  marginTop: '20px',
  '& > .MuiGrid-item': {
    display: 'flex'
  }
},
healthCard: {
  background: 'rgba(255, 255, 255, 0.9)',
  border: '2px solid #f44336',
  borderRadius: '8px',
  padding: '20px',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  flex: 1, // ← ADICIONE ESTA LINHA
  display: 'flex', // ← ADICIONE ESTA LINHA
  flexDirection: 'column', // ← ADICIONE ESTA LINHA
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(244, 67, 54, 0.2)',
  }
},
soulCard: {
  background: 'rgba(255, 255, 255, 0.9)',
  border: '2px solid #9c27b0',
  borderRadius: '8px',
  padding: '20px',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  flex: 1, // ← ADICIONE ESTA LINHA
  display: 'flex', // ← ADICIONE ESTA LINHA
  flexDirection: 'column', // ← ADICIONE ESTA LINHA
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(156, 39, 176, 0.2)',
  }
},
energyCard: {
  background: 'rgba(255, 255, 255, 0.9)',
  border: '2px solid #2196f3',
  borderRadius: '8px',
  padding: '20px',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  flex: 1,
  display: 'flex',
  flexDirection: 'column', 
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(33, 150, 243, 0.2)',
  }
},
  healthHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15px'
  },
  healthTitle: {
    color: '#f44336',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  soulTitle: {
    color: '#9c27b0',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  energyTitle: {
    color: '#2196f3',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  healthIcon: {
    fontSize: '24px'
  },
  progressContainer: {
    marginBottom: '15px'
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px'
  },
  progressText: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#666'
  },
  progressValue: {
    fontSize: '1.1rem',
    fontWeight: 'bold'
  },
  healthProgress: {
    height: '20px',
    borderRadius: '10px',
    backgroundColor: '#ffcdd2',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#f44336',
      borderRadius: '10px'
    }
  },
  soulProgress: {
    height: '20px',
    borderRadius: '10px',
    backgroundColor: '#e1bee7',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#9c27b0',
      borderRadius: '10px'
    }
  },
  energyProgress: {
    height: '20px',
    borderRadius: '10px',
    backgroundColor: '#bbdefb',
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#2196f3',
      borderRadius: '10px'
    }
  },
  healthDetails: {
    marginTop: '15px',
    padding: '10px',
    background: '#f5f5f5',
    borderRadius: '4px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: '#666',
    marginBottom: '4px'
  },
  editDialog: {
    '& .MuiDialog-paper': {
      borderRadius: '12px',
      padding: '20px'
    }
  },
  editField: {
    marginBottom: '20px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px'
    }
  },
  quickActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginTop: '15px',
    flexWrap: 'wrap'
  },
  quickButton: {
    minWidth: '100px'
  },
  methodSelection: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  methodGrid: {
    marginTop: '30px',
  },
  methodCard: {
    padding: '30px 20px',
    textAlign: 'center',
    border: '3px solid #e0e0e0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    height: '100%',
    '&:hover': {
      borderColor: '#6a1b9a',
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 25px rgba(106, 27, 154, 0.15)'
    },
    '&.selected': {
      borderColor: '#6a1b9a',
      background: 'linear-gradient(135deg, rgba(106, 27, 154, 0.05) 0%, rgba(142, 36, 170, 0.05) 100%)'
    }
  },
  methodIcon: {
    fontSize: '48px',
    marginBottom: '15px',
    color: '#6a1b9a'
  },
  methodTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#6a1b9a',
    marginBottom: '10px'
  },
  methodDescription: {
    color: 'text.secondary',
    marginBottom: '15px',
    lineHeight: '1.5'
  },
  methodBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#6a1b9a',
    textAlign: 'center',
    borderBottom: '2px solid #6a1b9a',
    paddingBottom: '8px'
  },
  additionalValuesSection: {
    marginBottom: '30px',
  },
  additionalValuesGrid: {
    marginTop: '20px',
  },
  additionalValueCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    border: '2px solid #2196f3',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    height: '100%',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(33, 150, 243, 0.2)',
    }
  },
  additionalValueHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '15px'
  },
  additionalValueIcon: {
    fontSize: '32px',
    color: '#2196f3'
  },
  additionalValueName: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#2196f3',
    textTransform: 'uppercase'
  },
  additionalValueDisplay: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1976d2',
    margin: '15px 0'
  },
  additionalValueFormula: {
    fontSize: '0.8rem',
    color: 'text.secondary',
    fontFamily: 'monospace',
    background: '#f5f5f5',
    padding: '8px',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  additionalValueDescription: {
    fontSize: '0.9rem',
    color: 'textSecondary',
    lineHeight: '1.4'
  },
  distributionModal: {
    '& .MuiDialog-paper': {
      maxWidth: '800px',
      borderRadius: '12px',
      zIndex: '9998 !important'
    }
  },
  methodSelectionModal: {
    '& .MuiDialog-paper': {
      maxWidth: '900px',
      borderRadius: '12px',
      zIndex: '9998 !important'
    }
  },
  availableValues: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '15px'
  },
  valueChip: {
    padding: '8px 16px',
    border: '2px solid #6a1b9a',
    borderRadius: '20px',
    background: 'white',
    color: '#6a1b9a',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#6a1b9a',
      color: 'white'
    },
    '&.used': {
      background: '#e0e0e0',
      color: '#9e9e9e',
      borderColor: '#e0e0e0',
      cursor: 'not-allowed'
    }
  },
  attributeDistribution: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px',
    margin: '5px 0',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    background: 'white',
    '&:hover': {
      backgroundColor: '#f9f9f9'
    }
  },
  pointsSystem: {
    textAlign: 'center',
    padding: '20px'
  },
  pointsDisplay: {
    background: 'linear-gradient(135deg, #ff6b35 0%, #e65100 100%)',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: 'bold',
    fontSize: '1.2rem'
  },
  rollButtonContainer: {
    textAlign: 'center',
    margin: '20px 0'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    zIndex: 1
  }
});

// Component Functions
const useFeiticeirosSheet = (character, onUpdate) => {
  const [localAttributes, setLocalAttributes] = useState(DEFAULT_ATTRIBUTES);
  const [showMethodSelection, setShowMethodSelection] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showDistribution, setShowDistribution] = useState(false);
  const [availableValues, setAvailableValues] = useState([...FIXED_VALUES]);
  const [distributionAttributes, setDistributionAttributes] = useState([...DEFAULT_ATTRIBUTES]);
  const [pontosDisponiveis, setPontosDisponiveis] = useState(17);
  const [isLoading, setIsLoading] = useState(false);
  const [localErrors, setLocalErrors] = useState({});
  const [currentHP, setCurrentHP] = useState(character?.current_hit_points || 0);
  const [currentPE, setCurrentPE] = useState(character?.current_energy_points || 0);
  const [editDialog, setEditDialog] = useState({ open: false, type: '', title: '' });
  const canvasRef = useRef(null);

  const wheelPositions = useMemo(() => {
    const centerX = 500;
    const centerY = 350;
    const radius = 220;
    
    const positions = [
      { angle: 45, name: 'SABEDORIA' },
      { angle: 90, name: 'DESTREZA' },
      { angle: 135, name: 'CONSTITUIÇÃO' },
      { angle: 225, name: 'INTELIGÊNCIA' },
      { angle: 270, name: 'FORÇA' },
      { angle: 315, name: 'PRESENÇA' },
      { angle: 0, type: 'empty' },
      { angle: 180, type: 'empty' }
    ];
    
    return positions.map((pos) => {
      const rad = pos.angle * Math.PI / 180;
      const x = centerX + radius * Math.cos(rad);
      const y = centerY + radius * Math.sin(rad);
      
      if (pos.name) {
        return {
          x,
          y,
          type: 'attribute',
          angle: pos.angle,
          name: pos.name
        };
      } else {
        return {
          x,
          y,
          type: 'empty',
          angle: pos.angle
        };
      }
    });
  }, []);

  const additionalValues = useMemo(() => {
    return calculateAdditionalValues(
      localAttributes, 
      character?.level || 1,
      character?.especializacao || 'Lutador'
    );
  }, [localAttributes, character?.level, character?.especializacao]);

  const drawMahoragaWheels = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const offset = (Math.random() - 0.5) * 10;
      ctx.arc(centerX + offset, centerY + offset, 120, 0, 2 * Math.PI);
    }
    ctx.strokeStyle = 'rgba(74, 20, 140, 0.9)';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    ctx.beginPath();
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      const radius = 40 + (Math.random() - 0.5) * 8;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (angle === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(105, 27, 154, 1)';
    ctx.fill();
    
    ctx.beginPath();
    for (let i = 0; i < 2; i++) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const radius = 42 + (Math.random() - 0.5) * 6;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(74, 20, 140, 0.8)';
      ctx.lineWidth = 2 + i;
      ctx.stroke();
    }
    
    ctx.strokeStyle = 'rgba(106, 27, 154, 0.9)';
    ctx.lineWidth = 6;
    
    const connections = [
      [1, 4], [7, 6], [0, 3], [2, 5],
    ];
    
    connections.forEach(([startIdx, endIdx]) => {
      const startPos = wheelPositions[startIdx];
      const endPos = wheelPositions[endIdx];
      
      if (startPos && endPos) {
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.moveTo(startPos.x, startPos.y);
          
          const segments = 3;
          for (let s = 1; s <= segments; s++) {
            const t = s / segments;
            const x = startPos.x + (endPos.x - startPos.x) * t;
            const y = startPos.y + (endPos.y - startPos.y) * t;
            
            const varyX = (Math.random() - 0.5) * 15;
            const varyY = (Math.random() - 0.5) * 15;
            
            ctx.lineTo(x + varyX, y + varyY);
          }
          
          ctx.lineTo(endPos.x, endPos.y);
          ctx.stroke();
        }
      }
    });
    
    ctx.strokeStyle = 'rgba(74, 20, 140, 0.6)';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const length = 20 + Math.random() * 30;
      const startRadius = 50 + Math.random() * 40;
      
      const startX = centerX + Math.cos(angle) * startRadius;
      const startY = centerY + Math.sin(angle) * startRadius;
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }, [wheelPositions]);

  useEffect(() => {
    drawMahoragaWheels();
  }, [drawMahoragaWheels]);

  const diceRollModal = useModal(({ close, custom }) => {
    return React.createElement(DiceRollModal, {
      handleClose: close,
      characterId: custom.characterId,
      characterName: custom.characterName,
      skillName: custom.skillName,
      skillValue: custom.skillValue,
      onDiceRoll: (rollResult) => {
        if (custom.skillName && rollResult) {
          const rollValue = rollResult.total;
          const attributeIndex = distributionAttributes.findIndex(
            attr => attr.name === custom.skillName
          );
          if (attributeIndex !== -1) {
            const newAttributes = [...distributionAttributes];
            newAttributes[attributeIndex].value = rollValue;
            setDistributionAttributes(newAttributes);
          }
        }
      },
      zIndex: 10000
    });
  }, { defaultZIndex: 10000 });

  const handleHealthClick = useCallback(() => {
    setEditDialog({
      open: true,
      type: 'hp',
      title: 'Editar Pontos de Vida',
      current: currentHP,
      max: additionalValues.PONTOS_VIDA.max,
      description: additionalValues.PONTOS_VIDA.descricao
    });
  }, [currentHP, additionalValues]);

  const handleSoulClick = useCallback(() => {
    setEditDialog({
      open: true,
      type: 'soul',
      title: 'Integridade da Alma',
      current: additionalValues.INTEGRIDADE_ALMA.valor,
      max: additionalValues.INTEGRIDADE_ALMA.valor,
      description: additionalValues.INTEGRIDADE_ALMA.descricao,
      readOnly: true
    });
  }, [additionalValues]);

  const handleEnergyClick = useCallback(() => {
    setEditDialog({
      open: true,
      type: 'energy',
      title: 'Editar Pontos de Energia Amaldiçoada',
      current: currentPE,
      max: additionalValues.PONTOS_ENERGIA.max,
      description: additionalValues.PONTOS_ENERGIA.descricao
    });
  }, [currentPE, additionalValues]);

  const handleSaveEdit = useCallback((type, current, max) => {
    if (type === 'hp') {
      const newCurrent = Math.min(max, Math.max(0, current));
      setCurrentHP(newCurrent);
      
      if (character && onUpdate) {
        onUpdate('character', 'current_hit_points', newCurrent);
      }
    } else if (type === 'energy') {
      const newCurrent = Math.min(max, Math.max(0, current));
      setCurrentPE(newCurrent);
      
      if (character && onUpdate) {
        onUpdate('character', 'current_energy_points', newCurrent);
      }
    }
    
    setEditDialog({ open: false, type: '', title: '' });
  }, [character, onUpdate]);

  const handleQuickAction = useCallback((type, amount) => {
  if (type === 'heal') {
    const newHP = Math.min(additionalValues.PONTOS_VIDA.max, currentHP + amount);
    setCurrentHP(newHP);
    if (character && onUpdate) {
      onUpdate('character', 'current_hit_points', newHP);
    }
  } else if (type === 'damage') {
    const newHP = Math.max(0, currentHP - amount);
    setCurrentHP(newHP);
    if (character && onUpdate) {
      onUpdate('character', 'current_hit_points', newHP);
    }
  } else if (type === 'energy') {
    const newPE = Math.min(additionalValues.PONTOS_ENERGIA.max, currentPE + amount);
    setCurrentPE(newPE);
    if (character && onUpdate) {
      onUpdate('character', 'current_energy_points', newPE);
    }
  } else if (type === 'energy_remove') {
    const newPE = Math.max(0, currentPE - amount);
    setCurrentPE(newPE);
    if (character && onUpdate) {
      onUpdate('character', 'current_energy_points', newPE);
    }
  }
}, [additionalValues, currentHP, currentPE, character, onUpdate]);

  const loadCharacterData = useCallback(() => {
    const hasAttributes = character?.attributes && character.attributes.length > 0;
    
    if (hasAttributes) {
      const loadedAttributes = DEFAULT_ATTRIBUTES.map(defaultAttr => {
        const charAttr = character.attributes.find(attr => 
          attr.attribute?.name === defaultAttr.name
        );
        return {
          ...defaultAttr,
          value: charAttr?.value || defaultAttr.value
        };
      });
      setLocalAttributes(loadedAttributes);
    } else {
      setShowMethodSelection(true);
    }

    setCurrentHP(character?.current_hit_points || 0);
    setCurrentPE(character?.current_energy_points || 0);
  }, [character]);

  useEffect(() => {
    loadCharacterData();
  }, [loadCharacterData]);

  const handleMethodSelect = useCallback((method) => {
    setSelectedMethod(method);
    setShowMethodSelection(false);
    setShowDistribution(true);
    
    if (method.id === 'FIXOS') {
      setAvailableValues([...FIXED_VALUES]);
      setDistributionAttributes(DEFAULT_ATTRIBUTES.map(attr => ({
        ...attr,
        value: 10,
        assignedValue: null
      })));
    } else if (method.id === 'COMPRA') {
      setPontosDisponiveis(17);
      setDistributionAttributes(DEFAULT_ATTRIBUTES.map(attr => ({
        ...attr,
        value: 10
      })));
    }
  }, []);

  const assignValueToAttribute = useCallback((attributeIndex, value) => {
    const newAttributes = [...distributionAttributes];
    const attribute = newAttributes[attributeIndex];
    
    if (attribute.assignedValue !== null) {
      setAvailableValues(prev => [...prev, attribute.assignedValue].sort((a, b) => b - a));
    }
    
    attribute.assignedValue = value;
    attribute.value = value;
    
    setAvailableValues(prev => prev.filter(v => v !== value));
    setDistributionAttributes(newAttributes);
  }, [distributionAttributes]);

  const removeValueFromAttribute = useCallback((attributeIndex) => {
    const newAttributes = [...distributionAttributes];
    const attribute = newAttributes[attributeIndex];
    
    if (attribute.assignedValue !== null) {
      setAvailableValues(prev => [...prev, attribute.assignedValue].sort((a, b) => b - a));
      attribute.assignedValue = null;
      attribute.value = 10;
    }
    
    setDistributionAttributes(newAttributes);
  }, [distributionAttributes]);

  const calcularCustoAtributo = useCallback((valorAtual, novoValor) => {
    const custoAtual = TABELA_CUSTOS[valorAtual] || 0;
    const custoNovo = TABELA_CUSTOS[novoValor] || 0;
    return custoNovo - custoAtual;
  }, []);

  const ajustarAtributoCompra = useCallback((attributeIndex, novoValor) => {
    if (novoValor < 8 || novoValor > 15) return;

    const atributo = distributionAttributes[attributeIndex];
    const custo = calcularCustoAtributo(atributo.value, novoValor);
    
    if (pontosDisponiveis >= custo) {
      const novosAtributos = [...distributionAttributes];
      novosAtributos[attributeIndex] = {
        ...atributo,
        value: novoValor
      };
      setDistributionAttributes(novosAtributos);
      setPontosDisponiveis(pontosDisponiveis - custo);
    }
  }, [distributionAttributes, pontosDisponiveis, calcularCustoAtributo]);

  const confirmDistribution = useCallback(async () => {
    setIsLoading(true);
    try {
      setLocalAttributes(distributionAttributes);
      setShowDistribution(false);
      
      if (character?.attributes && onUpdate) {
        const updatePromises = distributionAttributes.map(attr => {
          const charAttr = character.attributes.find(cAttr => 
            cAttr.attribute?.name === attr.name
          );
          if (charAttr) {
            return Promise.resolve(onUpdate('attribute', attr.name, attr.value));
          }
          return Promise.resolve();
        });
        
        await Promise.all(updatePromises);
      }
    } catch (error) {
      console.error('Erro ao confirmar distribuição:', error);
      setLocalErrors(prev => ({
        ...prev,
        distribution: 'Erro ao salvar atributos. Tente novamente.'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [distributionAttributes, character, onUpdate]);

  const resetDistribution = useCallback(() => {
    if (selectedMethod?.id === 'FIXOS') {
      setAvailableValues([...FIXED_VALUES]);
      setDistributionAttributes(DEFAULT_ATTRIBUTES.map(attr => ({
        ...attr,
        value: 10,
        assignedValue: null
      })));
    } else if (selectedMethod?.id === 'COMPRA') {
      setPontosDisponiveis(17);
      setDistributionAttributes(DEFAULT_ATTRIBUTES.map(attr => ({
        ...attr,
        value: 10
      })));
    } else if (selectedMethod?.id === 'ROLAGEM') {
      setDistributionAttributes(DEFAULT_ATTRIBUTES.map(attr => ({
        ...attr,
        value: 10
      })));
    }
    setLocalErrors(prev => ({ ...prev, distribution: null }));
  }, [selectedMethod]);

  const updateAttribute = useCallback((attributeName, value) => {
    const numValue = value === "" ? 0 : Math.max(0, Math.min(30, parseInt(value) || 0));
    
    setLocalAttributes(prev => 
      prev.map(attr => 
        attr.name === attributeName ? { ...attr, value: numValue } : attr
      )
    );

    if (character?.attributes && onUpdate) {
      const charAttr = character.attributes.find(attr => 
        attr.attribute?.name === attributeName
      );
      if (charAttr) {
        onUpdate('attribute', attributeName, numValue);
      }
    }
  }, [character, onUpdate]);

  const handleAttributeRoll = useCallback((attributeName) => {
    const attribute = localAttributes.find(attr => attr.name === attributeName);
    if (attribute && character) {
      diceRollModal.appear({
        characterId: character.id,
        characterName: character.name,
        skillName: attributeName,
        skillValue: attribute.value
      });
    }
  }, [localAttributes, character, diceRollModal]);

  const validateNumberInput = useCallback((value, min = 0, max = 30) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return min;
    return Math.max(min, Math.min(max, numValue));
  }, []);

  const handleInputChange = useCallback((e, callback, name) => {
    const value = e.target.value;
    if (value === '') {
      callback(name, '');
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue)) callback(name, numValue);
  }, []);

  const handleBlur = useCallback((e, callback, name) => {
    let value = e.target.value;
    const validatedValue = validateNumberInput(value);
    callback(name, validatedValue);
  }, [validateNumberInput]);

  const handleKeyDown = useCallback((e, currentValue, callback, name) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      callback(name, Math.min(30, currentValue + 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      callback(name, Math.max(0, currentValue - 1));
    }
  }, []);

  const canConfirm = useCallback(() => {
    if (selectedMethod?.id === 'FIXOS') {
      return availableValues.length === 0;
    }
    if (selectedMethod?.id === 'COMPRA') {
      return pontosDisponiveis >= 0;
    }
    return true;
  }, [selectedMethod, availableValues, pontosDisponiveis]);

  return {
    localAttributes,
    showMethodSelection,
    setShowMethodSelection,
    selectedMethod,
    showDistribution,
    setShowDistribution,
    availableValues,
    distributionAttributes,
    pontosDisponiveis,
    isLoading,
    localErrors,
    currentHP,
    currentPE,
    editDialog,
    setEditDialog,
    canvasRef,
    wheelPositions,
    additionalValues,
    diceRollModal,
    handleHealthClick,
    handleSoulClick,
    handleEnergyClick,
    handleSaveEdit,
    handleQuickAction,
    handleMethodSelect,
    assignValueToAttribute,
    removeValueFromAttribute,
    ajustarAtributoCompra,
    confirmDistribution,
    resetDistribution,
    updateAttribute,
    handleAttributeRoll,
    handleInputChange,
    handleBlur,
    handleKeyDown,
    canConfirm
  };
};

const HealthBar = React.memo(({ 
  type, 
  data, 
  current, 
  max, 
  onClick, 
  onQuickAction, 
  classes 
}) => {
  
  const getConfig = () => {
    switch (type) {
      case 'hp':
        return {
          title: 'PONTOS DE VIDA',
          icon: React.createElement(Favorite, { className: classes.healthIcon }),
          color: '#f44336',
          progressClass: classes.healthProgress,
          titleClass: classes.healthTitle,
          cardClass: classes.healthCard
        };
      case 'soul':
        return {
          title: 'INTEGRIDADE DA ALMA',
          icon: React.createElement(SoulIcon, { className: classes.healthIcon }),
          color: '#9c27b0',
          progressClass: classes.soulProgress,
          titleClass: classes.soulTitle,
          cardClass: classes.soulCard
        };
      case 'energy':
        return {
          title: 'ENERGIA AMALDIÇOADA',
          icon: React.createElement(LocalHospital, { className: classes.healthIcon }),
          color: '#2196f3',
          progressClass: classes.energyProgress,
          titleClass: classes.energyTitle,
          cardClass: classes.energyCard
        };
      default:
        return {};
    }
  };

  const config = getConfig();
  const progress = max > 0 ? (current / max) * 100 : 0;

  return React.createElement(Grid, { 
    item: true, 
    xs: 12, 
    md: 4,
    style: { display: 'flex' } // Garante que o Grid item use flex
  },
    React.createElement(Card, { 
      className: config.cardClass, 
      onClick: onClick,
      style: { 
        flex: 1, // Ocupa toda a largura disponível
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '200px' // Altura mínima consistente
      }
    },
      React.createElement(CardContent, { 
        style: { 
          flex: 1, // O conteúdo ocupa todo o espaço
          display: 'flex', 
          flexDirection: 'column',
          padding: '16px'
        }
      },
        // Header
        React.createElement(Box, { 
          className: classes.healthHeader,
          style: { flex: '0 0 auto' } // Não cresce, tamanho fixo
        },
          React.createElement(Typography, { 
            className: config.titleClass,
            style: { fontSize: '0.9rem' } // Tamanho consistente
          },
            config.icon,
            config.title
          ),
          React.createElement(IconButton, { 
            size: "small",
            style: { flex: '0 0 auto' }
          },
            React.createElement(Edit)
          )
        ),

        // Progress Section
        React.createElement(Box, { 
          className: classes.progressContainer,
          style: { 
            flex: '0 0 auto',
            margin: '16px 0'
          }
        },
          React.createElement(Box, { className: classes.progressLabel },
            React.createElement(Typography, { 
              className: classes.progressText,
              style: { fontSize: '0.8rem' }
            },
              `${current} / ${max}`
            ),
            React.createElement(Typography, { 
              className: classes.progressValue, 
              style: { 
                color: config.color,
                fontSize: '0.9rem'
              }
            },
              `${Math.round(progress)}%`
            )
          ),
          React.createElement(LinearProgress, {
            variant: "determinate",
            value: progress,
            className: config.progressClass,
            style: { height: '12px' }
          })
        ),

        // Details Section
        React.createElement(Box, { 
          className: classes.healthDetails,
          style: { 
            flex: '1', // Ocupa o espaço restante
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }
        },
          React.createElement(Box, { 
            className: classes.detailRow,
            style: { marginBottom: '8px' }
          },
            React.createElement('span', { 
              style: { 
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }
            }, 'Detalhes:'),
            React.createElement('span', { 
              style: { 
                fontSize: '0.75rem',
                textAlign: 'right'
              }
            }, data.descricao)
          ),
          data.dadoVida && React.createElement(Box, { 
            className: classes.detailRow,
            style: { marginBottom: '0' }
          },
            React.createElement('span', { 
              style: { 
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }
            }, 'Dado de Vida:'),
            React.createElement('span', { 
              style: { 
                fontSize: '0.75rem',
                textAlign: 'right'
              }
            }, data.dadoVida)
          )
        ),

        // Quick Actions - CORREÇÃO COMPLETA
type !== 'soul' && React.createElement(Box, { 
  className: classes.quickActions,
  style: { 
    flex: '0 0 auto',
    marginTop: 'auto',
    paddingTop: '12px'
  }
},
  React.createElement(Button, {
    size: "small",
    variant: "outlined",
    onClick: (e) => {
      e.stopPropagation();
      if (type === 'energy') {
        onQuickAction('energy', 1); // Adiciona energia
      } else {
        onQuickAction('heal', 1); // Cura PV
      }
    },
    className: classes.quickButton,
    style: { minWidth: '60px' }
  }, '+1'),
  React.createElement(Button, {
    size: "small",
    variant: "outlined",
    onClick: (e) => {
      e.stopPropagation();
      if (type === 'energy') {
        onQuickAction('energy_remove', 1); // Remove energia
      } else {
        onQuickAction('damage', 1); // Dano em PV
      }
    },
    className: classes.quickButton,
    style: { minWidth: '60px' }
  }, '-1')
)
      )
    )
  );
});

const AttributeWheel = React.memo(({ 
  position, 
  attribute, 
  classes, 
  handleInputChange, 
  handleBlur, 
  handleKeyDown, 
  handleAttributeRoll, 
  updateAttribute 
}) => {
  const modifier = calculateModifier(attribute.value);
  
  const getTextPosition = () => {
    switch (position.name) {
      case 'FORÇA':
        return { top: '-45px', left: '50%', transform: 'translateX(-50%)' };
      case 'DESTREZA':
        return { top: '155px', left: '50%', transform: 'translateX(-50%)' };
      case 'CONSTITUIÇÃO':
        return { top: '155px', left: '50%', transform: 'translateX(-50%)' };
      case 'INTELIGÊNCIA':
        return { bottom: '155px', left: '50%', transform: 'translateX(-50%)' };
      case 'SABEDORIA':
        return { bottom: '-45px', left: '50%', transform: 'translateX(-50%)' };
      case 'PRESENÇA':
        return { bottom: '155px', left: '50%', transform: 'translateX(-50%)' };
      default:
        return { top: '-45px', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  const textPosition = getTextPosition();

  return React.createElement(Box, {
    className: classes.wheelPosition,
    style: { 
      left: `${position.x}px`, 
      top: `${position.y}px`,
      position: 'absolute'
    }
  },
    React.createElement(Box, {
      style: {
        position: 'absolute',
        ...textPosition,
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 25,
        width: 'max-content'
      }
    },
      React.createElement(Typography, {
        style: {
          fontSize: '0.75rem',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          whiteSpace: 'nowrap',
          background: 'rgba(106, 27, 154, 0.9)',
          padding: '4px 10px',
          borderRadius: '12px',
          border: '2px solid #4a148c',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          display: 'inline-block'
        }
      }, attribute.name)
    ),

    React.createElement(Card, { className: classes.attributeWheel },
      React.createElement(CardContent, { style: { padding: '8px' } },
        React.createElement(Box, { className: classes.attributeValueContainerWheel },
          React.createElement(TextField, {
            type: "number",
            value: attribute.value,
            onChange: (e) => handleInputChange(e, updateAttribute, attribute.name),
            onBlur: (e) => handleBlur(e, updateAttribute, attribute.name),
            onKeyDown: (e) => handleKeyDown(e, attribute.value, updateAttribute, attribute.name),
            inputProps: { 
              min: 0, 
              max: 30,
              style: { textAlign: 'center' }
            },
            className: classes.attributeInputWheel,
            size: "small"
          }),
          React.createElement(IconButton, {
            className: classes.diceButtonWheel,
            onClick: () => handleAttributeRoll(attribute.name),
            size: "small"
          }, React.createElement(Casino, { fontSize: "small" }))
        ),

        React.createElement(Box, { className: classes.modifierBoxWheel },
          React.createElement(Typography, { className: classes.modifierLabelWheel },
            'MODIFICADOR'
          ),
          React.createElement(Typography, { variant: "h6", style: { fontSize: '0.9rem' } },
            `${modifier >= 0 ? '+' : ''}${modifier}`
          )
        )
      )
    )
  );
});

const EmptyWheel = React.memo(({ position, classes }) => {
  return React.createElement(Box, {
    className: classes.wheelPosition,
    style: { 
      left: `${position.x}px`, 
      top: `${position.y}px` 
    }
  }, React.createElement(Card, { className: classes.emptyWheel }));
});

const AdditionalValueCard = React.memo(({ type, data, classes }) => {
  const getIcon = () => {
    switch (type) {
      case 'ATENÇÃO': return React.createElement(Visibility, { className: classes.additionalValueIcon });
      case 'DEFESA': return React.createElement(Security, { className: classes.additionalValueIcon });
      case 'DESLOCAMENTO': return React.createElement(DirectionsRun, { className: classes.additionalValueIcon });
      case 'INICIATIVA': return React.createElement(Update, { className: classes.additionalValueIcon });
      default: return React.createElement(Visibility, { className: classes.additionalValueIcon });
    }
  };

  return React.createElement(Grid, { item: true, xs: 12, sm: 6, md: 3 },
    React.createElement(Card, { className: classes.additionalValueCard },
      React.createElement(CardContent, null,
        React.createElement(Box, { className: classes.additionalValueHeader },
          getIcon(),
          React.createElement(Typography, { className: classes.additionalValueName },
            type
          )
        ),
        
        React.createElement(Typography, { className: classes.additionalValueDisplay },
          data.valor
        ),
        
        React.createElement(Tooltip, { title: data.descricao, placement: "top" },
          React.createElement(Typography, { className: classes.additionalValueFormula },
            data.formula
          )
        ),
        
        React.createElement(Typography, { className: classes.additionalValueDescription },
          data.descricao
        )
      )
    )
  );
});

const EditDialogModal = React.memo(({ 
  editDialog, 
  setEditDialog, 
  handleSaveEdit, 
  classes 
}) => {
  if (!editDialog.open) return null;

  return React.createElement(Dialog, {
    open: editDialog.open,
    onClose: () => setEditDialog({ open: false, type: '', title: '' }),
    maxWidth: "sm",
    fullWidth: true,
    className: classes.editDialog
  },
    React.createElement(DialogTitle, null,
      React.createElement(Typography, { variant: "h6", fontWeight: "bold" },
        editDialog.title
      ),
      editDialog.description && React.createElement(Typography, { variant: "body2", color: "textSecondary" },
        editDialog.description
      )
    ),
    
    React.createElement(DialogContent, null,
      React.createElement(TextField, {
        label: "Valor Atual",
        type: "number",
        value: editDialog.current,
        onChange: (e) => setEditDialog(prev => ({
          ...prev,
          current: parseInt(e.target.value) || 0
        })),
        className: classes.editField,
        fullWidth: true,
        disabled: editDialog.readOnly,
        inputProps: { 
          min: 0, 
          max: editDialog.max,
          style: { textAlign: 'center' }
        }
      }),
      
      React.createElement(TextField, {
        label: "Valor Máximo",
        type: "number",
        value: editDialog.max,
        onChange: (e) => setEditDialog(prev => ({
          ...prev,
          max: Math.max(1, parseInt(e.target.value) || 1)
        })),
        className: classes.editField,
        fullWidth: true,
        disabled: editDialog.readOnly || editDialog.type === 'soul',
        inputProps: { 
          min: 1,
          style: { textAlign: 'center' }
        }
      })
    ),
    
    React.createElement(DialogActions, null,
      React.createElement(Button, {
        onClick: () => setEditDialog({ open: false, type: '', title: '' }),
        variant: "outlined"
      }, 'Cancelar'),
      React.createElement(Button, {
        onClick: () => handleSaveEdit(editDialog.type, editDialog.current, editDialog.max),
        variant: "contained",
        startIcon: React.createElement(Save),
        disabled: editDialog.readOnly,
        className: classes.setupButton
      }, 'Salvar')
    )
  );
});

const MethodSelectionModal = React.memo(({ 
  showMethodSelection, 
  setShowMethodSelection, 
  selectedMethod, 
  handleMethodSelect, 
  classes 
}) => {
  if (!showMethodSelection) return null;

  return React.createElement(Dialog, {
    open: showMethodSelection,
    onClose: () => setShowMethodSelection(false),
    maxWidth: "md",
    fullWidth: true,
    className: classes.methodSelectionModal,
    sx: {
      zIndex: 9998,
      '& .MuiBackdrop-root': {
        zIndex: 9997
      }
    }
  },
    React.createElement(DialogTitle, { sx: { textAlign: 'center' } },
      React.createElement(Typography, { variant: "h4", component: "div", fontWeight: "bold", color: "#6a1b9a" },
        'MODO DE CRIAÇÃO'
      ),
      React.createElement(Typography, { variant: "subtitle1", component: "div", color: "textSecondary" },
        'Escolha como criar seus atributos'
      )
    ),
    
    React.createElement(DialogContent, null,
      React.createElement(Alert, { severity: "info", sx: { mb: 3 } },
        React.createElement('strong', null, 'Converse com seu Mestre!'),
        ' Todos os jogadores do grupo devem usar o mesmo método para manter o equilíbrio.'
      ),

      React.createElement(Grid, { container: true, spacing: 3, className: classes.methodGrid },
        Object.values(METODOS_CRIACAO).map((method) =>
          React.createElement(Grid, { item: true, xs: 12, md: 4, key: method.id },
            React.createElement(Card, {
              className: `${classes.methodCard} ${selectedMethod?.id === method.id ? 'selected' : ''}`,
              onClick: () => handleMethodSelect(method)
            },
              React.createElement(Box, { className: classes.methodIcon },
                method.icone
              ),
              
              React.createElement(Box, {
                className: classes.methodBadge,
                style: { backgroundColor: method.badgeColor, color: 'white' }
              }, method.badge),
              
              React.createElement(Typography, { className: classes.methodTitle },
                method.nome
              ),
              
              React.createElement(Typography, { className: classes.methodDescription },
                method.descricao
              ),
              
              React.createElement(Typography, { variant: "body2", color: "textSecondary" },
                method.detalhes
              )
            )
          )
        )
      )
    )
  );
});

const DistributionModal = React.memo(({
  showDistribution,
  setShowDistribution,
  selectedMethod,
  availableValues,
  distributionAttributes,
  pontosDisponiveis,
  isLoading,
  localErrors,
  character,
  diceRollModal,
  assignValueToAttribute,
  ajustarAtributoCompra,
  confirmDistribution,
  resetDistribution,
  canConfirm,
  classes
}) => {
  if (!showDistribution) return null;

  const renderMethodContent = () => {
    switch (selectedMethod?.id) {
      case 'FIXOS':
        return React.createElement(React.Fragment, null,
          React.createElement(Alert, { severity: "info", sx: { mb: 3 } },
            React.createElement('strong', null, 'Método Valores Fixos:'),
            ' Distribua os 6 valores entre os atributos. Todos os jogadores começam com a mesma pontuação total.'
          ),

          React.createElement(Box, { sx: { mb: 3 } },
            React.createElement(Typography, { variant: "h6", gutterBottom: true },
              'Valores Disponíveis:'
            ),
            React.createElement(Box, { className: classes.availableValues },
              availableValues.map((value, index) =>
                React.createElement(Box, {
                  key: index,
                  className: classes.valueChip,
                  onClick: () => {
                    const emptyAttributeIndex = distributionAttributes.findIndex(
                      attr => attr.assignedValue === null
                    );
                    if (emptyAttributeIndex !== -1) {
                      assignValueToAttribute(emptyAttributeIndex, value);
                    }
                  }
                }, value)
              )
            )
          )
        );

      case 'ROLAGEM':
        return React.createElement(Alert, { severity: "warning", sx: { mb: 3 } },
          React.createElement('strong', null, 'Método Rolagem:'),
          ' A sorte decide! Role 4d6 para cada atributo (descarte o menor). Personagens únicos mas podem ser desbalanceados.'
        );

      case 'COMPRA':
        return React.createElement(React.Fragment, null,
          React.createElement(Alert, { severity: "info", sx: { mb: 3 } },
            React.createElement('strong', null, 'Método Compra por Pontos:'),
            ' Use 17 pontos para comprar melhorias. Você pode piorar atributos para ganhar mais pontos!'
          ),

          React.createElement(Box, { className: classes.pointsSystem },
            React.createElement(Box, { className: classes.pointsDisplay },
              `Pontos Disponíveis: ${pontosDisponiveis}`
            ),
            
            React.createElement(Typography, { variant: "body2", color: "textSecondary", sx: { mb: 2 } },
              'Tabela de Custos: 8[+2] 9[+1] 10[0] 11[2] 12[3] 13[4] 14[5] 15[7]'
            )
          )
        );

      default:
        return null;
    }
  };

  const renderAttributeControls = (attribute, index) => {
    if (selectedMethod?.id === 'COMPRA') {
      return React.createElement(Box, { display: "flex", alignItems: "center", gap: 1 },
        React.createElement(IconButton, {
          size: "small",
          onClick: () => ajustarAtributoCompra(index, attribute.value - 1),
          disabled: attribute.value <= 8 || isLoading
        }, React.createElement(Close)),
        
        React.createElement(Typography, {
          fontWeight: "bold",
          minWidth: "30px",
          textAlign: "center",
          color: attribute.value === 10 ? 'text.secondary' : 'primary.main'
        }, attribute.value),
        
        React.createElement(IconButton, {
          size: "small",
          onClick: () => ajustarAtributoCompra(index, attribute.value + 1),
          disabled: attribute.value >= 15 || isLoading
        }, React.createElement(Check))
      );
    }

    return React.createElement(Box, { display: "flex", alignItems: "center", gap: 1 },
      React.createElement(TextField, {
        type: "number",
        value: attribute.value,
        onChange: (e) => {
          const newAttributes = [...distributionAttributes];
          newAttributes[index].value = parseInt(e.target.value) || 0;
          setDistributionAttributes(newAttributes);
        },
        inputProps: { 
          min: 0, 
          max: 30,
          style: { 
            textAlign: 'center',
            width: '60px',
            padding: '4px 8px'
          }
        },
        size: "small",
        variant: "outlined",
        disabled: isLoading
      }),
      React.createElement(IconButton, {
        size: "small",
        onClick: () => {
          if (character && !isLoading) {
            diceRollModal.appear({
              characterId: character.id,
              characterName: character.name,
              skillName: attribute.name,
              skillValue: attribute.value
            });
          }
        },
        className: classes.diceButtonWheel,
        disabled: isLoading
      }, React.createElement(Casino))
    );
  };

  const renderStatusAlerts = () => {
    return React.createElement(React.Fragment, null,
      selectedMethod?.id === 'FIXOS' && availableValues.length === 0 && React.createElement(Alert, { severity: "success", sx: { mt: 2 } },
        'Todos os valores foram distribuídos!'
      ),

      selectedMethod?.id === 'COMPRA' && pontosDisponiveis < 0 && React.createElement(Alert, { severity: "warning", sx: { mt: 2 } },
        `Você está com ${Math.abs(pontosDisponiveis)} pontos negativos! Isso significa que seus atributos estão abaixo da média.`
      )
    );
  };

  return React.createElement(Dialog, {
    open: showDistribution,
    onClose: () => !isLoading && setShowDistribution(false),
    maxWidth: "md",
    className: classes.distributionModal,
    sx: {
      zIndex: 9998,
      '& .MuiBackdrop-root': {
        zIndex: 9997
      }
    }
  },
    isLoading && React.createElement(Box, { className: classes.loadingOverlay },
      React.createElement(CircularProgress)
    ),
    
    React.createElement(DialogTitle, { sx: { textAlign: 'center' } },
      React.createElement(Typography, { variant: "h5", component: "div", fontWeight: "bold" },
        selectedMethod?.nome
      ),
      React.createElement(Typography, { variant: "body2", component: "div", color: "textSecondary" },
        selectedMethod?.descricao
      )
    ),
    
    React.createElement(DialogContent, null,
      renderMethodContent(),

      localErrors.distribution && React.createElement(Alert, { severity: "error", sx: { mb: 2 } },
        localErrors.distribution
      ),

      React.createElement(Box, null,
        React.createElement(Typography, { variant: "h6", gutterBottom: true },
          'Atributos:'
        ),
        distributionAttributes.map((attribute, index) =>
          React.createElement(Box, { key: attribute.name, className: classes.attributeDistribution },
            React.createElement(Box, { flex: 1 },
              React.createElement(Typography, { fontWeight: "bold", gutterBottom: true },
                attribute.name
              ),
              React.createElement(Typography, { variant: "caption", color: "textSecondary" },
                attribute.description
              )
            ),
            
            React.createElement(Box, { display: "flex", alignItems: "center", gap: 2 },
              renderAttributeControls(attribute, index)
            )
          )
        )
      ),

      renderStatusAlerts()
    ),
    
    React.createElement(DialogActions, { sx: { justifyContent: 'space-between', p: 3 } },
      React.createElement(Button, {
        onClick: resetDistribution,
        startIcon: React.createElement(Shuffle),
        variant: "outlined",
        disabled: isLoading
      }, 'Reiniciar'),
      
      React.createElement(Box, { display: "flex", gap: 1 },
        React.createElement(Button, {
          onClick: () => {
            setShowDistribution(false);
            setShowMethodSelection(true);
          },
          variant: "outlined",
          disabled: isLoading
        }, '← Voltar'),
        
        React.createElement(Button, {
          onClick: confirmDistribution,
          variant: "contained",
          startIcon: React.createElement(Check),
          disabled: !canConfirm() || isLoading,
          className: classes.setupButton
        }, isLoading ? 'Salvando...' : 'Confirmar')
      )
    )
  );
});

// Main Component
function FeiticeirosSheet({
  classes,
  character,
  onUpdate,
  loadingStates = {},
  errors = {}
}) {
  const {
    localAttributes,
    showMethodSelection,
    setShowMethodSelection,
    selectedMethod,
    showDistribution,
    setShowDistribution,
    availableValues,
    distributionAttributes,
    pontosDisponiveis,
    isLoading,
    localErrors,
    currentHP,
    currentPE,
    editDialog,
    setEditDialog,
    canvasRef,
    wheelPositions,
    additionalValues,
    diceRollModal,
    handleHealthClick,
    handleSoulClick,
    handleEnergyClick,
    handleSaveEdit,
    handleQuickAction,
    handleMethodSelect,
    assignValueToAttribute,
    ajustarAtributoCompra,
    confirmDistribution,
    resetDistribution,
    updateAttribute,
    handleAttributeRoll,
    handleInputChange,
    handleBlur,
    handleKeyDown,
    canConfirm
  } = useFeiticeirosSheet(character, onUpdate);

  return React.createElement(Box, { className: classes.container },
    // Modais
    diceRollModal.isOpen && diceRollModal.content,
    
    React.createElement(EditDialogModal, {
      editDialog,
      setEditDialog,
      handleSaveEdit,
      classes
    }),
    
    React.createElement(MethodSelectionModal, {
      showMethodSelection,
      setShowMethodSelection,
      selectedMethod,
      handleMethodSelect,
      classes
    }),
    
    React.createElement(DistributionModal, {
      showDistribution,
      setShowDistribution,
      selectedMethod,
      availableValues,
      distributionAttributes,
      pontosDisponiveis,
      isLoading,
      localErrors,
      character,
      diceRollModal,
      assignValueToAttribute,
      ajustarAtributoCompra,
      confirmDistribution,
      resetDistribution,
      canConfirm,
      classes
    }),
    
    // Header
    React.createElement(Paper, { className: classes.header },
      React.createElement(Typography, { variant: "h4", fontWeight: "bold" },
        'FEITICEIROS & MALDIÇÕES'
      ),
      React.createElement(Typography, { variant: "subtitle1" },
        'Sistema baseado no universo de Jujutsu Kaisen'
      ),
      React.createElement(Button, {
        className: classes.setupButton,
        startIcon: React.createElement(Shuffle),
        onClick: () => setShowMethodSelection(true)
      }, 'Escolher Método de Criação')
    ),

    // Seção de Vida e Energia
    React.createElement(Box, { className: classes.healthSection },
      React.createElement(Typography, { className: classes.sectionTitle },
        'VIDA E ENERGIA'
      ),
      React.createElement(Grid, { 
        container: true, 
        spacing: 2, 
        className: classes.healthGrid,
        style: { alignItems: 'stretch' }
      },
        React.createElement(HealthBar, {
          type: "hp",
          data: additionalValues.PONTOS_VIDA,
          current: currentHP,
          max: additionalValues.PONTOS_VIDA.max,
          onClick: handleHealthClick,
          onQuickAction: handleQuickAction,
          classes
        }),
        React.createElement(HealthBar, {
          type: "soul",
          data: additionalValues.INTEGRIDADE_ALMA,
          current: additionalValues.INTEGRIDADE_ALMA.valor,
          max: additionalValues.INTEGRIDADE_ALMA.valor,
          onClick: handleSoulClick,
          onQuickAction: handleQuickAction,
          classes
        }),
        React.createElement(HealthBar, {
          type: "energy",
          data: additionalValues.PONTOS_ENERGIA,
          current: currentPE,
          max: additionalValues.PONTOS_ENERGIA.max,
          onClick: handleEnergyClick,
          onQuickAction: handleQuickAction,
          classes
        })
      )
    ),

    // Layout Mahoraga
    React.createElement(Box, { className: classes.mahoragaLayout },
      React.createElement('canvas', {
        ref: canvasRef,
        width: 1000,
        height: 700,
        className: classes.wheelCanvas
      }),
      wheelPositions.map((position, index) => {
        if (position.type === 'attribute') {
          const attribute = localAttributes.find(attr => attr.name === position.name);
          if (attribute) {
            return React.createElement(AttributeWheel, {
              key: position.name,
              position: position,
              attribute: attribute,
              classes,
              handleInputChange,
              handleBlur,
              handleKeyDown,
              handleAttributeRoll,
              updateAttribute
            });
          }
        } else {
          return React.createElement(EmptyWheel, {
            key: `empty-${index}`,
            position: position,
            classes
          });
        }
        return null;
      })
    ),

    // Valores Adicionais
    React.createElement(Box, { className: classes.additionalValuesSection },
      React.createElement(Typography, { className: classes.sectionTitle },
        'VALORES ADICIONAIS'
      ),
      React.createElement(Typography, { 
        variant: "body2", 
        color: "textSecondary", 
        textAlign: "center", 
        mb: 2 
      },
        'Valores calculados automaticamente baseados nos atributos e nível do personagem'
      ),
      React.createElement(Grid, { 
        container: true, 
        spacing: 2, 
        className: classes.additionalValuesGrid 
      },
        Object.entries(additionalValues).map(([type, data]) => (
          type !== 'PONTOS_VIDA' && 
          type !== 'INTEGRIDADE_ALMA' && 
          type !== 'PONTOS_ENERGIA' &&
          React.createElement(AdditionalValueCard, {
            key: type,
            type: type,
            data: data,
            classes
          })
        ))
      )
    ),

    // Botão de Rolagem
    React.createElement(Box, { className: classes.rollButtonContainer },
      React.createElement(Button, {
        variant: "contained",
        size: "large",
        onClick: () => {
          if (character) {
            diceRollModal.appear({
              characterId: character.id,
              characterName: character.name
            });
          }
        },
        startIcon: React.createElement(Casino),
        className: classes.setupButton,
        disabled: !character
      }, character ? 'Rolar Dados' : 'Carregando...')
    ),

    // Footer
    React.createElement(Box, { 
      sx: { 
        textAlign: 'center', 
        mt: 4, 
        color: 'text.secondary' 
      } 
    },
      React.createElement(Typography, { variant: "body2" },
        'Sistema em desenvolvimento - Layout das 8 Rodas do Samsara'
      )
    )
  );
}

export default withStyles(styles)(FeiticeirosSheet);