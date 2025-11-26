export const ESPECIALIZACOES_PV = {
  'Lutador': { pv: 12, dadoVida: 'd10' },
  'Especialista em Combate': { pv: 12, dadoVida: 'd10' },
  'Especialista em Técnica': { pv: 10, dadoVida: 'd8' },
  'Controlador': { pv: 10, dadoVida: 'd8' },
  'Suporte': { pv: 10, dadoVida: 'd8' },
  'Restringido': { pv: 16, dadoVida: 'd12' }
};

export const ESPECIALIZACOES_PE = {
  'Lutador': { pe: 4, modAtributo: false },
  'Especialista em Combate': { pe: 4, modAtributo: false },
  'Especialista em Técnica': { pe: 6, modAtributo: true },
  'Controlador': { pe: 5, modAtributo: true },
  'Suporte': { pe: 5, modAtributo: true },
  'Restringido': { pe: 0, modAtributo: false }
};

export const DEFAULT_ATTRIBUTES = [
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

export const PERICIAS = [
  { nome: 'ATLETISMO', atributo: 'FORÇA', descricao: 'Testes de força física, saltos, escaladas, natação', treinada: false, mestre: false, outros: 0 },
  { nome: 'ACROBACIA', atributo: 'DESTREZA', descricao: 'Equilíbrio, cambalhotas, esquivar, movimentos ágeis', treinada: false, mestre: false, outros: 0 },
  { nome: 'FURTIVIDADE', atributo: 'DESTREZA', descricao: 'Movimento silencioso, esconder-se, passar despercebido', treinada: false, mestre: false, outros: 0 },
  { nome: 'PRESTIDIGITAÇÃO', atributo: 'DESTREZA', descricao: 'Truques manuais, pickpocket, atos de destreza manual', treinada: false, mestre: false, outros: 0 },
  { nome: 'DIREÇÃO', atributo: 'SABEDORIA', descricao: 'Navegação, orientação, leitura de mapas', treinada: false, mestre: false, outros: 0 },
  { nome: 'INTUIÇÃO', atributo: 'SABEDORIA', descricao: 'Percepção de intenções, leitura de pessoas', treinada: false, mestre: false, outros: 0 },
  { nome: 'MEDICINA', atributo: 'SABEDORIA', descricao: 'Primeiros socorros, diagnóstico, tratamento de ferimentos', treinada: false, mestre: false, outros: 0 },
  { nome: 'OCULTISMO', atributo: 'SABEDORIA', descricao: 'Conhecimento sobre magia, criaturas sobrenaturais, símbolos', treinada: false, mestre: false, outros: 0 },
  { nome: 'PERCEPÇÃO', atributo: 'SABEDORIA', descricao: 'Percepção sensorial, notar detalhes, escutar sons', treinada: false, mestre: false, outros: 0 },
  { nome: 'SOBREVIVÊNCIA', atributo: 'SABEDORIA', descricao: 'Rastreamento, caça, acampamento, orientação na natureza', treinada: false, mestre: false, outros: 0 },
  { nome: 'FEITIÇARIA', atributo: 'INTELIGÊNCIA', descricao: 'Conhecimento específico sobre feitiços e magias', treinada: false, mestre: false, outros: 0 },
  { nome: 'HISTÓRIA', atributo: 'INTELIGÊNCIA', descricao: 'Conhecimento histórico, lendas, eventos passados', treinada: false, mestre: false, outros: 0 },
  { nome: 'INVESTIGAÇÃO', atributo: 'INTELIGÊNCIA', descricao: 'Análise de cenas, resolução de enigmas, dedução', treinada: false, mestre: false, outros: 0 },
  { nome: 'TECNOLOGIA', atributo: 'INTELIGÊNCIA', descricao: 'Uso de dispositivos tecnológicos, eletrônicos, computadores', treinada: false, mestre: false, outros: 0 },
  { nome: 'TEOLOGIA', atributo: 'INTELIGÊNCIA', descricao: 'Conhecimento sobre religiões, deuses, práticas espirituais', treinada: false, mestre: false, outros: 0 },
  { nome: 'ENGANAÇÃO', atributo: 'PRESENÇA', descricao: 'Mentir, disfarces, blefes, criar histórias convincentes', treinada: false, mestre: false, outros: 0 },
  { nome: 'INTIMIDAÇÃO', atributo: 'PRESENÇA', descricao: 'Amedrontar, coagir, impor respeito através da presença', treinada: false, mestre: false, outros: 0 },
  { nome: 'PERFORMANCE', atributo: 'PRESENÇA', descricao: 'Atuação, canto, dança, apresentações artísticas', treinada: false, mestre: false, outros: 0 },
  { nome: 'PERSUASÃO', atributo: 'PRESENÇA', descricao: 'Convencer, negociar, diplomacia, discursos persuasivos', treinada: false, mestre: false, outros: 0 }
];

export const OFICIOS = [
  { nome: 'CANALIZADOR', atributo: 'INTELIGÊNCIA', descricao: 'Criação e manutenção de canais de energia amaldiçoada', treinada: false, mestre: false, outros: 0 },
  { nome: 'ENTALHADOR', atributo: 'INTELIGÊNCIA', descricao: 'Criação de selos, símbolos e artefatos mágicos', treinada: false, mestre: false, outros: 0 },
  { nome: 'ASTÚCIA', atributo: 'INTELIGÊNCIA', descricao: 'Estratégia, tática, planejamento em combate', treinada: false, mestre: false, outros: 0 }
];

export const RESISTENCIAS = [
  { nome: 'FORTITUDE', atributo: 'CONSTITUIÇÃO', descricao: 'Resistência a efeitos físicos, venenos, doenças', treinada: false, mestre: false, outros: 0 },
  { nome: 'INTEGRIDADE', atributo: 'CONSTITUIÇÃO', descricao: 'Resistência a corrupção, degeneração, decomposição', treinada: false, mestre: false, outros: 0 },
  { nome: 'REFLEXOS', atributo: 'DESTREZA', descricao: 'Esquiva de ataques, explosões, armadilhas', treinada: false, mestre: false, outros: 0 },
  { nome: 'VONTADE', atributo: 'SABEDORIA', descricao: 'Resistência a efeitos mentais, ilusões, controle mental', treinada: false, mestre: false, outros: 0 }
];

export const ATAQUES = [
  { nome: 'CORPO-A-CORPO', atributo: 'FORÇA', descricao: 'Ataques com armas brancas e combate físico', treinada: false, mestre: false, outros: 0 },
  { nome: 'A DISTÂNCIA', atributo: 'DESTREZA', descricao: 'Ataques com armas de arremesso, arcos, bestas', treinada: false, mestre: false, outros: 0 },
  { nome: 'AMALDIÇOADO', atributo: 'INTELIGÊNCIA', descricao: 'Ataques usando energia amaldiçoada e feitiços', treinada: false, mestre: false, outros: 0 }
];

export const FIXED_VALUES = [15, 14, 13, 12, 10, 8];

export const TABELA_CUSTOS = {
  8: -2,
  9: -1,
  10: 0,
  11: 2,
  12: 3,
  13: 4,
  14: 5,
  15: 7
};

export const METODOS_CRIACAO = {
  FIXOS: {
    id: 'FIXOS',
    nome: 'VALORES FIXOS',
    icone: 'Psychology',
    descricao: 'Balanceado e justo para todos os jogadores',
    detalhes: 'Receba 6 valores pré-definidos [15,14,13,12,10,8] e distribua entre os atributos.',
    badge: 'RECOMENDADO',
    badgeColor: '#4caf50'
  },
  ROLAGEM: {
    id: 'ROLAGEM', 
    nome: 'ROLAGEM',
    icone: 'SportsEsports',
    descricao: 'Aventure-se e deixe a sorte decidir seu destino',
    detalhes: 'Role 4d6 para cada atributo (descarte o menor). Personagens únicos e imprevisíveis!',
    badge: 'AVENTUREIRO',
    badgeColor: '#ff9800'
  },
  COMPRA: {
    id: 'COMPRA',
    nome: 'COMPRA POR PONTOS',
    icone: 'ShoppingCart',
    descricao: 'Controle total sobre seu personagem',
    detalhes: 'Comece com 10 em tudo e use 17 pontos pra comprar melhorias seguindo uma tabela de custos.',
    badge: 'EXPERT',
    badgeColor: '#9c27b0'
  }
};