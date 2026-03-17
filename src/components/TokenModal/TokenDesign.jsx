import React, { useState, useRef, useEffect } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { PastaVisual, TokenVisual, MenuContextualPasta } from "./PastaComponents";
import { DragDropSystem } from "./TokenModal";

function TokenDesign({
    //controle do modal
    isOpen,
    onClose,
    modalRef,
    pastaModalRef,

    //abas
    activeTab,
    setActiveTab,

    //token atual sendo importado
    imagemSelecionada,
    setImagemSelecionada,
    nomeToken,
    setNomeToken,

    //dados da biblioteca
    bibliotecaTokens,
    setBibliotecaTokens,

    //pasta atual e seu modal
    modalPastaAberto,
    setModalPastaAberto,
    pastaAtual,
    setPastaAtual,

    //menus contextuais
    menuContextual,
    setMenuContextual,
    menuContextualPasta,
    setMenuContextualPasta,

    //renomeacao de pasta
    pastaRenomeando,
    setPastaRenomeando,
    novoNomePasta,
    setNovoNomePasta,

    //renomeacao de token
    tokenRenomeando,
    setTokenRenomeando,
    novoNomeToken,
    setNovoNomeToken,

    //flags de estado
    criandoSubPasta,
    setCriandoSubPasta,

    //funcoes da biblioteca
    salvarTokenNaBiblioteca,
    criarPasta,
    adicionarItemNaPasta,
    removerItemDaPasta,
    excluirPasta,
    renomearPasta,
    buscarItensPorPastaPai,

    //funcoes de renomeacao de pasta
    iniciarRenomeacaoPasta,
    salvarRenomeacaoPasta,
    cancelarRenomeacaoPasta,

    //funcoes de renomeacao de token
    iniciarRenomeacaoToken,
    salvarRenomeacaoToken,
    cancelarRenomeacaoToken,
    excluirToken,

    //funcoes do modal da pasta
    adicionarItemNaPastaAtual,
    removerItemDaPastaAtual,
    abrirSubPasta,
    renomearPastaAtual,
    excluirPastaAtual,
    criarSubPastaAqui,
    voltarPasta
}) {
    const [dragOverItem, setDragOverItem] = useState(null);
    const [menuContextualToken, setMenuContextualToken] = useState({
        aberto: false, x: 0, y: 0, idToken: null, nomeToken: null
    });

    //limpa estados quando fecha o modal principal
    useEffect(() => {
        if (!isOpen) {
            setPastaRenomeando(null);
            setNovoNomePasta('');
            setTokenRenomeando(null);
            setNovoNomeToken('');
            setMenuContextual({
                aberto: false, x: 0, y: 0, idPasta: null, nomePasta: null
            });
            setMenuContextualToken({
                aberto: false, x: 0, y: 0, idToken: null, nomeToken: null
            });
        }
    }, [isOpen, setPastaRenomeando, setNovoNomePasta, setTokenRenomeando, setNovoNomeToken, setMenuContextual]);

    const handleModalClick = (e) => e.stopPropagation();

    //handlers de drag usando DragDropSystem
    const handleDragStart = (e, dados) => {
        e.dataTransfer.setData('application/json', JSON.stringify(dados));
        e.dataTransfer.effectAllowed = 'move';

        if (dados.tipo === "token" && dados.imagemUrl) {
            const img = new Image();
            img.src = dados.imagemUrl;
            img.onload = () => {
                const size = Math.min(60, dados.larguraOriginal || 60);
                e.dataTransfer.setDragImage(img, size / 2, size / 2);
            };
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const dados = JSON.parse(e.dataTransfer.getData('application/json'));
            DragDropSystem.processDrop(e, dados);
        } catch (erro) {
            console.log("erro no drop:", erro);
        }
    };

    //render do modal da pasta (subpastas e tokens)
    const renderModalPasta = () => {
        if (!pastaAtual) return null;

        const itensDaPasta = pastaAtual.itens || [];
        const subPastas = bibliotecaTokens.filter(item =>
            item.tipo === "pasta" && item.pastaPai === pastaAtual.id
        );
        const tokens = itensDaPasta.filter(item => item.tipo !== "pasta");
        const itensOrdenados = [...subPastas, ...tokens];

        return (
            <Modal
                open={modalPastaAberto}
                onClose={() => {
                    setModalPastaAberto(false);
                    setPastaAtual(null);
                    setDragOverItem(null);
                    setCriandoSubPasta(false);
                }}
                slotProps={{
                    backdrop: {
                        onDragOver: handleDragOver,
                        onDrop: handleDrop,
                        sx: {
                            pointerEvents: 'auto',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)'
                        }
                    }
                }}
            >
                <Box
                    ref={pastaModalRef}
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 450,
                        bgcolor: '#1a1f27',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        borderRadius: 3,
                        border: '1px solid #3a4050',
                        overflow: 'hidden'
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {/* cabeçalho com gradiente */}
                    <Box sx={{
                        background: 'linear-gradient(135deg, #2a313c 0%, #1f252e 100%)',
                        borderBottom: '1px solid #3f4b5a',
                        px: 3,
                        py: 2
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    cursor: 'pointer',
                                    color: '#e6e9f0',
                                    fontWeight: 600,
                                    letterSpacing: '0.3px',
                                    '&:hover': { color: '#fff' }
                                }}
                                onDoubleClick={renomearPastaAtual}
                            >
                                <FolderIcon sx={{ color: '#5b8cff', fontSize: 28 }} />
                                {pastaAtual.nome}
                            </Typography>

                            <Button
                                onClick={() => {
                                    setModalPastaAberto(false);
                                    setPastaAtual(null);
                                }}
                                variant="text"
                                sx={{
                                    minWidth: 'auto',
                                    color: '#a0a8b8',
                                    fontSize: 20,
                                    '&:hover': {
                                        color: '#fff',
                                        backgroundColor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                ✕
                            </Button>
                        </Box>

                        {/* breadcrumb ou info adicional */}
                        {pastaAtual.pastaPai && (
                            <Typography sx={{ color: '#7e8a9a', fontSize: 12, mt: 0.5, ml: 5 }}>
                                Subpasta • {itensOrdenados.length} ite{itensOrdenados.length !== 1 ? 'ns' : 'm'}
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ p: 3, bgcolor: '#1e232c' }}>
                        {itensOrdenados.length === 0 ? (
                            <Box sx={{
                                textAlign: 'center',
                                py: 6,
                                px: 3,
                                color: '#7e8a9a',
                                border: '2px dashed #3a4050',
                                borderRadius: 3,
                                backgroundColor: '#252b35',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: '#5b8cff',
                                    backgroundColor: '#2a313f'
                                }
                            }}>
                                <FolderOpenIcon sx={{ fontSize: 64, color: '#4a5568', mb: 2 }} />
                                <Typography sx={{ color: '#b0b8c8', fontWeight: 500, mb: 1 }}>
                                    Esta pasta está vazia
                                </Typography>
                                <Typography sx={{ color: '#7e8a9a', fontSize: 13 }}>
                                    Arraste tokens para dentro desta pasta
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Typography sx={{ color: '#b0b8c8', fontSize: 13, mb: 2, ml: 1 }}>
                                    {itensOrdenados.length} ite{itensOrdenados.length !== 1 ? 'ns' : 'm'} nesta pasta
                                </Typography>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                                    gap: 2,
                                    maxHeight: 350,
                                    overflowY: 'auto',
                                    pr: 1,
                                    mb: 1,
                                    '&::-webkit-scrollbar': {
                                        width: '6px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        background: '#2a313c',
                                        borderRadius: '10px',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: '#4a5568',
                                        borderRadius: '10px',
                                        '&:hover': {
                                            background: '#5b8cff',
                                        }
                                    }
                                }}>
                                    {itensOrdenados.map(item => (
                                        item.tipo === "pasta" ? (
                                            <Box
                                                key={item.id}
                                                sx={{
                                                    transform: 'scale(1)',
                                                    transition: 'transform 0.2s',
                                                    width: '100%',
                                                    height: '100%'
                                                }}
                                            >
                                                <PastaVisual
                                                    pasta={item}
                                                    estaRenomeando={pastaRenomeando === item.id}
                                                    novoNome={novoNomePasta}
                                                    onNomeChange={setNovoNomePasta}
                                                    onSalvarRenomeacao={salvarRenomeacaoPasta}
                                                    onCancelarRenomeacao={cancelarRenomeacaoPasta}
                                                    onAbrirPasta={abrirSubPasta}
                                                    onContextMenu={(dados) => {
                                                        setMenuContextualPasta({
                                                            aberto: true,
                                                            x: dados.x, y: dados.y,
                                                            idPasta: dados.idPasta
                                                        });
                                                    }}
                                                    onDragStart={(e, pasta) => handleDragStart(e, { ...pasta, tipo: "pasta" })}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e, pastaDestino) => {
                                                        e.preventDefault();
                                                        try {
                                                            const dados = JSON.parse(e.dataTransfer.getData('application/json'));
                                                            if (dados.id) {
                                                                removerItemDaPastaAtual(pastaAtual.id, dados.id);
                                                                setTimeout(() => adicionarItemNaPastaAtual(pastaDestino.id, dados), 50);
                                                            }
                                                        } catch (erro) {
                                                            console.log("erro no drop:", erro);
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        ) : (
                                            <TokenVisual
                                                key={item.id}
                                                token={item}
                                                estaRenomeando={tokenRenomeando === item.id}
                                                novoNome={novoNomeToken}
                                                onNomeChange={setNovoNomeToken}
                                                onSalvarRenomeacao={salvarRenomeacaoToken}
                                                onCancelarRenomeacao={cancelarRenomeacaoToken}
                                                onContextMenu={(dados) => setMenuContextualToken({
                                                    aberto: true,
                                                    x: dados.x,
                                                    y: dados.y,
                                                    idToken: dados.idToken,
                                                    nomeToken: dados.nomeToken
                                                })}
                                                onDragStart={(e, token) => handleDragStart(e, {
                                                    ...token,
                                                    tipo: "token",
                                                    larguraOriginal: token.larguraOriginal,
                                                    alturaOriginal: token.alturaOriginal
                                                })}
                                                onDragOver={(e, token) => {
                                                    e.preventDefault();
                                                    setDragOverItem(token.id);
                                                }}
                                                onDragLeave={() => setDragOverItem(null)}
                                                onDrop={(e, tokenDestino) => {
                                                    e.preventDefault();
                                                    setDragOverItem(null);
                                                    if (criandoSubPasta) return;

                                                    try {
                                                        const tokenArrastado = JSON.parse(e.dataTransfer.getData('application/json'));
                                                        if (tokenArrastado.id !== tokenDestino.id) {
                                                            setCriandoSubPasta(true);
                                                            removerItemDaPastaAtual(pastaAtual.id, tokenArrastado.id);
                                                            removerItemDaPastaAtual(pastaAtual.id, tokenDestino.id);

                                                            setTimeout(() => {
                                                                const novaSubPasta = {
                                                                    id: `pasta-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                                                                    tipo: "pasta",
                                                                    nome: "Nova subpasta",
                                                                    pastaPai: pastaAtual.id,
                                                                    itens: [tokenArrastado, tokenDestino],
                                                                    dataCriacao: new Date().toISOString()
                                                                };
                                                                setBibliotecaTokens(prev => [...prev, novaSubPasta]);
                                                                adicionarItemNaPastaAtual(pastaAtual.id, novaSubPasta);
                                                                setCriandoSubPasta(false);
                                                            }, 50);
                                                        }
                                                    } catch (erro) {
                                                        console.log("erro ao criar subpasta:", erro);
                                                        setCriandoSubPasta(false);
                                                    }
                                                }}
                                            />
                                        )
                                    ))}
                                </Box>
                            </>
                        )}

                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            borderTop: '1px solid #3a4050',
                            mt: 2,
                            pt: 2
                        }}>
                            <Button
                                onClick={voltarPasta}
                                variant="outlined"
                                sx={{
                                    color: '#b0b8c8',
                                    borderColor: '#4a5568',
                                    borderRadius: 2,
                                    px: 3,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': {
                                        borderColor: '#5b8cff',
                                        color: '#fff',
                                        backgroundColor: 'rgba(91,140,255,0.1)'
                                    }
                                }}
                            >
                                ← Voltar
                            </Button>
                        </Box>
                    </Box>

                    {menuContextualPasta?.aberto && (
                        <MenuContextualPasta
                            x={menuContextualPasta.x}
                            y={menuContextualPasta.y}
                            onRenomear={() => {
                                const subPasta = bibliotecaTokens.find(p => p.id === menuContextualPasta.idPasta);
                                if (subPasta) iniciarRenomeacaoPasta(subPasta.id, subPasta.nome);
                                setMenuContextualPasta({ aberto: false, x: 0, y: 0, idPasta: null });
                            }}
                            onExcluir={() => {
                                excluirPasta(menuContextualPasta.idPasta);
                                setMenuContextualPasta({ aberto: false, x: 0, y: 0, idPasta: null });
                            }}
                            onFechar={() => setMenuContextualPasta({ aberto: false, x: 0, y: 0, idPasta: null })}
                        />
                    )}
                </Box>
            </Modal>
        );
    };

    //render do conteudo das abas (biblioteca principal)
    const renderConteudoAba = () => {
        switch (activeTab) {
            case 0: {
                const itensRaiz = buscarItensPorPastaPai(null);
                const pastas = itensRaiz.filter(item => item.tipo === "pasta");
                const tokens = itensRaiz.filter(item => item.tipo === "token");
                const itensOrdenados = [...pastas, ...tokens];

                if (itensRaiz.length === 0) {
                    return (
                        <Box sx={{
                            color: '#a0a8b8',
                            textAlign: 'center',
                            py: 6,
                            px: 3,
                            backgroundColor: '#252b35',
                            borderRadius: 3,
                            border: '1px dashed #4a5568'
                        }}>
                            <FolderOpenIcon sx={{ fontSize: 64, color: '#4a5568', mb: 2 }} />
                            <Typography sx={{ color: '#e6e9f0', fontWeight: 500, mb: 1 }}>
                                Nenhum token ou pasta na biblioteca
                            </Typography>
                            <Typography sx={{ color: '#7e8a9a', fontSize: 14 }}>
                                Importe um token na aba "Importar" ou arraste tokens um sobre o outro para criar pastas
                            </Typography>
                        </Box>
                    );
                }

                return (
                    <Box>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                            px: 1
                        }}>
                            <Typography sx={{
                                color: '#b0b8c8',
                                fontWeight: 600,
                                fontSize: 14,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Biblioteca • {itensRaiz.length} ite{itensRaiz.length !== 1 ? 'ns' : 'm'}
                            </Typography>
                            <Typography sx={{ color: '#5b8cff', fontSize: 13 }}>
                                Arraste para organizar
                            </Typography>
                        </Box>

                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                            gap: 2,
                            maxHeight: 450,
                            overflowY: 'auto',
                            p: 1,
                            '&::-webkit-scrollbar': {
                                width: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: '#2a313c',
                                borderRadius: '10px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: '#4a5568',
                                borderRadius: '10px',
                                '&:hover': {
                                    background: '#5b8cff',
                                }
                            }
                        }}>
                            {itensOrdenados.map((item, index) => {
                                const key = `${item.tipo}-${item.id}-${index}`;

                                if (item.tipo === "pasta") {
                                    return (
                                        <Box
                                            key={key}
                                            sx={{
                                                transform: 'scale(1)',
                                                transition: 'transform 0.2s',
                                                width: '100%',
                                                height: '100%'
                                            }}
                                        >
                                            <PastaVisual
                                                pasta={item}
                                                estaRenomeando={pastaRenomeando === item.id}
                                                novoNome={novoNomePasta}
                                                onNomeChange={setNovoNomePasta}
                                                onSalvarRenomeacao={salvarRenomeacaoPasta}
                                                onCancelarRenomeacao={cancelarRenomeacaoPasta}
                                                onAbrirPasta={(pasta) => {
                                                    setPastaAtual(pasta);
                                                    setModalPastaAberto(true);
                                                }}
                                                onContextMenu={(dados) => setMenuContextual({
                                                    aberto: true, x: dados.x, y: dados.y,
                                                    idPasta: dados.idPasta, nomePasta: dados.nomePasta
                                                })}
                                                onDragStart={(e, pasta) => handleDragStart(e, { ...pasta, tipo: "pasta" })}
                                                onDragOver={(e, pasta) => {
                                                    e.preventDefault();
                                                    setDragOverItem(pasta.id);
                                                }}
                                                onDragLeave={() => setDragOverItem(null)}
                                                onDrop={(e, pastaDestino) => {
                                                    e.preventDefault();
                                                    setDragOverItem(null);

                                                    try {
                                                        const dados = JSON.parse(e.dataTransfer.getData('application/json'));
                                                        if (dados.tipo === "token" && dados.id) {
                                                            const tokenParaMover = bibliotecaTokens.find(t => t.id === dados.id);
                                                            if (tokenParaMover) {
                                                                setBibliotecaTokens(prev => prev.filter(item => item.id !== dados.id));
                                                                adicionarItemNaPasta(pastaDestino.id, tokenParaMover);
                                                            }
                                                        }
                                                    } catch (erro) {
                                                        console.error("erro no drop:", erro);
                                                    }
                                                }}
                                            />
                                        </Box>
                                    );
                                }

                                return (
                                    <TokenVisual
                                        key={key}
                                        token={item}
                                        estaRenomeando={tokenRenomeando === item.id}
                                        novoNome={novoNomeToken}
                                        onNomeChange={setNovoNomeToken}
                                        onSalvarRenomeacao={salvarRenomeacaoToken}
                                        onCancelarRenomeacao={cancelarRenomeacaoToken}
                                        onContextMenu={(dados) => setMenuContextualToken({
                                            aberto: true,
                                            x: dados.x,
                                            y: dados.y,
                                            idToken: dados.idToken,
                                            nomeToken: dados.nomeToken
                                        })}
                                        onDragStart={(e, token) => handleDragStart(e, {
                                            ...token,
                                            tipo: "token",
                                            larguraOriginal: token.larguraOriginal,
                                            alturaOriginal: token.alturaOriginal
                                        })}
                                        onDragOver={(e, token) => {
                                            e.preventDefault();
                                            setDragOverItem(token.id);
                                        }}
                                        onDragLeave={() => setDragOverItem(null)}
                                        onDrop={(e, tokenDestino) => {
                                            e.preventDefault();
                                            setDragOverItem(null);

                                            try {
                                                const dados = JSON.parse(e.dataTransfer.getData('application/json'));
                                                if (dados.tipo === "token" && dados.id !== tokenDestino.id) {
                                                    const token1 = bibliotecaTokens.find(t => t.id === dados.id);
                                                    const token2 = bibliotecaTokens.find(t => t.id === tokenDestino.id);

                                                    if (token1 && token2) {
                                                        setBibliotecaTokens(prev => prev.filter(t => t.id !== token1.id && t.id !== token2.id));
                                                        const novaPasta = criarPasta([token1, token2], null);
                                                        setBibliotecaTokens(prev => [...prev, novaPasta]);
                                                    }
                                                }
                                            } catch (erro) {
                                                console.error("erro no drop sobre token:", erro);
                                            }
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                );
            }

            case 1:
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography sx={{
                            color: '#e6e9f0',
                            mb: 3,
                            fontWeight: 600,
                            fontSize: 16
                        }}>
                            Importar Nova Imagem
                        </Typography>

                        <Box sx={{
                            backgroundColor: '#252b35',
                            borderRadius: 3,
                            p: 3,
                            border: '1px solid #3a4050'
                        }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const arquivo = e.target.files[0];
                                    if (arquivo) setImagemSelecionada(URL.createObjectURL(arquivo));
                                }}
                                style={{
                                    width: '100%',
                                    padding: 12,
                                    backgroundColor: '#1e232c',
                                    color: '#b0b8c8',
                                    border: '2px dashed #4a5568',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontSize: 14
                                }}
                            />

                            {imagemSelecionada && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography sx={{ color: '#b0b8c8', mb: 1, fontSize: 14 }}>Preview:</Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        bgcolor: '#1a1f27',
                                        p: 2,
                                        borderRadius: 2,
                                        border: '1px solid #3a4050'
                                    }}>
                                        <img
                                            src={imagemSelecionada}
                                            alt="Preview"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: 200,
                                                objectFit: 'contain',
                                                borderRadius: 4
                                            }}
                                        />
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{ mt: 3 }}>
                                <label htmlFor="nomeToken" style={{
                                    color: '#b0b8c8',
                                    display: 'block',
                                    marginBottom: 8,
                                    fontSize: 14,
                                    fontWeight: 500
                                }}>
                                    Nome do Token:
                                </label>
                                <input
                                    type="text"
                                    id="nomeToken"
                                    value={nomeToken}
                                    onChange={(e) => setNomeToken(e.target.value)}
                                    placeholder="Ex: Guerreiro, Ladrao, NPC, Inimigo, Carlos"
                                    style={{
                                        width: '100%',
                                        padding: 12,
                                        backgroundColor: '#1e232c',
                                        color: '#e6e9f0',
                                        border: '1px solid #4a5568',
                                        borderRadius: 8,
                                        fontSize: 14,
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#5b8cff'}
                                    onBlur={(e) => e.target.style.borderColor = '#4a5568'}
                                />
                                {nomeToken && (
                                    <p style={{
                                        color: '#7e8a9a',
                                        marginTop: 8,
                                        fontSize: 13
                                    }}>
                                        Token será salvo como: <strong style={{ color: '#5b8cff' }}>{nomeToken}</strong>
                                    </p>
                                )}
                            </Box>
                        </Box>
                    </Box>
                );

            default:
                return <Box sx={{ color: '#fff', textAlign: 'center', py: 3 }}>Selecione uma aba</Box>;
        }
    };

    return (
        <>
            <Modal
                open={isOpen}
                onClose={onClose}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                slotProps={{
                    backdrop: {
                        onDragOver: handleDragOver,
                        onDrop: handleDrop,
                        sx: {
                            pointerEvents: 'auto',
                            backgroundColor: 'rgba(0, 0, 0, 0.9)'
                        }
                    }
                }}
                disablePortal={false}
                disableEnforceFocus
                disableAutoFocus
                keepMounted={false}
                hideBackdrop={false}
                style={{ pointerEvents: 'auto', zIndex: 1300 }}
            >
                <Box
                    ref={modalRef}
                    onClick={handleModalClick}
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 600,
                        maxWidth: '95vw',
                        maxHeight: '85vh',
                        bgcolor: '#1a1f27',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                        borderRadius: 4,
                        border: '1px solid #3a4050',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {/* cabeçalho do modal principal */}
                    <Box sx={{
                        background: 'linear-gradient(135deg, #2a313c 0%, #1f252e 100%)',
                        borderBottom: '1px solid #3f4b5a',
                        px: 3,
                        py: 2
                    }}>
                        <Typography variant="h6" sx={{
                            color: '#e6e9f0',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <FolderIcon sx={{ color: '#5b8cff' }} />
                            Biblioteca de Tokens
                        </Typography>
                    </Box>

                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        sx={{
                            minHeight: 48,
                            px: 2,
                            pt: 1,
                            bgcolor: '#1e232c',
                            '& .MuiTab-root': {
                                color: '#a0a8b8',
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: 15,
                                minHeight: 40,
                                '&.Mui-selected': {
                                    color: '#5b8cff',
                                    fontWeight: 700
                                }
                            },
                            '& .MuiTabs-indicator': {
                                bgcolor: '#5b8cff',
                                height: 3,
                                borderRadius: '3px 3px 0 0'
                            }
                        }}
                    >
                        <Tab label="Biblioteca" />
                        <Tab label="Importar" />
                    </Tabs>

                    <Box sx={{
                        flex: 1,
                        overflowY: 'auto',
                        p: 3,
                        bgcolor: '#1e232c',
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#2a313c',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#4a5568',
                            borderRadius: '10px',
                            '&:hover': {
                                background: '#5b8cff',
                            }
                        }
                    }}>
                        {renderConteudoAba()}
                    </Box>

                    {menuContextual?.aberto && (
                        <MenuContextualPasta
                            x={menuContextual.x}
                            y={menuContextual.y}
                            onRenomear={() => {
                                if (menuContextual.idPasta && menuContextual.nomePasta) {
                                    iniciarRenomeacaoPasta(menuContextual.idPasta, menuContextual.nomePasta);
                                }
                                setMenuContextual({ aberto: false, x: 0, y: 0, idPasta: null, nomePasta: null });
                            }}
                            onExcluir={() => {
                                if (menuContextual.idPasta) excluirPasta(menuContextual.idPasta);
                                setMenuContextual({ aberto: false, x: 0, y: 0, idPasta: null, nomePasta: null });
                            }}
                            onFechar={() => setMenuContextual({ aberto: false, x: 0, y: 0, idPasta: null, nomePasta: null })}
                        />
                    )}

                    {menuContextualToken?.aberto && (
                        <MenuContextualPasta
                            x={menuContextualToken.x}
                            y={menuContextualToken.y}
                            onRenomear={() => {
                                if (menuContextualToken.idToken && menuContextualToken.nomeToken) {
                                    console.log("renomear token:", menuContextualToken.idToken);
                                    iniciarRenomeacaoToken(menuContextualToken.idToken, menuContextualToken.nomeToken);
                                }
                                setMenuContextualToken({ aberto: false, x: 0, y: 0, idToken: null, nomeToken: null });
                            }}
                            onExcluir={() => {
                                if (menuContextualToken.idToken) {
                                    console.log("excluir token:", menuContextualToken.idToken);
                                    excluirToken(menuContextualToken.idToken);
                                }
                                setMenuContextualToken({ aberto: false, x: 0, y: 0, idToken: null, nomeToken: null });
                            }}
                            onFechar={() => setMenuContextualToken({ aberto: false, x: 0, y: 0, idToken: null, nomeToken: null })}
                        />
                    )}

                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1.5,
                        p: 2,
                        bgcolor: '#1a1f27',
                        borderTop: '1px solid #3a4050'
                    }}>
                        <Button
                            onClick={onClose}
                            variant="outlined"
                            sx={{
                                color: '#b0b8c8',
                                borderColor: '#4a5568',
                                borderRadius: 2,
                                px: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                    borderColor: '#7e8a9a',
                                    color: '#fff',
                                    backgroundColor: 'rgba(255,255,255,0.05)'
                                }
                            }}
                        >
                            Fechar
                        </Button>

                        {activeTab === 1 && (
                            <Button
                                onClick={salvarTokenNaBiblioteca}
                                disabled={!imagemSelecionada || !nomeToken?.trim()}
                                variant="contained"
                                sx={{
                                    bgcolor: '#5b8cff',
                                    borderRadius: 2,
                                    px: 4,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 12px rgba(91,140,255,0.3)',
                                    '&:hover': {
                                        bgcolor: '#4a7ae0',
                                        boxShadow: '0 6px 16px rgba(91,140,255,0.4)'
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: '#2a3440',
                                        color: '#6a7480'
                                    }
                                }}
                            >
                                Salvar Token
                            </Button>
                        )}
                    </Box>
                </Box>
            </Modal>

            {renderModalPasta()}
        </>
    );
}

export default TokenDesign;