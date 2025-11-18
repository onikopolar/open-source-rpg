import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Container, Box, Typography, Button, Grid, Paper, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';

import { Header, Section } from '../../components';
import SkillModal from '../../components/modals/SkillModal';
import useModal from '../../hooks/useModal';
import { api } from '../../utils';

export async function getServerSideProps() {
  return {
    props: {},
  }
}

export default function ManageSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const skillModal = useModal(({ close, custom }) => (
    <SkillModal
      handleClose={close}
      onSubmit={fetchSkills}
      data={custom?.data}
      operation={custom?.operation}
    />
  ));

  const fetchSkills = async () => {
    try {
      const response = await api.get('/skill');
      setSkills(response.data);
    } catch (error) {
      console.error('Erro ao carregar perícias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleDelete = async (skillId) => {
    if (window.confirm('Tem certeza que deseja excluir esta perícia?')) {
      try {
        await api.delete(`/skill/${skillId}`);
        fetchSkills();
      } catch (error) {
        alert('Erro ao excluir perícia');
      }
    }
  };

  const handleEdit = (skill) => {
    skillModal.appear({ data: skill, operation: 'edit' });
  };

  const handleCreate = () => {
    skillModal.appear({ operation: 'create' });
  };

  return (
    <>
      <Head>
        <title>Gerenciar Perícias - RPG System</title>
      </Head>

      <Header />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Section title="Gerenciar Perícias">
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Nova Perícia
            </Button>
          </Box>

          <Grid container spacing={2}>
            {skills.map((skill) => (
              <Grid item xs={12} md={6} key={skill.id}>
                <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {skill.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {skill.description || 'Sem descrição'}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      onClick={() => handleEdit(skill)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(skill.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {skills.length === 0 && !loading && (
            <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
              Nenhuma perícia cadastrada
            </Typography>
          )}
        </Section>
      </Container>
    </>
  );
}
