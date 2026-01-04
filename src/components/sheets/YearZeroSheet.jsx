import React, { useState, useEffect, useCallback } from 'react';
import { withStyles } from '@mui/styles';
import { Box } from '@mui/material';

// Importar componentes refatorados
import HealthStressTracker, { healthStressStyles } from './Yearzero-modos/HealthStressTracker';
import DiamondWeb, { diamondWebStyles } from './Yearzero-modos/DiamondWeb';
import { 
  AttributeWithSkills,
  attributeSkillMap,
  getAttributeValue,
  getSkillValue,
  attributeComponentsStyles
} from './Yearzero-modos/AttributeComponents';
import EquipmentNotepad, { equipmentNotepadStyles } from './Yearzero-modos/EquipmentNotepad';
import RadiationTracker, { radiationStyles } from './Yearzero-modos/RadiationTracker';
import ExperienceHistoryTracker, { experienceHistoryStyles } from './Yearzero-modos/ExperienceHistoryTracker';

// Fix: Adicionei os styles do ExperienceHistoryTracker que estavam faltando
console.log('[YearZeroSheet] Versão 2.4.0 - Fix: Importei experienceHistoryStyles e removi wrappers desnecessários');

// Combinar todos os estilos
const mainStyles = (theme) => ({
  container: {
    padding: '20px',
    maxWidth: '1150px',
    margin: '0 auto',
    display: 'flex',
    gap: '25px',
    minHeight: '700px',
    background: 'transparent',
    borderRadius: '8px',
    position: 'relative',
    flexWrap: 'nowrap',
    justifyContent: 'center'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
    width: '320px',
    flexShrink: 0
  },
  centerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
    width: '320px',
    flexShrink: 0
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
    width: '320px',
    flexShrink: 0,
    alignItems: 'stretch'
  },
  attributesContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '6px',
    position: 'relative',
    padding: '10px',
    minHeight: '480px',
  },
  diamondCore: {
    position: 'relative',
    width: '360px',
    height: '270px',
    margin: '0 auto',
    transform: 'scale(0.85)'
  },
  // Importa os estilos dos componentes - AGORA COMPLETO
  ...healthStressStyles(theme),
  ...diamondWebStyles(theme),
  ...attributeComponentsStyles(theme),
  ...equipmentNotepadStyles(theme),
  ...radiationStyles(theme),
  ...experienceHistoryStyles(theme) // ESTAVA FALTANDO ESTE
});

// Helper para converter array em objeto indexado por nome
const arrayToObject = (items, keyField = 'name') => {
  const obj = {};
  items.forEach(item => {
    if (item && item[keyField]) {
      obj[item[keyField]] = { ...item };
    }
  });
  return obj;
};

// Helper para converter objeto em array
const objectToArray = (obj) => {
  return Object.values(obj);
};

// Função para converter valor numérico em array de booleanos
const createSquaresFromValue = (value, max) => {
  const squares = Array(max).fill(false);
  const activeCount = Math.min(value, max);
  for (let i = 0; i < activeCount; i++) {
    squares[i] = true;
  }
  return squares;
};

