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
      isLoading: false // Será injetado
    });
  });

  const changePictureModal = useModal(({ close, custom }) => {
    return React.createElement(ChangePictureModal, {
      handleClose: close,
      characterId: custom.characterId,
      characterName: custom.characterName
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
