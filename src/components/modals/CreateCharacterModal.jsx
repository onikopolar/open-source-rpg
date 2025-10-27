import React, { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import {
    TextField, Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle, Button
} from '@mui/material'

import { api } from '../../utils';

const styles = theme => ({

})

function CreateCharacterModal({
    classes,
    handleClose,
    onCharacterCreated,
    data,
    operation = 'create'
}) {
    const [character, setCharacter] = useState({
        name: ''
    });

    useEffect(() => {
        console.log('CreateCharacterModal mounted:', { operation, data });
        if (operation === 'edit' && data) {
            setCharacter({
                name: data.name || ''
            });
        }
    }, [data, operation]);

    const resetState = () => {
        return setCharacter({
            name: ''
        });
    }

    const createCharacter = () => {
        console.log('Creating character:', character);
        if(!character.name) {
            console.log('Error: Character name is empty');
            alert('Nome do personagem é obrigatório!');
            return;
        }

        api.post('/character', character)
            .then((response) => {
                console.log('Character created successfully:', response.data);
                // Callback
                onCharacterCreated();
                // Close modal
                handleClose();
                resetState();
            })
            .catch((error) => {
                console.error('Error creating character:', error);
                alert('Erro ao criar o personagem!');
            });
    }

    const editCharacter = () => {
        console.log('Editing character:', { id: data.id, character });
        if(!character.name) {
            console.log('Error: Character name is empty');
            alert('Nome do personagem é obrigatório!');
            return;
        }

        api.put('/character/' + data.id, character)
            .then((response) => {
                console.log('Character edited successfully:', response.data);
                // Callback
                onCharacterCreated();
                // Close modal
                handleClose();
                resetState();
            })
            .catch((error) => {
                console.error('Error editing character:', error);
                alert('Erro ao editar o personagem!');
            });
    }

    const handleSubmit = () => {
        console.log('Handle submit called:', operation);
        if (operation === 'create') {
            createCharacter();
        } else if (operation === 'edit') {
            editCharacter();
        }
    }

    const getTitle = () => {
        return operation === 'create' ? 'Criar novo personagem' : 'Editar personagem';
    }

    const getButtonText = () => {
        return operation === 'create' ? 'Criar' : 'Salvar';
    }

    return (
        <Dialog
            open={true}
            onClose={handleClose}
        >
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {operation === 'create' 
                        ? 'Insira as informações do personagem que deseja criar.'
                        : 'Edite as informações do personagem.'
                    }
                </DialogContentText>
                <TextField
                    style={{
                        marginTop: '15px'
                    }}
                    autoFocus
                    label="Nome"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={character.name}
                    onChange={
                        ({ target }) => {
                            const value = target.value;
                            console.log('Name changed:', value);
                            setCharacter(prevState => ({
                                ...prevState,
                                name: value
                            }));
                        }
                    }
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleClose}
                    color="secondary"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                >
                    {getButtonText()}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default withStyles(styles)(CreateCharacterModal);
