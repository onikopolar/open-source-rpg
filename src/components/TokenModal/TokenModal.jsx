import React, { useState, useEffect, useRef } from "react";
import TokenDesign from "./TokenDesign";

// Sistema central de drag & drop
const DragDropSystem = {
    listeners: new Map(),

    register(id, element, handler) {
        this.listeners.set(id, { element, handler });
    },

    unregister(id) {
        this.listeners.delete(id);
    },

    processDrop(event, dados) {
        event.preventDefault();
        event.stopPropagation();

        const listenersValidos = [];

        for (let [id, listener] of this.listeners) {
            if (!listener.element || !document.body.contains(listener.element)) {
                this.listeners.delete(id);
                continue;
            }

            try {
                const rect = listener.element.getBoundingClientRect();
                const area = rect.width * rect.height;
                listenersValidos.push({ id, ...listener, rect, area });
            } catch (e) {
                // Silencia erro
            }
        }

        const listenersComMouseDentro = listenersValidos.filter(l => {
            const dentro = event.clientX >= l.rect.left &&
                event.clientX <= l.rect.right &&
                event.clientY >= l.rect.top &&
                event.clientY <= l.rect.bottom;
            return dentro;
        });

        if (listenersComMouseDentro.length === 0) {
            if (this.listeners.has('BibliotecaRaiz')) {
                this.listeners.get('BibliotecaRaiz').handler(dados, event);
            }
            return;
        }

        let elementoMaisProfundo = null;
        let maiorProfundidade = -1;

        listenersComMouseDentro.forEach(l => {
            try {
                if (l.element.contains(event.target) || event.target.contains(l.element)) {
                    let profundidade = 0;
                    let elemento = l.element;
                    while (elemento.parentElement) {
                        profundidade++;
                        elemento = elemento.parentElement;
                    }

                    if (profundidade > maiorProfundidade) {
                        maiorProfundidade = profundidade;
                        elementoMaisProfundo = l;
                    }
                }
            } catch (e) {
                // Silencia erro
            }
        });

        const alvo = elementoMaisProfundo || listenersComMouseDentro.sort((a, b) => a.area - b.area)[0];

        try {
            alvo.handler(dados, event);
        } catch (erro) {
            // Silencia erro
        }
    }
};

//utilitário pra renomear pastas
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

//utilitário pra renomear tokens
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
        const handleDragStart = () => {
            setIsDragging(true);
        };

        const handleDragEnd = () => {
            setIsDragging(false);
            if (!props.open) {
                setOpen(false);
            }
        };

        window.addEventListener('dragstart', handleDragStart);
        window.addEventListener('dragend', handleDragEnd);
        document.addEventListener('dragstart', handleDragStart);
        document.addEventListener('dragend', handleDragEnd);

        return () => {
            window.removeEventListener('dragstart', handleDragStart);
            window.removeEventListener('dragend', handleDragEnd);
            document.removeEventListener('dragstart', handleDragStart);
            document.removeEventListener('dragend', handleDragEnd);
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
        } catch (erro) {
            // Silencia erro
        }
    };

    const salvarTokenNaBiblioteca = () => {
        if (!imagemSelecionada || !nomeToken.trim()) return;

        const img = new Image();
        img.src = imagemSelecionada;
        img.onload = () => {
            const novoToken = {
                id: Date.now().toString(),
                tipo: "token",
                nome: nomeToken,
                imagemUrl: imagemSelecionada,
                larguraOriginal: img.naturalWidth,
                alturaOriginal: img.naturalHeight,
                pastaPai: null,
                dataCriacao: new Date().toISOString()
            };

            setBibliotecaTokens(prev => [...prev, novoToken]);
            setImagemSelecionada(null);
            setNomeToken("");
        };
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

    const excluirToken = (idToken) => {
        setBibliotecaTokens(prev => {
            return prev.filter(item => item.id !== idToken || item.tipo !== "token");
        });
    };

    const renomearPasta = (id, novoNome) => {
        renomearPastaUtil(id, novoNome, setBibliotecaTokens, setPastaAtual);
    };

    const renomearToken = (id, novoNome) => {
        renomearTokenUtil(id, novoNome, setBibliotecaTokens);
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

    const [menuContextualToken, setMenuContextualToken] = useState({
        aberto: false, x: 0, y: 0, idToken: null, nomeToken: null
    });

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
        />
    );
}

export { DragDropSystem, TokenModal as default };