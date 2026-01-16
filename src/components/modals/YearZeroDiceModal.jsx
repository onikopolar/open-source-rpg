import React, { useState } from 'react';
import { withStyles } from '@mui/styles';
import {
    TextField, Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle, Button, Grid, Box, Paper, Typography, Collapse
} from '@mui/material'
import { Casino, Replay, Warning, Psychology } from '@mui/icons-material';

import { api } from '../../utils'

const styles = theme => ({
    modal: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    paper: {
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
        maxWidth: "90vw",
        maxHeight: "90vh",
        overflow: "auto"
    },
    // Estilos para pânico - cores sérias de perigo extremo
    panicAlert: {
        position: "relative",
        background: "#0a0a0a",
        border: "3px solid #ff0000",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        color: "#ffffff",
        textAlign: "center",
        boxShadow: "0 0 40px rgba(255, 0, 0, 0.8)",
        overflow: "hidden"
    },
    panicGlow: {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        height: "3px",
        background: "#ff0000",
        animation: "$panicFlash 1s infinite"
    },
    panicHeader: {
        fontSize: "1.8rem",
        fontWeight: "900",
        marginBottom: "15px",
        color: "#ff0000",
        letterSpacing: "3px",
        textTransform: "uppercase"
    },
    panicDiceGrid: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        justifyContent: "center",
        margin: "15px 0"
    },
    panicDie: {
        width: "40px",
        height: "40px",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: "1.2rem",
        position: "relative",
        border: "2px solid",
        transition: "all 0.3s ease"
    },
    panicDieHighlight: {
        background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
        borderColor: "#FF8C00",
        color: "#8B0000",
        boxShadow: "0 0 15px #FFD700, inset 0 0 10px rgba(255, 255, 255, 0.5)",
        animation: "$panicShake 0.5s infinite"
    },
    stressDie: {
        background: "linear-gradient(135deg, #FFA500 0%, #FF6347 100%)",
        borderColor: "#FF4500",
        color: "white"
    },
    normalDie: {
        background: "linear-gradient(135deg, #FFFFFF 0%, #F0F0F0 100%)",
        borderColor: "#CCCCCC",
        color: "#333333"
    },
    panicBadge: {
        position: "absolute",
        top: "-5px",
        right: "-5px",
        background: "#ff0000",
        color: "white",
        borderRadius: "50%",
        width: "20px",
        height: "20px",
        fontSize: "0.8rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        boxShadow: "0 0 10px #ff0000"
    },
    resultBox: {
        background: "rgba(255, 0, 0, 0.1)",
        border: "1px solid #ff0000",
        borderRadius: "6px",
        padding: "15px",
        margin: "15px 0",
        color: "#ffffff"
    },
    resultText: {
        fontSize: "0.9rem",
        lineHeight: "1.4",
        textAlign: "left"
    },
    instructionText: {
        fontSize: "0.8rem",
        fontStyle: "italic",
        color: "#ff6b6b",
        textAlign: "center",
        marginTop: "10px"
    },
    // Animações
    "@keyframes panicFlash": {
        "0%": { opacity: "1" },
        "50%": { opacity: "0.3" },
        "100%": { opacity: "1" }
    },
    "@keyframes panicShake": {
        "0%": { transform: "translateX(0)" },
        "25%": { transform: "translateX(-2px)" },
        "50%": { transform: "translateX(2px)" },
        "75%": { transform: "translateX(-2px)" },
        "100%": { transform: "translateX(0)" }
    }
})

