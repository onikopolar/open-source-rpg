import React, { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import {
    TextField, Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle, Button, Grid, Select, MenuItem, FormControl, InputLabel,
    Box, Typography
} from '@mui/material'

import { api } from '../../utils'

const styles = theme => ({

})

function DiceRollModal({
    classes,
    handleClose,
    characterId,
    onDiceRoll
}) {
    // Carregar preferências salvas ou usar padrão
    const [timesToRoll, setTimesToRoll] = useState(1);
    const [facesNumber, setFacesNumber] = useState(6);
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [result, setResult] = useState(null);

    // Quando o modal abre, carrega as preferências salvas
    useEffect(() => {
        const savedTimes = localStorage.getItem('diceRoller_timesToRoll');
        const savedFaces = localStorage.getItem('diceRoller_facesNumber');
        
        if (savedTimes) setTimesToRoll(Number(savedTimes));
        if (savedFaces) setFacesNumber(Number(savedFaces));
    }, []);

    // Salvar preferências quando mudar
    const savePreferences = (times, faces) => {
        localStorage.setItem('diceRoller_timesToRoll', times);
        localStorage.setItem('diceRoller_facesNumber', faces);
    };

    const getSuccessThreshold = (faces) => {
        const thresholds = {
            3: 2,
            4: 3,
            6: 4,
            8: 5,
            10: 6,
            12: 7,
            16: 9,
            20: 11,
            30: 16,
            100: 51
        };
        return thresholds[faces] || Math.ceil(faces / 2);
    }

    const getRollResult = (rolls, faces) => {
        const threshold = getSuccessThreshold(faces);
        const total = rolls.reduce((acc, curr) => acc + curr.rolled_number, 0);
        const successes = rolls.filter(roll => roll.rolled_number >= threshold).length;
        const failures = rolls.filter(roll => roll.rolled_number < threshold).length;
        const criticalSuccess = rolls.some(roll => roll.rolled_number === faces);
        const criticalFailure = rolls.some(roll => roll.rolled_number === 1);

        return {
            rolls,
            total,
            successes,
            failures,
            criticalSuccess,
            criticalFailure,
            threshold,
            faces
        };
    }

    const rollDice = () => {
        setButtonDisabled(true);

        if(!timesToRoll || !facesNumber) {
            return window.alert('É necessário escolher todos os campos!');
        }

        if(timesToRoll < 1) {
            return window.alert('O número de dados precisa ser maior que 1.');
        }

        // Salvar as preferências atuais
        savePreferences(timesToRoll, facesNumber);

        api.post('roll', {
            character_id: characterId,
            max_number: facesNumber,
            times: timesToRoll
        })
        .then(res => {
            const rollResult = getRollResult(res.data, facesNumber);
            setResult(rollResult);
            setButtonDisabled(false);

            if(onDiceRoll) {
                onDiceRoll(rollResult);
            }
        })
        .catch(err => {
            console.log(err);
        });
    }

    const getResultColor = (result) => {
        if (result.criticalSuccess) return '#4caf50';
        if (result.criticalFailure) return '#f44336';
        if (result.successes > 0) return '#2196f3';
        return '#ff9800';
    }

    const getResultText = (result) => {
        if (result.criticalSuccess) return 'Sucesso Crítico';
        if (result.criticalFailure) return 'Falha Crítica';
        if (result.successes > 0) return 'Sucesso';
        return 'Falha';
    }

    return (
        <Dialog
            open={true}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
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
                                    backgroundColor: getResultColor(result),
                                    color: 'white',
                                    borderRadius: 1,
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    mb: 2
                                }}>
                                    <Typography variant="h6">
                                        {getResultText(result)}
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
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
                                                backgroundColor: '#e0e0e0',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {each.rolled_number}
                                        </Box>
                                    ))}
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body1">
                                            <strong>Total:</strong> {result.total}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body1">
                                            <strong>Sucessos:</strong> {result.successes}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body1">
                                            <strong>Falhas:</strong> {result.failures}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body1">
                                            <strong>Limite:</strong> {result.threshold}+
                                        </Typography>
                                    </Grid>
                                    {result.criticalSuccess && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="success.main">
                                                <strong>Crítico:</strong> Valor máximo alcançado
                                            </Typography>
                                        </Grid>
                                    )}
                                    {result.criticalFailure && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="error.main">
                                                <strong>Crítico:</strong> Valor mínimo alcançado
                                            </Typography>
                                        </Grid>
                                    )}
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
                                    onChange={
                                        ({ target }) => {
                                            const value = target.value;
                                            setTimesToRoll(Number(value));
                                            // Salva automaticamente quando muda
                                            savePreferences(Number(value), facesNumber);
                                        }
                                    }
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Número de faces</InputLabel>
                                    <Select
                                        value={facesNumber}
                                        label="Número de faces"
                                        onChange={
                                            ({ target }) => {
                                                const value = target.value;
                                                setFacesNumber(Number(value));
                                                // Salva automaticamente quando muda
                                                savePreferences(timesToRoll, Number(value));
                                            }
                                        }
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
                        onClick={() => {
                            return result ? setResult(null) : rollDice()
                        }}
                        disabled={buttonDisabled}
                    >
                        {result ? 'Novos Dados' : 'Rolar'}
                    </Button>
            </DialogActions>
        </Dialog>
    )
}

export default withStyles(styles)(DiceRollModal);
