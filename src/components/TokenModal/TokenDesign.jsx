import React, { useState, useRef, useEffect } from "react";
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
    isOpen,
    onClose,
    modalRef,
    pastaModalRef,
    activeTab,
    setActiveTab,
    imagemSelecionada,
    setImagemSelecionada,
    setImagemBase64,
    nomeToken,
    setNomeToken,
    bibliotecaTokens,
    setBibliotecaTokens,
    modalPastaAberto,
    setModalPastaAberto,
    pastaAtual,
    setPastaAtual,
    menuContextual,
    setMenuContextual,
    menuContextualPasta,
    setMenuContextualPasta,
    pastaRenomeando,
    setPastaRenomeando,
    novoNomePasta,
    setNovoNomePasta,
    tokenRenomeando,
    setTokenRenomeando,
    novoNomeToken,
    setNovoNomeToken,
    criandoSubPasta,
    setCriandoSubPasta,
    salvarTokenNaBiblioteca,
    criarPasta,
    adicionarItemNaPasta,
    removerItemDaPasta,
    excluirPasta,
    renomearPasta,
    buscarItensPorPastaPai,
    iniciarRenomeacaoPasta,
    salvarRenomeacaoPasta,
    cancelarRenomeacaoPasta,
    iniciarRenomeacaoToken,
    salvarRenomeacaoToken,
    cancelarRenomeacaoToken,
    excluirToken,
    adicionarItemNaPastaAtual,
    removerItemDaPastaAtual,
    abrirSubPasta,
    renomearPastaAtual,
    excluirPastaAtual,
    criarSubPastaAqui,
    voltarPasta,
    recortarToken,
    colarToken,
    tokenClipboard,
    historicoPastas,
    loading,
}) {
    const [dragOverItem, setDragOverItem] = useState(null);
    const [menuContextualToken, setMenuContextualToken] = useState({
        aberto: false, x: 0, y: 0, idToken: null, nomeToken: null
    });
    const [urlExterna, setUrlExterna] = useState("");
    const [uploadLoading, setUploadLoading] = useState(false);

    // Isola o sidebar do tabletop: bloqueia mouse/touch/wheel + conecta drag-drop
    useEffect(() => {
        const el = modalRef?.current;
        if (!el) return;
        DragDropSystem.isolateElement(el);
        return () => DragDropSystem.releaseElement(el);
    }, [isOpen, modalRef]);

    // Isola o sub-pasta panel quando aberto
    useEffect(() => {
        const el = pastaModalRef?.current;
        if (!el || !modalPastaAberto) return;
        DragDropSystem.isolateElement(el);
        return () => DragDropSystem.releaseElement(el);
    }, [modalPastaAberto, pastaModalRef]);

    // Registra zona de drop da biblioteca
    useEffect(() => {
        if (!isOpen) return;
        const raf = requestAnimationFrame(() => {
            if (!modalRef?.current) return;
            DragDropSystem.registerZone('BibliotecaRaiz', modalRef.current, {
                onJsonDrop: (dados) => {
                    if (dados.tipo !== 'token') return;
                    setBibliotecaTokens(prev => {
                        // Verifica se token ja existe em QUALQUER lugar (raiz OU dentro de pastas)
                        const tokenJaExiste = prev.some(item =>
                            (item.id === dados.id && item.tipo === 'token') ||
                            (item.tipo === 'pasta' && item.itens?.some(i => i.id === dados.id))
                        );
                        // So adiciona tokens NOVOS (vindos do tabletop). 
                        // Tokens ja existentes sao manipulados pelos handlers React internos.
                        if (tokenJaExiste) return prev;
                        return [...prev, { ...dados, pastaPai: null }];
                    });
                    if (pastaAtual?.itens?.some(i => i.id === dados.id)) {
                        setPastaAtual(prev => ({ ...prev, itens: prev.itens.filter(i => i.id !== dados.id) }));
                    }
                }
            });
        });
        return () => {
            cancelAnimationFrame(raf);
            DragDropSystem.unregisterZone('BibliotecaRaiz');
        };
    }, [isOpen, modalRef, pastaAtual, setBibliotecaTokens, setPastaAtual]);

    useEffect(() => {
        if (!isOpen) {
            setPastaRenomeando(null);
            setNovoNomePasta('');
            setTokenRenomeando(null);
            setNovoNomeToken('');
            setUrlExterna('');
            setMenuContextual({ aberto: false, x: 0, y: 0, idPasta: null, nomePasta: null });
            setMenuContextualToken({ aberto: false, x: 0, y: 0, idToken: null, nomeToken: null });
            // Fecha sub-pasta quando sidebar fecha
            setModalPastaAberto(false);
            setPastaAtual(null);
        }
    }, [isOpen, setPastaRenomeando, setNovoNomePasta, setTokenRenomeando, setNovoNomeToken, setMenuContextual, setModalPastaAberto, setPastaAtual]);

    const handleModalClick = (e) => e.stopPropagation();

    // Fecha menus contextuais ao clicar no sidebar (left-click apenas)
    const fecharMenusContextuais = () => {
        if (menuContextual?.aberto) setMenuContextual(prev => ({ ...prev, aberto: false }));
        if (menuContextualPasta?.aberto) setMenuContextualPasta(prev => ({ ...prev, aberto: false }));
        if (menuContextualToken?.aberto) setMenuContextualToken(prev => ({ ...prev, aberto: false }));
    };

    const handleDragStart = (e, dados) => {
        if (dados.tipo === "token") {
            dados.parentId = dados.id;
        }
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

    // === Utilitarios de drag-drop de pasta ===

    /** Cria subpasta a partir de dois tokens arrastados juntos */
    const handleCriarSubPasta = (tokenArrastado, tokenDestino, pastaPaiId) => {
        const novaSubPasta = {
            id: `pasta-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            tipo: "pasta",
            nome: "Nova subpasta",
            pastaPai: pastaPaiId,
            itens: [tokenArrastado, tokenDestino],
            dataCriacao: new Date().toISOString()
        };
        if (pastaPaiId) {
            setBibliotecaTokens(prev => [...prev, novaSubPasta]);
            adicionarItemNaPastaAtual(pastaPaiId, novaSubPasta);
        } else {
            // Raiz: remove tokens soltos e adiciona a pasta
            setBibliotecaTokens(prev => {
                const filtrado = prev.filter(t => t.id !== tokenArrastado.id && t.id !== tokenDestino.id);
                return [...filtrado, novaSubPasta];
            });
        }
        setCriandoSubPasta(false);
    };

    /** Handler de drop de token sobre outro token — cria subpasta */
    const fazerDropTokenSobreToken = (e, tokenDestino, pastaPaiId) => {
        e.preventDefault();
        setDragOverItem(null);
        if (criandoSubPasta) return;
        try {
            const dados = JSON.parse(e.dataTransfer.getData('application/json'));
            if (dados.tipo === "token" && dados.id !== tokenDestino.id) {
                setCriandoSubPasta(true);
                if (pastaPaiId) {
                    removerItemDaPastaAtual(pastaPaiId, dados.id);
                    removerItemDaPastaAtual(pastaPaiId, tokenDestino.id);
                }
                setTimeout(() => handleCriarSubPasta(dados, tokenDestino, pastaPaiId), 50);
            }
        } catch (erro) {
            setCriandoSubPasta(false);
        }
    };

    /** Handler de drop de item sobre uma pasta — move o item pra dentro */
    const fazerDropSobrePasta = (e, pastaDestino, pastaPaiId) => {
        e.preventDefault();
        try {
            const dados = JSON.parse(e.dataTransfer.getData('application/json'));
            if (dados.id) {
                if (pastaPaiId) removerItemDaPastaAtual(pastaPaiId, dados.id);
                // Sem setTimeout: deixa o React agrupar as atualizações de estado
                adicionarItemNaPastaAtual(pastaDestino.id, dados);
            }
        } catch (erro) { /* ignore */ }
    };

    /** Props comuns para TokenVisual (biblioteca e subpastas) */
    const tokenVisualProps = (item, pastaPaiId) => ({
        key: item.id,
        token: item,
        opacity: tokenClipboard?.id === item.id ? 0.35 : undefined,
        estaRenomeando: tokenRenomeando === item.id,
        novoNome: novoNomeToken,
        onNomeChange: setNovoNomeToken,
        onSalvarRenomeacao: salvarRenomeacaoToken,
        onCancelarRenomeacao: cancelarRenomeacaoToken,
        onContextMenu: (dados) => setMenuContextualToken({ aberto: true, x: dados.x, y: dados.y, idToken: dados.idToken, nomeToken: dados.nomeToken }),
        onDragStart: (e, token) => handleDragStart(e, { ...token, tipo: "token", larguraOriginal: token.larguraOriginal, alturaOriginal: token.alturaOriginal }),
        onDragOver: (e, token) => { e.preventDefault(); setDragOverItem(token.id); },
        onDragLeave: () => setDragOverItem(null),
        onDrop: (e, tokenDestino) => fazerDropTokenSobreToken(e, tokenDestino, pastaPaiId),
    });

    /** Props comuns para PastaVisual (biblioteca e subpastas) */
    const pastaVisualProps = (item, pastaPaiId) => ({
        key: item.id,
        pasta: item,
        estaRenomeando: pastaRenomeando === item.id,
        novoNome: novoNomePasta,
        onNomeChange: setNovoNomePasta,
        onSalvarRenomeacao: salvarRenomeacaoPasta,
        onCancelarRenomeacao: cancelarRenomeacaoPasta,
        onAbrirPasta: abrirSubPasta,
        onContextMenu: (dados) => setMenuContextualPasta({ aberto: true, x: dados.x, y: dados.y, idPasta: dados.idPasta }),
        onDragStart: (e, pasta) => handleDragStart(e, { ...pasta, tipo: "pasta" }),
        onDragOver: (e) => e.preventDefault(),
        onDrop: (e, pastaDestino) => fazerDropSobrePasta(e, pastaDestino, pastaPaiId),
    });

    // Grid de tokens reutilizavel
    const GRID_SX = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
        gap: 1.5,
        p: 1,
    };

    // Container do painel lateral (sidebar e subpastas)
    const PANEL_SX = {
        position: 'absolute',
        top: 12,
        left: 68,
        bottom: 12,
        width: 270,
        bgcolor: '#1a1f27',
        boxShadow: '4px 8px 32px rgba(0,0,0,0.55)',
        borderRadius: 3,
        border: '1px solid #3a4050',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    };

    // Cabecalho do painel
    const HEADER_SX = {
        background: 'linear-gradient(135deg, #2a313c 0%, #1f252e 100%)',
        borderBottom: '1px solid #3f4b5a',
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
    };

    // Area de conteudo scrollavel com padding
    const CONTENT_SX = {
        flex: 1,
        overflowY: 'auto',
        p: 1.5,
        bgcolor: '#1e232c',
    };

    // Scrollbar customizada (usar spread: ...SCROLLBAR_SX)
    const SCROLLBAR_SX = {
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { background: '#2a313c', borderRadius: '10px' },
        '&::-webkit-scrollbar-thumb': { background: '#4a5568', borderRadius: '10px', '&:hover': { background: '#5b8cff' } },
    };

    // Placeholder para estado vazio
    function EmptyState({ icon: Icon, title, subtitle, small }) {
        return (
            <Box sx={{ textAlign: 'center', py: small ? 4 : 6, px: 3, color: '#7e8a9a' }}>
                <Icon sx={{ fontSize: small ? 48 : 64, color: '#4a5568', mb: small ? 1 : 2 }} />
                <Typography variant={small ? 'body2' : 'body1'} sx={{ color: '#e6e9f0', fontWeight: 500, mb: 0.5 }}>{title}</Typography>
                {subtitle && <Typography variant="caption">{subtitle}</Typography>}
            </Box>
        );
    }

    const fazerUploadArquivo = async (arquivo) => {
        setUploadLoading(true);

        // Lê o arquivo como base64 ANTES do upload (fallback offline)
        const base64Promise = new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(arquivo);
        });

        const formData = new FormData();
        formData.append('file', arquivo);

        try {
            const [base64Data, response] = await Promise.all([
                base64Promise,
                fetch('/api/upload/token', { method: 'POST', body: formData })
            ]);

            const data = await response.json();
            
            if (response.ok) {
                setImagemSelecionada(data.url);
                if (base64Data && setImagemBase64) {
                    setImagemBase64(base64Data);
                }
            }
        } catch (error) {
            // Silently ignore
        } finally {
            setUploadLoading(false);
        }
    };

    const renderModalPasta = () => {
        if (!pastaAtual || !isOpen) return null;

        const itensDaPasta = pastaAtual.itens || [];
        const subPastas = bibliotecaTokens.filter(item =>
            item.tipo === "pasta" && item.pastaPai === pastaAtual.id
        );
        const tokens = itensDaPasta.filter(item => item.tipo !== "pasta");
        const itensOrdenados = [...subPastas, ...tokens];

        return (
            <Box ref={pastaModalRef} sx={{ ...PANEL_SX, zIndex: 101 }}>
                <Box sx={HEADER_SX}>
                    <Button onClick={voltarPasta} variant="text" sx={{ minWidth: 'auto', color: '#a0a8b8', fontSize: 18, p: 0.5, '&:hover': { color: '#fff' } }}>
                        {'<'}
                    </Button>
                    <FolderIcon sx={{ color: '#5b8cff', fontSize: 20 }} />
                    <Typography variant="subtitle1" noWrap sx={{ color: '#e6e9f0', fontWeight: 600, flex: 1 }}>
                        {pastaAtual.nome}
                    </Typography>
                </Box>

                <Box sx={CONTENT_SX}
                    onClick={fecharMenusContextuais}
                    onContextMenu={(e) => {
                        if (!tokenClipboard) return;
                        e.preventDefault();
                        setMenuContextualToken({ aberto: true, x: e.clientX, y: e.clientY, idToken: null, nomeToken: null });
                    }}
                >
                    {itensOrdenados.length === 0 ? (
                        <EmptyState icon={FolderOpenIcon} title="Pasta vazia" subtitle="Arraste tokens para ca" small />
                    ) : (
                        <>
                            <Typography sx={{ color: '#b0b8c8', fontSize: 12, mb: 1.5, ml: 0.5 }}>
                                {itensOrdenados.length} ite{itensOrdenados.length !== 1 ? 'ns' : 'm'}
                            </Typography>
                            <Box sx={GRID_SX}>
                                {itensOrdenados.map(item => (
                                    item.tipo === "pasta" ? (
                                        <PastaVisual {...pastaVisualProps(item, pastaAtual.id)} />
                                    ) : (
                                        <TokenVisual {...tokenVisualProps(item, pastaAtual.id)} />
                                    )
                                ))}
                            </Box>
                        </>
                    )}
                </Box>

                {menuContextualPasta?.aberto && (
                    <MenuContextualPasta
                        x={menuContextualPasta.x} y={menuContextualPasta.y}
                        onRenomear={() => {
                            const subPasta = bibliotecaTokens.find(p => p.id === menuContextualPasta.idPasta);
                            if (subPasta) iniciarRenomeacaoPasta(subPasta.id, subPasta.nome);
                            setMenuContextualPasta({ aberto: false, x: 0, y: 0, idPasta: null });
                        }}
                        onExcluir={() => { excluirPasta(menuContextualPasta.idPasta); setMenuContextualPasta({ aberto: false, x: 0, y: 0, idPasta: null }); }}
                        onFechar={() => setMenuContextualPasta({ aberto: false, x: 0, y: 0, idPasta: null })}
                    />
                )}
            </Box>
        );
    };

    const renderConteudoAba = () => {
        switch (activeTab) {
            case 0: {
                const itensRaiz = buscarItensPorPastaPai(null);
                const pastas = itensRaiz.filter(item => item.tipo === "pasta");
                const tokens = itensRaiz.filter(item => item.tipo === "token");
                const itensOrdenados = [...pastas, ...tokens];

                if (itensRaiz.length === 0) {
                    return (
                        <Box sx={{ color: '#a0a8b8', textAlign: 'center', py: 3, px: 2, backgroundColor: '#252b35', borderRadius: 3, border: '1px dashed #4a5568' }}>
                            <EmptyState icon={FolderOpenIcon} title="Nenhum token na biblioteca" subtitle='Importe um token na aba "Importar"' />
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

                        <Box sx={GRID_SX}>
                            {itensOrdenados.map((item, index) => {
                                const key = `${item.tipo}-${item.id}-${index}`;
                                if (item.tipo === "pasta") {
                                    return (
                                        <Box key={key} sx={{ transform: 'scale(1)', transition: 'transform 0.2s', width: '100%', height: '100%' }}>
                                            <PastaVisual
                                                {...pastaVisualProps(item, null)}
                                                onAbrirPasta={(pasta) => { setPastaAtual(pasta); setModalPastaAberto(true); }}
                                                onContextMenu={(dados) => setMenuContextual({ aberto: true, x: dados.x, y: dados.y, idPasta: dados.idPasta, nomePasta: dados.nomePasta })}
                                                onDragOver={(e, pasta) => { e.preventDefault(); setDragOverItem(pasta.id); }}
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
                                                                adicionarItemNaPastaAtual(pastaDestino.id, tokenParaMover);
                                                            }
                                                        }
                                                    } catch (erro) { /* ignore */ }
                                                }}
                                            />
                                        </Box>
                                    );
                                }
                                return (
                                    <TokenVisual
                                        key={key}
                                        {...tokenVisualProps(item, null)}
                                        onDrop={(e, tokenDestino) => {
                                            e.preventDefault();
                                            setDragOverItem(null);
                                            try {
                                                const dados = JSON.parse(e.dataTransfer.getData('application/json'));
                                                if (dados.tipo === "token" && dados.id !== tokenDestino.id) {
                                                    setCriandoSubPasta(true);
                                                    setTimeout(() => handleCriarSubPasta(dados, tokenDestino, null), 50);
                                                }
                                            } catch (erro) { setCriandoSubPasta(false); }
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
                    <Box sx={{ p: 1.5 }}>
                        <Typography sx={{
                            color: '#e6e9f0',
                            mb: 1.5,
                            fontWeight: 600,
                            fontSize: 14
                        }}>
                            Importar Nova Imagem
                        </Typography>

                        <Box sx={{
                            backgroundColor: '#252b35',
                            borderRadius: 3,
                            p: 2,
                            border: '1px solid #3a4050'
                        }}>
                            <Typography sx={{ color: '#b0b8c8', mb: 1.5, fontSize: 13, fontWeight: 500 }}>
                                Opcao 1: Upload de arquivo
                            </Typography>
                            
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const arquivo = e.target.files[0];
                                    if (arquivo) {
                                        fazerUploadArquivo(arquivo);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: 10,
                                    backgroundColor: '#1e232c',
                                    color: '#b0b8c8',
                                    border: '2px dashed #4a5568',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    marginBottom: 18
                                }}
                                disabled={uploadLoading}
                            />

                            {uploadLoading && (
                                <Typography sx={{ color: '#5b8cff', textAlign: 'center', my: 2 }}>
                                    Enviando imagem...
                                </Typography>
                            )}

                            <Typography sx={{ color: '#b0b8c8', mb: 1.5, fontSize: 13, fontWeight: 500 }}>
                                Opcao 2: URL externa
                            </Typography>

                            <input
                                type="text"
                                placeholder="https://exemplo.com/imagem.png"
                                value={urlExterna}
                                onChange={(e) => {
                                    const novaUrl = e.target.value;
                                    setUrlExterna(novaUrl);
                                    if (novaUrl.trim()) {
                                        setImagemSelecionada(novaUrl.trim());
                                    } else {
                                        setImagemSelecionada(null);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: 10,
                                    backgroundColor: '#1e232c',
                                    color: '#b0b8c8',
                                    border: '1px solid #4a5568',
                                    borderRadius: 8,
                                    fontSize: 13,
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    marginBottom: 18
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#5b8cff'}
                                onBlur={(e) => e.target.style.borderColor = '#4a5568'}
                            />

                            {imagemSelecionada && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography sx={{ color: '#b0b8c8', mb: 0.5, fontSize: 13 }}>Preview:</Typography>
                                    <Typography sx={{ color: '#7e8a9a', fontSize: 12, mb: 1, wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                                        URL: {imagemSelecionada.substring(0, 100)}...
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        bgcolor: '#1a1f27',
                                        p: 1.5,
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
                                            onError={(e) => {
                                                e.target.src = '';
                                                e.target.alt = 'Erro ao carregar imagem';
                                            }}
                                        />
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{ mt: 2 }}>
                                <label htmlFor="nomeToken" style={{
                                    color: '#b0b8c8',
                                    display: 'block',
                                    marginBottom: 6,
                                    fontSize: 13,
                                    fontWeight: 500
                                }}>
                                    Nome do Token:
                                </label>
                                <input
                                    type="text"
                                    id="nomeToken"
                                    value={nomeToken}
                                    onChange={(e) => setNomeToken(e.target.value)}
                                    placeholder="Ex: Mapa, Objeto, NPC, Inimigo, Carlos"
                                    style={{
                                        width: '100%',
                                        padding: 10,
                                        backgroundColor: '#1e232c',
                                        color: '#e6e9f0',
                                        border: '1px solid #4a5568',
                                        borderRadius: 8,
                                        fontSize: 13,
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

                        <Button
                            onClick={() => salvarTokenNaBiblioteca()}
                            disabled={!imagemSelecionada || !nomeToken?.trim() || uploadLoading}
                            variant="contained"
                            fullWidth
                            sx={{
                                mt: 2,
                                bgcolor: '#5b8cff',
                                borderRadius: 2,
                                py: 1.2,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: 14,
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
                            Salvar na Biblioteca
                        </Button>
                    </Box>
                );

            default:
                return <Box sx={{ color: '#fff', textAlign: 'center', py: 3 }}>Selecione uma aba</Box>;
        }
    };

    return (
        <>
            {/* Sidebar — flutuante, com margem do topo e fundo */}
            <Box
                ref={modalRef}
                onClick={handleModalClick}
                sx={{
                    ...PANEL_SX,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    zIndex: 100,
                    transform: isOpen ? 'translateX(0)' : 'translateX(calc(-100% - 20px))',
                    opacity: isOpen ? 1 : 0,
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
                }}
            >
                    <Box sx={HEADER_SX}>
                        <FolderIcon sx={{ color: '#5b8cff' }} />
                        <Typography variant="subtitle1" sx={{ color: '#e6e9f0', fontWeight: 600, letterSpacing: '0.5px' }}>
                            Biblioteca de Tokens
                        </Typography>
                    </Box>

                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        sx={{
                            minHeight: 40,
                            px: 1,
                            pt: 0.5,
                            bgcolor: '#1e232c',
                            '& .MuiTab-root': {
                                color: '#a0a8b8',
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: 13,
                                minHeight: 36,
                                minWidth: 'auto',
                                px: 2,
                                '&.Mui-selected': {
                                    color: '#5b8cff',
                                    fontWeight: 700
                                }
                            },
                            '& .MuiTabs-indicator': {
                                bgcolor: '#5b8cff',
                                height: 2,
                                borderRadius: '2px 2px 0 0'
                            }
                        }}
                    >
                        <Tab label="Biblioteca" />
                        <Tab label="Importar" />
                    </Tabs>

                    <Box sx={{ ...CONTENT_SX, ...SCROLLBAR_SX }}
                        onClick={fecharMenusContextuais}
                        onContextMenu={(e) => {
                            if (!tokenClipboard) return;
                            e.preventDefault();
                            setMenuContextualToken({
                                aberto: true,
                                x: e.clientX,
                                y: e.clientY,
                                idToken: null,
                                nomeToken: null,
                            });
                        }}
                    >
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
                            onRenomear={menuContextualToken.idToken ? () => {
                                iniciarRenomeacaoToken(menuContextualToken.idToken, menuContextualToken.nomeToken || '');
                                setMenuContextualToken({ aberto: false, x: 0, y: 0, idToken: null, nomeToken: null });
                            } : undefined}
                            onRecortar={menuContextualToken.idToken && !tokenClipboard ? () => {
                                recortarToken(menuContextualToken.idToken, pastaAtual?.id || null);
                            } : undefined}
                            onColar={tokenClipboard ? () => {
                                colarToken(pastaAtual?.id || null);
                                setMenuContextualToken({ aberto: false, x: 0, y: 0, idToken: null, nomeToken: null });
                            } : undefined}
                            onExcluir={menuContextualToken.idToken ? () => {
                                excluirToken(menuContextualToken.idToken);
                                setMenuContextualToken({ aberto: false, x: 0, y: 0, idToken: null, nomeToken: null });
                            } : undefined}
                            onFechar={() => setMenuContextualToken({ aberto: false, x: 0, y: 0, idToken: null, nomeToken: null })}
                        />
                    )}

            </Box>

            {renderModalPasta()}
        </>
    );
}

export default TokenDesign;