// hooks/useFeiticeirosInfo.js — Character info editing e derived values
import { useCallback, useMemo } from 'react';
import { FIELD_CONFIG } from './useFeiticeirosState';
import { calculateAdditionalValues } from '../utils/characterCalculations';

export const useFeiticeirosInfo = (state, setState, stateRef, character, onUpdate) => {

  const handleCharacterInfoClick = useCallback((field) => {
    const config = FIELD_CONFIG[field] || { display: field, desc: '' };
    setState(prev => ({
      ...prev,
      editDialog: {
        open: true, type: 'characterInfo', title: `Editar ${config.display}`,
        field, current: stateRef.current.characterInfo[field], description: config.desc
      }
    }));
  }, [setState, stateRef]);

  const handleOpenDerivedValuesModal = useCallback(() => {
    setState(prev => ({ ...prev, showDerivedValuesModal: true }));
  }, [setState]);

  const handleCloseDerivedValuesModal = useCallback(() => {
    setState(prev => ({ ...prev, showDerivedValuesModal: false }));
  }, [setState]);

  const handleSaveDerivedValuesBonuses = useCallback(async (newBonuses) => {
    const validated = {
      atencao: parseInt(newBonuses.atencao) || 0,
      defesa: parseInt(newBonuses.defesa) || 0,
      iniciativa: parseInt(newBonuses.iniciativa) || 0,
      deslocamento: parseInt(newBonuses.deslocamento) || 0
    };
    setState(prev => ({ ...prev, derivedValuesBonuses: validated, showDerivedValuesModal: false }));
    if (character?.id) {
      try {
        const response = await fetch('/api/feiticeiros/derived-values', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId: character.id, bonuses: validated })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Erro');
      } catch (error) {
        setState(prev => ({ ...prev, derivedValuesBonuses: stateRef.current.derivedValuesBonuses }));
        throw error;
      }
    }
  }, [setState, stateRef, character]);

  const additionalValues = useMemo(() => {
    return calculateAdditionalValues(
      state.localAttributes, state.characterInfo.nivel,
      state.characterInfo.especializacao, state.pericias
    );
  }, [state.localAttributes, state.characterInfo.nivel, state.characterInfo.especializacao, state.pericias]);

  const derivedValuesWithBonuses = useMemo(() => {
    const base = {
      ATENÇÃO: additionalValues?.ATENÇÃO?.valor || 10,
      DEFESA: additionalValues?.DEFESA?.valor || 10,
      INICIATIVA: additionalValues?.INICIATIVA?.valor || 0,
      DESLOCAMENTO: additionalValues?.DESLOCAMENTO?.valor || 9
    };
    const b = state.derivedValuesBonuses;
    return {
      ATENÇÃO: { ...additionalValues?.ATENÇÃO, valor: base.ATENÇÃO + (b.atencao || 0) },
      DEFESA: { ...additionalValues?.DEFESA, valor: base.DEFESA + (b.defesa || 0) },
      INICIATIVA: { ...additionalValues?.INICIATIVA, valor: base.INICIATIVA + (b.iniciativa || 0) },
      DESLOCAMENTO: { ...additionalValues?.DESLOCAMENTO, valor: base.DESLOCAMENTO + (b.deslocamento || 0) }
    };
  }, [additionalValues, state.derivedValuesBonuses]);

  return {
    handleCharacterInfoClick, handleOpenDerivedValuesModal, handleCloseDerivedValuesModal,
    handleSaveDerivedValuesBonuses, additionalValues, derivedValuesWithBonuses
  };
};
