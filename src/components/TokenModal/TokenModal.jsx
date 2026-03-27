// src/components/TokenModal/TokenModal.jsx
import React, { useState, useEffect, useRef } from "react";
import TokenDesign from "./TokenDesign";

const DragDropSystem = {
    listeners: new Map(),

    register(id, element, handler) {
        console.log('[DragDropSystem] register - id:', id, 'element:', element);
        this.listeners.set(id, { element, handler });
        console.log('[DragDropSystem] register - listeners size:', this.listeners.size);
    },

    unregister(id) {
        console.log('[DragDropSystem] unregister - id:', id);
        this.listeners.delete(id);
        console.log('[DragDropSystem] unregister - listeners size:', this.listeners.size);
    },

    processDrop(event, dados) {
        console.log('[DragDropSystem] ========== processDrop INICIADO ==========');
        console.log('[DragDropSystem] event:', event);
        console.log('[DragDropSystem] dados:', dados);
        console.log('[DragDropSystem] event.clientX:', event.clientX, 'event.clientY:', event.clientY);

        event.preventDefault();
        event.stopPropagation();

        const listenersValidos = [];
        console.log('[DragDropSystem] Coletando listeners válidos...');

        for (let [id, listener] of this.listeners) {
            console.log('[DragDropSystem] Verificando listener:', id);
            console.log('[DragDropSystem]   listener.element:', listener.element);

            if (!listener.element || !document.body.contains(listener.element)) {
                console.log('[DragDropSystem]   Elemento inválido ou não no DOM, removendo');
                this.listeners.delete(id);
                continue;
            }

            try {
                const rect = listener.element.getBoundingClientRect();
                const area = rect.width * rect.height;
                console.log('[DragDropSystem]   rect:', rect);
                console.log('[DragDropSystem]   area:', area);
                listenersValidos.push({ id, ...listener, rect, area });
            } catch (e) {
                console.log('[DragDropSystem]   Erro ao obter rect:', e);
            }
        }

        console.log('[DragDropSystem] listenersValidos:', listenersValidos.map(l => ({ id: l.id, rect: l.rect })));

        const listenersComMouseDentro = listenersValidos.filter(l => {
            const dentro = event.clientX >= l.rect.left &&
                event.clientX <= l.rect.right &&
                event.clientY >= l.rect.top &&
                event.clientY <= l.rect.bottom;
            console.log('[DragDropSystem] Verificando se mouse está dentro de:', l.id, 'dentro:', dentro);
            return dentro;
        });

        console.log('[DragDropSystem] listenersComMouseDentro:', listenersComMouseDentro.map(l => l.id));

        if (listenersComMouseDentro.length === 0) {
            console.log('[DragDropSystem] Nenhum listener com mouse dentro, verificando BibliotecaRaiz');
            if (this.listeners.has('BibliotecaRaiz')) {
                console.log('[DragDropSystem] Chamando handler da BibliotecaRaiz');
                this.listeners.get('BibliotecaRaiz').handler(dados, event);
            }
            console.log('[DragDropSystem] ========== processDrop FINALIZADO (sem alvo) ==========');
            return;
        }

        let elementoMaisProfundo = null;
        let maiorProfundidade = -1;

        console.log('[DragDropSystem] Procurando elemento mais profundo...');
        listenersComMouseDentro.forEach(l => {
            try {
                if (l.element.contains(event.target) || event.target.contains(l.element)) {
                    console.log('[DragDropSystem]   Listener', l.id, 'contém target ou vice-versa');
                    let profundidade = 0;
                    let elemento = l.element;
                    while (elemento.parentElement) {
                        profundidade++;
                        elemento = elemento.parentElement;
                    }
                    console.log('[DragDropSystem]   Profundidade:', profundidade);

                    if (profundidade > maiorProfundidade) {
                        maiorProfundidade = profundidade;
                        elementoMaisProfundo = l;
                        console.log('[DragDropSystem]   Novo elemento mais profundo:', l.id);
                    }
                }
            } catch (e) {
                console.log('[DragDropSystem]   Erro ao verificar contains:', e);
            }
        });

        const alvo = elementoMaisProfundo || listenersComMouseDentro.sort((a, b) => a.area - b.area)[0];
        console.log('[DragDropSystem] Alvo selecionado:', alvo.id);

        try {
            console.log('[DragDropSystem] Chamando handler do alvo com dados:', dados);
            alvo.handler(dados, event);
            console.log('[DragDropSystem] Handler executado com sucesso');
        } catch (erro) {
            console.error('[DragDropSystem] Erro no handler:', erro);
        }

        console.log('[DragDropSystem] ========== processDrop FINALIZADO ==========');
    }
};

