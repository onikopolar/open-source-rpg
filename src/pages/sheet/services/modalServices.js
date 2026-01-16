// Arquivo: src/pages/sheet/services/modalServices.js
// Versão: 1.1.0 - ADD: Callback de atualização após upload de imagem
console.log('[modalServices] Versão 1.1.0 - Callback de atualização de imagem implementado');

import React from 'react';
import { DiceRollModal, YearZeroDiceModal, StatusBarModal, ChangePictureModal } from '../../../components';

export const createModals = (useModal, handlers) => {
  const attributeDiceModal = useModal(({ close, custom }) => {
    return React.createElement(DiceRollModal, {
      handleClose: close,
      characterId: custom.characterId,
      characterName: custom.characterName,
      skillName: custom.attributeName,
      skillValue: custom.attributeValue
    });
  });

  const diceRollModal = useModal(({ close, custom }) => {
    return React.createElement(DiceRollModal, {
      handleClose: close,
      characterId: custom.characterId,
      characterName: custom.characterName,
      skillName: custom.skillName,
      skillValue: custom.skillValue
    });
  });

  const statusBarModal = useModal(({ close, custom }) => {
    return React.createElement(StatusBarModal, {
      handleClose: close,
      characterId: custom.characterId,
      characterName: custom.characterName,
      currentHitPoints: custom.currentHitPoints,
      maxHitPoints: custom.maxHitPoints,
      onSubmit: handlers.handleHitPointsUpdate,
      isLoading: false
    });
  });

  const changePictureModal = useModal(({ close, custom }) => {
    console.log('[modalServices] Criando ChangePictureModal com callback:', {
      hasRefreshData: !!custom.refreshData,
      hasOnPictureChange: !!custom.onPictureChange
    });
    
    return React.createElement(ChangePictureModal, {
      handleClose: close,
      character: custom.character,
      onPictureChange: custom.refreshData || custom.onPictureChange || (() => {
        console.warn('[modalServices] Nenhum callback de atualização fornecido');
      })
    });
  });

  const yearZeroDiceModal = useModal(({ close, custom }) => {
    return React.createElement(YearZeroDiceModal, {
      handleClose: close,
      characterId: custom.characterId,
      baseDice: custom.baseDice,
      skillDice: custom.skillDice,
      gearDice: custom.gearDice,
      attributeName: custom.attributeName,
      skillName: custom.skillName,
      character: custom.character,
      stressSquares: custom.stressSquares,
      onPushRoll: handlers.handleYearZeroPushRoll
    });
  });

  return {
    attributeDiceModal,
    diceRollModal,
    statusBarModal,
    changePictureModal,
    yearZeroDiceModal
  };
};