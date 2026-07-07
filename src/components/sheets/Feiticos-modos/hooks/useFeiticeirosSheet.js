// hooks/useFeiticeirosSheet.js — Hook principal (orquestrador)
// Versão refatorada: hooks separados por responsabilidade
import { useRef, useEffect, useCallback } from 'react';
import { useFeiticeirosState } from './useFeiticeirosState';
import { useFeiticeirosAttributes } from './useFeiticeirosAttributes';
import { useFeiticeirosHealth } from './useFeiticeirosHealth';
import { useFeiticeirosSkills } from './useFeiticeirosSkills';
import { useFeiticeirosInfo } from './useFeiticeirosInfo';
import { validateNumberInput } from '../utils/characterCalculations';

export const useFeiticeirosSheet = (character, onUpdate, diceRollModal) => {
  const { state, setState, stateRef } = useFeiticeirosState(character);

  const stableRef = useRef({ character, onUpdate, diceRollModal });
  useEffect(() => { stableRef.current = { character, onUpdate, diceRollModal }; }, [character, onUpdate, diceRollModal]);

  const attrs = useFeiticeirosAttributes(state, setState, stateRef, character, onUpdate, diceRollModal);
  const health = useFeiticeirosHealth(state, setState, character, onUpdate);
  const skills = useFeiticeirosSkills(state, setState, stateRef, character, onUpdate);
  const info = useFeiticeirosInfo(state, setState, stateRef, character, onUpdate);

  const handleInputChange = useCallback((e, callback, name) => {
    const value = e.target.value;
    if (value === '') { callback(name, ''); return; }
    const num = parseInt(value);
    if (!isNaN(num)) callback(name, num);
  }, []);

  const handleBlur = useCallback((e, callback, name) => {
    callback(name, validateNumberInput(e.target.value));
  }, []);

  const handleKeyDown = useCallback((e, currentValue, callback, name) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); callback(name, Math.min(30, currentValue + 1)); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); callback(name, Math.max(0, currentValue - 1)); }
  }, []);

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Desenha as linhas e círculos da roda de atributos (Mahoraga)
  const drawMahoragaWheels = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 1.8;
      ctx.strokeStyle = 'rgba(99, 158, 194, 0.9)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, 120, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = 'rgba(99, 158, 194, 1)';
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'rgba(140, 140, 140, 0.9)';
      ctx.lineWidth = 6;
      const connections = [[1, 4], [7, 6], [0, 3], [2, 5]];
      const wp = attrs.wheelPositions;
      connections.forEach(([a, b]) => {
        if (wp[a] && wp[b]) {
          ctx.beginPath();
          ctx.moveTo(wp[a].x, wp[a].y);
          ctx.lineTo(wp[b].x, wp[b].y);
          ctx.stroke();
        }
      });
    });
  }, [attrs.wheelPositions]);

  useEffect(() => {
    drawMahoragaWheels();
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [drawMahoragaWheels]);

  return {
    ...state, canvasRef,
    wheelPositions: attrs.wheelPositions,
    additionalValues: info.additionalValues,
    derivedValuesWithBonuses: info.derivedValuesWithBonuses,
    setShowMethodSelection: (v) => setState(prev => ({ ...prev, showMethodSelection: v })),
    setShowDistribution: (v) => setState(prev => ({ ...prev, showDistribution: v })),
    setEditDialog: (v) => setState(prev => ({ ...prev, editDialog: v })),
    canConfirm: attrs.canConfirm,
    handleMethodSelect: attrs.handleMethodSelect,
    assignValueToAttribute: attrs.assignValueToAttribute,
    removeValueFromAttribute: attrs.removeValueFromAttribute,
    ajustarAtributoCompra: attrs.ajustarAtributoCompra,
    confirmDistribution: attrs.confirmDistribution,
    resetDistribution: attrs.resetDistribution,
    updateAttribute: attrs.updateAttribute,
    handleAttributeRoll: attrs.handleAttributeRoll,
    rollAttributeRolagem: attrs.rollAttributeRolagem,
    handleHealthClick: health.handleHealthClick,
    handleSoulClick: health.handleSoulClick,
    handleEnergyClick: health.handleEnergyClick,
    handleSaveEdit: health.handleSaveEdit,
    handleQuickAction: health.handleQuickAction,
    handleToggleTreinada: skills.handleToggleTreinada,
    handleOutrosChange: skills.handleOutrosChange,
    handlePericiaRoll: (pericia, total) => skills.handlePericiaRoll(pericia, total, diceRollModal),
    handleCharacterInfoClick: info.handleCharacterInfoClick,
    handleOpenDerivedValuesModal: info.handleOpenDerivedValuesModal,
    handleCloseDerivedValuesModal: info.handleCloseDerivedValuesModal,
    handleSaveDerivedValuesBonuses: info.handleSaveDerivedValuesBonuses,
    handleInputChange, handleBlur, handleKeyDown,
  };
};
