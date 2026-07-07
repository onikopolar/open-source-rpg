// hooks/useFeiticeirosHealth.js — HP, Alma, PE e quick actions
import { useCallback } from 'react';

export const useFeiticeirosHealth = (state, setState, character, onUpdate) => {

  const handleHealthClick = useCallback(() => {
    setState(prev => ({
      ...prev,
      editDialog: { open: true, type: 'hp', title: 'Editar Pontos de Vida', current: prev.currentHP, max: prev.maxHP, description: 'PV atuais e máximos' }
    }));
  }, [setState]);

  const handleSoulClick = useCallback(() => {
    setState(prev => ({
      ...prev,
      editDialog: { open: true, type: 'soul', title: 'Editar Integridade da Alma', current: prev.currentSoul, max: prev.maxHP, description: 'Integridade da Alma atual' }
    }));
  }, [setState]);

  const handleEnergyClick = useCallback(() => {
    setState(prev => ({
      ...prev,
      editDialog: { open: true, type: 'energy', title: 'Editar PE', current: prev.currentPE, max: prev.maxPE, description: 'Pontos de Energia Amaldiçoada' }
    }));
  }, [setState]);

  const handleSaveEdit = useCallback((type, current, max, field) => {
    if (type === 'hp') {
      const nc = Math.max(0, current), nm = Math.max(1, max);
      setState(prev => ({ ...prev, currentHP: nc, maxHP: nm }));
      if (character && onUpdate) { onUpdate('character', 'current_hit_points', nc); onUpdate('character', 'max_hit_points', nm); }
    } else if (type === 'soul') {
      const nc = Math.max(0, current);
      setState(prev => ({ ...prev, currentSoul: nc }));
      if (character && onUpdate) onUpdate('character', 'current_soul_integrity', nc);
    } else if (type === 'energy') {
      const nc = Math.max(0, current), nm = Math.max(1, max);
      setState(prev => ({ ...prev, currentPE: nc, maxPE: nm }));
      if (character && onUpdate) { onUpdate('character', 'current_energy_points', nc); onUpdate('character', 'max_energy_points', nm); }
    } else if (type === 'characterInfo' && field) {
      setState(prev => ({
        ...prev,
        characterInfo: { ...prev.characterInfo, [field]: current }
      }));
      if (character && onUpdate) onUpdate('character', field, current);
    }
    setState(prev => ({ ...prev, editDialog: { open: false, type: '', title: '' } }));
  }, [setState, character, onUpdate]);

  const handleQuickAction = useCallback((type, amount) => {
    setState(prev => {
      const actions = {
        heal: () => [Math.min(prev.maxHP, prev.currentHP + amount), 'current_hit_points', 'currentHP'],
        damage: () => [Math.max(0, prev.currentHP - amount), 'current_hit_points', 'currentHP'],
        soul_heal: () => [Math.min(prev.maxHP, prev.currentSoul + amount), 'current_soul_integrity', 'currentSoul'],
        soul_damage: () => [Math.max(0, prev.currentSoul - amount), 'current_soul_integrity', 'currentSoul'],
        energy: () => [Math.min(prev.maxPE, prev.currentPE + amount), 'current_energy_points', 'currentPE'],
        energy_remove: () => [Math.max(0, prev.currentPE - amount), 'current_energy_points', 'currentPE']
      };
      const [newVal, field, stateKey] = actions[type]?.() || [];
      if (newVal === undefined) return prev;
      if (character && onUpdate) onUpdate('character', field, newVal);
      return { ...prev, [stateKey]: newVal };
    });
  }, [setState, character, onUpdate]);

  return { handleHealthClick, handleSoulClick, handleEnergyClick, handleSaveEdit, handleQuickAction };
};
