import React, { useRef, useEffect, useState } from "react";
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReactDOM from 'react-dom';

export function IconePasta(props) {
    const quantidade = props.quantidade || 0;
    const nomePasta = props.nome || "Pasta";
    const estaAberta = props.estaAberta || false;
    const estaRenomeando = props.estaRenomeando || false;
    const novoNome = props.novoNome || '';
    const onNomeChange = props.onNomeChange || function () { };
    const onSalvarRenomeacao = props.onSalvarRenomeacao || function () { };
    const onCancelarRenomeacao = props.onCancelarRenomeacao || function () { };
    const inputRef = props.inputRef || null;

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        cursor: props.estaRenomeando ? 'default' : 'pointer'
    };

    const nomeStyle = {
        marginTop: '8px',
        fontSize: '12px',
        fontWeight: '600',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '100%',
        color: '#e6e9f0',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
    };

    const inputStyle = {
        marginTop: '8px',
        padding: '6px 8px',
        width: '90%',
        fontSize: '12px',
        fontWeight: '600',
        textAlign: 'center',
        backgroundColor: '#fff',
        color: '#000',
        border: '2px solid #5b8cff',
        borderRadius: '6px',
        outline: 'none',
        fontFamily: 'inherit'
    };

    const badgeStyle = {
        position: 'absolute',
        top: '-6px',
        right: '-6px',
        backgroundColor: '#5b8cff',
        color: 'white',
        fontSize: '11px',
        fontWeight: 'bold',
        minWidth: '20px',
        height: '20px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
        border: '2px solid #1a1f27',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        zIndex: 2
    };

    const iconeContainerStyle = {
        position: 'relative',
        display: 'inline-block'
    };

    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            onSalvarRenomeacao();
        } else if (event.key === 'Escape') {
            onCancelarRenomeacao();
        }
    }

    return (
        <div style={containerStyle}>
            <div style={iconeContainerStyle}>
                {estaAberta ? (
                    <FolderOpenIcon
                        sx={{
                            fontSize: 70,
                            color: '#FFD966',
                            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))'
                        }}
                    />
                ) : (
                    <FolderIcon
                        sx={{
                            fontSize: 70,
                            color: '#FFD966',
                            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))'
                        }}
                    />
                )}

                {quantidade > 0 && (
                    <span style={badgeStyle}>
                        {quantidade > 99 ? '99+' : quantidade}
                    </span>
                )}
            </div>

            {estaRenomeando ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={novoNome}
                    onChange={(e) => onNomeChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={onSalvarRenomeacao}
                    style={inputStyle}
                    autoFocus
                />
            ) : (
                <div style={nomeStyle}>
                    {nomePasta}
                </div>
            )}
        </div>
    );
}

