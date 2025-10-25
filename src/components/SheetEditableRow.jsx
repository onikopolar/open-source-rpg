import React, { useState, useEffect } from 'react'
import { TextField, Box, Button, Typography } from '@mui/material'
import useModal from '../hooks/useModal';
import { InfoModal } from '../components';
import { api } from '../utils';

const SheetEditableRow = ({
    title,
    value,
    characterId,
    characterName,
    onRoll,
    onValueChange,
    skillId
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Corrigir hydration error
    useEffect(() => {
        setInputValue(value?.toString() || '');
    }, [value]);

    const infoModal = useModal(({ close }) => (
        <InfoModal
            title={title}
            text="Descrição da perícia será carregada aqui"
            handleClose={close}
        />
    ));

    const saveSkillValue = async (newValue) => {
        if (isSaving) return;
        
        setIsSaving(true);
        
        try {
            const numericValue = parseInt(newValue) || 0;

            await api.put('/character/skill', {
                character_id: characterId,
                skill_id: skillId,
                value: numericValue
            });
            
            // Notificar componente pai sobre a mudança
            if (onValueChange) {
                onValueChange(characterId, title, numericValue);
            }
            
        } catch (error) {
            console.error('Erro ao salvar habilidade:', error);
            alert('Erro ao salvar o valor da habilidade');
        } finally {
            setIsSaving(false);
        }
    }

    const handleValueChange = (newValue) => {
        const numericValue = newValue.replace(/[^0-9]/g, '');
        setInputValue(numericValue);
    }

    const handleBlur = async (event) => {
        const numericValue = event.target.value.replace(/[^0-9]/g, '') || '0';
        const currentValue = value?.toString() || '0';
        
        // Salvar apenas se o valor mudou
        if (numericValue !== currentValue) {
            await saveSkillValue(numericValue);
        }
    }

    const handleKeyPress = (event) => {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            event.preventDefault();
        }
        
        // Salvar quando pressionar Enter
        if (charCode === 13) {
            event.target.blur();
        }
    }

    const handleRollWithValidation = () => {
        const numericValue = parseInt(inputValue) || 0;
        if (!inputValue || numericValue === 0) {
            alert('Por favor, insira um valor numérico para a perícia primeiro!');
            return;
        }
        
        if (onRoll) {
            onRoll({
                characterId,
                characterName,
                skillName: title,
                skillValue: numericValue
            });
        }
    }

    return (
        <Box sx={{ 
            p: 2, 
            border: '1px solid #e0e0e0', 
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            position: 'relative'
        }}>
            {isSaving && (
                <Box 
                    sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 8,
                        height: 8,
                        backgroundColor: '#ff9800',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite'
                    }}
                />
            )}
            
            <Typography variant="h6" sx={{ minWidth: 120, fontWeight: 'bold' }}>
                {title}
            </Typography>
            
            <Button 
                variant="outlined" 
                size="small"
                onClick={handleRollWithValidation}
                disabled={isSaving}
            >
                Rolar
            </Button>
            
            <TextField
                value={inputValue}
                variant="outlined"
                type="text" // Mudado para text para melhor controle
                size="small"
                sx={{ width: 80 }}
                inputProps={{
                    style: {
                        textAlign: 'center',
                        padding: '8px'
                    },
                    inputMode: 'numeric',
                    pattern: '[0-9]*'
                }}
                onBlur={handleBlur}
                onChange={event => handleValueChange(event.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSaving}
            />
        </Box>
    )
}

export default SheetEditableRow;
