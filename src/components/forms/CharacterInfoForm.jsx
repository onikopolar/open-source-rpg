import { Formik, Form } from 'formik';
import { Grid, TextField, Button, Box, Alert, Typography } from '@mui/material';
import { useState, useEffect } from 'react';

import { CharacterInfoSchema } from '../../validations';
import Loader from '../Loader';

const CharacterInfoForm = ({
  character,
  onSubmit,
  onSuccess
}) => {
  const [saveStatus, setSaveStatus] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  
  const getInitialValues = () => ({
    name: character?.name || '',
    player_name: character?.player_name || '',
    age: character?.age || '',
    gender: character?.gender || ''
  });

  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => {
        setSaveStatus('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      console.log('Enviando dados para API:', values);
      
      const dataToSend = {
        ...values,
        age: values.age ? values.age : null
      };
      
      await onSubmit(dataToSend);
      
      setSaveStatus('success');
      setLastSaved(new Date());
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Erro ao salvar informações:', error);
      setSaveStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    return `Salvo às ${lastSaved.toLocaleTimeString()}`;
  };

  return (
    <Formik
      initialValues={getInitialValues()}
      onSubmit={handleSubmit}
      validationSchema={CharacterInfoSchema}
      enableReinitialize
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting,
        dirty,
        isValid
      }) => (
        <Form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {saveStatus === 'success' && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Informações salvas com sucesso! {formatLastSaved()}
                </Alert>
              </Grid>
            )}
            
            {saveStatus === 'error' && (
              <Grid item xs={12}>
                <Alert severity="error">
                  Erro ao salvar informações. Tente novamente.
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                variant="outlined"
                label="Nome do jogador(a)"
                name="player_name"
                value={values.player_name}
                fullWidth
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.player_name && Boolean(errors.player_name)}
                helperText={touched.player_name && errors.player_name}
                placeholder="Seu nome real"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                label="Nome do Personagem *"
                name="name"
                value={values.name}
                fullWidth
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name || "Nome do personagem no jogo"}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                variant="outlined"
                label="Idade"
                name="age"
                value={values.age}
                fullWidth
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.age && Boolean(errors.age)}
                helperText={touched.age && errors.age}
                inputProps={{ 
                  min: 0, 
                  max: 1000,
                  step: 1
                }}
                placeholder="0"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                label="Gênero"
                name="gender"
                value={values.gender}
                fullWidth
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.gender && Boolean(errors.gender)}
                helperText={touched.gender && errors.gender}
                placeholder="Masculino, Feminino, Não-binário, etc."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap'
              }}>
                <Box sx={{ flex: 1 }}>
                  {dirty && !isSubmitting && (
                    <Alert severity="info" sx={{ maxWidth: 300 }}>
                      Há alterações não salvas
                    </Alert>
                  )}
                  
                  {lastSaved && !dirty && (
                    <Typography variant="body2" color="text.secondary">
                      {formatLastSaved()}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {isSubmitting && (
                    <Loader size={30} />
                  )}
                  
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={isSubmitting || !dirty || !isValid}
                    size="large"
                    sx={{ minWidth: 160 }}
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Form>
      )}
    </Formik>
  );
};

export default CharacterInfoForm;
