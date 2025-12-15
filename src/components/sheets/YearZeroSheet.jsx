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
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
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

  useEffect(() => {
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
          console.log('[DEBUG] YearZeroSheet - Stress squares carregados do banco:', savedStressSquares);
          setStressSquares(savedStressSquares);
        } else {
          console.log('[DEBUG] YearZeroSheet - Stress squares inválidos, usando padrão');
          setStressSquares(Array(10).fill(false));
        }
      } catch (error) {
        console.error('[ERROR] YearZeroSheet - Erro ao carregar stress_squares:', error, 'Valor:', character.stress_squares);
        setStressSquares(Array(10).fill(false));
      }
    } else {
      console.log('[DEBUG] YearZeroSheet - Nenhum stress_squares encontrado, usando padrão');
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
          console.log('[DEBUG] YearZeroSheet - Health squares carregados do banco:', savedHealthSquares);
          setHealthSquares(savedHealthSquares);
        } else {
          console.log('[DEBUG] YearZeroSheet - Health squares inválidos, usando padrão');
          setHealthSquares(Array(10).fill(false));
        }
      } catch (error) {
        console.error('[ERROR] YearZeroSheet - Erro ao carregar health_squares:', error, 'Valor:', character.health_squares);
        setHealthSquares(Array(10).fill(false));
      }
    } else {
      console.log('[DEBUG] YearZeroSheet - Nenhum health_squares encontrado, usando padrão');
      setHealthSquares(Array(10).fill(false));
    }
  }, [attributes, skills, character]);

  const defaultAttributes = [
    { name: 'Força', year_zero_value: 1 },
    { name: 'Agilidade', year_zero_value: 1 },
    { name: 'Inteligência', year_zero_value: 1 },
    { name: 'Empatia', year_zero_value: 1 }
  ];

  const defaultSkills = [
    { name: 'COMBATE CORPO A CORPO', year_zero_value: 1 },
    { name: 'MAQUINÁRIO PESADO', year_zero_value: 1 },
    { name: 'RESISTÊNCIA', year_zero_value: 1 },
    { name: 'COMBATE À DISTÂNCIA', year_zero_value: 1 },
    { name: 'MOBILIDADE', year_zero_value: 1 },
    { name: 'PILOTAGEM', year_zero_value: 1 },
    { name: 'OBSERVAÇÃO', year_zero_value: 1 },
    { name: 'SOBREVIVÊNCIA', year_zero_value: 1 },
    { name: 'TECNOLOGIA', year_zero_value: 1 },
    { name: 'MANIPULAÇÃO', year_zero_value: 1 },
    { name: 'COMANDO', year_zero_value: 1 },
    { name: 'AJUDA MÉDICA', year_zero_value: 1 }
  ];

  const validatedAttributes = localAttributes.length ? localAttributes : defaultAttributes;
  const validatedSkills = localSkills.length ? localSkills : defaultSkills;

  const getAttributeValue = (attributeName) => {
    const attribute = validatedAttributes.find(a => a.name === attributeName);
    return Math.max(1, Math.min(6, attribute?.year_zero_value || 1));
  };

  const getSkillValue = (skillName) => {
    const skill = validatedSkills.find(s => s.name === skillName);
    return Math.max(1, Math.min(6, skill?.year_zero_value || 1));
  };

  const updateAttribute = (attributeName, value) => {
    const numValue = value === "" ? 1 : Math.max(1, Math.min(6, parseInt(value) || 1));
    setLocalAttributes(prev => prev.map(attr => 
      attr.name === attributeName ? { ...attr, year_zero_value: numValue } : attr
    ));
    if (onUpdate) onUpdate('attribute', attributeName, numValue);
  };

  const updateSkill = (skillName, value) => {
    const numValue = value === "" ? 1 : Math.max(1, Math.min(6, parseInt(value) || 1));
    setLocalSkills(prev => prev.map(skill => 
      skill.name === skillName ? { ...skill, year_zero_value: numValue } : skill
    ));
    if (onUpdate) onUpdate('skill', skillName, numValue);
  };

  const handleHealthUpdate = (newHealthSquares) => {
    console.log('[DEBUG] YearZeroSheet - handleHealthUpdate chamado:', newHealthSquares);
    setHealthSquares(newHealthSquares);
    if (onUpdate) {
      console.log('[DEBUG] YearZeroSheet - Chamando onUpdate com health_squares');
      onUpdate('health_squares', 'health_squares', newHealthSquares);
    }
  };

  const handleStressUpdate = (newStressSquares) => {
    console.log('[DEBUG] YearZeroSheet - handleStressUpdate chamado:', newStressSquares);
    setStressSquares(newStressSquares);
    if (onUpdate) {
      console.log('[DEBUG] YearZeroSheet - Chamando onUpdate com stress_squares');
      onUpdate('stress_squares', 'stress_squares', newStressSquares);
    }
  };

  const handleInputChange = (e, callback, name) => {
    const value = e.target.value;
    if (value === '') {
      callback(name, '');
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue)) callback(name, numValue);
  };

  const handleBlur = (e, callback, name) => {
    let value = e.target.value;
    if (value === '') value = '1';
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) value = '1';
    else if (numValue > 6) value = '6';
    callback(name, value);
  };

  const handleKeyDown = (e, currentValue, callback, name) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      callback(name, Math.min(6, currentValue + 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      callback(name, Math.max(1, currentValue - 1));
    }
  };

  const handleAttributeRoll = (attributeName) => {
    if (onAttributeRoll) {
      const value = getAttributeValue(attributeName);
      const stressCount = stressSquares.filter(Boolean).length;
      onAttributeRoll(attributeName, value, stressCount, stressSquares);
    }
  };

  const handleSkillRoll = (skillName) => {
    if (onSkillRoll) {
      const value = getSkillValue(skillName);
      const stressCount = stressSquares.filter(Boolean).length;
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
        'Força': [classes.skillTopLeft, classes.skillTopCenter, classes.skillTopRight],
        'Agilidade': [classes.skillLeftTop, classes.skillLeftMiddle, classes.skillLeftBottom],
        'Inteligência': [classes.skillRightTop, classes.skillRightMiddle, classes.skillRightBottom],
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
            'Força': { 
              position: classes.positionTop, 
              skills: { 
                0: 'COMBATE CORPO A CORPO', 
                1: 'MAQUINÁRIO PESADO', 
                2: 'RESISTÊNCIA' 
              }
            },
            'Agilidade': { 
              position: classes.positionLeft, 
              skills: { 
                0: 'COMBATE À DISTÂNCIA', 
                1: 'MOBILIDADE', 
                2: 'PILOTAGEM' 
              }
            },
            'Inteligência': { 
              position: classes.positionRight, 
              skills: { 
                0: 'OBSERVAÇÃO', 
                1: 'SOBREVIVÊNCIA', 
                2: 'TECNOLOGIA' 
              }
            },
            'Empatia': { 
              position: classes.positionBottom, 
              skills: { 
                0: 'MANIPULAÇÃO', 
                1: 'COMANDO', 
                2: 'AJUDA MÉDICA' 
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
