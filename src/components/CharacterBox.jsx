import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';

import {
  Link as LinkIcon,
  Delete as DeleteIcon,
  Favorite as HeartIcon,
  FavoriteBorder as HeartIconNoLife,
  VideoCameraFront as CameraIcon
} from '@mui/icons-material';

import useModal from '../hooks/useModal';
import GeneratePortraitModal from './modals/GeneratePortraitModal';

function CharacterBox({ character, deleteCharacter, ...rest }) {
  const getCharacterPictureURL = () => {
    if(!character) {
      return null;
    }

    if(character.standard_character_picture_url && character.injured_character_picture_url) {
      if(character.current_hit_points > (character.max_hit_points / 2)) {
        return character.standard_character_picture_url;
      }
      else {
        return character.injured_character_picture_url;
      }
    } else {
      return `/assets/user.png`
    }
  }

  const generatePortraitModal = useModal(({ close, custom }) => (
    <GeneratePortraitModal
      handleClose={close}
      characterId={custom.characterId}
    />
  ));

  return (
    <Box
      sx={{
        backgroundColor: 'primary.900',
        borderRadius: '5px',
        padding: '15px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        minHeight: '121px',
        gap: '20px',
      }}
      {...rest}
    >
      <Image
        src={getCharacterPictureURL()}
        alt="Character Portrait"
        style={{
          width: '75px',
          height: '75px',
          borderRadius: '50%',
        }}
        width={70}
        height={100}
      />
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <Typography sx={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginTop: '8px',
          color: 'white'
        }}>
          {character.name} (ID: {character.id})
        </Typography>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#E80A67',
          gap: '3px',
        }}>
          {character.current_hit_points === 0 ? (
            <HeartIconNoLife />
          ) : (
            <HeartIcon />
          )}
          <Typography sx={{ fontWeight: 'bold', color: 'white' }}>
            {character.current_hit_points}/{character.max_hit_points}
          </Typography>
        </Box>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginTop: '10px'
        }}>
          <Button
            variant="outlined"
            href={`/sheet/${character.id}`}
            target="_blank"
            sx={{ 
              width: 40, 
              height: 40, 
              minWidth: 40, 
              borderRadius: '5px',
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderColor: 'primary.light',
                backgroundColor: 'primary.700'
              }
            }}
          >
            <LinkIcon />
          </Button>
          <Button
            variant="outlined"
            sx={{ 
              width: 40, 
              height: 40, 
              minWidth: 40, 
              borderRadius: '5px',
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderColor: 'primary.light',
                backgroundColor: 'primary.700'
              }
            }}
            onClick={() => generatePortraitModal.appear({ characterId: character.id })}
          >
            <CameraIcon />
          </Button>
          <Button
            variant="outlined"
            onClick={() => deleteCharacter(character.id)}
            sx={{ 
              width: 40, 
              height: 40, 
              minWidth: 40, 
              borderRadius: '5px',
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderColor: 'error.light',
                backgroundColor: 'error.dark'
              }
            }}
          >
            <DeleteIcon />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default CharacterBox;
