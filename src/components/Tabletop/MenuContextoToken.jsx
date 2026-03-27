// components/Tabletop/MenuContextoToken.jsx
import React from "react";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import FlipIcon from '@mui/icons-material/Flip';

export const MenuContextoToken = React.forwardRef(({
    x, y, aberto, onFechar, onDeletar, onOcultar, onBloquear, onInverter,
    tokenNome, estaOculto, estaBloqueado, tipo = 'token'
}, ref) => {
    console.log('[MenuContextoToken] Renderizando', {
        x, y, aberto, tokenNome, estaOculto, estaBloqueado, tipo
    });

    if (!aberto) {
        console.log('[MenuContextoToken] Menu fechado, não renderiza');
        return null;
    }

    const textoOcultar = estaOculto ? "Mostrar (todos veem)" : "Ocultar (só eu vejo)";
    const textoBloquear = estaBloqueado ? "Desbloquear token" : "Bloquear token";
    const isNevoa = tipo === 'nevoa';

    console.log('[MenuContextoToken] Menu aberto', { textoOcultar, textoBloquear, isNevoa });

    const handleOcultar = () => {
        console.log('[MenuContextoToken] Botão Ocultar/Mostrar clicado', { tokenNome, estaOculto, tipo });
        if (onOcultar) {
            console.log('[MenuContextoToken] Chamando onOcultar');
            onOcultar();
        } else {
            console.warn('[MenuContextoToken] onOcultar não definido');
        }
        if (onFechar) {
            console.log('[MenuContextoToken] Chamando onFechar');
            onFechar();
        } else {
            console.warn('[MenuContextoToken] onFechar não definido');
        }
    };

    const handleInverter = () => {
        console.log('[MenuContextoToken] Botão Inverter clicado', { tokenNome, tipo });
        if (onInverter) {
            console.log('[MenuContextoToken] Chamando onInverter');
            onInverter();
        } else {
            console.warn('[MenuContextoToken] onInverter não definido');
        }
        if (onFechar) {
            console.log('[MenuContextoToken] Chamando onFechar');
            onFechar();
        } else {
            console.warn('[MenuContextoToken] onFechar não definido');
        }
    };

    const handleBloquear = () => {
        console.log('[MenuContextoToken] Botão Bloquear/Desbloquear clicado', { tokenNome, estaBloqueado, tipo });
        if (onBloquear) {
            console.log('[MenuContextoToken] Chamando onBloquear');
            onBloquear();
        } else {
            console.warn('[MenuContextoToken] onBloquear não definido');
        }
        if (onFechar) {
            console.log('[MenuContextoToken] Chamando onFechar');
            onFechar();
        } else {
            console.warn('[MenuContextoToken] onFechar não definido');
        }
    };

    const handleDeletar = () => {
        console.log('[MenuContextoToken] Botão Deletar clicado', { tokenNome, tipo });
        if (onDeletar) {
            console.log('[MenuContextoToken] Chamando onDeletar');
            onDeletar();
        } else {
            console.warn('[MenuContextoToken] onDeletar não definido');
        }
        if (onFechar) {
            console.log('[MenuContextoToken] Chamando onFechar');
            onFechar();
        } else {
            console.warn('[MenuContextoToken] onFechar não definido');
        }
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