const PANIC_TABLE = [
    { range: "1–6", effect: "SEGURANDO A ONDA. Você consegue manter seus nervos sob controle. Muito mal." },
    { range: "7", effect: "TIQUE NERVOSO. Seu NÍVEL DE ESTRESSE, e o NÍVEL DE ESTRESSE de todos os PJs amigáveis em uma distância CURTA de você, aumentam em um." },
    { range: "8", effect: "TREMEDEIRA. Você começa a tremer incontrolavelmente. Todas as rolagens de habilidade usando AGILIDADE sofrem uma modificação de -2 até que seu pânico pare." },
    { range: "9", effect: "SOLTAR ITEM. Seja por estresse, confusão ou pela percepção de que todos vão morrer de qualquer maneira, você solta uma arma ou outro item importante — a MJ decide qual. Seu NÍVEL DE ESTRESSE aumenta imediatamente em um." },
    { range: "10", effect: "CONGELAR. Você está paralisado pelo medo ou pelo estresse por uma Rodada, perdendo sua próxima ação lenta. Seu NÍVEL DE ESTRESSE, e o NÍVEL DE ESTRESSE de todos os PJs amigáveis em uma distância CURTA de você, aumentam em um." },
    { range: "11", effect: "BUSCAR COBERTURA. Você deve usar sua próxima ação para se afastar do perigo e encontrar um local seguro, se possível. Você tem permissão para fazer um teste de recuo se você tiver um inimigo no alcance ENGAJADO. Seu NÍVEL DE ESTRESSE diminui em um, mas o NÍVEL DE ESTRESSE de todos os PJs amigáveis à distância CURTA de você aumenta em um. Após uma Rodada, você pode agir normalmente." },
    { range: "12", effect: "GRITO. Você grita o mais alto possível por uma Rodada, perdendo sua próxima ação lenta. Seu NÍVEL DE ESTRESSE diminui em um, mas todo personagem amigável que ouve seu grito deve fazer uma Rolagem de Pânico imediata." },
    { range: "13", effect: "FUGA. Você simplesmente não aguenta mais. Você deve fugir para um lugar seguro e se recusar a deixá-lo. Você não atacará ninguém e não tentará nada perigoso. Você não tem permissão para fazer um teste de recuo se você tiver um inimigo no alcance ENGAJADO. Seu NÍVEL DE ESTRESSE diminui em um, mas todo personagem amigável que te vê fugir deve fazer uma Rolagem de Pânico imediata." },
    { range: "14", effect: "FRENESI. Você deve atacar imediatamente a pessoa ou criatura mais próxima, amigável ou não. Você não vai parar até que você ou seu alvo esteja Quebrado. Todo personagem amistoso que testemunhar sua fúria deve fazer uma Rolagem de Pânico imediata." },
    { range: "15+", effect: "CATATÔNICO. Você cai no chão e não pode falar ou se mover, olhando fixamente para o nada." }
];

