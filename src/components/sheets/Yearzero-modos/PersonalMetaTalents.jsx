import React, { useState, useEffect, useCallback } from 'react';
import { withStyles } from '@mui/styles';
import { Box, TextField, Typography } from '@mui/material';

// Estilos para o componente usando MUI style system
const personalMetaTalentsStyles = (theme) => ({
  // Container externo que centraliza tudo
  outerContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
  },
  // Container interno com grid
  container: {
    display: 'grid',
    gridTemplateColumns: 'minmax(420px, 2fr) minmax(320px, 1fr) minmax(360px, 1fr)',
    gap: theme.spacing(3),
    padding: theme.spacing(3),
    width: 'auto',
    maxWidth: '1550px',
    margin: '0 auto',
  },
  section: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2.5),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  // Section especial para coluna esquerda (maior)
  leftSection: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2.5),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    minWidth: '420px',
  },
  sectionTitle: {
    color: theme.palette.warning.main,
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
    marginBottom: theme.spacing(1.8),
    fontSize: theme.typography.pxToRem(14.5),
    fontWeight: theme.typography.fontWeightBold
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      '& fieldset': {
        borderColor: theme.palette.divider,
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.light,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.warning.main,
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
      fontSize: theme.typography.pxToRem(12.5)
    },
    '& .MuiInputBase-input': {
      color: theme.palette.text.primary,
      fontSize: theme.typography.pxToRem(13.5),
      padding: theme.spacing(1.2),
      height: '38px',
      boxSizing: 'border-box'
    },
    marginBottom: theme.spacing(1.8)
  },
  // TextArea ULTRA COMPACTO - metade da altura anterior
  ultraCompactTextArea: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      '& fieldset': {
        borderColor: theme.palette.divider,
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.light,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.warning.main,
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
      fontSize: theme.typography.pxToRem(12.5)
    },
    '& .MuiInputBase-input': {
      color: theme.palette.text.primary,
      fontSize: theme.typography.pxToRem(13),
      lineHeight: 1.3,
      padding: '8px 12px',
    },
    '& .MuiOutlinedInput-inputMultiline': {
      height: '52px !important',
      minHeight: '52px !important',
      maxHeight: '52px !important',
      overflowY: 'auto !important',
      boxSizing: 'border-box',
      resize: 'none',
    },
    marginBottom: theme.spacing(1.8),
    '& .MuiInputBase-root': {
      padding: '0 !important',
    }
  },
  centralSection: {
    textAlign: 'center',
    '& .MuiTextField-root': {
      marginBottom: theme.spacing(2.2)
    }
  },
  talentInput: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      '& fieldset': {
        borderColor: theme.palette.divider,
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.light,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.warning.main,
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
      fontSize: theme.typography.pxToRem(11.8)
    },
    '& .MuiInputBase-input': {
      color: theme.palette.text.primary,
      fontSize: theme.typography.pxToRem(12.8),
      padding: theme.spacing(1),
      height: '36px',
      boxSizing: 'border-box'
    },
    marginBottom: theme.spacing(1.3)
  }
});

