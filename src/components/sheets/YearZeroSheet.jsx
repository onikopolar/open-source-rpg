import React, { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import { Box } from '@mui/material';

// Importar componentes refatorados
import HealthStressTracker, { healthStressStyles } from './Yearzero-modos/HealthStressTracker';
import DiamondWeb, { diamondWebStyles } from './Yearzero-modos/DiamondWeb';
import { 
  AttributeOctagon, 
  SkillComponent, 
  attributeComponentsStyles,
  formatSkillDisplayName 
} from './Yearzero-modos/AttributeComponents';

// Combinar todos os estilos
const mainStyles = (theme) => ({
  container: {
    padding: '20px',
    maxWidth: '950px',
    margin: '0 auto',
    display: 'flex',
    gap: '20px',
    minHeight: '600px',
    background: 'transparent',
    borderRadius: '8px',
    position: 'relative'
  },
  attributesContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '6px',
    position: 'relative',
    padding: '10px',
    minHeight: '500px',
    backdropFilter: 'blur(10px)'
  },
  diamondCore: {
    position: 'relative',
    width: '300px',
    height: '300px',
    margin: '0 auto'
  },
  // Incorporar estilos dos componentes
  ...healthStressStyles(theme),
  ...diamondWebStyles(theme),
  ...attributeComponentsStyles(theme)
});

