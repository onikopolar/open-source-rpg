// Arquivo: index.js
// Eu exporto todos os componentes do diretório Yearzero-modos
// Versão 1.4.0 - Feat: Adiciono ConditionsConsumablesTracker para gerenciar lesões, condições e consumíveis

import HealthStressTracker from './HealthStressTracker';
import DiamondWeb from './DiamondWeb';
import { 
  AttributeOctagon, 
  SkillComponent, 
  attributeComponentsStyles,
  formatSkillDisplayName 
} from './AttributeComponents';
import EquipmentNotepad from './EquipmentNotepad';
import RadiationTracker from './RadiationTracker';
import ConditionsTracker from './ConditionsTracker';
import ExperienceHistoryTracker from './ExperienceHistoryTracker';
import PersonalMetaTalents from './PersonalMetaTalents';
import ArmasArmadura from './ArmasArmadura';
import ConditionsConsumablesTracker, { 
  SimpleConditionsTracker,
  toggleCondicao,
  atualizarConsumivel,
  atualizarLesao,
  resetarTudo,
  carregarDados,
  obterCondicoes,
  obterConsumiveis,
  obterLesoes,
  temCondicaoAtiva,
  temConsumivelBaixo,
  CONDICOES_INICIAIS,
  CONSUMIVEIS_INICIAIS,
  LESOES_INICIAIS
} from './ConditionsConsumablesTracker';

// Importo os objetos de estilos
import { healthStressStyles } from './HealthStressTracker';
import { diamondWebStyles } from './DiamondWeb';
import { equipmentNotepadStyles } from './EquipmentNotepad';
import { radiationStyles } from './RadiationTracker';
import { conditionsStyles } from './ConditionsTracker';
import { experienceHistoryStyles } from './ExperienceHistoryTracker';
import { personalMetaTalentsStyles } from './PersonalMetaTalents';
import { armasArmaduraStyles } from './ArmasArmadura';

console.log('[Yearzero-modos/index] Versão 1.4.0 - Adicionei ConditionsConsumablesTracker para gerenciamento completo de lesões, condições e consumíveis');

// Exportar todos os componentes e estilos
export {
  // Componentes principais
  HealthStressTracker,
  DiamondWeb,
  AttributeOctagon,
  SkillComponent,
  EquipmentNotepad,
  RadiationTracker,
  ConditionsTracker,
  ExperienceHistoryTracker,
  PersonalMetaTalents,
  ArmasArmadura,
  ConditionsConsumablesTracker,
  SimpleConditionsTracker,
  
  // Objetos de estilos
  healthStressStyles,
  diamondWebStyles,
  attributeComponentsStyles,
  equipmentNotepadStyles,
  radiationStyles,
  conditionsStyles,
  experienceHistoryStyles,
  personalMetaTalentsStyles,
  armasArmaduraStyles,
  
  // Funções utilitárias
  formatSkillDisplayName,
  
  // Métodos do ConditionsConsumablesTracker
  toggleCondicao,
  atualizarConsumivel,
  atualizarLesao,
  resetarTudo,
  carregarDados,
  obterCondicoes,
  obterConsumiveis,
  obterLesoes,
  temCondicaoAtiva,
  temConsumivelBaixo,
  
  // Constantes
  CONDICOES_INICIAIS,
  CONSUMIVEIS_INICIAIS,
  LESOES_INICIAIS
};