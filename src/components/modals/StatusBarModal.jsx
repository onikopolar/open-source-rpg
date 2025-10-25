import React, { useState, useEffect } from 'react';
import { withStyles } from '@mui/styles';
import {
    TextField, Dialog, DialogActions, DialogContent, Grid,
    DialogTitle, Button, Box, Typography
} from '@mui/material'

const styles = theme => ({

})

function StatusBarModal({
    classes,
    handleClose,
    onSubmit,
    characterId,
    characterName,
    currentHitPoints,
    maxHitPoints
}) {
    // Estado para os dados editáveis - agora com valores string para melhor controle
    const [hitPoints, setHitPoints] = useState({
        current: '',
        max: ''
    });

    // Carregar dados quando o modal abre
    useEffect(() => {
        setHitPoints({
            current: currentHitPoints?.toString() || '',
            max: maxHitPoints?.toString() || ''
        });
    }, [currentHitPoints, maxHitPoints]);

    // Resetar estado
    const resetState = () => {
        setHitPoints({
            current: '',
            max: ''
        });
    }

    // Validar e converter valores
    const validateAndSubmit = () => {
        const current = parseInt(hitPoints.current) || 0;
        const max = parseInt(hitPoints.max) || 0;

        // Validações
        if (hitPoints.current === '') {
            alert('Por favor, informe os pontos de vida atuais');
            return;
        }

        if (hitPoints.max === '' || max <= 0) {
            alert('Por favor, informe um valor máximo válido (maior que 0)');
            return;
        }

        if (current > max) {
            alert('Os pontos atuais não podem ser maiores que o máximo');
            return;
        }

        // Enviar dados convertidos para número
        onSubmit({
            current: current,
            max: max
        }).then(() => {
            resetState();
        });
    }

    // Calcular porcentagem para preview
    const calculatePercentage = () => {
        const current = parseInt(hitPoints.current) || 0;
        const max = parseInt(hitPoints.max) || 1;
        
        if (max === 0) return 0;
        return Math.round((current / max) * 100);
    }

    // Função para lidar com mudanças nos campos
    const handleChange = (field, value) => {
        // Permitir apenas números e campo vazio
        const numericValue = value.replace(/[^0-9]/g, '');
        
        setHitPoints(prevState => ({
            ...prevState,
            [field]: numericValue
        }));
    }

    return (
        <Dialog
            open={true}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                Editar Pontos de Vida - {characterName}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField
                            autoFocus
                            label="Pontos Atuais"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={hitPoints.current}
                            onChange={({ target }) => handleChange('current', target.value)}
                            inputProps={{ 
                                inputMode: 'numeric',
                                pattern: '[0-9]*'
                            }}
                            placeholder="Ex: 50"
                            helperText="Deixe vazio para 0"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Pontos Máximos"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={hitPoints.max}
                            onChange={({ target }) => handleChange('max', target.value)}
                            inputProps={{ 
                                inputMode: 'numeric',
                                pattern: '[0-9]*'
                            }}
                            placeholder="Ex: 100"
                            helperText="Valor deve ser maior que 0"
                        />
                    </Grid>
                    
                    {/* Preview da barra de vida */}
                    <Grid item xs={12}>
                        <Box sx={{ 
                            p: 2, 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 1,
                            backgroundColor: '#fafafa',
                            mt: 2
                        }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Prévia:
                            </Typography>
                            <Box sx={{ 
                                height: '20px', 
                                backgroundColor: '#e0e0e0', 
                                borderRadius: '10px',
                                overflow: 'hidden'
                            }}>
                                <Box 
                                    sx={{ 
                                        height: '100%',
                                        backgroundColor: calculatePercentage() > 50 ? '#4caf50' : 
                                                       calculatePercentage() > 25 ? '#ff9800' : '#f44336',
                                        width: `${calculatePercentage()}%`,
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            </Box>
                            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                                {parseInt(hitPoints.current) || 0} / {parseInt(hitPoints.max) || 0} ({calculatePercentage()}%)
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleClose}
                    color="secondary"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={validateAndSubmit}
                    variant="contained"
                >
                    Salvar
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default withStyles(styles)(StatusBarModal);