// Helper para criar estrutura inicial otimizada
const createOptimizedStructure = () => {
  console.log('[YearZeroSheet] Criando estrutura otimizada');
  
  const attributes = {
    'Força': { name: 'Força', year_zero_value: 0 },
    'Agilidade': { name: 'Agilidade', year_zero_value: 0 },
    'Inteligência': { name: 'Inteligência', year_zero_value: 0 },
    'Empatia': { name: 'Empatia', year_zero_value: 0 }
  };
  
  const skills = {
    'COMBATE CORPO A CORPO': { name: 'COMBATE CORPO A CORPO', year_zero_value: 0 },
    'MAQUINÁRIO PESADO': { name: 'MAQUINÁRIO PESADO', year_zero_value: 0 },
    'RESISTÊNCIA': { name: 'RESISTÊNCIA', year_zero_value: 0 },
    'COMBATE À DISTÂNCIA': { name: 'COMBATE À DISTÂNCIA', year_zero_value: 0 },
    'MOBILIDADE': { name: 'MOBILIDADE', year_zero_value: 0 },
    'PILOTAGEM': { name: 'PILOTAGEM', year_zero_value: 0 },
    'OBSERVAÇÃO': { name: 'OBSERVAÇÃO', year_zero_value: 0 },
    'SOBREVIVÊNCIA': { name: 'SOBREVIVÊNCIA', year_zero_value: 0 },
    'TECNOLOGIA': { name: 'TECNOLOGIA', year_zero_value: 0 },
    'MANIPULAÇÃO': { name: 'MANIPULAÇÃO', year_zero_value: 0 },
    'COMANDO': { name: 'COMANDO', year_zero_value: 0 },
    'AJUDA MÉDICA': { name: 'AJUDA MÉDICA', year_zero_value: 0 }
  };
  
  return { attributes, skills };
};

