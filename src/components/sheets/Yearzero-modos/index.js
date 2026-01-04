// Exportar todos os componentes do Yearzero-modos
// Versão 1.2.0 - Feat: Adicionei PersonalMetaTalents para meta pessoal, talentos e relacionamentos

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

// Importar os objetos de estilos
import { healthStressStyles } from './HealthStressTracker';
import { diamondWebStyles } from './DiamondWeb';
import { equipmentNotepadStyles } from './EquipmentNotepad';
import { radiationStyles } from './RadiationTracker';
import { conditionsStyles } from './ConditionsTracker';
import { experienceHistoryStyles } from './ExperienceHistoryTracker';
import { personalMetaTalentsStyles } from './PersonalMetaTalents';

console.log('[Yearzero-modos/index] Versão 1.2.0 - Adicionei PersonalMetaTalents para meta pessoal, talentos e relacionamentos');

export {
  HealthStressTracker,
  healthStressStyles,
  DiamondWeb,
  diamondWebStyles,
  AttributeOctagon,
  SkillComponent,
  attributeComponentsStyles,
  formatSkillDisplayName,
  EquipmentNotepad,
  equipmentNotepadStyles,
  RadiationTracker,
  radiationStyles,
  ConditionsTracker,
  conditionsStyles,
  ExperienceHistoryTracker,
  experienceHistoryStyles,
  PersonalMetaTalents,
  personalMetaTalentsStyles
};