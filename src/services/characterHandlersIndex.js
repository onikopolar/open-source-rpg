// Não podemos usar export * from em páginas Next.js
// Importar e exportar individualmente

// Importar de characterHandlers
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
  getSkillValue
} from './characterHandlers';

// Importar de yearZeroHandlers  
import { 
  handleYearZeroUpdate,
  handleYearZeroPushRoll,
  handleYearZeroAttributeRoll,
  handleYearZeroSkillRoll 
} from './yearZeroHandlers';

// Exportar tudo individualmente
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
  handleYearZeroUpdate,
  handleYearZeroPushRoll,
  handleYearZeroAttributeRoll,
  handleYearZeroSkillRoll
};

// Funções utilitárias comuns
export const createHandlers = ({
  character,
  setCharacter,
  attributeValues,
  setAttributeValues,
  skillValues,
  setSkillValues,
  yearZeroAttributeValues,
  setYearZeroAttributeValues,
  yearZeroSkillValues,
  setYearZeroSkillValues,
  rpgSystem,
  setLoading,
  clearError,
  handleApiError,
  loadingStates,
  errors
}) => {
  return {
    // Handlers básicos
    handleCharacterInfoSubmit: (values) => 
      handleCharacterInfoSubmit(character, values, setLoading, clearError, handleApiError),
    
    handleHitPointsUpdate: (newData) => 
      handleHitPointsUpdate(character, newData, setLoading, clearError, handleApiError, setCharacter),
    
    handleQuickHealthChange: (amount, type = 'heal') => 
      handleQuickHealthChange(character, amount, type, setLoading, clearError, handleApiError, setCharacter),
    
    handleFeiticeirosUpdate: (type, identifier, data) => 
      handleFeiticeirosUpdate(character, setCharacter, type, identifier, data),
    
    // Handlers de atributos/habilidades
    handleAttributeChange: (attributeId, newValue) => 
      handleAttributeChange(attributeId, newValue, setAttributeValues),
    
    handleSkillChange: (skillId, newValue) => 
      handleSkillChange(skillId, newValue, setSkillValues),
    
    saveAttributeValue: (attributeId) => 
      saveAttributeValue(character, attributeValues, attributeId, setLoading, clearError, handleApiError, setCharacter, rpgSystem),
    
    saveSkillValue: (skillId) => 
      saveSkillValue(character, skillValues, skillId, setLoading, clearError, handleApiError, setCharacter, rpgSystem),
    
    // Funções auxiliares
    getAttributeValue: (charAttr) => getAttributeValue(charAttr, attributeValues),
    getSkillValue: (charSkill) => getSkillValue(charSkill, skillValues),
    
    // Handlers Year Zero
    handleYearZeroUpdate: (type, name, value) => 
      handleYearZeroUpdate(character, rpgSystem, setCharacter, setYearZeroAttributeValues, setYearZeroSkillValues, type, name, value),
    
    handleYearZeroPushRoll: () => 
      handleYearZeroPushRoll(character, (type, name, value) => 
        handleYearZeroUpdate(character, rpgSystem, setCharacter, setYearZeroAttributeValues, setYearZeroSkillValues, type, name, value)
      ),
    
    handleYearZeroAttributeRoll: (attributeName, attributeValue, stressCount, stressSquares) => {
      // Esta função será injetada com yearZeroDiceModal
      return null; // placeholder
    },
    
    handleYearZeroSkillRoll: (skillName, skillValue, stressCount, stressSquares) => {
      // Esta função será injetada com yearZeroDiceModal
      return null; // placeholder
    }
  };
};
