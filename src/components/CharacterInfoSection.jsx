import React from 'react';
import Image from 'next/image';
import { Grid, Box, Button, CircularProgress } from '@mui/material';
import CharacterInfoForm from './forms/CharacterInfoForm';

export const CharacterInfoSection = ({ 
  character, 
  isMobile, 
  changePictureModal, 
  loadingStates,
  handleCharacterInfoSubmit,
  refreshData
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Box sx={{ 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <Image
            src={character.standard_character_picture_url || '/assets/user.png'}
            alt={character.name}
            width={isMobile ? 120 : 150}
            height={isMobile ? 160 : 200}
            style={{ 
              borderRadius: '8px',
              objectFit: 'cover'
            }}
            loading="eager"
            priority
          />
<Button 
  variant="outlined" 
  sx={{ 
    mt: 2,
    width: isMobile ? '100%' : 'auto',
    minWidth: 140
  }}
  onClick={() => {
    changePictureModal.appear({
      character: character, // ← ADICIONAR ESTA LINHA
      characterId: character.id,
      characterName: character.name,
      refreshData: refreshData // ← ADICIONAR TAMBÉM
    });
  }}
  disabled={loadingStates.changePicture}
  size={isMobile ? "small" : "medium"}
>
  {loadingStates.changePicture ? <CircularProgress size={24} /> : 'Alterar Imagem'}
</Button>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <CharacterInfoForm
          character={character}
          onSubmit={handleCharacterInfoSubmit}
          onSuccess={refreshData}
          isLoading={loadingStates.characterInfo}
          isMobile={isMobile}
        />
      </Grid>
    </Grid>
  );
};
