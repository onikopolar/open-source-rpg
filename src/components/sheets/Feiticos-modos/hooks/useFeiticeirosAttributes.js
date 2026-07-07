// hooks/useFeiticeirosAttributes.js — Métodos de criação, distribuição e atributos
import { useCallback, useMemo } from 'react';
import { DEFAULT_ATTRIBUTES, FIXED_VALUES, TABELA_CUSTOS } from '../constants/characterSheet';

export const WHEEL_CONFIG = [
  { angle: 45, name: 'SABEDORIA' },
  { angle: 90, name: 'DESTREZA' },
  { angle: 135, name: 'CONSTITUIÇÃO' },
  { angle: 225, name: 'INTELIGÊNCIA' },
  { angle: 270, name: 'FORÇA' },
  { angle: 315, name: 'PRESENÇA' },
  { angle: 0, type: 'empty' },
  { angle: 180, type: 'empty' }
];

export const useFeiticeirosAttributes = (state, setState, stateRef, character, onUpdate, diceRollModal) => {

  const canConfirm = useCallback(() => {
    const s = stateRef.current;
    if (s.selectedMethod?.id === 'FIXOS') return s.availableValues.length === 0;
    if (s.selectedMethod?.id === 'COMPRA') return s.pontosDisponiveis === 0;
    if (s.selectedMethod?.id === 'ROLAGEM') return s.distributionAttributes.every(a => a.value >= 8 && a.value <= 15);
    return false;
  }, [stateRef]);

  const handleMethodSelect = useCallback((method) => {
    setState(prev => ({
      ...prev,
      selectedMethod: method,
      showMethodSelection: false,
      showDistribution: true
    }));
    if (method.id === 'FIXOS') {
      setState(prev => ({
        ...prev,
        availableValues: [...FIXED_VALUES],
        distributionAttributes: DEFAULT_ATTRIBUTES.map(a => ({ ...a, value: 10, assignedValue: null })),
        pontosDisponiveis: 17
      }));
    } else if (method.id === 'COMPRA') {
      setState(prev => ({
        ...prev,
        pontosDisponiveis: 17,
        distributionAttributes: DEFAULT_ATTRIBUTES.map(a => ({ ...a, value: 10 }))
      }));
    }
  }, [setState]);

  const assignValueToAttribute = useCallback((attributeIndex, value) => {
    setState(prev => {
      const newAttrs = [...prev.distributionAttributes];
      const attr = newAttrs[attributeIndex];
      if (attr.assignedValue !== null) {
        return {
          ...prev,
          availableValues: [...prev.availableValues, attr.assignedValue].sort((a, b) => b - a),
          distributionAttributes: newAttrs.map((a, i) =>
            i === attributeIndex ? { ...a, assignedValue: value, value } : a)
        };
      }
      return {
        ...prev,
        availableValues: prev.availableValues.filter(v => v !== value),
        distributionAttributes: newAttrs.map((a, i) =>
          i === attributeIndex ? { ...a, assignedValue: value, value } : a)
      };
    });
  }, [setState]);

  const removeValueFromAttribute = useCallback((attributeIndex) => {
    setState(prev => {
      const newAttrs = [...prev.distributionAttributes];
      const attr = newAttrs[attributeIndex];
      if (attr.assignedValue !== null) {
        return {
          ...prev,
          availableValues: [...prev.availableValues, attr.assignedValue].sort((a, b) => b - a),
          distributionAttributes: newAttrs.map((a, i) =>
            i === attributeIndex ? { ...a, assignedValue: null, value: 10 } : a)
        };
      }
      return prev;
    });
  }, [setState]);

  const calcularCustoAtributo = useCallback((valorAtual, novoValor) => {
    return (TABELA_CUSTOS[novoValor] || 0) - (TABELA_CUSTOS[valorAtual] || 0);
  }, []);

  const ajustarAtributoCompra = useCallback((attributeIndex, novoValor) => {
    if (novoValor < 8 || novoValor > 15) return;
    setState(prev => {
      const attr = prev.distributionAttributes[attributeIndex];
      const custo = calcularCustoAtributo(attr.value, novoValor);
      if (prev.pontosDisponiveis >= custo) {
        const novos = [...prev.distributionAttributes];
        novos[attributeIndex] = { ...attr, value: novoValor };
        return { ...prev, distributionAttributes: novos, pontosDisponiveis: prev.pontosDisponiveis - custo };
      }
      return prev;
    });
  }, [setState, calcularCustoAtributo]);

  const confirmDistribution = useCallback(async () => {
    const currentState = stateRef.current;
    setState(prev => ({ ...prev, isLoading: true, showDistribution: false }));
    try {
      if (character?.id && currentState.selectedMethod) {
        const response = await fetch('/api/feiticeiros/distribution', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characterId: character.id,
            distributionData: currentState.distributionAttributes,
            metodo: currentState.selectedMethod.id
          })
        });
        const result = await response.json();
        if (result.success) {
          setState(prev => ({
            ...prev, isLoading: false,
            localAttributes: currentState.distributionAttributes,
            showMethodSelection: false,
            localErrors: { ...prev.localErrors, distribution: null }
          }));
          if (onUpdate) {
            onUpdate('character', 'feiticeiros_metodo_criacao', currentState.selectedMethod.id);
            onUpdate('character', 'feiticeiros_distribution_completed', true);
          }
        } else {
          throw new Error(result.error || 'Erro ao salvar');
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev, isLoading: false, showDistribution: true,
        localErrors: { ...prev.localErrors, distribution: 'Erro ao salvar. Tente novamente.' }
      }));
    }
  }, [stateRef, setState, character, onUpdate]);

  const resetDistribution = useCallback(() => {
    setState(prev => {
      if (prev.selectedMethod?.id === 'FIXOS') {
        return { ...prev, availableValues: [...FIXED_VALUES], distributionAttributes: DEFAULT_ATTRIBUTES.map(a => ({ ...a, value: 10, assignedValue: null })) };
      }
      return { ...prev, pontosDisponiveis: 17, distributionAttributes: DEFAULT_ATTRIBUTES.map(a => ({ ...a, value: 10 })) };
    });
    setState(prev => ({ ...prev, localErrors: { ...prev.localErrors, distribution: null } }));
  }, [setState]);

  const updateAttribute = useCallback((attributeName, value) => {
    const numValue = value === "" ? 0 : Math.max(0, Math.min(30, parseInt(value) || 0));
    setState(prev => ({
      ...prev,
      localAttributes: prev.localAttributes.map(a => a.name === attributeName ? { ...a, value: numValue } : a)
    }));
    if (character && onUpdate) {
      onUpdate('attribute', attributeName, { value: numValue });
    }
  }, [setState, character, onUpdate]);

  const handleAttributeRoll = useCallback((attributeName) => {
    const attr = stateRef.current.localAttributes.find(a => a.name === attributeName);
    if (attr && character && diceRollModal) {
      diceRollModal.appear({
        characterId: character.id,
        characterName: character.name,
        skillName: attributeName,
        skillValue: attr.value
      });
    }
  }, [stateRef, character, diceRollModal]);

  const rollAttributeRolagem = useCallback((attributeIndex, total) => {
    setState(prev => {
      const novos = [...prev.distributionAttributes];
      novos[attributeIndex] = { ...novos[attributeIndex], value: total };
      return { ...prev, distributionAttributes: novos };
    });
  }, [setState]);

  const wheelPositions = useMemo(() => {
    const cx = 260, cy = 290, r = 230;
    return WHEEL_CONFIG.map(pos => {
      const rad = pos.angle * Math.PI / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      return pos.name ? { x, y, type: 'attribute', angle: pos.angle, name: pos.name }
        : { x, y, type: 'empty', angle: pos.angle };
    });
  }, []);

  return {
    canConfirm, handleMethodSelect, assignValueToAttribute, removeValueFromAttribute,
    ajustarAtributoCompra, confirmDistribution, resetDistribution,
    updateAttribute, handleAttributeRoll, rollAttributeRolagem, wheelPositions
  };
};
