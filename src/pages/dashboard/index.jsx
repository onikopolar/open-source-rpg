// Arquivo: src/pages/dashboard/index.js
// Versão: 5.13.9 - STYLE: Card Tabletop sincronizado visualmente com Section

import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { withStyles } from '@mui/styles';
import { Grid, Container, Button, TextField, Box, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import {
  Header, Section, CharacterBox, AddBox,
  CreateCharacterModal, ConfirmationModal, EditableRow,
  AttributeModal, SkillModal
} from '../../components';

import { api } from '../../utils';
import useModal from '../../hooks/useModal';

export const getServerSideProps = async () => {
  const { prisma } = await import('../../database');

  function parseConfigs(array) {
    return array.map(config => {
      if (config.name === 'DICE_ON_SCREEN_TIMEOUT_IN_MS' || config.name === 'TIME_BETWEEN_DICES_IN_MS') {
        return { ...config, value: parseInt(config.value) / 1000 };
      }
      return config;
    });
  }

  const characters = await prisma.character.findMany({ orderBy: [{ name: 'asc' }] });
  const attributes = await prisma.attribute.findMany({ orderBy: [{ name: 'asc' }] });
  const skills = await prisma.skill.findMany({ orderBy: [{ name: 'asc' }] });
  const configs = await prisma.config.findMany();

  return {
    props: {
      characters: JSON.parse(JSON.stringify(characters)),
      attributes: JSON.parse(JSON.stringify(attributes)),
      skills: JSON.parse(JSON.stringify(skills)),
      configs: JSON.parse(JSON.stringify(parseConfigs(configs))),
    },
  };
};

function Dashboard({
  classes,
  characters: initialCharacters,
  attributes: initialAttributes,
  skills: initialSkills,
  configs: initialConfigs
}) {
  const router = useRouter();

  const [characters, setCharacters] = useState(initialCharacters);
  const [attributes, setAttributes] = useState(initialAttributes);
  const [skills, setSkills] = useState(initialSkills);
  const hasConfiguredConfigs = useRef(false);

  const [updatedConfigs, setUpdatedConfigs] = useState({
    DICE_ON_SCREEN_TIMEOUT_IN_MS: '',
    TIME_BETWEEN_DICES_IN_MS: ''
  });

  const configs = initialConfigs;

  useEffect(() => {
    if (hasConfiguredConfigs.current) return;
    if (!configs || configs.length === 0) return;

    const newConfigs = {};
    configs.forEach(config => {
      newConfigs[config.name] = config.value || '';
    });
    setUpdatedConfigs(newConfigs);
    hasConfiguredConfigs.current = true;
  }, [configs]);

  const refreshCharacters = () => {
    api.get('/character')
      .then(res => setCharacters(res.data))
      .catch(error => {
        console.error('[Dashboard] refreshCharacters - Erro:', error);
        alert('Erro ao atualizar lista de personagens');
      });
  };

  const updateConfigs = () => {
    const diceTimeoutValue = parseInt(updatedConfigs.DICE_ON_SCREEN_TIMEOUT_IN_MS);
    const timeBetweenValue = parseInt(updatedConfigs.TIME_BETWEEN_DICES_IN_MS);

    if (isNaN(diceTimeoutValue) || isNaN(timeBetweenValue)) {
      alert('Por favor, insira valores numéricos válidos');
      return;
    }

    api.put('/config/DICE_ON_SCREEN_TIMEOUT_IN_MS', { value: `${diceTimeoutValue * 1000}` })
      .catch(err => console.error('[Dashboard] Erro ao atualizar DICE_ON_SCREEN_TIMEOUT_IN_MS:', err));

    api.put('/config/TIME_BETWEEN_DICES_IN_MS', { value: `${timeBetweenValue * 1000}` })
      .catch(err => console.error('[Dashboard] Erro ao atualizar TIME_BETWEEN_DICES_IN_MS:', err));

    alert('Configurações salvas com sucesso!');
  };

  const runInitialSetup = () => {
    api.post('/setup')
      .then(res => { if (res.data.success) window.location.reload(); })
      .catch(err => console.error('[Dashboard] runInitialSetup - Erro:', err));
  };

  const confirmationModal = useModal(({ close, custom }) => (
    <ConfirmationModal
      title={custom.title}
      text={custom.text}
      data={custom.data}
      handleClose={close}
      onConfirmation={(data) => {
        const { id, type } = data;
        api.delete(`/${type}/${id}`)
          .then(() => {
            if (type === 'attribute') setAttributes(prev => prev.filter(a => a.id !== id));
            else if (type === 'skill') setSkills(prev => prev.filter(s => s.id !== id));
            else if (type === 'character') setCharacters(prev => prev.filter(c => c.id !== id));
          })
          .catch(error => {
            console.error(`[Dashboard] Erro ao apagar ${type}:`, error);
            alert(`Erro ao apagar: ${type}`);
          });
      }}
    />
  ));

  const createCharacterModal = useModal(({ close }) => (
    <CreateCharacterModal handleClose={close} onCharacterCreated={refreshCharacters} />
  ));

  const attributeModal = useModal(({ close, custom }) => (
    <AttributeModal
      handleClose={close}
      data={custom.data || null}
      operation={custom.operation}
      onSubmit={(newAttribute) => {
        if (custom.operation === 'create') setAttributes(prev => [...prev, newAttribute]);
        else if (custom.operation === 'edit') setAttributes(prev => prev.map(a => a.id === newAttribute.id ? newAttribute : a));
      }}
    />
  ));

  const skillModal = useModal(({ close, custom }) => (
    <SkillModal
      handleClose={close}
      data={custom.data || null}
      operation={custom.operation}
      onSubmit={(newSkill) => {
        if (custom.operation === 'create') setSkills(prev => [...prev, newSkill]);
        else if (custom.operation === 'edit') setSkills(prev => prev.map(s => s.id === newSkill.id ? newSkill : s));
      }}
    />
  ));

  return (
    <>
      <Container maxWidth="lg" style={{ marginBottom: '30px' }}>
        <Head>
          <title>Dashboard do Mestre | RPG</title>
        </Head>

        <Grid container item spacing={3}>
          <Header title="Dashboard do Mestre" />

          {configs && configs.length > 0 ? (
            <>
              <Grid item xs={12}>
                <Section title="Fichas e personagens">
                  <Grid item container xs={12} spacing={3}>
                    {characters && characters.map((character) => (
                      <Grid item xs={12} md={4} key={character.id}>
                        <CharacterBox
                          character={character}
                          deleteCharacter={() => confirmationModal.appear({
                            title: 'Apagar personagem',
                            text: 'Deseja apagar este personagem?',
                            data: { id: character.id, type: 'character' },
                          })}
                          onCharacterUpdated={refreshCharacters}
                        />
                      </Grid>
                    ))}
                    <Grid item xs={12} md={4}>
                      <AddBox onClick={() => createCharacterModal.appear()} />
                    </Grid>
                  </Grid>
                </Section>
              </Grid>

              {/* Card Modo Tabletop — mesmos tokens visuais do Section */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    padding: 3,
                    margin: 2,
                    backgroundColor: 'background.paper',
                    borderRadius: 1,
                    boxShadow: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{ color: 'primary.main', fontWeight: 'bold', mb: 0.5 }}
                    >
                      Modo Tabletop
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Inicie a sessão com seus jogadores na mesa virtual
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push('/Tabletop?fromDashboard=true')}
                    sx={{ px: 4, py: 1.2, fontSize: '14px', whiteSpace: 'nowrap' }}
                  >
                    Iniciar sessão →
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Section
                  title="Atributos"
                  renderButton={() => (
                    <Button
                      variant="outlined"
                      style={{ display: 'flex', alignSelf: 'center' }}
                      onClick={() => attributeModal.appear({ operation: 'create' })}
                    >
                      <AddIcon />
                    </Button>
                  )}
                >
                  <Grid item container xs={12} spacing={2} className={classes.scrollableBox}>
                    {attributes && attributes.map((attribute) => (
                      <Grid item xs={12} key={attribute.id}>
                        <EditableRow
                          data={attribute}
                          editRow={(data) => attributeModal.appear({ operation: 'edit', data })}
                          deleteRow={(data) => confirmationModal.appear({
                            title: 'Apagar atributo',
                            text: 'Deseja apagar este atributo?',
                            data: { id: data.id, type: 'attribute' },
                          })}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Section>
              </Grid>

              <Grid item xs={12} md={6}>
                <Section
                  title="Perícias"
                  renderButton={() => (
                    <Button
                      variant="outlined"
                      style={{ display: 'flex', alignSelf: 'center' }}
                      onClick={() => skillModal.appear({ operation: 'create' })}
                    >
                      <AddIcon />
                    </Button>
                  )}
                >
                  <Grid item container xs={12} spacing={2} className={classes.scrollableBox}>
                    {skills && skills.map((skill) => (
                      <Grid item xs={12} key={skill.id}>
                        <EditableRow
                          data={skill}
                          editRow={(data) => skillModal.appear({ operation: 'edit', data })}
                          deleteRow={(data) => confirmationModal.appear({
                            title: 'Apagar perícia',
                            text: 'Deseja apagar esta perícia?',
                            data: { id: data.id, type: 'skill' },
                          })}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Section>
              </Grid>

              <Grid item xs={12}>
                <Section title="Configurações">
                  <Grid item container xs={12} spacing={2}>
                    <Grid container spacing={2} item xs={12}>
                      <Grid item xs={12}>
                        <h4>Integração com OBS</h4>
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Tempo do dado em tela"
                          helperText="Em segundos"
                          value={updatedConfigs.DICE_ON_SCREEN_TIMEOUT_IN_MS || ''}
                          onChange={(e) => setUpdatedConfigs(prev => ({
                            ...prev,
                            DICE_ON_SCREEN_TIMEOUT_IN_MS: e.target.value
                          }))}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Tempo entre cada dado"
                          helperText="Em segundos"
                          value={updatedConfigs.TIME_BETWEEN_DICES_IN_MS || ''}
                          onChange={(e) => setUpdatedConfigs(prev => ({
                            ...prev,
                            TIME_BETWEEN_DICES_IN_MS: e.target.value
                          }))}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Button variant="contained" onClick={updateConfigs}>
                          Salvar
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>
                </Section>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Button variant="contained" onClick={runInitialSetup} fullWidth>
                REALIZAR CONFIGURAÇÃO INICIAL
              </Button>
            </Grid>
          )}
        </Grid>
      </Container>
    </>
  );
}

const styles = () => ({
  scrollableBox: {
    overflow: 'auto',
    maxHeight: '300px',
    paddingRight: '10px',
  },
});

export default withStyles(styles)(Dashboard);