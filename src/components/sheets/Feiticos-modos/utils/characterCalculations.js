// utils/characterCalculations.js - VERSÃO 100% COMPATÍVEL COM PDF
import { 
  ESPECIALIZACOES_PV, 
  ESPECIALIZACOES_PE 
} from '../constants/characterSheet';

// TABELA DE MODIFICADORES EXATA DO PDF
export const calculateModifier = (value) => {
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

export const calculateAdditionalValues = (attributes, nivel = 1, especializacao = '', pericias = [], outrosBonus = {}) => {
  const modDestreza = calculateModifier(attributes.find(attr => attr.name === 'DESTREZA')?.value || 10);
  const modSabedoria = calculateModifier(attributes.find(attr => attr.name === 'SABEDORIA')?.value || 10);
  const modConstituicao = calculateModifier(attributes.find(attr => attr.name === 'CONSTITUIÇÃO')?.value || 10);
  const modInteligencia = calculateModifier(attributes.find(attr => attr.name === 'INTELIGÊNCIA')?.value || 10);
  
  // PONTOS DE VIDA - Conforme PDF
  const basePV = ESPECIALIZACOES_PV[especializacao]?.pv || 10;
  const pvMaximo = basePV + modConstituicao;
  
  // PONTOS DE ENERGIA - Conforme PDF
  const basePE = ESPECIALIZACOES_PE[especializacao]?.pe || 0;
  const usaModAtributo = ESPECIALIZACOES_PE[especializacao]?.modAtributo || false;
  const peMaximo = basePE + (usaModAtributo ? modInteligencia : 0);
  
  // CORREÇÃO CRÍTICA: ATENÇÃO usa BÔNUS DA PERÍCIA PERCEPÇÃO, não apenas modificador
  const percepcaoPericia = pericias.find(p => p.nome === 'PERCEPÇÃO');
  const bonusPercepcao = percepcaoPericia ? calcularTotalPericia(percepcaoPericia, attributes) : modSabedoria;
  
  return {
    // ATENÇÃO: 10 + bônus Percepção + outros bônus (CONFORME PDF)
    ATENÇÃO: {
      valor: 10 + bonusPercepcao + (outrosBonus.atencao || 0),
      formula: '10 + Bônus Percepção + Outros Bônus',
      descricao: 'Percepção passiva do ambiente'
    },
    
    // DEFESA: 10 + Mod. Destreza + Metade Nível + Outros Bônus (CONFORME PDF)
    DEFESA: {
      valor: 10 + modDestreza + Math.floor(nivel / 2) + (outrosBonus.defesa || 0),
      formula: '10 + Mod. Destreza + Metade do Nível + Outros Bônus',
      descricao: 'Dificuldade para ser acertado em combate'
    },
    
    // DESLOCAMENTO: 9 + Outros Bônus (CONFORME PDF)
    DESLOCAMENTO: {
      valor: 9 + (outrosBonus.deslocamento || 0),
      formula: '9 + Outros Bônus',
      descricao: 'Distância por ação de movimento (metros)'
    },
    
    // INICIATIVA: Mod. Destreza + Outros Bônus (CONFORME PDF)
    INICIATIVA: {
      valor: modDestreza + (outrosBonus.iniciativa || 0),
      formula: 'Mod. Destreza + Outros Bônus',
      descricao: 'Bônus para ordem de turno no combate'
    },
    
    // PONTOS DE VIDA - Conforme PDF
    PONTOS_VIDA: {
      max: pvMaximo,
      base: basePV,
      modificador: modConstituicao,
      dadoVida: ESPECIALIZACOES_PV[especializacao]?.dadoVida || 'd8',
      descricao: ''
    },
    
    // INTEGRIDADE DA ALMA: Igual ao máximo de PV (CONFORME PDF)
    INTEGRIDADE_ALMA: {
      valor: pvMaximo,
      formula: 'Igual ao máximo de Pontos de Vida',
      descricao: ''
    },
    
    // PONTOS DE ENERGIA - Conforme PDF
    PONTOS_ENERGIA: {
      max: peMaximo,
      base: basePE,
      usaModAtributo: usaModAtributo,
      descricao: ``
    }
  };
};

// PERÍCIAS COM BÔNUS DE TREINAMENTO CORRETOS (PDF)
export const calcularTotalPericia = (pericia, attributes, especializacao = 0) => {
  const atributo = attributes.find(attr => attr.name === pericia.atributo);
  const modAtributo = calculateModifier(atributo?.value || 10);
  
  let bonusTreinamento = 0;
  if (pericia.mestre) {
    bonusTreinamento = 2;  // Mestre: +2 (3ª Etapa do PDF)
  } else if (pericia.treinada) {
    bonusTreinamento = 1;  // Treinado: +1 (1ª Etapa do PDF)
  }
  
  return modAtributo + bonusTreinamento + pericia.outros + especializacao;
};

export const validateNumberInput = (value, min = 0, max = 30) => {
  const numValue = parseInt(value);
  if (isNaN(numValue)) return min;
  return Math.max(min, Math.min(max, numValue));
};