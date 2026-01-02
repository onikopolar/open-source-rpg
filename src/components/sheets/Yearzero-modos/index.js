// Exportar todos os componentes do Yearzero-modos
// Versão 1.0.2 - Feat: Adicionado RadiationTracker e ConditionsTracker

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

// Importar os objetos de estilos
import { healthStressStyles } from './HealthStressTracker';
import { diamondWebStyles } from './DiamondWeb';
import { equipmentNotepadStyles } from './EquipmentNotepad';
import { radiationStyles } from './RadiationTracker';
import { conditionsStyles } from './ConditionsTracker';

console.log('[Yearzero-modos/index] Versão 1.0.2 - Adicionei RadiationTracker e ConditionsTracker');

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
  conditionsStyles
};