function YearZeroSheet({
  classes,
  character,
  attributes = [],
  skills = [],
  onUpdate,
  onAttributeRoll,
  onSkillRoll
}) {
  const [localAttributes, setLocalAttributes] = useState([]);
  const [localSkills, setLocalSkills] = useState([]);
  const [stressSquares, setStressSquares] = useState(Array(10).fill(false));
  const [healthSquares, setHealthSquares] = useState(Array(10).fill(false));

  // Log de versao
  console.log('[YearZeroSheet] Inicializando componente')
  console.log('[YearZeroSheet] Versao 1.0.2 - Fix: Suporte completo para valor 0 em ambos os modos')

  useEffect(() => {
    console.log('[YearZeroSheet] useEffect - Carregando dados do personagem')
    
    setLocalAttributes(attributes);
    setLocalSkills(skills);
    
    // Carregar quadrados do banco se existirem
    if (character?.stress_squares) {
      try {
        let savedStressSquares = character.stress_squares;
        
        if (typeof savedStressSquares === 'string') {
          savedStressSquares = savedStressSquares.replace(/^"+|"+$/g, '');
          savedStressSquares = JSON.parse(savedStressSquares);
        }
        
        if (Array.isArray(savedStressSquares) && savedStressSquares.length === 10) {
          console.log('[YearZeroSheet] Stress squares carregados do banco:', savedStressSquares);
          setStressSquares(savedStressSquares);
        } else {
          console.log('[YearZeroSheet] Stress squares invalidos, usando padrao');
          setStressSquares(Array(10).fill(false));
        }
      } catch (error) {
        console.error('[YearZeroSheet] Erro ao carregar stress_squares:', error, 'Valor:', character.stress_squares);
        setStressSquares(Array(10).fill(false));
      }
    } else {
      console.log('[YearZeroSheet] Nenhum stress_squares encontrado, usando padrao');
      setStressSquares(Array(10).fill(false));
    }
    
    if (character?.health_squares) {
      try {
        let savedHealthSquares = character.health_squares;
        
        if (typeof savedHealthSquares === 'string') {
          savedHealthSquares = savedHealthSquares.replace(/^"+|"+$/g, '');
          savedHealthSquares = JSON.parse(savedHealthSquares);
        }
        
        if (Array.isArray(savedHealthSquares) && savedHealthSquares.length === 10) {
          console.log('[YearZeroSheet] Health squares carregados do banco:', savedHealthSquares);
          setHealthSquares(savedHealthSquares);
        } else {
          console.log('[YearZeroSheet] Health squares invalidos, usando padrao');
          setHealthSquares(Array(10).fill(false));
        }
      } catch (error) {
        console.error('[YearZeroSheet] Erro ao carregar health_squares:', error, 'Valor:', character.health_squares);
        setHealthSquares(Array(10).fill(false));
      }
    } else {
      console.log('[YearZeroSheet] Nenhum health_squares encontrado, usando padrao');
      setHealthSquares(Array(10).fill(false));
    }
  }, [attributes, skills, character]);

  const defaultAttributes = [
    { name: 'Forca', year_zero_value: 0 },
    { name: 'Agilidade', year_zero_value: 0 },
    { name: 'Inteligencia', year_zero_value: 0 },
    { name: 'Empatia', year_zero_value: 0 }
  ];

  const defaultSkills = [
    { name: 'COMBATE CORPO A CORPO', year_zero_value: 0 },
    { name: 'MAQUINARIO PESADO', year_zero_value: 0 },
    { name: 'RESISTENCIA', year_zero_value: 0 },
    { name: 'COMBATE A DISTANCIA', year_zero_value: 0 },
    { name: 'MOBILIDADE', year_zero_value: 0 },
    { name: 'PILOTAGEM', year_zero_value: 0 },
    { name: 'OBSERVACAO', year_zero_value: 0 },
    { name: 'SOBREVIVENCIA', year_zero_value: 0 },
    { name: 'TECNOLOGIA', year_zero_value: 0 },
    { name: 'MANIPULACAO', year_zero_value: 0 },
    { name: 'COMANDO', year_zero_value: 0 },
    { name: 'AJUDA MEDICA', year_zero_value: 0 }
  ];

  const validatedAttributes = localAttributes.length ? localAttributes : defaultAttributes;
  const validatedSkills = localSkills.length ? localSkills : defaultSkills;

  const getAttributeValue = (attributeName) => {
    const attribute = validatedAttributes.find(a => a.name === attributeName);
    const value = attribute?.year_zero_value || 0;
    console.log('[YearZeroSheet] getAttributeValue:', attributeName, '=', value);
    return Math.max(0, Math.min(6, value));
  };

  const getSkillValue = (skillName) => {
    const skill = validatedSkills.find(s => s.name === skillName);
    const value = skill?.year_zero_value || 0;
    console.log('[YearZeroSheet] getSkillValue:', skillName, '=', value);
    return Math.max(0, Math.min(6, value));
  };

  const updateAttribute = (attributeName, value) => {
    console.log('[YearZeroSheet] updateAttribute chamado:', attributeName, 'valor recebido:', value, 'tipo:', typeof value);
    
    let numValue;
    if (value === "" || value === null || value === undefined) {
      numValue = 0;
    } else {
      numValue = parseInt(value);
      if (isNaN(numValue)) numValue = 0;
    }
    
    numValue = Math.max(0, Math.min(6, numValue));
    
    console.log('[YearZeroSheet] updateAttribute - valor final:', numValue);
    
    setLocalAttributes(prev => prev.map(attr => 
      attr.name === attributeName ? { ...attr, year_zero_value: numValue } : attr
    ));
    
    if (onUpdate) {
      console.log('[YearZeroSheet] Chamando onUpdate para atributo:', attributeName, 'valor:', numValue);
      onUpdate('attribute', attributeName, numValue);
    }
  };

  const updateSkill = (skillName, value) => {
    console.log('[YearZeroSheet] updateSkill chamado:', skillName, 'valor recebido:', value, 'tipo:', typeof value);
    
    let numValue;
    if (value === "" || value === null || value === undefined) {
      numValue = 0;
    } else {
      numValue = parseInt(value);
      if (isNaN(numValue)) numValue = 0;
    }
    
    numValue = Math.max(0, Math.min(6, numValue));
    
    console.log('[YearZeroSheet] updateSkill - valor final:', numValue);
    
    setLocalSkills(prev => prev.map(skill => 
      skill.name === skillName ? { ...skill, year_zero_value: numValue } : skill
    ));
    
    if (onUpdate) {
      console.log('[YearZeroSheet] Chamando onUpdate para skill:', skillName, 'valor:', numValue);
      onUpdate('skill', skillName, numValue);
    }
  };

  const handleHealthUpdate = (newHealthSquares) => {
    console.log('[YearZeroSheet] handleHealthUpdate chamado:', newHealthSquares);
    setHealthSquares(newHealthSquares);
    if (onUpdate) {
      console.log('[YearZeroSheet] Chamando onUpdate com health_squares');
      onUpdate('health_squares', 'health_squares', newHealthSquares);
    }
  };

  const handleStressUpdate = (newStressSquares) => {
    console.log('[YearZeroSheet] handleStressUpdate chamado:', newStressSquares);
    setStressSquares(newStressSquares);
    if (onUpdate) {
      console.log('[YearZeroSheet] Chamando onUpdate com stress_squares');
      onUpdate('stress_squares', 'stress_squares', newStressSquares);
    }
  };

  const handleInputChange = (e, callback, name) => {
    const value = e.target.value;
    console.log('[YearZeroSheet] handleInputChange:', name, 'valor digitado:', value);
    
    if (value === '') {
      callback(name, '');
      return;
    }
    
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      callback(name, numValue);
    }
  };

  const handleBlur = (e, callback, name) => {
    let value = e.target.value;
    console.log('[YearZeroSheet] handleBlur:', name, 'valor no blur:', value);
    
    if (value === '') {
      value = '0';
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
      value = '0';
    } else if (numValue > 6) {
      value = '6';
    }
    
    console.log('[YearZeroSheet] handleBlur - valor final:', value);
    callback(name, value);
  };

  const handleKeyDown = (e, currentValue, callback, name) => {
    console.log('[YearZeroSheet] handleKeyDown:', {
      key: e.key,
      currentValue,
      name,
      tipoEvento: e.type
    });
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(6, currentValue + 1);
      console.log('[YearZeroSheet] Seta para cima:', currentValue, '->', newValue);
      callback(name, newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(0, currentValue - 1);
      console.log('[YearZeroSheet] Seta para baixo:', currentValue, '->', newValue);
      callback(name, newValue);
    }
  };

  // NOVO: Funcao para handle de clique nas setinhas
  const handleIncrement = (currentValue, callback, name) => {
    console.log('[YearZeroSheet] handleIncrement (setinha para cima):', name, 'valor atual:', currentValue);
    const newValue = Math.min(6, currentValue + 1);
    console.log('[YearZeroSheet] Novo valor:', newValue);
    callback(name, newValue);
  };

  const handleDecrement = (currentValue, callback, name) => {
    console.log('[YearZeroSheet] handleDecrement (setinha para baixo):', name, 'valor atual:', currentValue);
    const newValue = Math.max(0, currentValue - 1);
    console.log('[YearZeroSheet] Novo valor:', newValue);
    callback(name, newValue);
  };

  const handleAttributeRoll = (attributeName) => {
    if (onAttributeRoll) {
      const value = getAttributeValue(attributeName);
      const stressCount = stressSquares.filter(Boolean).length;
      console.log('[YearZeroSheet] Rolando atributo:', attributeName, 'valor:', value);
      onAttributeRoll(attributeName, value, stressCount, stressSquares);
    }
  };

  const handleSkillRoll = (skillName) => {
    if (onSkillRoll) {
      const value = getSkillValue(skillName);
      const stressCount = stressSquares.filter(Boolean).length;
      console.log('[YearZeroSheet] Rolando skill:', skillName, 'valor:', value);
      onSkillRoll(skillName, value, stressCount, stressSquares);
    }
  };

  const AttributeWithSkills = ({ attributeName, config }) => {
    const currentAttributeValue = getAttributeValue(attributeName);
    const skillValues = Object.values(config.skills).map(skillName => ({
      name: skillName,
      value: getSkillValue(skillName)
    }));

    const getSkillPositions = () => {
      const positionMap = {
        'Forca': [classes.skillTopLeft, classes.skillTopCenter, classes.skillTopRight],
        'Agilidade': [classes.skillLeftTop, classes.skillLeftMiddle, classes.skillLeftBottom],
        'Inteligencia': [classes.skillRightTop, classes.skillRightMiddle, classes.skillRightBottom],
        'Empatia': [classes.skillBottomLeft, classes.skillBottomCenter, classes.skillBottomRight]
      };
      return positionMap[attributeName] || [];
    };

    const skillPositions = getSkillPositions();

    return (
      <>
        <AttributeOctagon
          classes={classes}
          attributeName={attributeName}
          attributeValue={currentAttributeValue}
          positionClass={config.position}
          onInputChange={(e, name) => handleInputChange(e, updateAttribute, name)}
          onBlur={(e, name) => handleBlur(e, updateAttribute, name)}
          onKeyDown={(e, currentValue, name) => handleKeyDown(e, currentValue, updateAttribute, name)}
          onIncrement={(currentValue, name) => handleIncrement(currentValue, updateAttribute, name)}
          onDecrement={(currentValue, name) => handleDecrement(currentValue, updateAttribute, name)}
          onDiceClick={handleAttributeRoll}
        />

        {skillValues.map((skill, index) => (
          <SkillComponent
            key={skill.name}
            classes={classes}
            skillName={skill.name}
            skillValue={skill.value}
            positionClass={skillPositions[index]}
            onInputChange={(e, name) => handleInputChange(e, updateSkill, name)}
            onBlur={(e, name) => handleBlur(e, updateSkill, name)}
            onKeyDown={(e, currentValue, name) => handleKeyDown(e, currentValue, updateSkill, name)}
            onIncrement={(currentValue, name) => handleIncrement(currentValue, updateSkill, name)}
            onDecrement={(currentValue, name) => handleDecrement(currentValue, updateSkill, name)}
            onDiceClick={handleSkillRoll}
          />
        ))}
      </>
    );
  };

  return (
    <Box className={classes.container}>
      <HealthStressTracker 
        classes={classes}
        healthSquares={healthSquares}
        stressSquares={stressSquares}
        onHealthUpdate={handleHealthUpdate}
        onStressUpdate={handleStressUpdate}
      />
      <Box className={classes.attributesContainer}>
        <Box className={classes.diamondCore}>
          <DiamondWeb classes={classes} />
          {Object.entries({
            'Forca': { 
              position: classes.positionTop, 
              skills: { 
                0: 'COMBATE CORPO A CORPO', 
                1: 'MAQUINARIO PESADO', 
                2: 'RESISTENCIA' 
              }
            },
            'Agilidade': { 
              position: classes.positionLeft, 
              skills: { 
                0: 'COMBATE A DISTANCIA', 
                1: 'MOBILIDADE', 
                2: 'PILOTAGEM' 
              }
            },
            'Inteligencia': { 
              position: classes.positionRight, 
              skills: { 
                0: 'OBSERVACAO', 
                1: 'SOBREVIVENCIA', 
                2: 'TECNOLOGIA' 
              }
            },
            'Empatia': { 
              position: classes.positionBottom, 
              skills: { 
                0: 'MANIPULACAO', 
                1: 'COMANDO', 
                2: 'AJUDA MEDICA' 
              }
            }
          }).map(([attributeName, config]) => (
            <AttributeWithSkills
              key={attributeName}
              attributeName={attributeName}
              config={config}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default withStyles(mainStyles)(YearZeroSheet);