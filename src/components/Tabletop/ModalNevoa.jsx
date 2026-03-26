// src/components/Tabletop/ModalNevoa.jsx
import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import BrushIcon from '@mui/icons-material/Brush';
import DeleteIcon from '@mui/icons-material/Delete';
import UndoIcon from '@mui/icons-material/Undo';
import CloseIcon from '@mui/icons-material/Close';

export function ModalNevoa({ 
    aberto, 
    onClose,
    posicao,
    modoDesenho,
    ativarModoDesenho,
    desativarModoDesenho,
    limparTudo,
    desfazer
}) {
    const menuRef = useRef(null);
    const [position, setPosition] = useState({ top: posicao?.y || 0, left: posicao?.x || 0 });

    // Ajusta a posição do menu pra não vazar da tela
    useEffect(() => {
        if (!aberto || !menuRef.current || !posicao) return;
        
        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let top = posicao.y;
        let left = posicao.x + 60; // Abre ao lado do botão
        
        // Ajusta se passar da borda direita
        if (left + menuRect.width > viewportWidth - 10) {
            left = posicao.x - menuRect.width - 10;
        }
        
        // Ajusta se passar da borda inferior
        if (top + menuRect.height > viewportHeight - 10) {
            top = viewportHeight - menuRect.height - 10;
        }
        
        // Garante que não fique muito nas bordas
        if (left < 10) left = 10;
        if (top < 10) top = 10;
        
        setPosition({ top, left });
    }, [aberto, posicao]);

    // Fecha o menu se clicar fora
    useEffect(() => {
        if (!aberto) return;

        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        }

        function handleEscapeKey(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [aberto, onClose]);

    // Se não estiver aberto, não renderiza nada
    if (!aberto) return null;

    const handleTogglePincel = () => {
        if (modoDesenho) {
            desativarModoDesenho();
        } else {
            ativarModoDesenho();
        }
    };

    const menuStyle = {
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        backgroundColor: '#1e232c',
        border: '1px solid #3a4050',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        padding: '12px',
        minWidth: '240px',
        animation: 'menuFadeIn 0.15s ease'
    };

    return (
        <div ref={menuRef} style={menuStyle}>
            <style>{`
                @keyframes menuFadeIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>

            {/* Cabeçalho com título e botão fechar */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid #3a4050',
                pb: 1,
                mb: 1.5
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BrushIcon sx={{ color: modoDesenho ? '#5b8cff' : '#6c757d', fontSize: 18 }} />
                    <span style={{ color: '#e6e9f0', fontSize: '14px', fontWeight: 600 }}>Ferramenta de Névoa</span>
                </Box>
                <Button
                    onClick={onClose}
                    size="small"
                    sx={{
                        minWidth: 'auto',
                        p: 0.5,
                        color: '#a0a8b8',
                        '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }
                    }}
                >
                    <CloseIcon fontSize="small" />
                </Button>
            </Box>

            {/* Botão do pincel com estado visual */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={handleTogglePincel}
                    startIcon={<BrushIcon />}
                    sx={{
                        flex: 1,
                        fontSize: '12px',
                        ...(modoDesenho ? {
                            bgcolor: '#5b8cff',
                            color: '#fff',
                            borderColor: '#5b8cff',
                            '&:hover': { bgcolor: '#4a7ae0', borderColor: '#4a7ae0' }
                        } : {
                            color: '#b0b8c8',
                            borderColor: '#4a5568',
                            '&:hover': { bgcolor: '#2a3440', borderColor: '#5b8cff' }
                        })
                    }}
                >
                    {modoDesenho ? "Pincel Ativo" : "Ativar Pincel"}
                </Button>
            </Box>

            {/* Ações */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Button
                    size="small"
                    onClick={desfazer}
                    startIcon={<UndoIcon />}
                    sx={{
                        fontSize: '12px',
                        color: '#b0b8c8',
                        borderColor: '#4a5568',
                        justifyContent: 'flex-start',
                        '&:hover': { bgcolor: '#2a3440' }
                    }}
                >
                    Desfazer
                </Button>
                <Button
                    size="small"
                    onClick={limparTudo}
                    startIcon={<DeleteIcon />}
                    sx={{
                        fontSize: '12px',
                        color: '#ff8a8a',
                        borderColor: '#4a5568',
                        justifyContent: 'flex-start',
                        '&:hover': { bgcolor: '#4a2c2c' }
                    }}
                >
                    Limpar
                </Button>
            </Box>
        </div>
    );
}