function PersonalMetaTalents({
  classes,
  character,
  onSave
}) {
  console.log('[PersonalMetaTalents v3.3.0] FIX: TODOS os campos salvam apenas no blur - Segurança máxima');

  // Estado para os dados do componente
  const [metaPessoal, setMetaPessoal] = useState('');
  const [camarada, setCamarada] = useState('');
  const [rival, setRival] = useState('');
  const [carreira, setCarreira] = useState('');
  const [aparencia, setAparencia] = useState('');
  const [talentos, setTalentos] = useState(['', '', '', '']);

  // Carregar dados iniciais do personagem
  useEffect(() => {
    if (character) {
      console.log('[PersonalMetaTalents] Carreguei dados do personagem');
      
      if (character.personal_goal) {
        setMetaPessoal(character.personal_goal);
      }
      
      if (character.camarada) {
        setCamarada(character.camarada);
      }
      
      if (character.rival) {
        setRival(character.rival);
      }
      
      if (character.career) {
        setCarreira(character.career);
      }
      
      if (character.appearance) {
        setAparencia(character.appearance);
      }
      
      if (character.talents) {
        try {
          let loadedTalents = character.talents;
          
          if (typeof loadedTalents === 'string') {
            loadedTalents = loadedTalents.replace(/^"+|"+$/g, '');
            loadedTalents = JSON.parse(loadedTalents);
          }
          
          if (Array.isArray(loadedTalents)) {
            const paddedTalents = [...loadedTalents];
            while (paddedTalents.length < 4) {
              paddedTalents.push('');
            }
            setTalentos(paddedTalents.slice(0, 4));
          }
        } catch (error) {
          console.error('[PersonalMetaTalents] Erro ao carregar talentos:', error);
          if (character.talents && typeof character.talents === 'string' && character.talents.length > 0) {
            setTalentos([character.talents, '', '', '']);
          }
        }
      }
    }
  }, [character]);

  // Handler para salvar dados
  const saveData = useCallback(async (field, value) => {
    console.log(`[PersonalMetaTalents] Salvei ${field} (blur)`);
    
    if (onSave) {
      try {
        await onSave(field, value);
      } catch (error) {
        console.error(`[PersonalMetaTalents] Erro ao salvar ${field}:`, error);
      }
    }
  }, [onSave]);

  // Handlers para todos os campos: SALVAM APENAS NO BLUR
  const handleMetaPessoalBlur = useCallback((event) => {
    const newValue = event.target.value;
    console.log('[PersonalMetaTalents] Meta pessoal blur:', newValue);
    saveData('personal_goal', newValue);
  }, [saveData]);

  const handleCamaradaBlur = useCallback((event) => {
    const newValue = event.target.value;
    console.log('[PersonalMetaTalents] Camarada blur:', newValue);
    saveData('camarada', newValue);
  }, [saveData]);

  const handleRivalBlur = useCallback((event) => {
    const newValue = event.target.value;
    console.log('[PersonalMetaTalents] Rival blur:', newValue);
    saveData('rival', newValue);
  }, [saveData]);

  const handleCarreiraBlur = useCallback((event) => {
    const newValue = event.target.value;
    console.log('[PersonalMetaTalents] Carreira blur:', newValue);
    saveData('career', newValue);
  }, [saveData]);

  const handleAparenciaBlur = useCallback((event) => {
    const newValue = event.target.value;
    console.log('[PersonalMetaTalents] Aparência blur:', newValue);
    saveData('appearance', newValue);
  }, [saveData]);

  // Handler para talentos - precisa de índice
  const handleTalentoBlur = useCallback((index) => {
    return (event) => {
      const newValue = event.target.value;
      console.log(`[PersonalMetaTalents] Talento ${index + 1} blur:`, newValue);
      
      setTalentos(prev => {
        const newTalentos = [...prev];
        newTalentos[index] = newValue;
        
        // Salva o array completo
        saveData('talents', JSON.stringify(newTalentos));
        
        return newTalentos;
      });
    };
  }, [saveData]);

  // Handlers de change apenas atualizam o estado local (sem salvar)
  const handleMetaPessoalChange = useCallback((event) => {
    setMetaPessoal(event.target.value);
  }, []);

  const handleCamaradaChange = useCallback((event) => {
    setCamarada(event.target.value);
  }, []);

  const handleRivalChange = useCallback((event) => {
    setRival(event.target.value);
  }, []);

  const handleCarreiraChange = useCallback((event) => {
    setCarreira(event.target.value);
  }, []);

  const handleAparenciaChange = useCallback((event) => {
    setAparencia(event.target.value);
  }, []);

  const handleTalentoChange = useCallback((index) => {
    return (event) => {
      const newValue = event.target.value;
      setTalentos(prev => {
        const newTalentos = [...prev];
        newTalentos[index] = newValue;
        return newTalentos;
      });
    };
  }, []);

  return (
    <Box className={classes.outerContainer}>
      <Box className={classes.container}>
        {/* COLUNA ESQUERDA: Meta Pessoal e Relacionamentos */}
        <Box className={classes.leftSection}>
          <Typography variant="h6" className={classes.sectionTitle}>
            META PESSOAL
          </Typography>
          <TextField
            multiline
            rows={2}
            variant="outlined"
            placeholder="Digite sua meta pessoal..."
            value={metaPessoal}
            onChange={handleMetaPessoalChange}
            onBlur={handleMetaPessoalBlur}
            className={classes.ultraCompactTextArea}
            fullWidth
            inputProps={{
              style: {
                height: '52px',
                minHeight: '52px',
                maxHeight: '52px',
                overflowY: 'auto',
                padding: '8px 12px'
              }
            }}
          />
          
          <Typography variant="h6" className={classes.sectionTitle}>
            RELACIONAMENTOS
          </Typography>
          <TextField
            label="Camarada:"
            variant="outlined"
            placeholder="Nome do camarada"
            value={camarada}
            onChange={handleCamaradaChange}
            onBlur={handleCamaradaBlur}
            className={classes.textField}
            fullWidth
          />
          <TextField
            label="Rival:"
            variant="outlined"
            placeholder="Nome do rival"
            value={rival}
            onChange={handleRivalChange}
            onBlur={handleRivalBlur}
            className={classes.textField}
            fullWidth
          />
        </Box>

        {/* COLUNA CENTRAL: Carreira e Aparência */}
        <Box className={`${classes.section} ${classes.centralSection}`}>
          <Typography variant="h6" className={classes.sectionTitle}>
            CARREIRA
          </Typography>
          <TextField
            variant="outlined"
            placeholder="Ex: Pilotagem, Engenheiro"
            value={carreira}
            onChange={handleCarreiraChange}
            onBlur={handleCarreiraBlur}
            className={classes.textField}
            fullWidth
          />
          
          <Typography variant="h6" className={classes.sectionTitle}>
            APARÊNCIA
          </Typography>
          <TextField
            multiline
            rows={2}
            variant="outlined"
            placeholder="Descreva a aparência do personagem..."
            value={aparencia}
            onChange={handleAparenciaChange}
            onBlur={handleAparenciaBlur}
            className={classes.ultraCompactTextArea}
            fullWidth
            inputProps={{
              style: {
                height: '52px',
                minHeight: '52px',
                maxHeight: '52px',
                overflowY: 'auto',
                padding: '8px 12px'
              }
            }}
          />
        </Box>

        {/* COLUNA DIREITA: Talentos */}
        <Box className={classes.section}>
          <Typography variant="h6" className={classes.sectionTitle}>
            TALENTOS
          </Typography>
          {talentos.map((talento, index) => (
            <TextField
              key={`talento-${index}`}
              label={`Talento ${index + 1}:`}
              variant="outlined"
              placeholder={`Ex: ${['Liderança', 'Sobrevivência', 'Tecnologia', 'Combate Corpo a Corpo'][index]}`}
              value={talento}
              onChange={handleTalentoChange(index)}
              onBlur={handleTalentoBlur(index)}
              className={classes.talentInput}
              fullWidth
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default withStyles(personalMetaTalentsStyles)(PersonalMetaTalents);
export { personalMetaTalentsStyles };