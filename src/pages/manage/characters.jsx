import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Container, Box, Typography, Button, Grid, Paper, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';

import { Header, Section } from '../../components';
import CreateCharacterModal from '../../components/modals/CreateCharacterModal';
import useModal from '../../hooks/useModal';
import { api } from '../../utils';

export async function getServerSideProps() {
  return {
    props: {},
  }
}

export default function ManageCharacters() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  const characterModal = useModal(({ close, custom }) => (
    <CreateCharacterModal
      handleClose={close}
      onCharacterCreated={fetchCharacters}
      data={custom?.data}
      operation={custom?.operation}
    />
  ));

  const fetchCharacters = async () => {
    try {
      const response = await api.get('/character');
      setCharacters(response.data);
    } catch (error) {
      console.error('Erro ao carregar personagens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleDelete = async (characterId) => {
    if (window.confirm('Tem certeza que deseja excluir este personagem?')) {
      try {
        await api.delete(`/character/${characterId}`);
        fetchCharacters();
      } catch (error) {
        alert('Erro ao excluir personagem');
      }
    }
  };

  const handleEdit = (character) => {
    characterModal.appear({ data: character, operation: 'edit' });
  };

  const handleCreate = () => {
    characterModal.appear({ operation: 'create' });
  };

  return (
    <>
      <Head>
        <title>Gerenciar Personagens - RPG System</title>
      </Head>

      <Header />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Section title="Gerenciar Personagens">
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Novo Personagem
            </Button>
          </Box>

          <Grid container spacing={2}>
            {characters.map((character) => (
              <Grid item xs={12} md={6} key={character.id}>
                <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {character.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      PV: {character.current_hit_points}/{character.max_hit_points}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {character.id}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      onClick={() => handleEdit(character)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(character.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {characters.length === 0 && !loading && (
            <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
              Nenhum personagem cadastrado
            </Typography>
          )}
        </Section>
      </Container>
    </>
  );
}