export function MenuContextualPasta(props) {
    const {
        x,
        y,
        onRenomear,
        onExcluir,
        onFechar
    } = props;

    const menuRef = useRef(null);
    const [position, setPosition] = useState({ top: y, left: x });

    useEffect(() => {
        function ajustarPosicao() {
            if (menuRef.current) {
                const menuRect = menuRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                let top = y;
                let left = x;
                
                if (left + menuRect.width > viewportWidth) {
                    left = viewportWidth - menuRect.width - 10;
                }
                
                if (left < 10) {
                    left = 10;
                }
                
                if (top + menuRect.height > viewportHeight) {
                    top = viewportHeight - menuRect.height - 10;
                }
                
                if (top < 10) {
                    top = 10;
                }
                
                setPosition({ top, left });
            }
        }
        
        ajustarPosicao();
        
        window.addEventListener('resize', ajustarPosicao);
        window.addEventListener('scroll', ajustarPosicao);
        
        return () => {
            window.removeEventListener('resize', ajustarPosicao);
            window.removeEventListener('scroll', ajustarPosicao);
        };
    }, [x, y]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                if (onFechar) {
                    onFechar();
                }
            }
        }

        function handleEscapeKey(event) {
            if (event.key === 'Escape') {
                if (onFechar) {
                    onFechar();
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'auto';
        };
    }, [onFechar]);

    const menuContent = (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                backgroundColor: '#1e232c',
                border: '1px solid #3a4050',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '4px 0',
                minWidth: '180px',
                zIndex: 999999,
                animation: 'menuFadeIn 0.15s ease'
            }}
        >
            <style>{`
                @keyframes menuFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
            
            <button
                style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#e6e9f0',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    fontWeight: 500
                }}
                onClick={(event) => {
                    event.stopPropagation();
                    if (onRenomear) onRenomear();
                    if (onFechar) onFechar();
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a3440';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#e6e9f0';
                }}
            >
                ✏️ Renomear
            </button>

            <div style={{ height: '1px', backgroundColor: '#3a4050', margin: '4px 0' }} />

            <button
                style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#ff8a8a',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    fontWeight: 500
                }}
                onClick={(event) => {
                    event.stopPropagation();
                    if (onExcluir) onExcluir();
                    if (onFechar) onFechar();
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4a2c2c';
                    e.currentTarget.style.color = '#ffb0b0';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#ff8a8a';
                }}
            >
                🗑️ Excluir pasta
            </button>
        </div>
    );

    return ReactDOM.createPortal(
        menuContent,
        document.body
    );
}

export function PastaVisual(props) {
    const {
        pasta,
        estaRenomeando,
        novoNome,
        onNomeChange,
        onSalvarRenomeacao,
        onCancelarRenomeacao,
        onAbrirPasta,
        onContextMenu,
        onDragStart,
        onDragOver,
        onDrop
    } = props;

    const inputRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (estaRenomeando && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [estaRenomeando]);

    const quantidadeItens = pasta.itens ? pasta.itens.length : 0;

    function handleContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();

        const coordenadas = {
            x: event.clientX,
            y: event.clientY,
            idPasta: pasta.id,
            nomePasta: pasta.nome
        };

        if (onContextMenu) {
            onContextMenu(coordenadas);
        }
    }

    function handleClick(event) {
        event.stopPropagation();

        if (estaRenomeando) {
            return;
        }

        if (onAbrirPasta) {
            onAbrirPasta(pasta);
        }
    }

    function handleDragStart(event) {
        event.stopPropagation();

        if (estaRenomeando) {
            event.preventDefault();
            return;
        }

        const pastaData = {
            id: pasta.id,
            tipo: "pasta",
            nome: pasta.nome,
            itens: pasta.itens
        };

        event.dataTransfer.setData('application/json', JSON.stringify(pastaData));
        event.dataTransfer.effectAllowed = 'move';

        if (onDragStart) {
            onDragStart(event, pasta);
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';

        if (onDragOver) {
            onDragOver(event, pasta);
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();

        if (onDrop) {
            onDrop(event, pasta);
        }
    }

    const containerStyle = {
        border: estaRenomeando
            ? '2px solid #5b8cff'
            : isHovered
                ? '1px solid #7a9eb3'
                : '1px solid #3a4050',
        borderRadius: '12px',
        padding: '12px',
        textAlign: 'center',
        backgroundColor: estaRenomeando ? '#2a3440' : '#252b35',
        cursor: estaRenomeando ? 'default' : 'grab',
        transition: 'all 0.2s ease',
        position: 'relative',
        opacity: estaRenomeando ? 0.95 : 1,
        boxShadow: estaRenomeando 
            ? '0 0 12px rgba(91,140,255,0.5)' 
            : isHovered 
                ? '0 8px 16px rgba(0,0,0,0.3)' 
                : '0 4px 8px rgba(0,0,0,0.2)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    };

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            draggable={!estaRenomeando}
        >
            <IconePasta
                quantidade={quantidadeItens}
                nome={pasta.nome}
                estaAberta={false}
                estaRenomeando={estaRenomeando}
                novoNome={novoNome}
                onNomeChange={onNomeChange}
                onSalvarRenomeacao={onSalvarRenomeacao}
                onCancelarRenomeacao={onCancelarRenomeacao}
                inputRef={inputRef}
            />

            {isHovered && !estaRenomeando && (
                <MoreVertIcon
                    style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        fontSize: '18px',
                        color: '#a0a8b8',
                        cursor: 'context-menu',
                        transition: 'color 0.2s ease',
                        opacity: 0.8
                    }}
                />
            )}
        </div>
    );
}