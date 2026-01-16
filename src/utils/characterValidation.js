// Validação robusta de ID do personagem
export const validateCharacterId = (id) => {
  if (!id) return null;
  
  const characterId = Number(id);
  const isValid = !isNaN(characterId) && characterId > 0;
  return isValid ? characterId : null;
};

// Função para serializar dados do personagem de forma segura
export const safeSerializeCharacter = (character) => {
  if (!character) return null;
  
  try {
    return JSON.parse(JSON.stringify(character));
  } catch (error) {
    console.error('Erro ao serializar personagem:', error);
    return null;
  }
};

// Validação de entrada numérica
export const validateNumericInput = (event) => {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (allowedKeys.includes(event.key)) return;
  if (!/[0-9]/.test(event.key)) {
    event.preventDefault();
  }
};
