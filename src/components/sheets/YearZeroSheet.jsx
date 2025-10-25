import React from 'react';
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

  const defaultAttributes = [
    { name: 'FORÇA', year_zero_value: 1 },
    { name: 'AGILIDADE', year_zero_value: 1 },
    { name: 'RACIOCÍNIO', year_zero_value: 1 },
    { name: 'EMPATIA', year_zero_value: 1 }
  ];

  const defaultSkills = [
    { name: 'Combate Corpo a Corpo', year_zero_value: 1 },
    { name: 'Maquinario Pesado', year_zero_value: 1 },
    { name: 'Resistencia', year_zero_value: 1 },
    { name: 'Combate a Distancia', year_zero_value: 1 },
    { name: 'Mobilidade', year_zero_value: 1 },
    { name: 'Pilotagem', year_zero_value: 1 },
    { name: 'Observação', year_zero_value: 1 },
    { name: 'Sobrevivência', year_zero_value: 1 },
    { name: 'Tecnologia', year_zero_value: 1 },
    { name: 'Manipulação', year_zero_value: 1 },
    { name: 'Comando', year_zero_value: 1 },
    { name: 'Cuidados Médicos', year_zero_value: 1 }
  ];

  const validatedAttributes = Array.isArray(attributes) && attributes.length > 0 ? attributes : defaultAttributes;
  const validatedSkills = Array.isArray(skills) && skills.length > 0 ? skills : defaultSkills;

  console.log('[DEBUG] YearZeroSheet - Validacao final:', {
    attributesRecebidas: attributes,
    skillsRecebidas: skills,
    validatedAttributes: validatedAttributes,
    validatedSkills: validatedSkills,
    usandoDefaultAttributes: validatedAttributes === defaultAttributes,
    usandoDefaultSkills: validatedSkills === defaultSkills
  });

  console.log('[DEBUG] YearZeroSheet - Dados validados:', {
    validatedAttributesCount: validatedAttributes.length,
    validatedSkillsCount: validatedSkills.length,
    usingDefaultAttributes: validatedAttributes === defaultAttributes,
    usingDefaultSkills: validatedSkills === defaultSkills
  });

  const attributeConfig = {
    'FORÇA': {
      position: classes.positionTop,
      collisionSize: '120px',
      skills: {
        top: 'Combate Corpo a Corpo',
        left: 'Maquinario Pesado', 
        right: 'Resistencia'
      },
      skillPositions: {
        top: { top: '-63px', left: '50%', transform: 'translateX(-50%)' },
        left: { top: '50%', left: '-65px', transform: 'translateY(-50%)' },
        right: { top: '50%', right: '-65px', transform: 'translateY(-50%)' }
      }
    },
    'AGILIDADE': {
      position: classes.positionLeft,
      collisionSize: '120px',
      skills: {
        top: 'Combate a Distancia',
        left: 'Mobilidade',
        bottom: 'Pilotagem'
      },
      skillPositions: {
        top: { top: '-60px', left: '50%', transform: 'translateX(-50%)' },
        left: { top: '50%', left: '-65px', transform: 'translateY(-50%)' },
        bottom: { bottom: '-60px', left: '50%', transform: 'translateX(-50%)' }
      }
    },
    'RACIOCÍNIO': {
      position: classes.positionRight,
      collisionSize: '120px',
      skills: {
        top: 'Observação', 
        right: 'Sobrevivência',
        bottom: 'Tecnologia'
      },
      skillPositions: {
        top: { top: '-60px', left: '50%', transform: 'translateX(-50%)' },
        right: { top: '50%', right: '-65px', transform: 'translateY(-50%)' },
        bottom: { bottom: '-60px', left: '50%', transform: 'translateX(-50%)' }
      }
    },
    'EMPATIA': {
      position: classes.positionBottom,
      collisionSize: '120px',
      skills: {
        left: 'Manipulação',
        right: 'Comando', 
        bottom: 'Cuidados Médicos'
      },
      skillPositions: {
        left: { top: '50%', left: '-65px', transform: 'translateY(-50%)' },
        right: { top: '50%', right: '-65px', transform: 'translateY(-50%)' },
        bottom: { bottom: '-60px', left: '50%', transform: 'translateX(-50%)' }
      }
    }
  };

  const getAttributeValue = (attributeName) => {
    console.log(`[DEBUG] YearZeroSheet getAttributeValue - Buscando valor para: ${attributeName}`);
    const attribute = validatedAttributes.find(a => a && a.name === attributeName);
    const value = attribute ? (attribute.year_zero_value || 1) : 1;
    const finalValue = Math.max(1, Math.min(6, value));
    console.log(`[DEBUG] YearZeroSheet getAttributeValue - Resultado: ${attributeName} = ${finalValue}`);
    return finalValue;
  };

  const getSkillValue = (skillName) => {
    console.log(`[DEBUG] YearZeroSheet getSkillValue - Buscando valor para: ${skillName}`);
    const skill = validatedSkills.find(s => s && s.name === skillName);
    const value = skill ? (skill.year_zero_value || 1) : 1;
    const finalValue = Math.max(1, Math.min(6, value));
    console.log(`[DEBUG] YearZeroSheet getSkillValue - Resultado: ${skillName} = ${finalValue}`);
    return finalValue;
  };

  const updateAttribute = (attributeName, value) => {
    console.log(`[DEBUG] YearZeroSheet updateAttribute - Iniciando atualizacao: ${attributeName} = ${value}`);
    if (onUpdate && typeof onUpdate === 'function') {
      let numValue = parseInt(value);
      console.log(`[DEBUG] YearZeroSheet updateAttribute - Valor parseado: ${numValue}`);
      if (isNaN(numValue)) {
        console.log('[DEBUG] YearZeroSheet updateAttribute - Valor NaN, usando 1');
        numValue = 1;
      }
      numValue = Math.max(1, Math.min(6, numValue));
      console.log(`[DEBUG] YearZeroSheet updateAttribute - Valor final validado: ${numValue}`);
      onUpdate('attribute', attributeName, numValue);
    } else {
      console.error('[ERROR] YearZeroSheet updateAttribute - onUpdate nao disponivel');
    }
  };

  const updateSkill = (skillName, value) => {
    console.log(`[DEBUG] YearZeroSheet updateSkill - Iniciando atualizacao: ${skillName} = ${value}`);
    
    // APENAS LOGAR se a skill existe, mas SEMPRE TENTAR SALVAR
    const skillExists = validatedSkills.some(s => s.name === skillName);
    console.log(`[DEBUG] YearZeroSheet updateSkill - Skill "${skillName}" existe: ${skillExists}`);
    
    if (!skillExists) {
      console.warn(`[WARN] YearZeroSheet updateSkill - Skill nao encontrada: ${skillName}. Tentando salvar mesmo assim.`);
    }
    
    if (onUpdate && typeof onUpdate === 'function') {
      let numValue = parseInt(value);
      console.log(`[DEBUG] YearZeroSheet updateSkill - Valor parseado: ${numValue}`);
      if (isNaN(numValue)) {
        console.log('[DEBUG] YearZeroSheet updateSkill - Valor NaN, usando 1');
        numValue = 1;
      }
      numValue = Math.max(1, Math.min(6, numValue));
      console.log(`[DEBUG] YearZeroSheet updateSkill - Valor final validado: ${numValue}`);
      onUpdate('skill', skillName, numValue);
    } else {
      console.error('[ERROR] YearZeroSheet updateSkill - onUpdate nao disponivel');
    }
  };

  const handleInputChange = (e, callback, name) => {
    const value = e.target.value;
    console.log(`[DEBUG] YearZeroSheet handleInputChange - Input alterado: ${name} = "${value}"`);
    
    if (value === '') {
      console.log(`[DEBUG] YearZeroSheet handleInputChange - Campo vazio, chamando callback com string vazia`);
      callback(name, '');
      return;
    }
    
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      console.log(`[DEBUG] YearZeroSheet handleInputChange - Valor numerico valido: ${numValue}`);
      callback(name, numValue);
    } else {
      console.log(`[DEBUG] YearZeroSheet handleInputChange - Valor invalido, ignorando: ${value}`);
    }
  };

  const handleBlur = (e, callback, name) => {
    let value = e.target.value;
    console.log(`[DEBUG] YearZeroSheet handleBlur - Campo perdeu foco: ${name} = "${value}"`);
    
    if (value === '') {
      console.log(`[DEBUG] YearZeroSheet handleBlur - Campo vazio, definindo para 1`);
      value = '1';
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      console.log(`[DEBUG] YearZeroSheet handleBlur - Valor invalido ou menor que 1, definindo para 1`);
      value = '1';
    } else if (numValue > 6) {
      console.log(`[DEBUG] YearZeroSheet handleBlur - Valor maior que 6, definindo para 6`);
      value = '6';
    }
    
    console.log(`[DEBUG] YearZeroSheet handleBlur - Chamando callback com valor final: ${value}`);
    callback(name, value);
  };

  const handleKeyDown = (e, currentValue, callback, name) => {
    console.log(`[DEBUG] YearZeroSheet handleKeyDown - Tecla pressionada: ${e.key} para ${name}`);
    
    if (e.key === 'ArrowUp') {
      console.log(`[DEBUG] YearZeroSheet handleKeyDown - Seta para cima, incrementando valor`);
      e.preventDefault();
      const newValue = Math.min(6, currentValue + 1);
      console.log(`[DEBUG] YearZeroSheet handleKeyDown - Novo valor: ${newValue}`);
      callback(name, newValue);
    } else if (e.key === 'ArrowDown') {
      console.log(`[DEBUG] YearZeroSheet handleKeyDown - Seta para baixo, decrementando valor`);
      e.preventDefault();
      const newValue = Math.max(1, currentValue - 1);
      console.log(`[DEBUG] YearZeroSheet handleKeyDown - Novo valor: ${newValue}`);
      callback(name, newValue);
    } else {
      console.log(`[DEBUG] YearZeroSheet handleKeyDown - Tecla normal: ${e.key}`);
    }
  };

  const handleAttributeRoll = (attributeName) => {
    console.log(`[DEBUG] YearZeroSheet handleAttributeRoll - Clicou para rolar atributo: ${attributeName}`);
    if (onAttributeRoll && typeof onAttributeRoll === 'function') {
      const value = getAttributeValue(attributeName);
      console.log(`[DEBUG] YearZeroSheet handleAttributeRoll - Chamando onAttributeRoll com: ${attributeName}, ${value}`);
      onAttributeRoll(attributeName, value);
    } else {
      console.error('[ERROR] YearZeroSheet handleAttributeRoll - onAttributeRoll nao disponivel');
    }
  };

  const handleSkillRoll = (skillName) => {
    console.log(`[DEBUG] YearZeroSheet handleSkillRoll - Clicou para rolar skill: ${skillName}`);
    if (onSkillRoll && typeof onSkillRoll === 'function') {
      const value = getSkillValue(skillName);
      console.log(`[DEBUG] YearZeroSheet handleSkillRoll - Chamando onSkillRoll com: ${skillName}, ${value}`);
      onSkillRoll(skillName, value);
    } else {
      console.error('[ERROR] YearZeroSheet handleSkillRoll - onSkillRoll nao disponivel');
    }
  };

  const AttributeWithAuras = ({ attributeName, config }) => {
    console.log(`[DEBUG] YearZeroSheet AttributeWithAuras - Renderizando: ${attributeName}`);
    
    if (!attributeName || !config) {
      console.error('[ERROR] YearZeroSheet AttributeWithAuras - attributeName ou config ausente');
      return null;
    }
    
    const currentAttributeValue = getAttributeValue(attributeName);
    console.log(`[DEBUG] YearZeroSheet AttributeWithAuras - Valor atual do atributo: ${attributeName} = ${currentAttributeValue}`);
    
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
          console.log(`[DEBUG] YearZeroSheet AttributeWithAuras - Renderizando skill: ${skillName} na posicao ${position}`);
          
          // APENAS LOGAR se a skill existe, mas SEMPRE RENDERIZAR
          const skillExists = validatedSkills.some(s => s.name === skillName);
          console.log(`[DEBUG] YearZeroSheet AttributeWithAuras - Skill "${skillName}" existe: ${skillExists}`);
          
          if (!skillExists) {
            console.warn(`[WARN] YearZeroSheet AttributeWithAuras - Skill nao encontrada: ${skillName}. Usando valor padrao.`);
          }
          
          const currentSkillValue = getSkillValue(skillName);
          console.log(`[DEBUG] YearZeroSheet AttributeWithAuras - Valor da skill: ${skillName} = ${currentSkillValue}`);
          
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
                    {skillName}
                  </Typography>
                  <Box className={classes.skillInputRow}>
                    <TextField
                      type="number"
                      value={currentSkillValue}
                      onChange={(e) => {
                        console.log(`[DEBUG] YearZeroSheet Skill Input - onChange: ${skillName}`);
                        handleInputChange(e, updateSkill, skillName);
                      }}
                      onBlur={(e) => {
                        console.log(`[DEBUG] YearZeroSheet Skill Input - onBlur: ${skillName}`);
                        handleBlur(e, updateSkill, skillName);
                      }}
                      onKeyDown={(e) => {
                        console.log(`[DEBUG] YearZeroSheet Skill Input - onKeyDown: ${skillName}, tecla: ${e.key}`);
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
                        console.log(`[DEBUG] YearZeroSheet Skill Dice Button - Clicou: ${skillName}`);
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
                  console.log(`[DEBUG] YearZeroSheet Attribute Input - onChange: ${attributeName}`);
                  handleInputChange(e, updateAttribute, attributeName);
                }}
                onBlur={(e) => {
                  console.log(`[DEBUG] YearZeroSheet Attribute Input - onBlur: ${attributeName}`);
                  handleBlur(e, updateAttribute, attributeName);
                }}
                onKeyDown={(e) => {
                  console.log(`[DEBUG] YearZeroSheet Attribute Input - onKeyDown: ${attributeName}, tecla: ${e.key}`);
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
                  console.log(`[DEBUG] YearZeroSheet Attribute Dice Button - Clicou: ${attributeName}`);
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
        {Object.entries(attributeConfig).map(([attributeName, config]) => {
          console.log(`[DEBUG] YearZeroSheet - Mapeando atributo para renderizacao: ${attributeName}`);
          return (
            <AttributeWithAuras 
              key={attributeName}
              attributeName={attributeName} 
              config={config} 
            />
          );
        })}
      </Box>
    </Box>
  );
}

export default withStyles(styles, { withTheme: false })(YearZeroSheet);
