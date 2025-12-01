import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { withStyles } from '@mui/styles';
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

function CharacterBox({ character, deleteCharacter, classes, ...rest }) {
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
      className={classes.root}
      {...rest}
    >
      <Image
        src={getCharacterPictureURL()}
        alt="Character Portrait"
        className={classes.image}
        width={70}
        height={100}
      />
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
          >
            <LinkIcon />
          </Button>
          <Button
            variant="outlined"
            className={classes.button}
            onClick={() => generatePortraitModal.appear({ characterId: character.id })}
          >
            <CameraIcon />
          </Button>
          <Button
            variant="outlined"
            onClick={() => deleteCharacter(character.id)}
            className={`${classes.button} ${classes.deleteButton}`}
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
  },
  content: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'start',
    flexDirection: 'column',
    gap: '10px',
    width: 'calc(100% - 95px)', // 75px da imagem + 20px do gap
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