function renomearPastaUtil(idPasta, novoNome, setBibliotecaTokens, setPastaAtual) {
    setBibliotecaTokens(prev => {
        return prev.map(item =>
            item.id === idPasta && item.tipo === "pasta"
                ? { ...item, nome: novoNome }
                : item
        );
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

function renomearTokenUtil(idToken, novoNome, setBibliotecaTokens) {
    setBibliotecaTokens(prev => {
        return prev.map(item =>
            item.id === idToken && item.tipo === "token"
                ? { ...item, nome: novoNome }
                : item
        );
    });
}

function TokenModal(props) {
    const [open, setOpen] = useState(props.open || false);
    const [isDragging, setIsDragging] = useState(false);
    const modalRef = useRef(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isDragging && props.open === false) {
            return;
        }
        setOpen(props.open || false);
    }, [props.open, isDragging]);

    const onClose = () => {
        setIsDragging(false);
        setOpen(false);
        props.onClose?.();
    };

    useEffect(() => {
        const handleDragStartGlobal = () => {
            setIsDragging(true);
        };

        const handleDragEndGlobal = () => {
            setIsDragging(false);
            if (!props.open) {
                setOpen(false);
            }
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

            if (e.target.closest('.MuiModal-root')) {
                setOpen(true);
            }
        } catch (erro) { }
    };

    const carregarTokensBiblioteca = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/Tabletop/tokens');
            const data = await response.json();

            if (response.ok) {
                const tokensBiblioteca = data.map(token => ({
                    id: token.id,
                    tipo: "token",
                    nome: token.nome,
                    imagemUrl: token.imageUrl,
                    larguraOriginal: token.larguraOriginal,
                    alturaOriginal: token.alturaOriginal,
                    pastaPai: null,
                    dataCriacao: token.createdAt
                }));
                setBibliotecaTokens(tokensBiblioteca);
            }
        } catch (error) {
            console.error('[TokenModal] Erro ao carregar tokens:', error);
        } finally {
            setLoading(false);
        }
    };

    const salvarTokenNaAPI = async (token) => {
        console.log('[TokenModal] ========== salvarTokenNaAPI INICIADO ==========');
        console.log('[TokenModal] Token recebido:', token);
        console.log('[TokenModal] Token - imageUrl:', token.imageUrl);
        console.log('[TokenModal] Token - imageBase64:', token.imageBase64 ? 'presente' : 'null');
        console.log('[TokenModal] Token - nome:', token.nome);
        console.log('[TokenModal] Token - tokenId:', token.tokenId);

        try {
            const bodyString = JSON.stringify(token);
            console.log('[TokenModal] Body stringificado:', bodyString);
            console.log('[TokenModal] Body tamanho:', bodyString.length);

            const response = await fetch('/api/Tabletop/tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: bodyString
            });

            console.log('[TokenModal] Response status:', response.status);
            console.log('[TokenModal] Response ok:', response.ok);

            const data = await response.json();
            console.log('[TokenModal] Response data:', data);

            if (!response.ok) {
                console.error('[TokenModal] Erro na resposta:', data.error);
                throw new Error(data.error || 'Erro ao salvar token');
            }

            console.log('[TokenModal] Token salvo com sucesso, ID:', data.id);
            console.log('[TokenModal] ========== salvarTokenNaAPI FINALIZADO ==========');
            return data;
        } catch (error) {
            console.error('[TokenModal] Erro no catch:', error);
            console.error('[TokenModal] Stack:', error.stack);
            return null;
        }
    };

    const deletarTokenDaAPI = async (id) => {
        console.log('[TokenModal] ========== deletarTokenDaAPI INICIADO ==========');
        console.log('[TokenModal] ID para deletar:', id);

        try {
            const response = await fetch(`/api/Tabletop/${id}`, {
                method: 'DELETE'
            });

            console.log('[TokenModal] Response status:', response.status);
            console.log('[TokenModal] Response ok:', response.ok);

            if (!response.ok) {
                const data = await response.json();
                console.error('[TokenModal] Erro na resposta:', data.error);
                throw new Error(data.error || 'Erro ao deletar token');
            }

            console.log('[TokenModal] Token deletado com sucesso:', id);
            console.log('[TokenModal] ========== deletarTokenDaAPI FINALIZADO ==========');
            return true;
        } catch (error) {
            console.error('[TokenModal] Erro no catch:', error);
            console.error('[TokenModal] Stack:', error.stack);
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
                imageBase64: null,
                mimeType: null
            };

            const tokenSalvo = await salvarTokenNaAPI(novoToken);

            if (tokenSalvo) {
                const tokenParaBiblioteca = {
                    id: tokenSalvo.id,
                    tipo: "token",
                    nome: nomeToken.trim(),
                    imagemUrl: imagemSelecionada,
                    larguraOriginal: tokenSalvo.larguraOriginal,
                    alturaOriginal: tokenSalvo.alturaOriginal,
                    pastaPai: null,
                    dataCriacao: new Date().toISOString()
                };

                setBibliotecaTokens(prev => [...prev, tokenParaBiblioteca]);
                setImagemSelecionada(null);
                setNomeToken("");
                setActiveTab(0);
            }
        } catch (error) {
            console.error('[TokenModal] Erro ao salvar token:', error);
        } finally {
            setLoading(false);
        }
    };

    const excluirToken = async (idToken) => {
        const deletado = await deletarTokenDaAPI(idToken);
        if (deletado) {
            setBibliotecaTokens(prev => {
                return prev.filter(item => item.id !== idToken || item.tipo !== "token");
            });
        }
    };

    const renomearToken = (id, novoNome) => {
        renomearTokenUtil(id, novoNome, setBibliotecaTokens);
    };

    const criarPasta = (itensDentro, nomeSugerido) => {
        const pastasExistentes = bibliotecaTokens.filter(item => item.tipo === "pasta");
        return {
            id: `pasta-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            tipo: "pasta",
            nome: nomeSugerido || `Pasta ${pastasExistentes.length + 1}`,
            pastaPai: null,
            itens: itensDentro || [],
            dataCriacao: new Date().toISOString()
        };
    };

    const adicionarItemNaPasta = (idPasta, item) => {
        setBibliotecaTokens(prev => {
            return prev.map(p =>
                p.id === idPasta && p.tipo === "pasta"
                    ? { ...p, itens: [...p.itens, item] }
                    : p
            );
        });
    };

    const removerItemDaPasta = (idPasta, idItem) => {
        setBibliotecaTokens(prev => {
            return prev.map(p =>
                p.id === idPasta && p.tipo === "pasta"
                    ? { ...p, itens: p.itens.filter(i => i.id !== idItem) }
                    : p
            );
        });
    };

    const excluirPasta = (idPasta) => {
        setBibliotecaTokens(prev => {
            const pasta = prev.find(item => item.id === idPasta && item.tipo === "pasta");
            if (pasta) {
                return [...prev.filter(item => item.id !== idPasta), ...(pasta.itens || [])];
            }
            return prev;
        });
    };

    const renomearPasta = (id, novoNome) => {
        renomearPastaUtil(id, novoNome, setBibliotecaTokens, setPastaAtual);
    };

    const iniciarRenomeacaoPasta = (id, nomeAtual) => {
        setPastaRenomeando(id);
        setNovoNomePasta(nomeAtual);
        setMenuContextual({ aberto: false, x: 0, y: 0, idPasta: null, nomePasta: null });
    };

    const iniciarRenomeacaoToken = (id, nomeAtual) => {
        setTokenRenomeando(id);
        setNovoNomeToken(nomeAtual);
        setMenuContextualToken({ aberto: false, x: 0, y: 0, idToken: null, nomeToken: null });
    };

    const salvarRenomeacaoPasta = () => {
        if (pastaRenomeando && novoNomePasta?.trim()) {
            renomearPasta(pastaRenomeando, novoNomePasta.trim());
        }
        setPastaRenomeando(null);
        setNovoNomePasta("");
    };

    const salvarRenomeacaoToken = () => {
        if (tokenRenomeando && novoNomeToken?.trim()) {
            renomearToken(tokenRenomeando, novoNomeToken.trim());
        }
        setTokenRenomeando(null);
        setNovoNomeToken("");
    };

    const cancelarRenomeacaoPasta = () => {
        setPastaRenomeando(null);
        setNovoNomePasta("");
    };

    const cancelarRenomeacaoToken = () => {
        setTokenRenomeando(null);
        setNovoNomeToken("");
    };

    const buscarItensPorPastaPai = (idPastaPai) => {
        return bibliotecaTokens.filter(item =>
            idPastaPai === null ? !item.pastaPai : item.pastaPai === idPastaPai
        );
    };

    const adicionarItemNaPastaAtual = (idPasta, item) => {
        setBibliotecaTokens(prev => {
            return prev.map(p =>
                p.id === idPasta && p.tipo === "pasta"
                    ? { ...p, itens: [...p.itens, item] }
                    : p
            );
        });

        setPastaAtual(prev => {
            if (prev?.id === idPasta) {
                return { ...prev, itens: [...prev.itens, item] };
            }
            return prev;
        });
    };

    const removerItemDaPastaAtual = (idPasta, idItem) => {
        setBibliotecaTokens(prev => {
            return prev.map(p =>
                p.id === idPasta && p.tipo === "pasta"
                    ? { ...p, itens: p.itens.filter(i => i.id !== idItem) }
                    : p
            );
        });

        setPastaAtual(prev => {
            if (prev?.id === idPasta) {
                return { ...prev, itens: prev.itens.filter(i => i.id !== idItem) };
            }
            return prev;
        });
    };

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
        if (open && modalRef.current) {
            DragDropSystem.register('BibliotecaRaiz', modalRef.current, (dados) => {
                if (dados.tipo !== "token") return;

                setBibliotecaTokens(prev => {
                    const semPasta = prev.map(item =>
                        item.tipo === "pasta" && item.itens?.some(i => i.id === dados.id)
                            ? { ...item, itens: item.itens.filter(i => i.id !== dados.id) }
                            : item
                    );

                    const tokenJaExiste = semPasta.some(
                        item => item.id === dados.id && item.tipo === "token"
                    );

                    if (tokenJaExiste) return semPasta;

                    return [...semPasta, { ...dados, pastaPai: null }];
                });

                if (pastaAtual?.itens?.some(i => i.id === dados.id)) {
                    setPastaAtual(prev => ({
                        ...prev,
                        itens: prev.itens.filter(i => i.id !== dados.id)
                    }));
                }
            });
        }

        return () => {
            DragDropSystem.unregister('BibliotecaRaiz');
        };
    }, [open, pastaAtual]);

    useEffect(() => {
        if (modalPastaAberto && pastaAtual && pastaModalRef.current) {
            DragDropSystem.register(`Pasta-${pastaAtual.id}`, pastaModalRef.current, (dados) => {
                if (dados.tipo !== "token" || !dados.id) return;

                setBibliotecaTokens(prev => {
                    return prev.map(item =>
                        item.id === pastaAtual.id && item.tipo === "pasta"
                            ? { ...item, itens: item.itens.filter(i => i.id !== dados.id) }
                            : item
                    );
                });

                setTimeout(() => {
                    setBibliotecaTokens(prev => {
                        return prev.map(item =>
                            item.id === pastaAtual.id && item.tipo === "pasta"
                                ? { ...item, itens: [...item.itens, dados] }
                                : item
                        );
                    });

                    setPastaAtual(prev => ({
                        ...prev,
                        itens: [...prev.itens, dados]
                    }));
                }, 50);
            });
        }

        return () => {
            if (pastaAtual) {
                DragDropSystem.unregister(`Pasta-${pastaAtual.id}`);
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

    if (!open) return null;

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
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
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