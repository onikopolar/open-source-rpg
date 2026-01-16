// Arquivo: src/components/CharacterBox.jsx
// Versão: 6.0.0 - MAJOR: Suporte completo para base64 e URLs, prioridade correta

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

console.log('[CharacterBox] Versão 6.0.0 - MAJOR: Suporte completo para base64 e URLs, prioridade correta');

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

    console.log('[CharacterBox] DEBUG - Campos disponíveis:', {
      id: character.id,
      // Base64 COM PREFIXO (novo sistema)
      hasStandardBase64: !!character.standard_character_image,
      base64Length: character.standard_character_image?.length,
      base64Preview: character.standard_character_image?.substring(0, 50),
      // URLs antigas (sistema anterior)
      hasStandardURL: !!character.standard_character_picture_url,
      hasInjuredURL: !!character.injured_character_picture_url,
      standardURL: character.standard_character_picture_url,
      injuredURL: character.injured_character_picture_url,
      // Dados de vida para lógica ferido/saudável
      currentHP: character.current_hit_points,
      maxHP: character.max_hit_points,
      isInjured: character.current_hit_points <= (character.max_hit_points / 2)
    });

    // PRIORIDADE 1: Base64 direto do banco (novo sistema)
    if (character.standard_character_image) {
      console.log('[CharacterBox] Usando Base64 do banco (prioridade máxima)');
      return character.standard_character_image; // Já é data URL completa
    }

    // PRIORIDADE 2: URLs antigas (backward compatibility)
    if(character.standard_character_picture_url || character.injured_character_picture_url) {
      const isInjured = character.current_hit_points <= (character.max_hit_points / 2);
      const hasInjuredURL = !!character.injured_character_picture_url;
      
      if (isInjured && hasInjuredURL) {
        console.log('[CharacterBox] Personagem ferido, usando URL ferida:', character.injured_character_picture_url);
        return character.injured_character_picture_url;
      } else {
        const url = character.standard_character_picture_url || character.injured_character_picture_url;
        console.log('[CharacterBox] Usando URL padrão:', url);
        return url;
      }
    }

    // PRIORIDADE 3: Fallback padrão
    console.log('[CharacterBox] Nenhuma imagem personalizada, usando fallback padrão');
    return '/assets/user.png';
  }

  const characterImageUrl = getCharacterPictureURL();
  
  const isDefaultImage = characterImageUrl === '/assets/user.png';
  const isBase64 = characterImageUrl?.startsWith('data:image/');
  const isExternalURL = characterImageUrl?.startsWith('http');

  console.log('[CharacterBox] Resultado final:', {
    imageUrl: characterImageUrl ? `${characterImageUrl.substring(0, 60)}...` : 'null',
    isDefaultImage,
    isBase64,
    isExternalURL,
    type: isBase64 ? 'base64' : isExternalURL ? 'external-url' : isDefaultImage ? 'default' : 'unknown'
  });

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

  const renderImage = () => {
    if (!characterImageUrl) return null;

    if (isBase64) {
      // Usar <img> normal para base64
      return (
        <img
          src={characterImageUrl}
          alt={`${character.name} Portrait`}
          className={classes.image}
          style={{
            width: '75px',
            height: '75px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      );
    }

    // Usar Next.js Image para URLs externas e fallback
    return (
      <Image
        src={characterImageUrl}
        alt={`${character.name} Portrait`}
        className={classes.image}
        width={75}
        height={75}
        // Prioridade apenas para URLs externas, não para fallback padrão
        priority={isExternalURL}
        loading={isDefaultImage ? "lazy" : "eager"}
      />
    );
  };

  return (
    <Box
      className={classes.root}
      {...rest}
    >
      {renderImage()}
      
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