function YearZeroDiceModal({
    classes,
    handleClose,
    characterId,
    baseDice = 0,
    skillDice = 0,
    gearDice = 0,
    attributeName = '',
    skillName = '',
    character,
    stressSquares = [], // NOVO: Receber os quadrados de estresse
    onDiceRoll,
    onPushRoll
}) {
    const [skillDiceInput, setSkillDiceInput] = useState(skillDice);
    const [attributeDiceInput, setAttributeDiceInput] = useState(baseDice);
    const [gearDiceInput, setGearDiceInput] = useState(gearDice);
    
    // NOVO: Calcular nível de estresse baseado nos quadrados
    const stressLevel = stressSquares ? stressSquares.filter(Boolean).length : 0;
    const [stressDiceInput, setStressDiceInput] = useState(stressLevel);

    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [result, setResult] = useState(null);
    const [pushState, setPushState] = useState('initial');
    const [showPanicAlert, setShowPanicAlert] = useState(false);
    const [panicRollResult, setPanicRollResult] = useState(null);
    const [showPanicEffect, setShowPanicEffect] = useState(false);

    const rollSingleDie = () => {
        return Math.floor(Math.random() * 6) + 1;
    }

    const rollPanic = () => {
        const panicRoll = rollSingleDie();
        // NOVO: Usar o nível de estresse calculado dos quadrados
        const totalPanicRoll = panicRoll + stressLevel;
        
        let panicEffect;
        if (totalPanicRoll <= 6) panicEffect = PANIC_TABLE[0];
        else if (totalPanicRoll <= 7) panicEffect = PANIC_TABLE[1];
        else if (totalPanicRoll <= 8) panicEffect = PANIC_TABLE[2];
        else if (totalPanicRoll <= 9) panicEffect = PANIC_TABLE[3];
        else if (totalPanicRoll <= 10) panicEffect = PANIC_TABLE[4];
        else if (totalPanicRoll <= 11) panicEffect = PANIC_TABLE[5];
        else if (totalPanicRoll <= 12) panicEffect = PANIC_TABLE[6];
        else if (totalPanicRoll <= 13) panicEffect = PANIC_TABLE[7];
        else if (totalPanicRoll <= 14) panicEffect = PANIC_TABLE[8];
        else panicEffect = PANIC_TABLE[9];

        setPanicRollResult({
            panicRoll: panicRoll,
            stressLevel: stressLevel, // NOVO: Usar stressLevel calculado
            totalPanicRoll: totalPanicRoll,
            effect: panicEffect
        });
        setShowPanicEffect(false);
    }

    const revealPanicEffect = () => {
        setShowPanicEffect(true);
    }

    const rollYearZeroDice = () => {
        setButtonDisabled(true);
        setShowPanicAlert(false);
        setPanicRollResult(null);
        setShowPanicEffect(false);

        const totalDice = skillDiceInput + attributeDiceInput + gearDiceInput + stressDiceInput;

        if(totalDice < 1) {
            setButtonDisabled(false);
            return window.alert('É necessário pelo menos 1 dado para rolar');
        }

        const whiteDiceCount = attributeDiceInput + skillDiceInput + gearDiceInput;
        const yellowDiceCount = stressDiceInput;

        const whiteResults = Array.from({ length: whiteDiceCount }, rollSingleDie);
        const yellowResults = Array.from({ length: yellowDiceCount }, rollSingleDie);

        const allResults = [...whiteResults, ...yellowResults];

        const whiteSuccesses = whiteResults.filter(value => value === 6).length;
        const yellowSuccesses = yellowResults.filter(value => value === 6).length;
        const panics = yellowResults.filter(value => value === 1).length;

        const totalSuccesses = whiteSuccesses + yellowSuccesses;
        const hasPanic = panics > 0;

        const rollResult = {
            dice: allResults,
            whiteResults: whiteResults,
            yellowResults: yellowResults,
            successes: totalSuccesses,
            failures: allResults.filter(value => value === 1).length,
            pushState: 'initial',
            totalDice: totalDice,
            whiteDiceCount: whiteDiceCount,
            yellowDiceCount: yellowDiceCount,
            whiteSuccesses: whiteSuccesses,
            yellowSuccesses: yellowSuccesses,
            panics: panics,
            hasPanic: hasPanic
        };

        setResult(rollResult);
        setPushState('initial');
        setButtonDisabled(false);

        if (hasPanic) {
            setShowPanicAlert(true);
            rollPanic();
        }

        if (onDiceRoll) {
            onDiceRoll(rollResult);
        }

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
        setShowPanicAlert(false);
        setPanicRollResult(null);
        setShowPanicEffect(false);

        if (onPushRoll) {
            onPushRoll();
        }

        const newWhiteDice = result.whiteResults.map(die => {
            return die === 6 || die === 1 ? die : rollSingleDie();
        });

        const newYellowDice = result.yellowResults.map(die => {
            return die === 6 || die === 1 ? die : rollSingleDie();
        });

        const allNewResults = [...newWhiteDice, ...newYellowDice];

        const whiteSuccesses = newWhiteDice.filter(value => value === 6).length;
        const yellowSuccesses = newYellowDice.filter(value => value === 6).length;
        const panics = newYellowDice.filter(value => value === 1).length;

        const totalSuccesses = whiteSuccesses + yellowSuccesses;
        const hasPanic = panics > 0;

        const pushResult = {
            dice: allNewResults,
            whiteResults: newWhiteDice,
            yellowResults: newYellowDice,
            successes: totalSuccesses,
            failures: allNewResults.filter(value => value === 1).length,
            pushState: 'pushed',
            totalDice: result.totalDice,
            whiteDiceCount: result.whiteDiceCount,
            yellowDiceCount: result.yellowDiceCount,
            whiteSuccesses: whiteSuccesses,
            yellowSuccesses: yellowSuccesses,
            panics: panics,
            hasPanic: hasPanic
        };

        setResult(pushResult);
        setPushState('pushed');
        setButtonDisabled(false);

        if (hasPanic) {
            setShowPanicAlert(true);
            rollPanic();
        }
    }

    const getDieStyle = (value, index) => {
        const isYellowDie = index >= result.whiteResults.length;
        const isPanicDie = isYellowDie && value === 1;

        if (isPanicDie) {
            return {
                backgroundColor: '#FF8C00',
                color: '#000000',
                fontWeight: 'bold',
                border: '3px solid #FF4500',
                boxShadow: '0 0 15px rgba(255, 140, 0, 0.8)'
            };
        }
        if(value === 6) {
            return {
                backgroundColor: isYellowDie ? '#ffeb3b' : '#4caf50',
                color: isYellowDie ? '#000000' : 'white',
                fontWeight: 'bold',
                border: isYellowDie ? '2px solid #ff9800' : 'none'
            };
        }
        if(value === 1) {
            return {
                backgroundColor: isYellowDie ? '#fff9c4' : '#e0e0e0',
                color: isYellowDie ? '#000000' : '#000000',
                fontWeight: 'bold',
                border: isYellowDie ? '1px solid #ffd54f' : '1px solid #bdbdbd'
            };
        }
        return {
            backgroundColor: isYellowDie ? '#f2de28ce' : '#a2b69848',
            border: isYellowDie ? '1px solid #f8c312ff' : '1px solid #bdbdbd'
        };
    };

    const getDialogTitle = () => {
        if (result) {
            if (result.hasPanic) {
                return 'PÂNICO - Rolagem Year Zero Engine';
            }
            return 'Resultado Year Zero Engine';
        }

        if (skillName && attributeName) {
            return `Rolar ${skillName} (${attributeName})`;
        } else if (attributeName) {
            return `Rolar ${attributeName}`;
        }
        return 'Rolar Year Zero Engine';
    };

    const handleNewRoll = () => {
        setShowPanicAlert(false);
        setPanicRollResult(null);
        setShowPanicEffect(false);
        handleClose();
    };

    const PanicAlert = () => (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Paper className={classes.panicAlert}>
                <div className={classes.panicGlow} />
                
                <Typography className={classes.panicHeader}>
                    [PÂNICO!!!]
                </Typography>

                <Box className={classes.panicDiceGrid}>
                    {result.dice.map((value, index) => {
                        const isYellowDie = index >= result.whiteResults.length;
                        const isPanicDie = isYellowDie && value === 1;
                        const dieClass = isPanicDie ? classes.panicDieHighlight : 
                                       isYellowDie ? classes.stressDie : classes.normalDie;
                        
                        return (
                            <Box key={index} className={`${classes.panicDie} ${dieClass}`}>
                                {value}
                                {isPanicDie && (
                                    <Box className={classes.panicBadge}>
                                        !
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>

                {panicRollResult && (
                    <Box className={classes.centeredContent}>
                        <Box className={classes.calculationBox}>
                            <Typography className={classes.calculationText}>
                                <strong>CÁLCULO AUTOMÁTICO DO PÂNICO</strong>
                            </Typography>
                            
                            <Box className={classes.inlineCalculation}>
                                <Typography className={classes.calculationPart}>
                                    1D6, resultado = {panicRollResult.panicRoll}
                                </Typography>
                                <Typography className={classes.calculationPart}>
                                    +
                                </Typography>
                                <Typography className={classes.calculationPart}>
                                    Estresse atual = {panicRollResult.stressLevel}
                                </Typography>
                            </Box>
                            
                            <Typography className={classes.calculationFormula}>
                                <strong>TOTAL = {panicRollResult.totalPanicRoll}</strong>
                            </Typography>

                            {!showPanicEffect && (
                                <Box className={classes.revealButtonContainer}>
                                    <Button
                                        className={classes.revealButton}
                                        onClick={revealPanicEffect}
                                        startIcon={<Psychology />}
                                        size="large"
                                    >
                                        REVELAR EFEITO DO PÂNICO
                                    </Button>
                                </Box>
                            )}

                            {showPanicEffect && (
                                <Collapse in={showPanicEffect}>
                                    <Box className={classes.resultBox}>
                                        <Typography className={classes.resultText}>
                                            <strong>EFEITO: {panicRollResult.effect.range}</strong><br/>
                                            {panicRollResult.effect.effect}
                                        </Typography>
                                    </Box>
                                    <Typography className={classes.instructionText}>
                                        Leia este resultado para o Mestre
                                    </Typography>
                                </Collapse>
                            )}
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );

    return (
        <Dialog
            open={true}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>
                {getDialogTitle()}
            </DialogTitle>
            <DialogContent>
                {
                    result ? (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <DialogContentText>
                                    {skillName && attributeName
                                        ? `${skillName} (${attributeName})`
                                        : 'Sistema Year Zero Engine'
                                    }
                                </DialogContentText>
                            </Grid>

                            {result.hasPanic && <PanicAlert />}

                            {!result.hasPanic && (
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, justifyContent: 'center' }}>
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
                                                    fontWeight: 'bold',
                                                    ...getDieStyle(value, index)
                                                }}
                                            >
                                                {value}
                                            </Box>
                                        ))}
                                    </Box>
                                </Grid>
                            )}

                            <Grid item xs={6}>
                                <DialogContentText>
                                    Dados Brancos: {result.whiteDiceCount}
                                </DialogContentText>
                                <DialogContentText>
                                    Sucessos Brancos: {result.whiteSuccesses}
                                </DialogContentText>
                            </Grid>
                            <Grid item xs={6}>
                                <DialogContentText>
                                    Dados Amarelos: {result.yellowDiceCount}
                                </DialogContentText>
                                <DialogContentText>
                                    Sucessos Amarelos: {result.yellowSuccesses}
                                </DialogContentText>
                            </Grid>

                            <Grid item xs={12}>
                                <DialogContentText variant="h6">
                                    Total de Sucessos: {result.successes}
                                </DialogContentText>
                                {result.panics > 0 && (
                                    <DialogContentText>
                                        Dados de Pânico: {result.panics}
                                    </DialogContentText>
                                )}
                            </Grid>

                            {pushState === 'initial' && !result.hasPanic && (
                                <Grid item xs={12}>
                                    <DialogContentText>
                                        <Warning style={{ verticalAlign: 'middle', marginRight: 8 }} />
                                        Você pode empurrar a rolagem para rerrolar dados que não são 1 ou 6.
                                    </DialogContentText>
                                </Grid>
                            )}

                            {pushState === 'pushed' && (
                                <Grid item xs={12}>
                                    <DialogContentText>
                                        {result.successes > 0
                                            ? `Ação bem-sucedida com ${result.successes} sucesso(s)`
                                            : 'Ação falhou'
                                        }
                                    </DialogContentText>
                                </Grid>
                            )}
                        </Grid>
                    ) : (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <DialogContentText>
                                    {skillName && attributeName
                                        ? `${skillName} vinculada a ${attributeName}`
                                        : 'Sistema Year Zero Engine - Cada 6 é um sucesso'
                                    }
                                </DialogContentText>
                                {/* NOVO: Mostrar nível de estresse calculado dos quadrados */}
                                {stressLevel > 0 && (
                                    <DialogContentText>
                                        Estresse Atual (Quadrados): {stressLevel} (sugestão)
                                    </DialogContentText>
                                )}
                            </Grid>

                            <Grid item xs={3}>
                                <TextField
                                    autoFocus
                                    label="Dados de Habilidade"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={skillDiceInput}
                                    onChange={({ target }) => {
                                        setSkillDiceInput(Number(target.value));
                                    }}
                                />
                            </Grid>

                            <Grid item xs={3}>
                                <TextField
                                    label="Dados de Atributo"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={attributeDiceInput}
                                    onChange={({ target }) => {
                                        setAttributeDiceInput(Number(target.value));
                                    }}
                                />
                            </Grid>

                            <Grid item xs={3}>
                                <TextField
                                    label="Dados de Equipamento"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={gearDiceInput}
                                    onChange={({ target }) => {
                                        setGearDiceInput(Number(target.value));
                                    }}
                                />
                            </Grid>

                            <Grid item xs={3}>
                                <TextField
                                    label="Dados de Estresse"
                                    type="number"
                                    fullWidth
                                    variant="outlined"
                                    value={stressDiceInput}
                                    onChange={({ target }) => {
                                        setStressDiceInput(Number(target.value));
                                    }}
                                    helperText={`Quadrados: ${stressLevel}`}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <DialogContentText>
                                    Total de dados brancos: {skillDiceInput + attributeDiceInput + gearDiceInput}
                                </DialogContentText>
                                <DialogContentText>
                                    Dados amarelos (estresse): {stressDiceInput}
                                </DialogContentText>
                                <DialogContentText variant="h6">
                                    Total geral: {(skillDiceInput + attributeDiceInput + gearDiceInput) + stressDiceInput}     
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
                        {pushState === 'initial' && !result.hasPanic && result.successes === 0 && (
                            <Button
                                onClick={pushRoll}
                                startIcon={<Replay />}
                                color="warning"
                                style={{ marginRight: 8 }}
                            >
                                Empurrar Rolagem (+1 Estresse)
                            </Button>
                        )}
                        <Button
                            onClick={handleNewRoll}
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
                        Rolar
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

export default withStyles(styles)(YearZeroDiceModal);