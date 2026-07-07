// hooks/useFeiticeirosSkills.js — Perícias, ofícios, resistências e ataques
import { useCallback } from 'react';

export const useFeiticeirosSkills = (state, setState, stateRef, character, onUpdate) => {

  const handleToggleTreinada = useCallback((itemNome, checked, tipo, modulo) => {
    setState(prev => ({
      ...prev,
      [modulo]: prev[modulo].map(p => {
        if (p.nome !== itemNome) return p;
        if (tipo === 'treinada') return { ...p, treinada: checked };
        if (tipo === 'mestre') return { ...p, mestre: checked, treinada: checked ? true : p.treinada };
        return p;
      })
    }));
    if (character && onUpdate) {
      const typeMap = { pericias: 'pericia', oficios: 'oficio', resistencias: 'resistencia', ataques: 'ataque' };
      const type = typeMap[modulo];
      if (type) {
        const item = stateRef.current[modulo].find(p => p.nome === itemNome);
        if (item) {
          onUpdate(type, itemNome, {
            treinada: tipo === 'mestre' ? true : checked,
            mestre: tipo === 'mestre' ? checked : item.mestre,
            outros: item.outros || 0
          });
        }
      }
    }
  }, [setState, stateRef, character, onUpdate]);

  const handleOutrosChange = useCallback((itemNome, outros, modulo) => {
    setState(prev => ({
      ...prev,
      [modulo]: prev[modulo].map(p => p.nome === itemNome ? { ...p, outros } : p)
    }));
    if (character && onUpdate) {
      const typeMap = { pericias: 'pericia', oficios: 'oficio', resistencias: 'resistencia', ataques: 'ataque' };
      const type = typeMap[modulo];
      if (type) {
        const item = stateRef.current[modulo].find(p => p.nome === itemNome);
        if (item) {
          onUpdate(type, itemNome, {
            treinada: item.treinada || false,
            mestre: item.mestre || false,
            outros: parseInt(outros) || 0
          });
        }
      }
    }
  }, [setState, stateRef, character, onUpdate]);

  const handlePericiaRoll = useCallback((pericia, total, diceRollModal) => {
    if (character && diceRollModal) {
      diceRollModal.appear({
        characterId: character.id,
        characterName: character.name,
        skillName: pericia.nome,
        skillValue: total,
        initialTimes: parseInt(total) || 1,
        skillDescription: `${pericia.descricao} (${pericia.atributo})`
      });
    }
  }, [character]);

  return { handleToggleTreinada, handleOutrosChange, handlePericiaRoll };
};
