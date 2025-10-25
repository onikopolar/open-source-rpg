/**
 * Utilitários para o sistema Year Zero Engine
 * Contém funções específicas para as mecânicas do sistema
 */

/**
 * Calcula o número de dados base baseado no valor do atributo
 * @param {number} attributeValue - Valor do atributo
 * @returns {number} Número de dados base
 */
export const calculateBaseDice = (attributeValue) => {
  const value = parseInt(attributeValue) || 0;
  if (value >= 5) return 2;
  if (value >= 3) return 1;
  return 0;
};

/**
 * Simula uma rolagem no sistema Year Zero
 * @param {number} baseDice - Número de dados base
 * @param {number} skillDice - Número de dados de habilidade
 * @param {number} stress - Nível de estresse atual
 * @param {boolean} push - Se o push está ativado
 * @returns {Object} Resultado da rolagem
 */
export const simulateYearZeroRoll = (baseDice, skillDice, stress = 0, push = false) => {
  const totalDice = baseDice + skillDice;
  const results = [];
  let successes = 0;
  let panes = 0;

  // Rolagem inicial
  for (let i = 0; i < totalDice; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    results.push(roll);
    if (roll === 6) successes++;
    if (roll === 1) panes++;
  }

  // Aplicar efeito do estresse
  if (stress > 0) {
    const stressRolls = Math.min(stress, 3); // Máximo 3 dados de estresse
    for (let i = 0; i < stressRolls; i++) {
      const roll = Math.floor(Math.random() * 6) + 1;
      results.push(roll);
      if (roll === 6) successes++;
      if (roll === 1) panes++;
    }
  }

  return {
    results,
    successes,
    panes,
    totalDice: results.length,
    pushAvailable: push && successes === 0 && panes === 0
  };
};

/**
 * Realiza um push nos dados (rerrolagem)
 * @param {Array} previousResults - Resultados anteriores
 * @param {number} stress - Nível de estresse
 * @returns {Object} Resultado do push
 */
export const performPush = (previousResults, stress) => {
  const newResults = [];
  let additionalSuccesses = 0;
  let additionalPanes = 0;

  // Rerrola apenas dados que não são 6 ou 1
  previousResults.forEach(roll => {
    if (roll !== 6 && roll !== 1) {
      const newRoll = Math.floor(Math.random() * 6) + 1;
      newResults.push(newRoll);
      if (newRoll === 6) additionalSuccesses++;
      if (newRoll === 1) additionalPanes++;
    } else {
      newResults.push(roll);
    }
  });

  // Adiciona dados de estresse no push
  if (stress > 0) {
    const stressRolls = Math.min(stress, 2); // Menos dados no push
    for (let i = 0; i < stressRolls; i++) {
      const roll = Math.floor(Math.random() * 6) + 1;
      newResults.push(roll);
      if (roll === 6) additionalSuccesses++;
      if (roll === 1) additionalPanes++;
    }
  }

  return {
    results: newResults,
    additionalSuccesses,
    additionalPanes,
    totalSuccesses: (previousResults.filter(r => r === 6).length) + additionalSuccesses,
    totalPanes: (previousResults.filter(r => r === 1).length) + additionalPanes
  };
};

/**
 * Determina o nível de trauma baseado no estresse
 * @param {number} stress - Nível de estresse
 * @returns {string} Descrição do trauma
 */

/**
 * Determina o nível de trauma baseado no estresse
 * @param {number} stress - Nível de estresse
 * @returns {string} Descrição do trauma
 */
export const getTraumaLevel = (stress) => {
  if (stress >= 9) return 'Trauma Grave - Personagem incapacitado';
  if (stress >= 7) return 'Trauma Severo - Penalidades severas';
  if (stress >= 5) return 'Trauma Moderado - Penalidades moderadas';
  return 'Normal - Sem efeitos adversos';
};

/**
 * Retorna os efeitos de trauma baseado no nível de estresse
 * @param {number} stress - Nível de estresse
 * @returns {Array} Lista de efeitos do trauma
 */
export const getTraumaEffects = (stress) => {
  if (stress >= 9) return ['Incapacitado totalmente', 'Risco de morte'];
  if (stress >= 7) return ['-2 em todos os testes', 'Incapacitado parcialmente'];
  if (stress >= 5) return ['-1 em todos os testes'];
  return [];
};
