import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Container, Box, Typography, Button, Grid, Paper, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';

import { Header, Section } from '../../components';
import AttributeModal from '../../components/modals/AttributeModal';
import useModal from '../../hooks/useModal';
import { api } from '../../utils';

export default function ManageAttributes() {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);

  const attributeModal = useModal(({ close, custom }) => (
    <AttributeModal
      handleClose={close}
      onSubmit={fetchAttributes}
      data={custom?.data}
      operation={custom?.operation}
    />
  ));

  const fetchAttributes = async () => {
    try {
      const response = await api.get('/attribute');
      setAttributes(response.data);
    } catch (error) {
      console.error('Erro ao carregar atributos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleDelete = async (attributeId) => {
    if (window.confirm('Tem certeza que deseja excluir este atributo?')) {
      try {
        await api.delete(`/attribute/${attributeId}`);
        fetchAttributes();
      } catch (error) {
        alert('Erro ao excluir atributo');
      }
    }
  };

  const handleEdit = (attribute) => {
    attributeModal.appear({ data: attribute, operation: 'edit' });
  };

  const handleCreate = () => {
    attributeModal.appear({ operation: 'create' });
  };

  return (
    <>
      <Head>
        <title>Gerenciar Atributos - RPG System</title>
      </Head>

      <Header />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Section title="Gerenciar Atributos">
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Novo Atributo
            </Button>
          </Box>

          <Grid container spacing={2}>
            {attributes.map((attribute) => (
              <Grid item xs={12} md={6} key={attribute.id}>
                <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {attribute.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {attribute.description || 'Sem descrição'}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      onClick={() => handleEdit(attribute)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(attribute.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {attributes.length === 0 && !loading && (
            <Typography variant="body1" sx={{ textAlign: 'center', mt: 4 }}>
              Nenhum atributo cadastrado
            </Typography>
          )}
        </Section>
      </Container>
    </>
  );
}
