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
    grupoSelecionado = [],
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
    setTokensLocal,
}, ref) => {
    if (!aberto) return null;

    const isNevoa = tipo === 'nevoa';
    const isGrupo = grupoSelecionado.length > 1;
    const idsDoGrupo = isGrupo
        ? grupoSelecionado.map(i => tokensLocal[i]?.id).filter(Boolean)
        : [];
    const textoOcultar = estaOculto ? "Mostrar (todos veem)" : "Ocultar (só eu vejo)";
    const textoBloquear = estaBloqueado ? "Desbloquear token" : "Bloquear token";

    const btnStyle = {
        width: '100%', padding: '10px 12px', backgroundColor: 'transparent',
        border: 'none', borderBottom: '1px solid #333', color: '#fff',
        textAlign: 'left', cursor: 'pointer', fontSize: '14px',
        display: 'flex', alignItems: 'center', gap: '12px'
    };
    const hoverOn = (e) => e.currentTarget.style.backgroundColor = '#3a3a3a';
    const hoverOff = (e) => e.currentTarget.style.backgroundColor = 'transparent';

    // Ações em lote
    const handleDeletarGrupo = () => {
        if (!isMaster || idsDoGrupo.length === 0) { onFechar?.(); return; }
        Promise.all(idsDoGrupo.map(id => deletarToken(id)))
            .then(() => {
                if (setTokensLocal) {
                    setTokensLocal(prev => prev.filter(t => !idsDoGrupo.includes(t.id)));
                }
                idsDoGrupo.forEach(id => {
                    if (socket?.connected) emitirTokenDeleted(id);
                });
                despacharUI({ type: 'SELECT_TOKEN', payload: null });
                despacharUI({ type: 'SET_FEEDBACK', payload: { message: `${idsDoGrupo.length} tokens deletados`, type: 'success' } });
            })
            .catch(() => despacharUI({ type: 'SET_FEEDBACK', payload: { message: 'Erro ao deletar tokens', type: 'error' } }));
        onFechar?.();
    };

    const handleOcultarGrupo = (ocultar) => {
        if (!isMaster || idsDoGrupo.length === 0) { onFechar?.(); return; }
        idsDoGrupo.forEach(id => {
            atualizarToken(id, { oculto: ocultar }).then(() => {
                despacharUI({ type: 'SET_TOKEN_VISIBILITY', payload: { tokenId: id, oculto: ocultar } });
                if (socket?.connected) emitirTokenVisibilityChanged(id, ocultar);
            }).catch(() => {});
        });
        despacharUI({ type: 'SET_FEEDBACK', payload: { message: ocultar ? 'Tokens ocultados' : 'Tokens visíveis', type: 'success' } });
        onFechar?.();
    };

    const handleBloquearGrupo = (bloquear) => {
        if (!isMaster || idsDoGrupo.length === 0) { onFechar?.(); return; }
        idsDoGrupo.forEach(id => {
            atualizarToken(id, { bloqueado: bloquear }).then(() => {
                despacharUI({ type: 'SET_TOKEN_BLOCK', payload: { tokenId: id, bloqueado: bloquear } });
                if (socket?.connected) emitirTokenLockChanged(id, bloquear);
            }).catch(() => {});
        });
        if (setTokensLocal) {
            setTokensLocal(prev => prev.map(t => idsDoGrupo.includes(t.id) ? { ...t, bloqueado: bloquear } : t));
        }
        despacharUI({ type: 'SET_FEEDBACK', payload: { message: bloquear ? 'Tokens bloqueados' : 'Tokens desbloqueados', type: 'success' } });
        onFechar?.();
    };

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

        // ⏱️ TRACING: ID único pra rastrear esse clique até o outro cliente
        const _traceId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const _t0 = performance.now();

        const token = tokensLocal.find((t) => t.id === tokenId);
        const novoEstado = token ? !token.invertido : false;

        console.log(
            `%c[⏱️ INVERT] %ctraceId=${_traceId} %cetapa=CLIQUE %cts=0ms %ctokenId=${tokenId} invertido=${novoEstado}`,
            'font-weight:bold;color:#ff9800', 'color:#4fc3f7', 'color:#ff9800', 'color:#888', 'color:#aaa'
        );

        //  CORREÇÃO: Atualiza localmente primeiro (otimista)
        if (setTokensLocal) {
            setTokensLocal(prev => prev.map(t => 
                t.id === tokenId ? { ...t, invertido: novoEstado } : t
            ));
        }
        console.log(
            `%c[⏱️ INVERT] %ctraceId=${_traceId} %cetapa=LOCAL-STATE %cts=+${(performance.now() - _t0).toFixed(1)}ms`,
            'font-weight:bold;color:#ff9800', 'color:#4fc3f7', 'color:#66bb6a', 'color:#888'
        );

        // ⚡ CORREÇÃO: Emite socket IMEDIATAMENTE (antes do HTTP).
        // O HTTP (atualizarToken) pode levar 500-800ms, mas o socket
        // chega nos outros jogadores em <30ms. O HTTP roda em background
        // e só reverte o estado local se falhar.
        if (socket?.connected) {
            const _tAntesEmit = performance.now();
            const _transport = socket.io?.engine?.transport?.name || '?';
            const _socketId = socket.id?.slice(0, 8) || '?';
            console.log(
                `%c[⏱️ INVERT] %ctraceId=${_traceId} %cetapa=SOCKET-EMIT %cts=+${(_tAntesEmit - _t0).toFixed(1)}ms %ctransport=${_transport} %csocketId=${_socketId}`,
                'font-weight:bold;color:#ff9800', 'color:#4fc3f7', 'color:#ab47bc', 'color:#888', 'color:#888', 'color:#888'
            );
            emitirTokenInverted(tokenId, novoEstado, _traceId, _t0);
        } else {
            console.log(
                `%c[⏱️ INVERT] %ctraceId=${_traceId} %cetapa=SOCKET-PULADO %cmotivo=socket-desconectado %cconnected=${socket?.connected} %cid=${socket?.id?.slice(0, 8) || 'null'}`,
                'font-weight:bold;color:#ff9800', 'color:#4fc3f7', 'color:#f44336', 'color:#f44336', 'color:#888', 'color:#888'
            );
        }

        // HTTP em background — não bloqueia o socket
        console.log(
            `%c[⏱️ INVERT] %ctraceId=${_traceId} %cetapa=HTTP-INICIO %cts=+${(performance.now() - _t0).toFixed(1)}ms`,
            'font-weight:bold;color:#ff9800', 'color:#4fc3f7', 'color:#42a5f5', 'color:#888'
        );
        const _tHttpStart = performance.now();

        atualizarToken(tokenId, { invertido: novoEstado })
            .then(() => {
                const _tHttpEnd = performance.now();
                console.log(
                    `%c[⏱️ INVERT] %ctraceId=${_traceId} %cetapa=HTTP-FIM %cts=+${(_tHttpEnd - _t0).toFixed(1)}ms %chttpDurou=${(_tHttpEnd - _tHttpStart).toFixed(1)}ms`,
                    'font-weight:bold;color:#ff9800', 'color:#4fc3f7', 'color:#42a5f5', 'color:#888', 'color:#888'
                );
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
                // ⚡ Reverte a mudança local E notifica os outros jogadores
                if (setTokensLocal) {
                    setTokensLocal(prev => prev.map(t => 
                        t.id === tokenId ? { ...t, invertido: !novoEstado } : t
                    ));
                }
                // Notifica reversão para outros jogadores
                if (socket?.connected) {
                    emitirTokenInverted(tokenId, !novoEstado);
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

        //  CORREÇÃO: Atualiza localmente primeiro (otimista)
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
                //  CORREÇÃO: Reverte a mudança local em caso de erro
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
                    {isGrupo ? `${grupoSelecionado.length} tokens selecionados` : (isNevoa ? 'Camada de Névoa' : tokenNome)}
                </span>
            </div>

            {/* Ações em LOTE (multi-seleção) */}
            {isGrupo && isMaster && (
                <>
                    <button onClick={handleDeletarGrupo} style={btnStyle}
                        onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                        <DeleteIcon sx={{ fontSize: 18, color: '#f44336' }} />
                        Excluir {grupoSelecionado.length} tokens
                    </button>
                    <button onClick={() => handleOcultarGrupo(true)} style={btnStyle}
                        onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                        <VisibilityOffIcon sx={{ fontSize: 18 }} />
                        Ocultar {grupoSelecionado.length} tokens
                    </button>
                    <button onClick={() => handleOcultarGrupo(false)} style={btnStyle}
                        onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                        <VisibilityIcon sx={{ fontSize: 18 }} />
                        Mostrar {grupoSelecionado.length} tokens
                    </button>
                    <button onClick={() => handleBloquearGrupo(true)} style={btnStyle}
                        onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                        <LockIcon sx={{ fontSize: 18 }} />
                        Bloquear {grupoSelecionado.length} tokens
                    </button>
                    <button onClick={() => handleBloquearGrupo(false)} style={btnStyle}
                        onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                        <LockOpenIcon sx={{ fontSize: 18 }} />
                        Desbloquear {grupoSelecionado.length} tokens
                    </button>
                </>
            )}

            {!isGrupo && !isNevoa && (
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