// Não podemos usar export * from em páginas Next.js
// Vamos exportar individualmente

// Hooks
export { useCharacterSheet } from './hooks/useCharacterSheet';

// Components
export { CharacterInfoSection } from './components/CharacterInfoSection';
export { RPGSystemSelector } from './components/RPGSystemSelector';

// Systems
export { ClassicSystem } from './systems/ClassicSystem';

// Utils - exportar individualmente
import { validateCharacterId, safeSerializeCharacter, validateNumericInput } from './utils/characterValidation';
export { validateCharacterId, safeSerializeCharacter, validateNumericInput };

// Services - exportar individualmente
import { 
  handleCharacterInfoSubmit,
  handleHitPointsUpdate,
  handleQuickHealthChange,
  handleFeiticeirosUpdate,
  handleAttributeChange,
  handleSkillChange,
  saveAttributeValue,
  saveSkillValue,
  getAttributeValue,
  getSkillValue,
  createHandlers 
} from './services/characterHandlersIndex';

import { 
  handleYearZeroUpdate,
  handleYearZeroPushRoll,
  handleYearZeroAttributeRoll,
  handleYearZeroSkillRoll 
} from './services/yearZeroHandlers';

import { createModals } from './services/modalServices';

export {
  handleCharacterInfoSubmit,
  handleHitPointsUpdate,
  handleQuickHealthChange,
  handleFeiticeirosUpdate,
  handleAttributeChange,
  handleSkillChange,
  saveAttributeValue,
  saveSkillValue,
  getAttributeValue,
  getSkillValue,
  createHandlers,
  handleYearZeroUpdate,
  handleYearZeroPushRoll,
  handleYearZeroAttributeRoll,
  handleYearZeroSkillRoll,
  createModals
};