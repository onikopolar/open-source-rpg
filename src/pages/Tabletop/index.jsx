// src/pages/Tabletop/index.jsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import FichaAbaInferior from '../../components/Tabletop/FichaAbaInferior';

const SENHA_MESTRE = "4455";

// Carrega o TabletopGrid apenas no cliente
const TabletopGrid = dynamic(() => import('./tabletopgrid'), {
    ssr: false,
    loading: () => (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a'
        }}>
            <CircularProgress />
        </div>
    )
});

export default function registroNoTabletop() {
    const router = useRouter();
    const { sheetId, fromDashboard } = router.query;

    const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
    const [senhaDigitada, setSenhaDigitada] = useState("");
    const [erroSenha, setErroSenha] = useState(false);
    const [isMaster, setIsMaster] = useState(null);
    const [modoDecidido, setModoDecidido] = useState(false);
    const [characterName, setCharacterName] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (!router.isReady) return;

        console.log('[Tabletop] Decidindo modo de acesso');
        console.log('[Tabletop] sheetId:', sheetId);
        console.log('[Tabletop] fromDashboard:', fromDashboard);

        if (sheetId) {
            console.log('[Tabletop] Modo PLAYER');
            setIsMaster(false);
            setModoDecidido(true);
            return;
        }

        if (fromDashboard === 'true') {
            console.log('[Tabletop] Modo MESTRE (via Dashboard)');
            setIsMaster(true);
            setModoDecidido(true);
            return;
        }

        console.log('[Tabletop] Aguardando senha do mestre');
        setModalSenhaAberto(true);
        setModoDecidido(true);
    }, [router.isReady, sheetId, fromDashboard]);

    useEffect(() => {
        if (!sheetId || isMaster !== false) return;

        const buscarDadosPersonagem = async () => {
            setLoadingData(true);
            try {
                const response = await fetch(`/api/character/${sheetId}`);
                const data = await response.json();
                
                if (response.ok) {
                    console.log('[Tabletop] Dados do personagem carregados:', {
                        name: data.name,
                        player_name: data.player_name
                    });
                    setCharacterName(data.name || `Personagem ${sheetId}`);
                    setPlayerName(data.player_name || `Player ${sheetId}`);
                } else {
                    console.log('[Tabletop] Personagem não encontrado');
                    setCharacterName(`Personagem ${sheetId}`);
                    setPlayerName(`Player ${sheetId}`);
                }
            } catch (error) {
                console.error('[Tabletop] Erro ao buscar dados do personagem:', error);
                setCharacterName(`Personagem ${sheetId}`);
                setPlayerName(`Player ${sheetId}`);
            } finally {
                setLoadingData(false);
            }
        };

        buscarDadosPersonagem();
    }, [sheetId, isMaster]);

    const handleConfirmarSenha = () => {
        if (senhaDigitada === SENHA_MESTRE) {
            setIsMaster(true);
            setModalSenhaAberto(false);
            setErroSenha(false);
            setSenhaDigitada("");
        } else {
            setErroSenha(true);
        }
    };

    const handleFecharModal = () => {
        setModalSenhaAberto(false);
        setErroSenha(false);
        setSenhaDigitada("");
    };

    if (!modoDecidido || !router.isReady) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1>Carregando...</h1>
            </div>
        );
    }

    if (isMaster === false) {
        return (
            <div style={{
                padding: '40px',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {loadingData ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <CircularProgress size={24} />
                        <h1>Carregando dados do jogador...</h1>
                    </div>
                ) : (
                    <h1>Modo Player - {playerName}</h1>
                )}
                <div style={{ flex: 1, minHeight: 0 }}>
                    <TabletopGrid 
                        isMaster={false} 
                        sheetId={sheetId} 
                        playerName={playerName}
                    />
                </div>
                <FichaAbaInferior sheetId={sheetId} characterName={characterName} />
            </div>
        );
    }

    if (isMaster === true) {
        return (
            <div style={{
                padding: '40px',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h1>Modo Mestre</h1>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <TabletopGrid isMaster={true} sheetId={null} playerName={null} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1>Acesso ao Tabletop</h1>
                <Button
                    variant="contained"
                    onClick={() => setModalSenhaAberto(true)}
                >
                    Entrar como Mestre
                </Button>
            </div>

            <Dialog open={modalSenhaAberto} onClose={handleFecharModal}>
                <DialogTitle>Acesso de Mestre</DialogTitle>
                <DialogContent>
                    {erroSenha && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Senha incorreta. Tente novamente.
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Senha do Mestre"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={senhaDigitada}
                        onChange={(e) => setSenhaDigitada(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleConfirmarSenha();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFecharModal}>Cancelar</Button>
                    <Button onClick={handleConfirmarSenha} variant="contained">
                        Entrar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}