// src/components/TokenModal/TokenModal.jsx
import React, { useState, useEffect, useRef } from "react";
import TokenDesign from "./TokenDesign";
import DragDropSystem from "../../utils/DragDropSystem";

function renomearPastaUtil(idPasta, novoNome, setBibliotecaTokens, setPastaAtual) {
    setBibliotecaTokens(prev => {
        const novos = prev.map(item =>
            item.id === idPasta && item.tipo === "pasta"
                ? { ...item, nome: novoNome }
                : item
        );
        return novos;
    });

    if (setPastaAtual) {
        setPastaAtual(prev => {
            if (prev?.id === idPasta) {
                return { ...prev, nome: novoNome };
            }
            return prev;
        });
    }
}

async function renomearTokenUtil(idToken, novoNome, setBibliotecaTokens) {
    console.log('[renomearTokenUtil] INÍCIO - idToken:', idToken, 'novoNome:', novoNome);
    
    // Atualiza local primeiro (otimista)
    setBibliotecaTokens(prev => {
        console.log('[renomearTokenUtil] Atualizando state local, total itens:', prev.length);
        const token = prev.find(item => item.id === idToken && item.tipo === 'token');
        console.log('[renomearTokenUtil] Token encontrado no state?', !!token, 'nome antigo:', token?.nome, 'tipo:', token?.tipo, 'parentId:', token?.parentId);
        const novos = prev.map(item =>
            item.id === idToken && item.tipo === "token"
                ? { ...item, nome: novoNome }
                : item
        );
        return novos;
    });
    // Persiste no banco
    try {
        console.log('[renomearTokenUtil] Enviando PUT /api/Tabletop/' + idToken + ' com body:', JSON.stringify({ nome: novoNome }));
        const response = await fetch(`/api/Tabletop/${idToken}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: novoNome })
        });
        const data = await response.json();
        console.log('[renomearTokenUtil] Resposta do servidor - status:', response.status, 'body:', JSON.stringify(data));
        if (!response.ok) {
            console.error('[renomearTokenUtil] ❌ Servidor retornou erro:', data);
        } else {
            console.log('[renomearTokenUtil] ✅ Token renomeado no servidor. parentId retornado:', data.parentId);
        }
    } catch (e) {
        console.error('[renomearTokenUtil] ❌ Erro de rede:', e.message);
    }
}

function TokenModal(props) {
    console.log('[TokenModal] 🟢 COMPONENTE MONTADO, open=', props.open);
    const [open, setOpen] = useState(props.open || false);
    const [isDragging, setIsDragging] = useState(false);
    const modalRef = useRef(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isDragging && props.open === false) return;
        setOpen(props.open || false);
    }, [props.open, isDragging]);

    const onClose = () => {
        setIsDragging(false);
        setOpen(false);
        props.onClose?.();
    };

    useEffect(() => {
        const handleDragStartGlobal = () => setIsDragging(true);
        const handleDragEndGlobal = () => {
            setIsDragging(false);
            if (!props.open) setOpen(false);
        };

        window.addEventListener('dragstart', handleDragStartGlobal);
        window.addEventListener('dragend', handleDragEndGlobal);
        document.addEventListener('dragstart', handleDragStartGlobal);
        document.addEventListener('dragend', handleDragEndGlobal);

        return () => {
            window.removeEventListener('dragstart', handleDragStartGlobal);
            window.removeEventListener('dragend', handleDragEndGlobal);
            document.removeEventListener('dragstart', handleDragStartGlobal);
            document.removeEventListener('dragend', handleDragEndGlobal);
        };
    }, [props.open]);

    const [activeTab, setActiveTab] = useState(0);
    const [imagemSelecionada, setImagemSelecionada] = useState(null);
    const [imagemBase64, setImagemBase64] = useState(null);
    const [nomeToken, setNomeToken] = useState("");
    const [bibliotecaTokens, setBibliotecaTokens] = useState([]);

    const [modalPastaAberto, setModalPastaAberto] = useState(false);
    const [pastaAtual, setPastaAtual] = useState(null);
    const [historicoPastas, setHistoricoPastas] = useState([]);
    const pastaModalRef = useRef(null);

    const [menuContextual, setMenuContextual] = useState({
        aberto: false, x: 0, y: 0, idPasta: null, nomePasta: null
    });

    const [menuContextualPasta, setMenuContextualPasta] = useState({
        aberto: false, x: 0, y: 0, idPasta: null
    });

    const [pastaRenomeando, setPastaRenomeando] = useState(null);
    const [novoNomePasta, setNovoNomePasta] = useState("");

    const [tokenRenomeando, setTokenRenomeando] = useState(null);
    const [novoNomeToken, setNovoNomeToken] = useState("");

    const [criandoSubPasta, setCriandoSubPasta] = useState(false);
    const [menuContextualToken, setMenuContextualToken] = useState({
        aberto: false, x: 0, y: 0, idToken: null, nomeToken: null
    });
    const [tokenClipboard, setTokenClipboard] = useState(null); // { id, nome, pastaPai }

    // Recortar token: marca com flag visual (nao remove)
    const recortarToken = (idToken, pastaPai) => {
        let token;
        if (pastaPai) {
            const pasta = bibliotecaTokens.find(p => p.id === pastaPai && p.tipo === 'pasta');
            token = pasta?.itens?.find(t => t.id === idToken && t.tipo === 'token');
        } else {
            token = bibliotecaTokens.find(t => t.id === idToken && t.tipo === 'token');
        }
        if (!token) return;
        setTokenClipboard({ id: token.id, nome: token.nome, pastaPai });
        setMenuContextualToken({ aberto: false, x: 0, y: 0, idToken: null, nomeToken: null });
    };

    // Colar token: remove do local anterior e adiciona ao novo
    const colarToken = (pastaDestinoId) => {
        if (!tokenClipboard) return;

        let token;
        if (tokenClipboard.pastaPai) {
            const pasta = bibliotecaTokens.find(p => p.id === tokenClipboard.pastaPai && p.tipo === 'pasta');
            token = pasta?.itens?.find(t => t.id === tokenClipboard.id && t.tipo === 'token');
        } else {
            token = bibliotecaTokens.find(t => t.id === tokenClipboard.id && t.tipo === 'token');
        }

        if (!token) { setTokenClipboard(null); return; }

        // Remove do local anterior
        if (tokenClipboard.pastaPai) {
            removerItemDaPastaAtual(tokenClipboard.pastaPai, tokenClipboard.id);
        } else {
            setBibliotecaTokens(prev => prev.filter(t => t.id !== tokenClipboard.id));
        }

        // Adiciona ao novo local
        const tokenLimpo = { ...token, _recortado: false };
        if (pastaDestinoId) {
            adicionarItemNaPastaAtual(pastaDestinoId, tokenLimpo);
        } else {
            setBibliotecaTokens(prev => {
                const jaExiste = prev.some(t => t.id === tokenLimpo.id && t.tipo === 'token');
                if (jaExiste) return prev;
                return [...prev, tokenLimpo];
            });
        }
        setTokenClipboard(null);
    };

    const handleDragStart = (e, dados) => {
        setIsDragging(true);
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

    const carregarTokensBiblioteca = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/Tabletop/tokens');
            const data = await response.json();
            console.log('[carregarTokensBiblioteca] Resposta do servidor - total tokens:', data.length);
            data.forEach(t => {
                console.log(`[carregarTokensBiblioteca]   id=${t.id} tokenId=${t.tokenId} nome="${t.nome}" parentId=${t.parentId}`);
            });

            if (response.ok) {
                // Remove duplicatas por tokenId (mantem o primeiro encontrado = mais recente)
                const seenTokenIds = new Set();
                const tokensServidor = data
                    .filter(token => {
                        if (seenTokenIds.has(token.tokenId)) {
                            console.warn(`[Biblioteca] Token duplicado ignorado: ${token.tokenId} (DB id: ${token.id})`);
                            return false;
                        }
                        seenTokenIds.add(token.tokenId);
                        return true;
                    })
                    .map(token => ({
                        id: token.id,
                        tokenId: token.tokenId,
                        tipo: "token",
                        nome: token.nome,
                        imagemUrl: token.imageUrl,
                        imagemBase64: token.imageBase64 || null,
                        larguraOriginal: token.larguraOriginal,
                        alturaOriginal: token.alturaOriginal,
                        mimeType: token.mimeType || null,
                        parentId: token.parentId,
                        pastaPai: null,
                        dataCriacao: token.createdAt
                    }));

                // Carrega pastas do banco (via API)
                let pastasSalvas = [];
                try {
                    const res = await fetch('/api/Tabletop/folders');
                    if (res.ok) pastasSalvas = await res.json();
                } catch (e) { /* ignora */ }

                // 🔒 DEDUP GLOBAL: remove duplicatas por ID (mantem primeira ocorrencia)
                const todosItens = [...tokensServidor, ...pastasSalvas];
                const seenIds = new Set();
                const deduped = todosItens.filter(item => {
                    if (seenIds.has(item.id)) return false;
                    seenIds.add(item.id);
                    return true;
                });

                setBibliotecaTokens(deduped);
            }
        } catch (error) {
            // Silently ignore fetch errors
        } finally {
            setLoading(false);
        }
    };

    // Persiste pastas no banco (via API) - COM DEDUP
    useEffect(() => {
        const pastas = bibliotecaTokens.filter(item => item.tipo === 'pasta');
        // 🔒 Dedup pastas antes de persistir
        const seenPastaIds = new Set();
        const pastasDeduped = pastas.filter(p => {
            if (seenPastaIds.has(p.id)) return false;
            seenPastaIds.add(p.id);
            return true;
        });
        if (pastasDeduped.length > 0) {
            fetch('/api/Tabletop/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pastasDeduped)
            }).catch(() => {});
        }
    }, [bibliotecaTokens]);

    const salvarTokenNaAPI = async (token) => {
        try {
            const response = await fetch('/api/Tabletop/tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(token)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao salvar token');
            }

            return data;
        } catch (error) {
            return null;
        }
    };

    const deletarTokenDaAPI = async (id) => {
        try {
            const response = await fetch(`/api/Tabletop/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao deletar token');
            }

            return true;
        } catch (error) {
            return false;
        }
    };

    const salvarTokenNaBiblioteca = async () => {
        if (!imagemSelecionada || !nomeToken.trim()) return;

        try {
            setLoading(true);

            const img = new Image();
            img.src = imagemSelecionada;

            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });

            const novoToken = {
                tokenId: `token-${Date.now()}`,
                nome: nomeToken.trim(),
                x: 0,
                y: 0,
                escala: 1,
                larguraOriginal: img.naturalWidth || 50,
                alturaOriginal: img.naturalHeight || 50,
                invertido: false,
                oculto: false,
                bloqueado: false,
                imageUrl: imagemSelecionada,
                imageBase64: imagemBase64 || null,
                mimeType: null
            };

            const tokenSalvo = await salvarTokenNaAPI(novoToken);

            if (tokenSalvo) {
                const tokenParaBiblioteca = {
                    id: tokenSalvo.id,
                    tokenId: tokenSalvo.tokenId || novoToken.tokenId,
                    tipo: "token",
                    nome: nomeToken.trim(),
                    imagemUrl: imagemSelecionada,
                    imagemBase64: imagemBase64 || null,
                    larguraOriginal: tokenSalvo.larguraOriginal,
                    alturaOriginal: tokenSalvo.alturaOriginal,
                    pastaPai: null,
                    dataCriacao: new Date().toISOString()
                };

                // Anti-duplicata: se token ja existe na biblioteca, atualiza em vez de duplicar
                setBibliotecaTokens(prev => {
                    const jaExiste = prev.some(t => t.id === tokenParaBiblioteca.id && t.tipo === 'token');
                    if (jaExiste) {
                        return prev.map(t =>
                            t.id === tokenParaBiblioteca.id && t.tipo === 'token'
                                ? tokenParaBiblioteca
                                : t
                        );
                    }
                    return [...prev, tokenParaBiblioteca];
                });
                setImagemSelecionada(null);
                setImagemBase64(null);
                setNomeToken("");
                setActiveTab(0);
            }
        } catch (error) {
            // Silently ignore save errors
        } finally {
            setLoading(false);
        }
    };

    const excluirToken = async (idToken) => {
        const deletado = await deletarTokenDaAPI(idToken);
        if (deletado) {
            setBibliotecaTokens(prev => prev.filter(item => item.id !== idToken || item.tipo !== "token"));
        }
    };

    const renomearToken = (id, novoNome) => {
        console.log('[renomearToken] Chamado - id:', id, 'novoNome:', novoNome);
        renomearTokenUtil(id, novoNome, setBibliotecaTokens);
    };

    const renomearPasta = (id, novoNome) => {
        renomearPastaUtil(id, novoNome, setBibliotecaTokens, setPastaAtual);
    };

    // === Utilitarios de renomeacao genericos (pasta e token) ===
    const _iniciar = (setId, setNome, setMenu) => (id, nomeAtual) => {
        console.log('[_iniciar] Iniciando renomeação - id:', id, 'nomeAtual:', nomeAtual);
        setId(id); setNome(nomeAtual); setMenu(prev => ({ ...prev, aberto: false }));
    };
    const _salvar = (idState, nomeState, setId, setNome, onRename) => () => {
        console.log('[_salvar] Salvando renomeação - idState:', idState, 'nomeState:', nomeState, 'nomeState.trim():', nomeState?.trim());
        if (idState && nomeState?.trim()) {
            console.log('[_salvar] ✅ Vai chamar onRename');
            onRename(idState, nomeState.trim());
        } else {
            console.log('[_salvar] ❌ Condição FALHOU - idState ou nomeState.trim() é falsy. Não vai renomear!');
        }
        setId(null); setNome("");
    };
    const _cancelar = (setId, setNome) => () => { setId(null); setNome(""); };

    const iniciarRenomeacaoPasta = _iniciar(setPastaRenomeando, setNovoNomePasta, setMenuContextual);
    const salvarRenomeacaoPasta = _salvar(pastaRenomeando, novoNomePasta, setPastaRenomeando, setNovoNomePasta, renomearPasta);
    const cancelarRenomeacaoPasta = _cancelar(setPastaRenomeando, setNovoNomePasta);

    const iniciarRenomeacaoToken = _iniciar(setTokenRenomeando, setNovoNomeToken, setMenuContextualToken);
    const salvarRenomeacaoToken = _salvar(tokenRenomeando, novoNomeToken, setTokenRenomeando, setNovoNomeToken, renomearToken);
    const cancelarRenomeacaoToken = _cancelar(setTokenRenomeando, setNovoNomeToken);

    const criarPasta = (itensDentro, nomeSugerido) => {
        const pastasExistentes = bibliotecaTokens.filter(item => item.tipo === "pasta");
        const novaPasta = {
            id: `pasta-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            tipo: "pasta",
            nome: nomeSugerido || `Pasta ${pastasExistentes.length + 1}`,
            pastaPai: null,
            itens: itensDentro || [],
            dataCriacao: new Date().toISOString()
        };
        return novaPasta;
    };

    // === Utilitarios de manipulacao de pasta ===

    const atualizarItens = (idPasta, operacao) => (prev) =>
        prev.map(p => p.id === idPasta && p.tipo === "pasta" ? operacao(p) : p);

    const adicionarItemNaPasta = (idPasta, item) => {
        setBibliotecaTokens(atualizarItens(idPasta, p => {
            const semDuplicata = p.itens.filter(i => i.id !== item.id);
            return { ...p, itens: [...semDuplicata, item] };
        }));
    };

    const removerItemDaPasta = (idPasta, idItem) => {
        setBibliotecaTokens(atualizarItens(idPasta, p => ({ ...p, itens: p.itens.filter(i => i.id !== idItem) })));
    };

    // Wrappers que tambem atualizam pastaAtual
    const adicionarItemNaPastaAtual = (idPasta, item) => {
        adicionarItemNaPasta(idPasta, item);
        setPastaAtual(prev => {
            if (prev?.id !== idPasta) return prev;
            const jaExiste = prev.itens?.some(i => i.id === item.id);
            if (jaExiste) return prev;
            return { ...prev, itens: [...(prev.itens || []), item] };
        });
    };

    const removerItemDaPastaAtual = (idPasta, idItem) => {
        removerItemDaPasta(idPasta, idItem);
        setPastaAtual(prev => prev?.id === idPasta ? { ...prev, itens: prev.itens.filter(i => i.id !== idItem) } : prev);
    };

    const excluirPasta = (idPasta) => {
        setBibliotecaTokens(prev => {
            const pasta = prev.find(item => item.id === idPasta && item.tipo === "pasta");
            if (pasta) return [...prev.filter(item => item.id !== idPasta), ...(pasta.itens || [])];
            return prev;
        });
    };

    const buscarItensPorPastaPai = (idPastaPai) => bibliotecaTokens.filter(item =>
        idPastaPai === null ? !item.pastaPai : item.pastaPai === idPastaPai
    );

    const abrirSubPasta = (subPasta) => {
        setHistoricoPastas(prev => [...prev, pastaAtual]);
        setModalPastaAberto(false);

        setTimeout(() => {
            setPastaAtual(subPasta);
            setModalPastaAberto(true);
        }, 100);
    };

    const voltarPasta = () => {
        if (historicoPastas.length === 0) {
            setModalPastaAberto(false);
            setPastaAtual(null);
        } else {
            const pastaAnterior = historicoPastas[historicoPastas.length - 1];
            setHistoricoPastas(prev => prev.slice(0, -1));
            setModalPastaAberto(false);
            setTimeout(() => {
                setPastaAtual(pastaAnterior);
                setModalPastaAberto(true);
            }, 100);
        }
    };

    const renomearPastaAtual = () => {
        if (pastaAtual) {
            iniciarRenomeacaoPasta(pastaAtual.id, pastaAtual.nome);
        }
    };

    const excluirPastaAtual = () => {
        if (pastaAtual) {
            excluirPasta(pastaAtual.id);
            setModalPastaAberto(false);
            setPastaAtual(null);
        }
    };

    const criarSubPastaAqui = () => {
        if (!pastaAtual) return;

        const novaSubPasta = {
            id: `pasta-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            tipo: "pasta",
            nome: "Nova subpasta",
            pastaPai: pastaAtual.id,
            itens: [],
            dataCriacao: new Date().toISOString()
        };
        setBibliotecaTokens(prev => [...prev, novaSubPasta]);
        adicionarItemNaPastaAtual(pastaAtual.id, novaSubPasta);
    };

    useEffect(() => {
        if (open) {
            carregarTokensBiblioteca();
        }
    }, [open]);

    useEffect(() => {
        if (modalPastaAberto && pastaAtual && pastaModalRef.current) {
            DragDropSystem.registerZone(`Pasta-${pastaAtual.id}`, pastaModalRef.current, {
                onJsonDrop: (dados) => {
                    if (dados.tipo !== "token" || !dados.id) return;

                    // Remove de qualquer pasta/raiz e adiciona nesta pasta (tudo sincrono)
                    setBibliotecaTokens(prev => {
                        // Remove de todas as pastas e da raiz
                        const limpo = prev
                            .filter(item => !(item.id === dados.id && item.tipo === 'token'))
                            .map(item =>
                                item.tipo === 'pasta'
                                    ? { ...item, itens: item.itens.filter(i => i.id !== dados.id) }
                                    : item
                            );
                        // Adiciona na pasta atual (evita duplicata)
                        return limpo.map(item =>
                            item.id === pastaAtual.id && item.tipo === 'pasta'
                                ? {
                                    ...item,
                                    itens: item.itens.some(i => i.id === dados.id)
                                        ? item.itens
                                        : [...item.itens, dados]
                                }
                                : item
                        );
                    });

                    setPastaAtual(prev => {
                        if (!prev) return prev;
                        const jaExiste = prev.itens?.some(i => i.id === dados.id);
                        if (jaExiste) return prev;
                        return { ...prev, itens: [...(prev.itens || []), dados] };
                    });
                }
            });
        }

        return () => {
            if (pastaAtual) {
                DragDropSystem.unregisterZone(`Pasta-${pastaAtual.id}`);
            }
        };
    }, [modalPastaAberto, pastaAtual]);

    useEffect(() => {
        const handleAbrirPasta = (e) => {
            setPastaAtual(e.detail.pasta);
            setModalPastaAberto(true);
            setOpen(true);
        };

        window.addEventListener("abrirPasta", handleAbrirPasta);
        return () => window.removeEventListener("abrirPasta", handleAbrirPasta);
    }, []);

    useEffect(() => {
        if (!open) {
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
    }, [open]);

    // � DEDUP SILENCIOSO: corrige duplicatas em tempo real
    useEffect(() => {
        if (!open || bibliotecaTokens.length === 0) return;

        const seenIds = new Set();
        let temDuplicataRaiz = false;
        for (const item of bibliotecaTokens) {
            if (seenIds.has(item.id)) { temDuplicataRaiz = true; break; }
            seenIds.add(item.id);
        }

        const idsNaRaiz = new Set(bibliotecaTokens.filter(t => t.tipo === 'token').map(t => t.id));
        const idsEmPastas = new Set();
        for (const item of bibliotecaTokens) {
            if (item.tipo === 'pasta' && item.itens) {
                for (const sub of item.itens) {
                    if (sub.tipo === 'token') idsEmPastas.add(sub.id);
                }
            }
        }
        let temTokenEm2Lugares = false;
        for (const id of idsEmPastas) {
            if (idsNaRaiz.has(id)) { temTokenEm2Lugares = true; break; }
        }

        if (!temDuplicataRaiz && !temTokenEm2Lugares) return;

        // Corrige silenciosamente
        const uniqueSeen = new Set();
        let fixed = bibliotecaTokens.filter(item => {
            if (uniqueSeen.has(item.id)) return false;
            uniqueSeen.add(item.id);
            return true;
        });

        const idsEmPastasFinal = new Set();
        for (const item of fixed) {
            if (item.tipo === 'pasta' && item.itens) {
                for (const sub of item.itens) {
                    if (sub.tipo === 'token') idsEmPastasFinal.add(sub.id);
                }
            }
        }
        fixed = fixed.filter(item => {
            if (item.tipo === 'token' && idsEmPastasFinal.has(item.id)) return false;
            return true;
        });

        const tokenJaVistoEmPasta = new Set();
        fixed = fixed.map(item => {
            if (item.tipo !== 'pasta' || !item.itens) return item;
            return {
                ...item,
                itens: item.itens.filter(sub => {
                    if (sub.tipo !== 'token') return true;
                    if (tokenJaVistoEmPasta.has(sub.id)) return false;
                    tokenJaVistoEmPasta.add(sub.id);
                    return true;
                })
            };
        });

        setBibliotecaTokens(fixed);
    }, [bibliotecaTokens, open]);

    return (
        <TokenDesign
            isOpen={open}
            onClose={onClose}
            modalRef={modalRef}
            pastaModalRef={pastaModalRef}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            imagemSelecionada={imagemSelecionada}
            setImagemSelecionada={setImagemSelecionada}
            setImagemBase64={setImagemBase64}
            nomeToken={nomeToken}
            setNomeToken={setNomeToken}
            bibliotecaTokens={bibliotecaTokens}
            setBibliotecaTokens={setBibliotecaTokens}
            modalPastaAberto={modalPastaAberto}
            setModalPastaAberto={setModalPastaAberto}
            pastaAtual={pastaAtual}
            setPastaAtual={setPastaAtual}
            menuContextual={menuContextual}
            setMenuContextual={setMenuContextual}
            menuContextualPasta={menuContextualPasta}
            setMenuContextualPasta={setMenuContextualPasta}
            menuContextualToken={menuContextualToken}
            setMenuContextualToken={setMenuContextualToken}
            pastaRenomeando={pastaRenomeando}
            setPastaRenomeando={setPastaRenomeando}
            novoNomePasta={novoNomePasta}
            setNovoNomePasta={setNovoNomePasta}
            tokenRenomeando={tokenRenomeando}
            setTokenRenomeando={setTokenRenomeando}
            novoNomeToken={novoNomeToken}
            setNovoNomeToken={setNovoNomeToken}
            criandoSubPasta={criandoSubPasta}
            setCriandoSubPasta={setCriandoSubPasta}
            handleDragStart={handleDragStart}
            recortarToken={recortarToken}
            colarToken={colarToken}
            tokenClipboard={tokenClipboard}
            salvarTokenNaBiblioteca={salvarTokenNaBiblioteca}
            criarPasta={criarPasta}
            adicionarItemNaPasta={adicionarItemNaPasta}
            removerItemDaPasta={removerItemDaPasta}
            excluirPasta={excluirPasta}
            excluirToken={excluirToken}
            renomearPasta={renomearPasta}
            renomearToken={renomearToken}
            buscarItensPorPastaPai={buscarItensPorPastaPai}
            iniciarRenomeacaoPasta={iniciarRenomeacaoPasta}
            salvarRenomeacaoPasta={salvarRenomeacaoPasta}
            cancelarRenomeacaoPasta={cancelarRenomeacaoPasta}
            iniciarRenomeacaoToken={iniciarRenomeacaoToken}
            salvarRenomeacaoToken={salvarRenomeacaoToken}
            cancelarRenomeacaoToken={cancelarRenomeacaoToken}
            adicionarItemNaPastaAtual={adicionarItemNaPastaAtual}
            removerItemDaPastaAtual={removerItemDaPastaAtual}
            abrirSubPasta={abrirSubPasta}
            renomearPastaAtual={renomearPastaAtual}
            excluirPastaAtual={excluirPastaAtual}
            criarSubPastaAqui={criarSubPastaAqui}
            historicoPastas={historicoPastas}
            voltarPasta={voltarPasta}
            loading={loading}
        />
    );
}

export { DragDropSystem, TokenModal as default };