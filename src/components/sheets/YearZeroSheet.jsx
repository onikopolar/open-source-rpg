import React, { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import { Box, Typography, TextField, Paper, IconButton } from '@mui/material';
import { Casino } from '@mui/icons-material';

const fallbackTheme = {
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { paper: '#ffffff', default: '#f5f5f5' },
    text: { primary: '#000000' }
  }
};

const styles = (theme = fallbackTheme) => {
  const safeTheme = {
    palette: {
      primary: { 
        main: theme?.palette?.primary?.main || fallbackTheme.palette.primary.main 
      },
      secondary: { 
        main: theme?.palette?.secondary?.main || fallbackTheme.palette.secondary.main 
      },
      background: { 
        paper: theme?.palette?.background?.paper || fallbackTheme.palette.background.paper,
        default: theme?.palette?.background?.default || fallbackTheme.palette.background.default
      },
      text: { 
        primary: theme?.palette?.text?.primary || fallbackTheme.palette.text.primary 
      }
    }
  };

  return {
    container: {
      padding: '40px 20px',
      maxWidth: '900px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '700px',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)',
      borderRadius: '20px',
      border: '2px solid #ed6c02',
      boxShadow: '0 8px 32px rgba(237, 108, 2, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      position: 'relative'
    },
    diamondGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr 1fr',
      gap: '30px',
      width: '580px',
      height: '580px',
      alignItems: 'center',
      justifyItems: 'center',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        border: '2px solid #ed6c02',
        borderRadius: '15px',
        opacity: 0.2,
        zIndex: 1
      }
    },
    attributeSlot: {
      width: '145px',
      height: '145px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative'
    },
    positionTop: {
      gridColumn: '2',
      gridRow: '1'
    },
    positionLeft: {
      gridColumn: '1',
      gridRow: '2'
    },
    positionRight: {
      gridColumn: '3', 
      gridRow: '2'
    },
    positionBottom: {
      gridColumn: '2',
      gridRow: '3'
    },
    
    attributeCollisionField: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      borderRadius: '50%',
      background: 'transparent',
      border: '1px dashed #ed6c02',
      pointerEvents: 'none',
      zIndex: 5
    },
    
    attributeCore: {
      background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
      color: '#ed6c02',
      padding: '15px',
      borderRadius: '50%',
      textAlign: 'center',
      fontWeight: 'bold',
      width: '90px',
      height: '90px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.9)',
      border: '2px solid #ed6c02',
      position: 'relative',
      zIndex: 10,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 25px rgba(237, 108, 2, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.9)'
      }
    },
    
    attributeContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      width: '100%'
    },
    
    attributeInputRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      justifyContent: 'center'
    },
    
    attributeInput: {
      width: '35px',
      '& .MuiOutlinedInput-root': {
        background: 'rgba(255, 255, 255, 0.9)',
        '& fieldset': {
          borderColor: '#ed6c02',
          borderWidth: '2px'
        },
        '&:hover fieldset': {
          borderColor: '#1976d2',
          boxShadow: '0 0 10px rgba(25, 118, 210, 0.2)'
        }
      },
      '& input': {
        color: '#ed6c02',
        fontWeight: '800',
        fontSize: '0.85rem',
        textAlign: 'center',
        padding: '4px 2px'
      }
    },
    
    attributeDiceButton: {
      padding: '4px',
      minWidth: 'auto',
      color: '#ed6c02',
      '& .MuiSvgIcon-root': {
        fontSize: '20px'
      },
      '&:hover': {
        backgroundColor: 'rgba(237, 108, 2, 0.1)',
        transform: 'scale(1.1)'
      }
    },
    
    attributeName: {
      fontSize: '0.75rem',
      fontWeight: '700',
      color: '#ed6c02',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '4px'
    },
    
    skillOrbit: {
      position: 'absolute',
      background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
      border: '1px solid #1976d2',
      borderRadius: '8px',
      padding: '6px',
      textAlign: 'center',
      width: '75px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 8
    },
    
    skillContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      width: '100%'
    },
    
    skillInputRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      justifyContent: 'center'
    },
    
    skillInput: {
      width: '30px',
      margin: '0 auto',
      '& .MuiOutlinedInput-root': {
        background: 'rgba(255, 255, 255, 0.9)',
        '& fieldset': {
          borderColor: '#1976d2',
          borderWidth: '1px'
        },
        '&:hover fieldset': {
          borderColor: '#1565c0',
          boxShadow: '0 0 8px rgba(21, 101, 192, 0.2)'
        }
      },
      '& input': {
        color: '#1976d2',
        fontWeight: 'bold',
        fontSize: '0.75rem',
        textAlign: 'center',
        padding: '3px 1px'
      }
    },
    
    skillDiceButton: {
      padding: '2px',
      minWidth: 'auto',
      color: '#1976d2',
      '&:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        transform: 'scale(1.1)'
      },
      '& .MuiSvgIcon-root': {
        fontSize: '18px'
      }
    },
    
    skillName: {
      fontWeight: '600',
      fontSize: '0.6rem',
      lineHeight: '1.1',
      color: '#1976d2',
      marginBottom: '2px',
      minHeight: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.3px'
    },
    
    skillCollisionField: {
      position: 'absolute',
      background: 'transparent',
      border: '1px dashed #1976d2',
      borderRadius: '12px',
      pointerEvents: 'none',
      zIndex: 7
    }
  };
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
  console.log('[DEBUG] YearZeroSheet - Componente iniciado com props:', {
    characterId: character?.id,
    characterName: character?.name,
    attributesCount: attributes?.length,
    skillsCount: skills?.length,
    hasOnUpdate: !!onUpdate,
    hasOnAttributeRoll: !!onAttributeRoll,
    hasOnSkillRoll: !!onSkillRoll
  });

  console.log('[DEBUG] YearZeroSheet - Props detalhadas:', {
    attributes: attributes,
    skills: skills,
    characterAttributes: character?.attributes,
    characterSkills: character?.skills
  });

  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [localAttributes, setLocalAttributes] = useState([]);
  const [localSkills, setLocalSkills] = useState([]);

  useEffect(() => {
    console.log('[DEBUG] YearZeroSheet - Inicializando dados locais');
    setLocalAttributes(attributes);
    setLocalSkills(skills);
  }, [attributes, skills]);

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

  const validatedAttributes = Array.isArray(localAttributes) && localAttributes.length > 0 ? localAttributes : defaultAttributes;
  const validatedSkills = Array.isArray(localSkills) && localSkills.length > 0 ? localSkills : defaultSkills;

  console.log('[DEBUG] YearZeroSheet - Dados validados:', {
    validatedAttributesCount: validatedAttributes.length,
    validatedSkillsCount: validatedSkills.length
  });

  const attributeConfig = {
    'Força': {
      position: classes.positionTop,
      collisionSize: '120px',
      skills: {
        top: 'COMBATE CORPO A CORPO',
        left: 'MAQUINÁRIO PESADO', 
        right: 'RESISTÊNCIA'
      },
      skillPositions: {
        top: { top: '-63px', left: '50%', transform: 'translateX(-50%)' },
        left: { top: '50%', left: '-65px', transform: 'translateY(-50%)' },
        right: { top: '50%', right: '-65px', transform: 'translateY(-50%)' }
      }
    },
    'Agilidade': {
      position: classes.positionLeft,
      collisionSize: '120px',
      skills: {
        top: 'COMBATE À DISTÂNCIA',
        left: 'MOBILIDADE',
        bottom: 'PILOTAGEM'
      },
      skillPositions: {
        top: { top: '-60px', left: '50%', transform: 'translateX(-50%)' },
        left: { top: '50%', left: '-65px', transform: 'translateY(-50%)' },
        bottom: { bottom: '-60px', left: '50%', transform: 'translateX(-50%)' }
      }
    },
    'Inteligência': {
      position: classes.positionRight,
      collisionSize: '120px',
      skills: {
        top: 'OBSERVAÇÃO', 
        right: 'SOBREVIVÊNCIA',
        bottom: 'TECNOLOGIA'
      },
      skillPositions: {
        top: { top: '-60px', left: '50%', transform: 'translateX(-50%)' },
        right: { top: '50%', right: '-65px', transform: 'translateY(-50%)' },
        bottom: { bottom: '-60px', left: '50%', transform: 'translateX(-50%)' }
      }
    },
    'Empatia': {
      position: classes.positionBottom,
      collisionSize: '120px',
      skills: {
        left: 'COMANDO',
        right: 'AJUDA MÉDICA', 
        bottom: 'MANIPULAÇÃO'
      },
      skillPositions: {
        left: { top: '50%', left: '-65px', transform: 'translateY(-50%)' },
        right: { top: '50%', right: '-65px', transform: 'translateY(-50%)' },
        bottom: { bottom: '-60px', left: '50%', transform: 'translateX(-50%)' }
      }
    }
  };

  const getAttributeValue = (attributeName) => {
    const attribute = validatedAttributes.find(a => a && a.name === attributeName);
    const value = attribute ? (attribute.year_zero_value || 1) : 1;
    const finalValue = Math.max(1, Math.min(6, value));
    return finalValue;
  };

  const getSkillValue = (skillName) => {
    const skill = validatedSkills.find(s => s && s.name === skillName);
    const value = skill ? (skill.year_zero_value || 1) : 1;
    const finalValue = Math.max(1, Math.min(6, value));
    return finalValue;
  };

  const updateAttribute = async (attributeName, value) => {
    console.log(`[DEBUG] YearZeroSheet updateAttribute - Iniciando atualizacao: ${attributeName} = ${value}`);
    
    const numValue = value === "" ? 1 : Math.max(1, Math.min(6, parseInt(value) || 1));
    
    setLocalAttributes(prev => 
      prev.map(attr => 
        attr.name === attributeName 
          ? { ...attr, year_zero_value: numValue }
          : attr
      )
    );
    
    setLastUpdate(Date.now());
    
    if (onUpdate && typeof onUpdate === 'function') {
      console.log(`[DEBUG] YearZeroSheet updateAttribute - Chamando onUpdate: ${attributeName} = ${numValue}`);
      onUpdate('attribute', attributeName, numValue);
    }
  };

  const updateSkill = async (skillName, value) => {
    console.log(`[DEBUG] YearZeroSheet updateSkill - Iniciando atualizacao: ${skillName} = ${value}`);
    
    const numValue = value === "" ? 1 : Math.max(1, Math.min(6, parseInt(value) || 1));
    
    setLocalSkills(prev => 
      prev.map(skill => 
        skill.name === skillName 
          ? { ...skill, year_zero_value: numValue }
          : skill
      )
    );
    
    setLastUpdate(Date.now());
    
    if (onUpdate && typeof onUpdate === 'function') {
      console.log(`[DEBUG] YearZeroSheet updateSkill - Chamando onUpdate: ${skillName} = ${numValue}`);
      onUpdate('skill', skillName, numValue);
    }
  };

  const handleInputChange = (e, callback, name) => {
    const value = e.target.value;
    
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
    
    if (value === '') {
      value = '1';
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      value = '1';
    } else if (numValue > 6) {
      value = '6';
    }
    
    callback(name, value);
  };

  const handleKeyDown = (e, currentValue, callback, name) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(6, currentValue + 1);
      callback(name, newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(1, currentValue - 1);
      callback(name, newValue);
    }
  };

  const handleAttributeRoll = (attributeName) => {
    if (onAttributeRoll && typeof onAttributeRoll === 'function') {
      const value = getAttributeValue(attributeName);
      onAttributeRoll(attributeName, value);
    }
  };

  const handleSkillRoll = (skillName) => {
    if (onSkillRoll && typeof onSkillRoll === 'function') {
      const value = getSkillValue(skillName);
      onSkillRoll(skillName, value);
    }
  };

  const AttributeWithAuras = ({ attributeName, config }) => {
    const currentAttributeValue = getAttributeValue(attributeName);
    
    return (
      <Box className={`${classes.attributeSlot} ${config.position}`}>
        <div 
          className={classes.attributeCollisionField} 
          style={{ 
            width: config.collisionSize, 
            height: config.collisionSize 
          }} 
        />
        
        {Object.entries(config.skills).map(([position, skillName]) => {
          const currentSkillValue = getSkillValue(skillName);
          
          return (
            <div key={position}>
              <div 
                className={classes.skillCollisionField}
                style={{
                  ...config.skillPositions[position],
                  width: '85px',
                  height: '65px'
                }}
              />
              <Paper 
                className={classes.skillOrbit}
                style={config.skillPositions[position]}
              >
                <Box className={classes.skillContainer}>
                  <Typography className={classes.skillName}>
                    {skillName.replace(/_/g, ' ')}
                  </Typography>
                  <Box className={classes.skillInputRow}>
                    <TextField
                      type="number"
                      value={currentSkillValue}
                      onChange={(e) => {
                        handleInputChange(e, updateSkill, skillName);
                      }}
                      onBlur={(e) => {
                        handleBlur(e, updateSkill, skillName);
                      }}
                      onKeyDown={(e) => {
                        handleKeyDown(e, currentSkillValue, updateSkill, skillName);
                      }}
                      inputProps={{ 
                        min: 1, 
                        max: 6
                      }}
                      className={classes.skillInput}
                      size="small"
                    />
                    <IconButton 
                      className={classes.skillDiceButton}
                      onClick={() => {
                        handleSkillRoll(skillName);
                      }}
                      size="small"
                    >
                      <Casino fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            </div>
          );
        })}
        
        <Paper className={classes.attributeCore}>
          <Box className={classes.attributeContainer}>
            <Typography className={classes.attributeName}>
              {attributeName}
            </Typography>
            <Box className={classes.attributeInputRow}>
              <TextField
                type="number"
                value={currentAttributeValue}
                onChange={(e) => {
                  handleInputChange(e, updateAttribute, attributeName);
                }}
                onBlur={(e) => {
                  handleBlur(e, updateAttribute, attributeName);
                }}
                onKeyDown={(e) => {
                  handleKeyDown(e, currentAttributeValue, updateAttribute, attributeName);
                }}
                inputProps={{ 
                  min: 1, 
                  max: 6
                }}
                className={classes.attributeInput}
                size="small"
              />
              <IconButton 
                className={classes.attributeDiceButton}
                onClick={() => {
                  handleAttributeRoll(attributeName);
                }}
                size="small"
              >
                <Casino />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  };

  console.log('[DEBUG] YearZeroSheet - Iniciando renderizacao do grid de atributos');
  
  return (
    <Box className={classes.container}>
      <Box className={classes.diamondGrid}>
        {Object.entries(attributeConfig).map(([attributeName, config]) => (
          <AttributeWithAuras 
            key={attributeName}
            attributeName={attributeName} 
            config={config} 
          />
        ))}
      </Box>
    </Box>
  );
}

export default withStyles(styles, { withTheme: false })(YearZeroSheet);