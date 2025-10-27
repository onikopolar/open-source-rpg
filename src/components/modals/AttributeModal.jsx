import React, { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import {
    TextField, Dialog, DialogActions, DialogContent, Grid,
    DialogTitle, Button
} from '@mui/material'
import { api } from '../../utils';

const styles = theme => ({})

function AttributeModal({
    classes,
    handleClose,
    onSubmit,
    data,
    operation
}) {
    const [attribute, setAttribute] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if(!data) {
            return;
        }

        setAttribute({
            name: data.name || '',
            description: data.description || ''
        });
    }, [data]);

    const resetState = () => {
        return setAttribute({
            name: '',
            description: ''
        });
    }

    const submit = () => {
        if(!attribute.name) {
            alert('Preencha o nome do atributo!');
            return;
        }

        if(operation === 'create') {
            api.post('/attribute', attribute)
                .then(() => {
                    onSubmit();
                    handleClose();
                    resetState();
                })
                .catch(() => {
                    alert('Erro ao criar o atributo!');
                });
        }
        else if (operation === 'edit') {
            api.put(`/attribute/${data.id}`, attribute)
                .then(() => {
                    onSubmit();
                    handleClose();
                    resetState();
                })
                .catch(() => {
                    alert('Erro ao editar o atributo!');
                });
        }
    }

    return (
        <Dialog open={true} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {operation === 'create' ? 'Criar novo atributo' : 'Editar atributo'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField
                            style={{ marginTop: '15px' }}
                            autoFocus
                            label="Nome"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={attribute.name}
                            onChange={({ target }) => {
                                setAttribute(prevState => ({
                                    ...prevState,
                                    name: target.value
                                }));
                            }}
                            spellCheck={false}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            style={{ marginTop: '15px' }}
                            label="Descrição"
                            type="text"
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            value={attribute.description}
                            onChange={({ target }) => {
                                setAttribute(prevState => ({
                                    ...prevState,
                                    description: target.value
                                }));
                            }}
                            spellCheck={false}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="secondary">
                    Cancelar
                </Button>
                <Button onClick={submit} variant="contained">
                    Confirmar
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default withStyles(styles)(AttributeModal);
