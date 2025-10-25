import React, { useState } from 'react';
import { withStyles } from '@mui/styles';
import {
    TextField, Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle, Button, Grid, Box
} from '@mui/material'
import { Casino, Replay, Warning } from '@mui/icons-material';

import { api } from '../../utils'

const styles = theme => ({

})

function YearZeroDiceModal({
    classes,
    handleClose,
    characterId,
    onDiceRoll
}) {
    const [skillDice, setSkillDice] = useState(0);
    const [attributeDice, setAttributeDice] = useState(0);
    const [gearDice, setGearDice] = useState(0);

    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [result, setResult] = useState(null);
    const [pushState, setPushState] = useState('initial');

    const rollSingleDie = () => {
        return Math.floor(Math.random() * 6) + 1;
    }

    const rollYearZeroDice = () => {
        setButtonDisabled(true);

        const totalDice = skillDice + attributeDice + gearDice;
        
        if(totalDice < 1) {
            setButtonDisabled(false);
            return window.alert('E necessario pelo menos 1 dado para rolar');
        }

        const diceRolls = Array.from({ length: totalDice }, rollSingleDie);
        
        const rollResult = {
            dice: diceRolls,
            successes: diceRolls.filter(value => value === 6).length,
            failures: diceRolls.filter(value => value === 1).length,
            pushState: 'initial',
            totalDice: totalDice
        };

        setResult(rollResult);
        setPushState('initial');
        setButtonDisabled(false);

        api.post('roll', {
            character_id: characterId,
            max_number: 6,
            times: totalDice
        }).catch(err => {
            console.log(err);
        });
    }

    const pushRoll = () => {
        setButtonDisabled(true);

        const newDice = result.dice.map(die => {
            return die === 6 || die === 1 ? die : rollSingleDie();
        });
        
        const pushResult = {
            dice: newDice,
            successes: newDice.filter(value => value === 6).length,
            failures: newDice.filter(value => value === 1).length,
            pushState: 'pushed',
            totalDice: result.totalDice
        };

        setResult(pushResult);
        setPushState('pushed');
        setButtonDisabled(false);
    }

    const getDieStyle = (value) => {
        if(value === 6) {
            return { backgroundColor: '#4caf50', color: 'white', fontWeight: 'bold' };
        }
        if(value === 1) {
            return { backgroundColor: '#f44336', color: 'white', fontWeight: 'bold' };
        }
        return { backgroundColor: '#e0e0e0' };
    };

    return (
        <Dialog
            open={true}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>
                {result ? 'Resultado Year Zero Engine' : 'Rolar Dados Year Zero Engine'}
            </DialogTitle>
            <DialogContent>
                {
                    result ? (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <DialogContentText>
                                    Sistema Year Zero Engine
                                </DialogContentText>
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    {result.dice.map((value, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: 1,
                                                ...getDieStyle(value)
                                            }}
                                        >
                                            {value}
                                        </Box>
                                    ))}
                                </Box>
                            </Grid>

                            <Grid item xs={6}>
                                <DialogContentText>
                                    Sucessos: {result.successes}
                                </DialogContentText>
                            </Grid>
                            <Grid item xs={6}>
                                <DialogContentText>
                                    Falhas: {result.failures}
                                </DialogContentText>
                            </Grid>

                            {pushState === 'initial' && (
                                <Grid item xs={12}>
                                    <DialogContentText>
                                        <Warning style={{ verticalAlign: 'middle', marginRight: 8 }} />
                                        Voce pode empurrar a rolagem para rerolar dados.
                                    </DialogContentText>
                                </Grid>
                            )}

                            {pushState === 'pushed' && (
                                <Grid item xs={12}>
                                    <DialogContentText>
                                        {result.successes > 0 
                                            ? `Acao bem-sucedida com ${result.successes} sucesso(s)` 
                                            : 'Acao falhou'
                                        }
                                    </DialogContentText>
                                </Grid>
                            )}
                        </Grid>
                    ) : (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <DialogContentText>
                                    Sistema Year Zero Engine - Cada 6 e um sucesso
                                </DialogContentText>
                            </Grid>

                            <Grid item xs={4}>
                                <TextField
                                    autoFocus
                                    label="Dados de Habilidade"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={skillDice}
                                    onChange={({ target }) => {
                                        setSkillDice(Number(target.value));
                                    }}
                                />
                            </Grid>

                            <Grid item xs={4}>
                                <TextField
                                    label="Dados de Atributo"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={attributeDice}
                                    onChange={({ target }) => {
                                        setAttributeDice(Number(target.value));
                                    }}
                                />
                            </Grid>

                            <Grid item xs={4}>
                                <TextField
                                    label="Dados de Equipamento"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={gearDice}
                                    onChange={({ target }) => {
                                        setGearDice(Number(target.value));
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <DialogContentText>
                                    Total de dados: {skillDice + attributeDice + gearDice}
                                </DialogContentText>
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
                
                {result ? (
                    <Box>
                        {pushState === 'initial' && (
                            <Button
                                onClick={pushRoll}
                                startIcon={<Replay />}
                                color="warning"
                                style={{ marginRight: 8 }}
                            >
                                Empurrar Rolagem
                            </Button>
                        )}
                        <Button
                            onClick={() => setResult(null)}
                        >
                            Nova Rolagem
                        </Button>
                    </Box>
                ) : (
                    <Button
                        onClick={rollYearZeroDice}
                        disabled={buttonDisabled}
                        startIcon={<Casino />}
                    >
                        Rolar Dados
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

export default withStyles(styles)(YearZeroDiceModal);
