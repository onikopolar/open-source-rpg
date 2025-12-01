import React, { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import {
    TextField, Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle, Button, Grid, Select, MenuItem, FormControl, InputLabel,
    Box, Typography
} from '@mui/material'

import { api } from '../../utils'
import socket from '../../utils/socket'

const styles = theme => ({
    dialogPaper: {
        zIndex: '9999 !important'
    }
})

function DiceRollModal({
    classes,
    handleClose,
    characterId,
    onDiceRoll,
    zIndex = 9999
}) {
    const [timesToRoll, setTimesToRoll] = useState(1);
    const [facesNumber, setFacesNumber] = useState(6);
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const savedTimes = localStorage.getItem('diceRoller_timesToRoll');
        const savedFaces = localStorage.getItem('diceRoller_facesNumber');

        if (savedTimes) setTimesToRoll(Number(savedTimes));
        if (savedFaces) setFacesNumber(Number(savedFaces));
    }, []);

    const savePreferences = (times, faces) => {
        localStorage.setItem('diceRoller_timesToRoll', times);
        localStorage.setItem('diceRoller_facesNumber', faces);
    };

    const getRollResult = (rolls, faces) => {
        const total = rolls.reduce((acc, curr) => acc + curr.rolled_number, 0);
        
        return {
            rolls,
            total,
            faces
        };
    }

    const rollDiceLocal = () => {
        const fakeRolls = Array.from({ length: timesToRoll }, () => ({
            rolled_number: Math.floor(Math.random() * facesNumber) + 1
        }));
        
        const rollResult = getRollResult(fakeRolls, facesNumber);
        
        setResult(rollResult);
        setButtonDisabled(false);
        
        if(onDiceRoll) {
            onDiceRoll(rollResult);
        }
    };

    const rollDice = () => {
        setButtonDisabled(true);

        if(!timesToRoll || !facesNumber) {
            window.alert('É necessário escolher todos os campos!');
            setButtonDisabled(false);
            return;
        }

        if(timesToRoll < 1) {
            window.alert('O número de dados precisa ser maior que 0.');
            setButtonDisabled(false);
            return;
        }

        savePreferences(timesToRoll, facesNumber);

        if (!characterId) {
            rollDiceLocal();
            return;
        }

        api.post('roll', {
            character_id: characterId,
            max_number: facesNumber,
            times: timesToRoll
        })
        .then(res => {
            if (!res.data) {
                setButtonDisabled(false);
                window.alert('Erro: resposta vazia da API');
                return;
            }

            if (!Array.isArray(res.data)) {
                setButtonDisabled(false);
                window.alert('Erro: formato de resposta inválido');
                return;
            }

            const rollResult = getRollResult(res.data, facesNumber);
            setResult(rollResult);
            setButtonDisabled(false);

            if (socket && characterId) {
                socket.emit('dice_roll', {
                    character_id: characterId,
                    rolls: res.data
                });
            }

            if(onDiceRoll) {
                onDiceRoll(rollResult);
            }
        })
        .catch(err => {
            rollDiceLocal();
        });
    }

    const handleRollButtonClick = () => {
        if (result) {
            setResult(null);
        } else {
            rollDice();
        }
    }

    const handleTimesChange = (value) => {
        const numValue = Number(value);
        setTimesToRoll(numValue);
        savePreferences(numValue, facesNumber);
    }

    const handleFacesChange = (value) => {
        const numValue = Number(value);
        setFacesNumber(numValue);
        savePreferences(timesToRoll, numValue);
    }

    return (
        <Dialog
            open={true}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            classes={{
                paper: classes.dialogPaper
            }}
            sx={{
                zIndex: `${zIndex} !important`,
                '& .MuiDialog-container': {
                    zIndex: `${zIndex} !important`
                },
                '& .MuiBackdrop-root': {
                    zIndex: `${zIndex - 1} !important`
                }
            }}
        >
            <DialogTitle>
                {result ? 'Resultado da Rolagem' : 'Rolar Dados'}
            </DialogTitle>
            <DialogContent>
                {
                    result ? (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Box sx={{
                                    p: 2,
                                    backgroundColor: '#2196f3',
                                    color: 'white',
                                    borderRadius: 1,
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    mb: 2
                                }}>
                                    <Typography variant="h6">
                                        Resultado
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, justifyContent: 'center' }}>
                                    {result.rolls.map((each, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: 1,
                                                backgroundColor: '#7a6c69ff',
                                                fontWeight: 'bold',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            {each.rolled_number}
                                        </Box>
                                    ))}
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" align="center">
                                            Total: {result.total}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body1" align="center">
                                            <strong>Dados:</strong> {result.rolls.length}d{result.faces}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body1" align="center">
                                            <strong>Rolagens:</strong> {result.rolls.length}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <DialogContentText>
                                    Selecione o número de dados que você deseja rolar ao mesmo tempo e o número de faces.
                                </DialogContentText>
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    autoFocus
                                    label="Número de dados"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={timesToRoll}
                                    onChange={({ target }) => handleTimesChange(target.value)}
                                    inputProps={{ 
                                        min: 1,
                                        max: 100
                                    }}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Número de faces</InputLabel>
                                    <Select
                                        value={facesNumber}
                                        label="Número de faces"
                                        onChange={({ target }) => handleFacesChange(target.value)}
                                        MenuProps={{
                                            sx: {
                                                zIndex: '99999 !important'
                                            },
                                            PaperProps: {
                                                sx: {
                                                    zIndex: '99999 !important'
                                                }
                                            }
                                        }}
                                    >
                                        <MenuItem value={3}>D3</MenuItem>
                                        <MenuItem value={4}>D4</MenuItem>
                                        <MenuItem value={6}>D6</MenuItem>
                                        <MenuItem value={8}>D8</MenuItem>
                                        <MenuItem value={10}>D10</MenuItem>
                                        <MenuItem value={12}>D12</MenuItem>
                                        <MenuItem value={16}>D16</MenuItem>
                                        <MenuItem value={20}>D20</MenuItem>
                                        <MenuItem value={30}>D30</MenuItem>
                                        <MenuItem value={100}>D100</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    )
                }
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleClose}
                    color="secondary"
                >
                    Fechar
                </Button>
                <Button
                    onClick={handleRollButtonClick}
                    disabled={buttonDisabled}
                    variant="contained"
                    color="primary"
                >
                    {result ? 'Nova Rolagem' : 'Rolar'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default withStyles(styles)(DiceRollModal);