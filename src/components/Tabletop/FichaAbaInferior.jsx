// src/components/Tabletop/FichaAbaInferior.jsx
import { useState, useEffect } from 'react';
import { Box, Drawer, IconButton, Typography } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FichaPlayer from './FichaPlayer';

export default function FichaAbaInferior({ sheetId, characterName }) {
    const [aberto, setAberto] = useState(false);

    useEffect(() => {
        console.log('[FichaAbaInferior] Renderizando - aberto:', aberto, 'sheetId:', sheetId);
    }, [aberto, sheetId]);

    return (
        <>
            {/* Aba inferior fixa */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                <Box
                    sx={{
                        backgroundColor: '#2c3e50',
                        borderRadius: '12px 12px 0 0',
                        padding: '8px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            backgroundColor: '#1e2a36',
                            transform: 'translateY(-2px)'
                        }
                    }}
                    onClick={() => {
                        console.log('[FichaAbaInferior] Clicou na aba, aberto será:', !aberto);
                        setAberto(!aberto);
                    }}
                >
                    <MenuBookIcon sx={{ color: 'white' }} />
                    <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                        Ficha do personagem
                    </Typography>
                    {aberto ? (
                        <ExpandMoreIcon sx={{ color: 'white' }} />
                    ) : (
                        <ExpandLessIcon sx={{ color: 'white' }} />
                    )}
                </Box>
            </Box>

            {/* Painel da ficha que sobe do bottom */}
            <Drawer
                anchor="bottom"
                open={aberto}
                onClose={() => {
                    console.log('[FichaAbaInferior] Drawer fechando');
                    setAberto(false);
                }}
                sx={{
                    '& .MuiDrawer-paper': {
                        height: '85%',
                        backgroundColor: 'rgba(51, 51, 51, 0.95)',
                        borderTopLeftRadius: '16px',
                        borderTopRightRadius: '16px',
                        overflow: 'auto',
                        boxShadow: 'none'
                    }
                }}
            >
                <Box sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        mb: 2,
                        mt: 1,
                        mr: 1,
                        flexShrink: 0
                    }}>
                        <IconButton onClick={() => {
                            console.log('[FichaAbaInferior] Botão fechar clicado');
                            setAberto(false);
                        }}>
                            <ExpandMoreIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{
                        flex: 1,
                        overflow: 'auto',
                        minHeight: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start'
                    }}>
                        <Box sx={{
                            transform: 'scale(0.9)',
                            transformOrigin: 'top center',
                            width: '111.11%'
                        }}>
                            <FichaPlayer sheetId={sheetId} />
                        </Box>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}