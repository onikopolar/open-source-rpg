// Arquivo: src/components/CharacterBox.jsx
// Versão: 6.2.0 - FIX: Removido withStyles, usando sx inline para evitar hydration mismatch de CSS

import React from 'react';
import { Box, Button, Typography } from '@mui/material';

import {
  Link as LinkIcon,
  Delete as DeleteIcon,
  Favorite as HeartIcon,
  FavoriteBorder as HeartIconNoLife,
  VideoCameraFront as CameraIcon,
  Edit as EditIcon
} from '@mui/icons-material';

import useModal from '../hooks/useModal';
import GeneratePortraitModal from './modals/GeneratePortraitModal';
import ChangePictureModal from './modals/ChangePictureModal';

function CharacterBox({ 
  character, 
  deleteCharacter, 
  onCharacterUpdated,
  ...rest 
}) {
  const getCharacterPictureURL = () => {
    if (!character) return null;

    if (character.standard_character_image) {
      return character.standard_character_image;
    }

    if (character.standard_character_picture_url || character.injured_character_picture_url) {
      const isInjured = character.current_hit_points <= (character.max_hit_points / 2);
      const hasInjuredURL = !!character.injured_character_picture_url;

      if (isInjured && hasInjuredURL) {
        return character.injured_character_picture_url;
      }

      return character.standard_character_picture_url || character.injured_character_picture_url;
    }

    return '/assets/user.png';
  };

  const characterImageUrl = getCharacterPictureURL();

  const generatePortraitModal = useModal(({ close, custom }) => (
    <GeneratePortraitModal
      handleClose={close}
      characterId={custom.characterId}
    />
  ));

  const changePictureModal = useModal(({ close, custom }) => (
    <ChangePictureModal
      handleClose={close}
      character={custom.character}
      onPictureChange={custom.onPictureChange}
    />
  ));

  const handleEditPicture = () => {
    changePictureModal.appear({ 
      character: character,
      onPictureChange: () => {
        if (onCharacterUpdated && typeof onCharacterUpdated === 'function') {
          onCharacterUpdated();
        }
      }
    });
  };

  const buttonSx = {
    width: 40,
    height: 40,
    minWidth: 40,
    borderRadius: '5px',
    color: 'white',
    borderColor: 'white',
    '&:hover': {
      borderColor: 'primary.light',
      backgroundColor: 'primary.700',
    },
  };

  return (
    <Box
      sx={{
        backgroundColor: 'primary.900',
        borderRadius: '5px',
        padding: '15px',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: '121px',
        gap: '20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
      {...rest}
    >
      {/* Imagem — tamanho fixo, nunca encolhe */}
      <Box sx={{ flexShrink: 0, width: 75, height: 75 }}>
        <img
          src={characterImageUrl || '/assets/user.png'}
          alt={`${character.name} Portrait`}
          width={75}
          height={75}
          style={{
            width: '75px',
            height: '75px',
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={(e) => {
            e.target.src = '/assets/user.png';
          }}
        />
      </Box>

      {/* Conteúdo — ocupa o restante */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '10px',
          flex: 1,
          minWidth: 0, // necessário para o ellipsis funcionar dentro do flex
        }}
      >
        <Typography
          title={`${character.name} (ID: ${character.id})`}
          sx={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
          }}
        >
          {`${character.name} (ID: ${character.id})`}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', color: '#E80A67', gap: '3px' }}>
          {character.current_hit_points === 0 ? <HeartIconNoLife /> : <HeartIcon />}
          <Typography sx={{ fontWeight: 'bold', color: 'white' }}>
            {`${character.current_hit_points}/${character.max_hit_points}`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
          <Button
            variant="outlined"
            href={`/sheet/${character.id}`}
            target="_blank"
            sx={buttonSx}
            title="Abrir ficha"
          >
            <LinkIcon />
          </Button>
          <Button
            variant="outlined"
            sx={buttonSx}
            onClick={() => generatePortraitModal.appear({ characterId: character.id })}
            title="Gerar retrato"
          >
            <CameraIcon />
          </Button>
          <Button
            variant="outlined"
            sx={buttonSx}
            onClick={handleEditPicture}
            title="Alterar imagem"
          >
            <EditIcon />
          </Button>
          <Button
            variant="outlined"
            sx={{
              ...buttonSx,
              '&:hover': {
                borderColor: 'error.light',
                backgroundColor: 'error.dark',
              },
            }}
            onClick={() => deleteCharacter(character.id)}
            title="Excluir personagem"
          >
            <DeleteIcon />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default CharacterBox;