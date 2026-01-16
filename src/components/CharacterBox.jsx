// Arquivo: src/components/CharacterBox.jsx
// Versão: 5.13.4 - FIX: Suporte para atualização de imagem

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { withStyles } from '@mui/styles';
import Image from 'next/image';

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
  classes, 
  ...rest 
}) {
  console.log('[CharacterBox] Renderizando character:', character?.id, character?.name);
  console.log('[CharacterBox] onCharacterUpdated disponível:', !!onCharacterUpdated);
  
  const getCharacterPictureURL = () => {
    if(!character) {
      console.log('[CharacterBox] Character é null/undefined');
      return null;
    }

    // Debug das URLs disponíveis
    console.log('[CharacterBox] URLs do character:', {
      id: character.id,
      standard: character.standard_character_picture_url,
      injured: character.injured_character_picture_url,
      hasStandard: !!character.standard_character_picture_url,
      hasInjured: !!character.injured_character_picture_url
    });

    // MODIFICAÇÃO: Mostrar imagem personalizada mesmo se só tiver uma URL
    if(character.standard_character_picture_url || character.injured_character_picture_url) {
      // Se tem pontos de vida acima da metade OU não tem URL ferida, usar padrão
      if(character.current_hit_points > (character.max_hit_points / 2) || !character.injured_character_picture_url) {
        const url = character.standard_character_picture_url || character.injured_character_picture_url;
        console.log('[CharacterBox] Usando URL padrão/fallback:', url);
        return url;
      }
      else {
        console.log('[CharacterBox] Usando URL ferida:', character.injured_character_picture_url);
        return character.injured_character_picture_url;
      }
    } else {
      console.log('[CharacterBox] Nenhuma URL personalizada, usando padrão');
      return `/assets/user.png`;
    }
  }

  const characterImageUrl = getCharacterPictureURL();
  
  // Verifica se é a imagem padrão
  const isDefaultImage = characterImageUrl === '/assets/user.png';

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
    console.log('[CharacterBox] Abrindo ChangePictureModal para character:', character.id);
    changePictureModal.appear({ 
      character: character,
      onPictureChange: () => {
        console.log('[CharacterBox] onPictureChange chamado, atualizando personagem...');
        if (onCharacterUpdated && typeof onCharacterUpdated === 'function') {
          onCharacterUpdated();
        } else {
          console.warn('[CharacterBox] onCharacterUpdated não disponível');
        }
      }
    });
  };

  return (
    <Box
      className={classes.root}
      {...rest}
    >
      {characterImageUrl && (
        <Image
          src={characterImageUrl}
          alt={`${character.name} Portrait`}
          className={classes.image}
          width={70}
          height={100}
          // SOLUÇÃO: Desabilita preload para imagens padrão
          priority={!isDefaultImage} // Apenas prioriza imagens customizadas
          loading={isDefaultImage ? "lazy" : "eager"} // Lazy para padrão, eager para custom
        />
      )}
      <Box className={classes.content}>
        <Typography className={classes.name} title={`${character.name} (ID: ${character.id})`}>
          {character.name} (ID: {character.id})
        </Typography>
        <Box className={classes.health}>
          {character.current_hit_points === 0 ? (
            <HeartIconNoLife />
          ) : (
            <HeartIcon />
          )}
          <Typography className={classes.healthText}>
            {character.current_hit_points}/{character.max_hit_points}
          </Typography>
        </Box>
        <Box className={classes.actions}>
          <Button
            variant="outlined"
            href={`/sheet/${character.id}`}
            target="_blank"
            className={classes.button}
            title="Abrir ficha"
          >
            <LinkIcon />
          </Button>
          <Button
            variant="outlined"
            className={classes.button}
            onClick={() => generatePortraitModal.appear({ characterId: character.id })}
            title="Gerar retrato"
          >
            <CameraIcon />
          </Button>
          <Button
            variant="outlined"
            className={classes.button}
            onClick={handleEditPicture}
            title="Alterar imagem"
          >
            <EditIcon />
          </Button>
          <Button
            variant="outlined"
            onClick={() => deleteCharacter(character.id)}
            className={`${classes.button} ${classes.deleteButton}`}
            title="Excluir personagem"
          >
            <DeleteIcon />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.primary[900],
    borderRadius: '5px',
    padding: '15px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    minHeight: '121px',
    gap: '20px',
  },
  image: {
    width: '75px',
    height: '75px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  content: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'start',
    flexDirection: 'column',
    gap: '10px',
    width: 'calc(100% - 95px)',
  },
  name: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginTop: '8px',
    color: 'white',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
  health: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#E80A67',
    gap: '3px',
  },
  healthText: {
    fontWeight: 'bold',
    color: 'white'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '10px'
  },
  button: {
    width: 40,
    height: 40,
    minWidth: 40,
    borderRadius: '5px',
    color: 'white',
    borderColor: 'white',
    '&:hover': {
      borderColor: theme.palette.primary.light,
      backgroundColor: theme.palette.primary[700]
    }
  },
  deleteButton: {
    '&:hover': {
      borderColor: theme.palette.error.light,
      backgroundColor: theme.palette.error.dark
    }
  }
});

export default withStyles(styles)(CharacterBox);