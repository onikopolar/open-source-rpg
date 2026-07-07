// hooks/useFeiticeirosState.js — Estado inicial e sincronização com character
import { useState, useEffect, useRef } from 'react';
import { DEFAULT_ATTRIBUTES, METODOS_CRIACAO, PERICIAS, OFICIOS, RESISTENCIAS, ATAQUES, FIXED_VALUES } from '../constants/characterSheet';

export const FIELD_CONFIG = {
  nivel: { display: 'Nível', desc: 'Nível atual do personagem' },
  origem: { display: 'Origem', desc: 'Origem ou background do personagem' },
  treino: { display: 'Treino', desc: 'Bônus de treinamento' },
  especializacao: { display: 'Especialização', desc: 'Especialização principal' },
  tecnica: { display: 'Técnica', desc: 'Técnica ou escola de feitiçaria' },
  experiencia: { display: 'Experiência (EXP)', desc: 'Pontos de experiência acumulados' },
  multiclasse: { display: 'Multiclasse', desc: 'Classes adicionais' },
  grau: { display: 'Grau', desc: 'Grau de poder do feiticeiro' }
};

export const createDebounce = (wait) => {
  let timeout;
  return (func) => {
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
};

export const parseDerivedBonuses = (bonuses) => {
  if (!bonuses) return { atencao: 0, defesa: 0, iniciativa: 0, deslocamento: 0 };
  if (typeof bonuses === 'string') {
    try {
      const parsed = JSON.parse(bonuses);
      return {
        atencao: parseInt(parsed.atencao) || 0,
        defesa: parseInt(parsed.defesa) || 0,
        iniciativa: parseInt(parsed.iniciativa) || 0,
        deslocamento: parseInt(parsed.deslocamento) || 0
      };
    } catch (e) {
      return { atencao: 0, defesa: 0, iniciativa: 0, deslocamento: 0 };
    }
  }
  return {
    atencao: parseInt(bonuses.atencao) || 0,
    defesa: parseInt(bonuses.defesa) || 0,
    iniciativa: parseInt(bonuses.iniciativa) || 0,
    deslocamento: parseInt(bonuses.deslocamento) || 0
  };
};

const buildInitialState = (character) => {
  const hasFeiticeirosAttributes = character?.feiticeiros_attributes?.length > 0;
  const hasMetodoCriacao = character?.feiticeiros_metodo_criacao;

  return {
    showMethodSelection: !hasMetodoCriacao && !hasFeiticeirosAttributes,
    selectedMethod: hasMetodoCriacao ? METODOS_CRIACAO[hasMetodoCriacao] : null,
    showDistribution: false,
    editDialog: { open: false, type: '', title: '' },
    isLoading: false,
    localErrors: {},
    showDerivedValuesModal: false,
    derivedValuesBonuses: parseDerivedBonuses(character?.derived_values_bonuses),

    localAttributes: hasFeiticeirosAttributes
      ? DEFAULT_ATTRIBUTES.map(defaultAttr => {
          const charAttr = character.feiticeiros_attributes.find(
            attr => attr.attribute?.name === defaultAttr.name
          );
          return { ...defaultAttr, value: charAttr?.value || defaultAttr.value };
        })
      : DEFAULT_ATTRIBUTES,

    availableValues: [...FIXED_VALUES],
    distributionAttributes: DEFAULT_ATTRIBUTES.map(attr => ({
      ...attr, value: 10, assignedValue: null
    })),
    pontosDisponiveis: 17,

    currentHP: character?.current_hit_points || 0,
    currentSoul: character?.current_soul_integrity || 0,
    currentPE: character?.current_energy_points || 0,
    maxHP: character?.max_hit_points || 10,
    maxPE: character?.max_energy_points || 0,

    pericias: character?.feiticeiros_pericias?.length > 0
      ? PERICIAS.map(p => {
          const cp = character.feiticeiros_pericias.find(c => c.nome === p.nome);
          return cp ? { ...p, ...cp } : p;
        })
      : [...PERICIAS],

    oficios: character?.feiticeiros_oficios?.length > 0
      ? OFICIOS.map(o => {
          const co = character.feiticeiros_oficios.find(c => c.nome === o.nome);
          return co ? { ...o, ...co } : o;
        })
      : [...OFICIOS],

    resistencias: character?.feiticeiros_resistencias?.length > 0
      ? RESISTENCIAS.map(r => {
          const cr = character.feiticeiros_resistencias.find(c => c.nome === r.nome);
          return cr ? { ...r, ...cr } : r;
        })
      : [...RESISTENCIAS],

    ataques: character?.feiticeiros_ataques?.length > 0
      ? ATAQUES.map(a => {
          const ca = character.feiticeiros_ataques.find(c => c.nome === a.nome);
          return ca ? { ...a, ...ca } : a;
        })
      : [...ATAQUES],

    characterInfo: {
      nivel: character?.level || 1,
      origem: character?.origem || '',
      treino: character?.treino || '',
      especializacao: character?.especializacao || '',
      tecnica: character?.tecnica || '',
      experiencia: character?.experiencia || 0,
      multiclasse: character?.multiclasse || '',
      grau: character?.grau || ''
    }
  };
};

export const useFeiticeirosState = (character) => {
  const [state, setState] = useState(() => buildInitialState(character));
  const stateRef = useRef(state);
  stateRef.current = state; // síncrono — evita leitura de estado antigo no render

  // Sincroniza com o character quando ele muda
  useEffect(() => {
    if (!character?.id) return;
    const hasAttrs = character.feiticeiros_attributes?.length > 0;
    const hasMetodo = character.feiticeiros_metodo_criacao;

    if (hasAttrs) {
      setState(prev => ({
        ...prev,
        localAttributes: DEFAULT_ATTRIBUTES.map(d => {
          const ca = character.feiticeiros_attributes.find(a => a.attribute?.name === d.name);
          return { ...d, value: ca?.value || d.value };
        }),
        showMethodSelection: !hasMetodo && !hasAttrs,
        selectedMethod: hasMetodo ? METODOS_CRIACAO[hasMetodo] : null
      }));
    } else {
      setState(prev => ({ ...prev, showMethodSelection: !hasMetodo }));
    }

    const newInfo = {
      nivel: character.level || 1,
      origem: character.origem || '',
      treino: character.treino || '',
      especializacao: character.especializacao || '',
      tecnica: character.tecnica || '',
      experiencia: character.experiencia || 0,
      multiclasse: character.multiclasse || '',
      grau: character.grau || ''
    };

    setState(prev => ({
      ...prev,
      currentHP: character.current_hit_points || 0,
      currentSoul: character.current_soul_integrity || 0,
      currentPE: character.current_energy_points || 0,
      maxHP: character.max_hit_points || 10,
      maxPE: character.max_energy_points || 0,
      characterInfo: newInfo,
      derivedValuesBonuses: parseDerivedBonuses(character.derived_values_bonuses)
    }));
  }, [character?.id]);

  return { state, setState, stateRef };
};
