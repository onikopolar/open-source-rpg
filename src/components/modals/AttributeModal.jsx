import React, { useState } from 'react';
import { withStyles } from '@mui/styles';
import {
    TextField, Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle, Button, Grid, Select, MenuItem, FormControl, InputLabel,
    Box, Typography
} from '@mui/material';

import { api } from '../../utils';

const styles = theme => ({});

function AttributeModal({
    classes,
    handleClose,
    characterId,
    characterName,
    attributeName,
    attributeValue
}) {
    const [timesToRoll, setTimesToRoll] = useState(1);
    const [facesNumber, setFacesNumber] = useState(20);
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [result, setResult] = useState(null);

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
    };

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
            faces,
            attributeName,
            attributeValue: parseInt(attributeValue) || 0
        };
    };

    const rollDice = () => {
        setButtonDisabled(true);

        if(!timesToRoll || !facesNumber) {
            alert('É necessário escolher todos os campos!');
            setButtonDisabled(false);
            return;
        }

        if(timesToRoll < 1) {
            alert('O número de dados precisa ser maior que 1.');
            setButtonDisabled(false);
            return;
        }

        const numericValue = parseInt(attributeValue) || 0;
        if (!attributeValue || numericValue === 0) {
            alert('Por favor, insira um valor para o atributo primeiro!');
            setButtonDisabled(false);
            return;
        }

        api.post('roll', {
            character_id: characterId,
            max_number: facesNumber,
            times: timesToRoll
        })
        .then(res => {
            const rollResult = getRollResult(res.data, facesNumber);
            setResult(rollResult);
            setButtonDisabled(false);
        })
        .catch(err => {
            console.log(err);
            setButtonDisabled(false);
        });
    };

    const getResultColor = (result) => {
        if (result.criticalSuccess) return '#4caf50';
        if (result.criticalFailure) return '#f44336';
        if (result.successes > 0) return '#2196f3';
        return '#ff9800';
    };

    const getResultText = (result) => {
        if (result.criticalSuccess) return 'SUCESSO CRÍTICO';
        if (result.criticalFailure) return 'FALHA CRÍTICA';
        if (result.successes > 0) return 'SUCESSO';
        return 'FALHA';
    };

    return (
        <Dialog
            open={true}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>
                {result ? `Resultado - ${attributeName}` : `Rolar ${attributeName}`}
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
                                            <strong>Atributo:</strong> {result.attributeValue}
                                        </Typography>
                                    </Grid>
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
                                    <Grid item xs={6}>
                                        <Typography variant="body1">
                                            <strong>Dados:</strong> {result.rolls.length}d{result.faces}
                                        </Typography>
                                    </Grid>
                                    {result.criticalSuccess && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="success.main">
                                                <strong>Crítico:</strong> Valor máximo alcançado no dado
                                            </Typography>
                                        </Grid>
                                    )}
                                    {result.criticalFailure && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="error.main">
                                                <strong>Crítico:</strong> Valor mínimo alcançado no dado
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
                                    Configure a rolagem para o atributo <strong>{attributeName}</strong> com valor <strong>{attributeValue}</strong>.
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
                                    onChange={({ target }) => {
                                        const value = target.value;
                                        setTimesToRoll(Number(value));
                                    }}
                                    inputProps={{ min: 1 }}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Número de faces</InputLabel>
                                    <Select
                                        value={facesNumber}
                                        label="Número de faces"
                                        onChange={({ target }) => {
                                            const value = target.value;
                                            setFacesNumber(Number(value));
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
                    onClick={() => {
                        return result ? setResult(null) : rollDice()
                    }}
                    disabled={buttonDisabled}
                    variant="contained"
                >
                    {result ? 'Nova Rolagem' : 'Rolar Dados'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default withStyles(styles)(AttributeModal);