function YearZeroSheet({
  classes,
  character,
  attributes = [],
  skills = [],
  onUpdate,
  onAttributeRoll,
  onSkillRoll
}) {
  // Estrutura otimizada: objetos em vez de arrays
  const [optimizedData, setOptimizedData] = useState(() => createOptimizedStructure());
  const [stressSquares, setStressSquares] = useState(Array(10).fill(false));
  const [healthSquares, setHealthSquares] = useState(Array(10).fill(false));
  const [radiationSquares, setRadiationSquares] = useState(Array(10).fill(false));
  
  // Agora são arrays como o HealthStress
  const [experienceSquares, setExperienceSquares] = useState(Array(10).fill(false));
  const [historySquares, setHistorySquares] = useState(Array(3).fill(false));

  // Estado para controlar se já carregamos os dados iniciais
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Helper para atualizar um único atributo de forma otimizada
  const updateSingleAttribute = useCallback((attributeName, value) => {
    console.log('[YearZeroSheet] updateSingleAttribute:', attributeName, value);
    
    setOptimizedData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attributeName]: {
          ...prev.attributes[attributeName],
          year_zero_value: Math.max(0, Math.min(6, value))
        }
      }
    }));
    
    if (onUpdate) {
      onUpdate('attribute', attributeName, value);
    }
  }, [onUpdate]);

  // Helper para atualizar uma única skill de forma otimizada
  const updateSingleSkill = useCallback((skillName, value) => {
    console.log('[YearZeroSheet] updateSingleSkill:', skillName, value);
    
    setOptimizedData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skillName]: {
          ...prev.skills[skillName],
          year_zero_value: Math.max(0, Math.min(6, value))
        }
      }
    }));
    
    if (onUpdate) {
      onUpdate('skill', skillName, value);
    }
  }, [onUpdate]);

  // Carregar dados iniciais - só roda uma vez
  useEffect(() => {
    if (initialLoadDone) return;
    
    console.log('[YearZeroSheet] Carregando dados iniciais do personagem');
    
    let finalAttributes = { ...createOptimizedStructure().attributes };
    let finalSkills = { ...createOptimizedStructure().skills };
    
    // Carregar atributos do banco se existirem
    if (attributes && attributes.length > 0) {
      console.log('[YearZeroSheet] Convertendo atributos do banco para estrutura otimizada');
      attributes.forEach(attr => {
        if (attr.name && finalAttributes[attr.name]) {
          finalAttributes[attr.name] = {
            ...finalAttributes[attr.name],
            year_zero_value: Math.max(0, Math.min(6, attr.year_zero_value || 0))
          };
        }
      });
    }
    
    // Carregar skills do banco se existirem
    if (skills && skills.length > 0) {
      console.log('[YearZeroSheet] Convertendo skills do banco para estrutura otimizada');
      skills.forEach(skill => {
        if (skill.name && finalSkills[skill.name]) {
          finalSkills[skill.name] = {
            ...finalSkills[skill.name],
            year_zero_value: Math.max(0, Math.min(6, skill.year_zero_value || 0))
          };
        }
      });
    }
    
    setOptimizedData({
      attributes: finalAttributes,
      skills: finalSkills
    });
    
    // Carregar quadrados de stress do banco
    const loadStressSquares = () => {
      if (character?.stress_squares) {
        try {
          let savedStressSquares = character.stress_squares;
          
          if (typeof savedStressSquares === 'string') {
            savedStressSquares = savedStressSquares.replace(/^"+|"+$/g, '');
            savedStressSquares = JSON.parse(savedStressSquares);
          }
          
          if (Array.isArray(savedStressSquares) && savedStressSquares.length === 10) {
            console.log('[YearZeroSheet] Stress squares carregados:', savedStressSquares);
            setStressSquares(savedStressSquares);
            return;
          }
        } catch (error) {
          console.error('[YearZeroSheet] Erro ao carregar stress_squares:', error);
        }
      }
      setStressSquares(Array(10).fill(false));
    };
    
    // Carregar quadrados de vida do banco
    const loadHealthSquares = () => {
      if (character?.health_squares) {
        try {
          let savedHealthSquares = character.health_squares;
          
          if (typeof savedHealthSquares === 'string') {
            savedHealthSquares = savedHealthSquares.replace(/^"+|"+$/g, '');
            savedHealthSquares = JSON.parse(savedHealthSquares);
          }
          
          if (Array.isArray(savedHealthSquares) && savedHealthSquares.length === 10) {
            console.log('[YearZeroSheet] Health squares carregados:', savedHealthSquares);
            setHealthSquares(savedHealthSquares);
            return;
          }
        } catch (error) {
          console.error('[YearZeroSheet] Erro ao carregar health_squares:', error);
        }
      }
      setHealthSquares(Array(10).fill(false));
    };
    
    // Carregar quadrados de radiação do banco
    const loadRadiationSquares = () => {
      if (character?.radiation_squares) {
        try {
          let savedRadiationSquares = character.radiation_squares;
          
          if (typeof savedRadiationSquares === 'string') {
            savedRadiationSquares = savedRadiationSquares.replace(/^"+|"+$/g, '');
            savedRadiationSquares = JSON.parse(savedRadiationSquares);
          }
          
          if (Array.isArray(savedRadiationSquares) && savedRadiationSquares.length === 10) {
            console.log('[YearZeroSheet] Radiation squares carregados:', savedRadiationSquares);
            setRadiationSquares(savedRadiationSquares);
            return;
          }
        } catch (error) {
          console.error('[YearZeroSheet] Erro ao carregar radiation_squares:', error);
        }
      }
      setRadiationSquares(Array(10).fill(false));
    };
    
    // Carregar quadrados de experiência do banco (agora como array)
    const loadExperienceSquares = () => {
      if (character?.experience_points !== undefined) {
        try {
          // Tenta carregar como array primeiro
          if (Array.isArray(character.experience_points) && character.experience_points.length === 10) {
            console.log('[YearZeroSheet] Experience squares carregados como array:', character.experience_points);
            setExperienceSquares(character.experience_points);
            return;
          }
          
          // Se for número, converte para array
          const expValue = parseInt(character.experience_points) || 0;
          console.log('[YearZeroSheet] Experience points carregados como número:', expValue);
          const squares = createSquaresFromValue(expValue, 10);
          setExperienceSquares(squares);
          return;
          
        } catch (error) {
          console.error('[YearZeroSheet] Erro ao carregar experience_points:', error);
        }
      }
      setExperienceSquares(Array(10).fill(false));
    };
    
    // Carregar quadrados de história do banco (agora como array)
    const loadHistorySquares = () => {
      if (character?.history_points !== undefined) {
        try {
          // Tenta carregar como array primeiro
          if (Array.isArray(character.history_points) && character.history_points.length === 3) {
            console.log('[YearZeroSheet] History squares carregados como array:', character.history_points);
            setHistorySquares(character.history_points);
            return;
          }
          
          // Se for número, converte para array
          const histValue = parseInt(character.history_points) || 0;
          console.log('[YearZeroSheet] History points carregados como número:', histValue);
          const squares = createSquaresFromValue(histValue, 3);
          setHistorySquares(squares);
          return;
          
        } catch (error) {
          console.error('[YearZeroSheet] Erro ao carregar history_points:', error);
        }
      }
      setHistorySquares(Array(3).fill(false));
    };
    
    // Executar todos os carregamentos
    loadStressSquares();
    loadHealthSquares();
    loadRadiationSquares();
    loadExperienceSquares();
    loadHistorySquares();
    
    setInitialLoadDone(true);
    console.log('[YearZeroSheet] Carga inicial concluída');
    
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoizar handlers com useCallback para estabilizar referências
  const handleHealthUpdate = useCallback((newHealthSquares) => {
    console.log('[YearZeroSheet] Atualizando health squares:', newHealthSquares);
    setHealthSquares(newHealthSquares);
    if (onUpdate) {
      onUpdate('health_squares', 'health_squares', newHealthSquares);
    }
  }, [onUpdate]);

  const handleStressUpdate = useCallback((newStressSquares) => {
    console.log('[YearZeroSheet] Atualizando stress squares:', newStressSquares);
    setStressSquares(newStressSquares);
    if (onUpdate) {
      onUpdate('stress_squares', 'stress_squares', newStressSquares);
    }
  }, [onUpdate]);

  const handleRadiationUpdate = useCallback((newRadiationSquares) => {
    console.log('[YearZeroSheet] Atualizando radiation squares:', newRadiationSquares);
    setRadiationSquares(newRadiationSquares);
    if (onUpdate) {
      onUpdate('radiation_squares', 'radiation_squares', newRadiationSquares);
    }
  }, [onUpdate]);

  // Agora recebe arrays como o HealthStress
  const handleExperienceUpdate = useCallback((newExperienceSquares) => {
    console.log('[YearZeroSheet] Atualizando experience squares:', newExperienceSquares);
    setExperienceSquares(newExperienceSquares);
    if (onUpdate) {
      // Calcula o valor numérico para salvar no banco também
      const experienceValue = newExperienceSquares.filter(Boolean).length;
      onUpdate('experience_squares', 'experience_squares', newExperienceSquares);
      onUpdate('experience_points', 'experience_points', experienceValue);
    }
  }, [onUpdate]);

  // Agora recebe arrays como o HealthStress
  const handleHistoryUpdate = useCallback((newHistorySquares) => {
    console.log('[YearZeroSheet] Atualizando history squares:', newHistorySquares);
    setHistorySquares(newHistorySquares);
    if (onUpdate) {
      // Calcula o valor numérico para salvar no banco também
      const historyValue = newHistorySquares.filter(Boolean).length;
      onUpdate('history_squares', 'history_squares', newHistorySquares);
      onUpdate('history_points', 'history_points', historyValue);
    }
  }, [onUpdate]);

  const handleEquipmentSave = useCallback(async (type, value) => {
    console.log('[YearZeroSheet] Salvando equipment:', type, value);
    if (onUpdate) {
      await onUpdate(type, type, value);
    }
  }, [onUpdate]);

  const handleAttributeRollWrapper = useCallback((attributeName) => {
    console.log('[YearZeroSheet] Rolando atributo:', attributeName);
    if (onAttributeRoll) {
      const attribute = optimizedData.attributes[attributeName];
      const value = attribute ? attribute.year_zero_value : 0;
      const stressCount = stressSquares.filter(Boolean).length;
      onAttributeRoll(attributeName, value, stressCount, stressSquares);
    }
  }, [optimizedData.attributes, stressSquares, onAttributeRoll]);

  const handleSkillRollWrapper = useCallback((skillName) => {
    console.log('[YearZeroSheet] Rolando skill:', skillName);
    if (onSkillRoll) {
      const skill = optimizedData.skills[skillName];
      const value = skill ? skill.year_zero_value : 0;
      const stressCount = stressSquares.filter(Boolean).length;
      onSkillRoll(skillName, value, stressCount, stressSquares);
    }
  }, [optimizedData.skills, stressSquares, onSkillRoll]);

  // Handler para setLocalAttributes - agora atualiza objeto otimizado
  const handleSetLocalAttributes = useCallback((attributeName, value) => {
    console.log('[YearZeroSheet] handleSetLocalAttributes chamado para:', attributeName);
    updateSingleAttribute(attributeName, value);
  }, [updateSingleAttribute]);

  // Handler para setLocalSkills - agora atualiza objeto otimizado
  const handleSetLocalSkills = useCallback((skillName, value) => {
    console.log('[YearZeroSheet] handleSetLocalSkills chamado para:', skillName);
    updateSingleSkill(skillName, value);
  }, [updateSingleSkill]);

  // Converter objetos otimizados para arrays para compatibilidade com componentes existentes
  const attributesArray = React.useMemo(() => 
    objectToArray(optimizedData.attributes),
    [optimizedData.attributes]
  );

  const skillsArray = React.useMemo(() => 
    objectToArray(optimizedData.skills),
    [optimizedData.skills]
  );

  console.log('[YearZeroSheet] Renderizando layout simplificado');

  return (
    <Box className={classes.container}>
      {/* Coluna esquerda - Apenas Atributos */}
      <Box className={classes.leftColumn}>
        <Box className={classes.attributesContainer}>
          <Box className={classes.diamondCore}>
            <DiamondWeb classes={classes} />
            
            {Object.entries(attributeSkillMap).map(([attributeName, config]) => (
              <AttributeWithSkills
                key={attributeName}
                classes={classes}
                attributeName={attributeName}
                config={config}
                attributes={attributesArray}
                skills={skillsArray}
                onUpdate={onUpdate}
                setLocalAttributes={handleSetLocalAttributes}
                setLocalSkills={handleSetLocalSkills}
                onAttributeRoll={handleAttributeRollWrapper}
                onSkillRoll={handleSkillRollWrapper}
                defaultAttributes={[]}
                defaultSkills={[]}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Coluna central - Espaço vazio para separação */}
      <Box className={classes.centerColumn}>
        {/* Esta coluna fica vazia, serve apenas para criar espaço entre as outras */}
      </Box>

      {/* Coluna direita - HealthStress, Radiation, ExperienceHistory e Equipment empilhados */}
      <Box className={classes.rightColumn}>
        {/* Cada componente já tem seu próprio container com width definido */}
        <HealthStressTracker 
          classes={classes}
          healthSquares={healthSquares}
          stressSquares={stressSquares}
          onHealthUpdate={handleHealthUpdate}
          onStressUpdate={handleStressUpdate}
        />
        
        <RadiationTracker
          classes={classes}
          radiationSquares={radiationSquares}
          onRadiationUpdate={handleRadiationUpdate}
        />
        
        {/* ExperienceHistoryTracker agora tem seus próprios styles importados */}
        <ExperienceHistoryTracker
          classes={classes}
          experienceSquares={experienceSquares}
          historySquares={historySquares}
          onExperienceUpdate={handleExperienceUpdate}
          onHistoryUpdate={handleHistoryUpdate}
        />
        
        <EquipmentNotepad
          classes={classes}
          character={character}
          onSave={handleEquipmentSave}
        />
      </Box>
    </Box>
  );
}

export default withStyles(mainStyles)(YearZeroSheet);