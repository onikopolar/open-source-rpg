import React from "react";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import FlipIcon from '@mui/icons-material/Flip';

export const MenuContextoToken = React.forwardRef(({
    x,
    y,
    aberto,
    onFechar,
    tokenId,
    camadaId,
    tipo = 'token',
    tokenNome,
    estaOculto,
    estaBloqueado,
    isMaster = false,
    // Dependências para ações
    deletarToken,
    atualizarToken,
    socket,
    tabletopId,
    nevoa,
    despacharUI,
    emitirTokenDeleted,
    emitirTokenVisibilityChanged,
    emitirTokenLockChanged,
    emitirTokenInverted,
    tokensLocal,
    setTokensLocal, // NOVA PROP: função para atualizar estado local
}, ref) => {
    if (!aberto) {
        return null;
    }

    const textoOcultar = estaOculto ? "Mostrar (todos veem)" : "Ocultar (só eu vejo)";
    const textoBloquear = estaBloqueado ? "Desbloquear token" : "Bloquear token";
    const isNevoa = tipo === 'nevoa';

    const handleOcultar = () => {
        if (!isMaster || isNevoa) {
            if (onFechar) onFechar();
            return;
        }

        const novoEstado = !estaOculto;

        atualizarToken(tokenId, { oculto: novoEstado })
            .then(() => {
                despacharUI({
                    type: 'SET_TOKEN_VISIBILITY',
                    payload: { tokenId, oculto: novoEstado },
                });
                if (socket?.connected) {
                    emitirTokenVisibilityChanged(tokenId, novoEstado);
                }
                despacharUI({
                    type: 'SET_FEEDBACK',
                    payload: {
                        message: novoEstado ? 'Token ocultado' : 'Token visível',
                        type: 'success',
                    },
                });
            })
            .catch((err) => {
                console.error('[MenuContextoToken] Erro ao alterar visibilidade:', err);
                despacharUI({
                    type: 'SET_FEEDBACK',
                    payload: {
                        message: 'Erro ao alterar visibilidade',
                        type: 'error',
                    },
                });
            });

        if (onFechar) onFechar();
    };

    const handleInverter = () => {
        if (isNevoa) {
            if (onFechar) onFechar();
            return;
        }

        const token = tokensLocal.find((t) => t.id === tokenId);
        const novoEstado = token ? !token.invertido : false;

        // 🔧 CORREÇÃO: Atualiza localmente primeiro (otimista)
        if (setTokensLocal) {
            setTokensLocal(prev => prev.map(t => 
                t.id === tokenId ? { ...t, invertido: novoEstado } : t
            ));
        }

        atualizarToken(tokenId, { invertido: novoEstado })
            .then(() => {
                if (socket?.connected) {
                    emitirTokenInverted(tokenId, novoEstado);
                }
                despacharUI({
                    type: 'SET_FEEDBACK',
                    payload: {
                        message: novoEstado ? 'Token invertido' : 'Token normal',
                        type: 'success',
                    },
                });
            })
            .catch((err) => {
                console.error('[MenuContextoToken] Erro ao inverter token:', err);
                // 🔧 CORREÇÃO: Reverte a mudança local em caso de erro
                if (setTokensLocal) {
                    setTokensLocal(prev => prev.map(t => 
                        t.id === tokenId ? { ...t, invertido: !novoEstado } : t
                    ));
                }
                despacharUI({
                    type: 'SET_FEEDBACK',
                    payload: {
                        message: 'Erro ao inverter token',
                        type: 'error',
                    },
                });
            });

        if (onFechar) onFechar();
    };

    const handleBloquear = () => {
        if (!isMaster) {
            if (onFechar) onFechar();
            return;
        }

        if (isNevoa) {
            const novoEstado = !estaBloqueado;
            despacharUI({ type: 'TOGGLE_CAMADA_LOCK', payload: camadaId });
            despacharUI({
                type: 'SET_FEEDBACK',
                payload: {
                    message: novoEstado ? 'Camada bloqueada' : 'Camada desbloqueada',
                    type: novoEstado ? 'warning' : 'success',
                },
            });
            if (onFechar) onFechar();
            return;
        }

        const token = tokensLocal.find((t) => t.id === tokenId);
        const novoEstado = token ? !token.bloqueado : false;

        // 🔧 CORREÇÃO: Atualiza localmente primeiro (otimista)
        if (setTokensLocal) {
            setTokensLocal(prev => prev.map(t => 
                t.id === tokenId ? { ...t, bloqueado: novoEstado } : t
            ));
        }

        atualizarToken(tokenId, { bloqueado: novoEstado })
            .then(() => {
                despacharUI({
                    type: 'SET_TOKEN_BLOCK',
                    payload: { tokenId, bloqueado: novoEstado },
                });
                if (socket?.connected) {
                    emitirTokenLockChanged(tokenId, novoEstado);
                }
                despacharUI({
                    type: 'SET_FEEDBACK',
                    payload: {
                        message: novoEstado ? 'Token bloqueado' : 'Token desbloqueado',
                        type: novoEstado ? 'warning' : 'success',
                    },
                });
            })
            .catch((err) => {
                console.error('[MenuContextoToken] Erro ao alterar bloqueio:', err);
                // 🔧 CORREÇÃO: Reverte a mudança local em caso de erro
                if (setTokensLocal) {
                    setTokensLocal(prev => prev.map(t => 
                        t.id === tokenId ? { ...t, bloqueado: !novoEstado } : t
                    ));
                }
                despacharUI({
                    type: 'SET_FEEDBACK',
                    payload: {
                        message: 'Erro ao alterar bloqueio',
                        type: 'error',
                    },
                });
            });

        if (onFechar) onFechar();
    };

    const handleDeletar = () => {
        if (isNevoa) {
            if (nevoa) {
                nevoa.deletarCamada(camadaId);
                despacharUI({
                    type: 'SET_FEEDBACK',
                    payload: {
                        message: 'Camada deletada',
                        type: 'success',
                    },
                });
            }
            if (onFechar) onFechar();
            return;
        }

        deletarToken(tokenId)
            .then(() => {
                // Remove IMEDIATAMENTE do estado local para feedback visual instantâneo
                if (setTokensLocal) {
                    setTokensLocal((prev) => prev.filter((t) => t.id !== tokenId));
                }
                if (socket?.connected) {
                    emitirTokenDeleted(tokenId);
                }
                despacharUI({
                    type: 'SET_FEEDBACK',
                    payload: {
                        message: 'Token deletado',
                        type: 'success',
                    },
                });
            })
            .catch((err) => {
                console.error('[MenuContextoToken] Erro ao deletar token:', err);
                despacharUI({
                    type: 'SET_FEEDBACK',
                    payload: {
                        message: 'Erro ao deletar token',
                        type: 'error',
                    },
                });
            });

        if (onFechar) onFechar();
    };

    return (
        <div
            ref={ref}
            style={{
                position: 'fixed',
                top: y,
                left: x,
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                zIndex: 1000,
                minWidth: '180px'
            }}
        >
            <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid #444',
                color: '#aaa',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>
                    {isNevoa ? 'Camada de Névoa' : tokenNome}
                </span>
            </div>

            {!isNevoa && (
                <>
                    {isMaster && (
                        <button
                            onClick={handleOcultar}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid #333',
                                color: '#fff',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {estaOculto ? (
                                <VisibilityOffIcon sx={{ fontSize: 18 }} />
                            ) : (
                                <VisibilityIcon sx={{ fontSize: 18 }} />
                            )}
                            {textoOcultar}
                        </button>
                    )}

                    <button
                        onClick={handleInverter}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #333',
                            color: '#fff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <FlipIcon sx={{ fontSize: 18 }} />
                        Inverter
                    </button>
                </>
            )}

            {isMaster && (
                <button
                    onClick={handleBloquear}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #333',
                        color: estaBloqueado ? '#4caf50' : '#f9c371ff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#3a3a3a';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    {estaBloqueado ? (
                        <LockOpenIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                    ) : (
                        <LockIcon sx={{ fontSize: 18, color: '#ffa726' }} />
                    )}
                    {isNevoa
                        ? (estaBloqueado ? 'Desbloquear camada' : 'Bloquear camada')
                        : textoBloquear
                    }
                </button>
            )}

            <button
                onClick={handleDeletar}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ff6b6b',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3a3a3a';
                    e.currentTarget.style.color = '#ff8a8a';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#ff6b6b';
                }}
            >
                <DeleteIcon sx={{ fontSize: 18 }} />
                {isNevoa ? 'Deletar camada' : 'Deletar token'}
            </button>
        </div>
    );
});

MenuContextoToken.displayName = 'MenuContextoToken';