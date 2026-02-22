import React, { useState, useEffect, useRef } from "react";
import TokenDesign from "./TokenDesign";

// ========== SISTEMA CENTRAL DE DRAG & DROP ==========
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

        //filtra listeners válidos e calcula área
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
                //ignora erro e continua
            }
        }

        //só considera listeners com o mouse dentro
        const listenersComMouseDentro = listenersValidos.filter(l =>
            event.clientX >= l.rect.left &&
            event.clientX <= l.rect.right &&
            event.clientY >= l.rect.top &&
            event.clientY <= l.rect.bottom
        );

        //ordena do mais específico (menor área) pro menos específico
        const listenersOrdenados = listenersComMouseDentro.sort((a, b) => a.area - b.area);
        const alvo = listenersOrdenados[0];

        if (alvo) {
            alvo.handler(dados, event);
        } else if (this.listeners.has('BibliotecaRaiz')) {
            this.listeners.get('BibliotecaRaiz').handler(dados, event);
        }
    }
};

//utilitário pra renomear pastas
function renomearPastaUtil(idPasta, novoNome, setBibliotecaTokens, setPastaAtual) {
    setBibliotecaTokens(prev => prev.map(item =>
        item.id === idPasta && item.tipo === "pasta"
            ? { ...item, nome: novoNome }
            : item
    ));

    if (setPastaAtual) {
        setPastaAtual(prev => prev?.id === idPasta ? { ...prev, nome: novoNome } : prev);
    }
}

function TokenModal(props) {
    const [open, setOpen] = useState(props.open || false);
    const modalRef = useRef(null);

    useEffect(() => setOpen(props.open || false), [props.open]);

    const onClose = () => {
        setOpen(false);
        props.onClose?.();
    };

    //estados principais
    const [activeTab, setActiveTab] = useState(0);
    const [imagemSelecionada, setImagemSelecionada] = useState(null);
    const [nomeToken, setNomeToken] = useState("");
    const [bibliotecaTokens, setBibliotecaTokens] = useState([]);

    //estados de navegação entre pastas
    const [modalPastaAberto, setModalPastaAberto] = useState(false);
    const [pastaAtual, setPastaAtual] = useState(null);
    const [historicoPastas, setHistoricoPastas] = useState([]);
    const pastaModalRef = useRef(null);

    //menus contextuais
    const [menuContextual, setMenuContextual] = useState({
        aberto: false, x: 0, y: 0, idPasta: null, nomePasta: null
    });

    const [menuContextualPasta, setMenuContextualPasta] = useState({
        aberto: false, x: 0, y: 0, idPasta: null
    });

    //renomeação
    const [pastaRenomeando, setPastaRenomeando] = useState(null);
    const [novoNomePasta, setNovoNomePasta] = useState("");
    const [criandoSubPasta, setCriandoSubPasta] = useState(false);

    //registra o modal principal pra receber drops
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

                    return tokenJaExiste
                        ? semPasta
                        : [...semPasta, { ...dados, pastaPai: null }];
                });

                if (pastaAtual?.itens?.some(i => i.id === dados.id)) {
                    setPastaAtual(prev => ({
                        ...prev,
                        itens: prev.itens.filter(i => i.id !== dados.id)
                    }));
                }
            });
        }

        return () => DragDropSystem.unregister('BibliotecaRaiz');
    }, [open, pastaAtual]);

    //registra o modal da pasta pra receber drops
    useEffect(() => {
        if (modalPastaAberto && pastaAtual && pastaModalRef.current) {
            DragDropSystem.register(`Pasta-${pastaAtual.id}`, pastaModalRef.current, (dados) => {
                if (dados.tipo !== "token" || !dados.id) return;

                setBibliotecaTokens(prev => prev.map(item =>
                    item.id === pastaAtual.id && item.tipo === "pasta"
                        ? { ...item, itens: item.itens.filter(i => i.id !== dados.id) }
                        : item
                ));

                setTimeout(() => {
                    setBibliotecaTokens(prev => prev.map(item =>
                        item.id === pastaAtual.id && item.tipo === "pasta"
                            ? { ...item, itens: [...item.itens, dados] }
                            : item
                    ));

                    setPastaAtual(prev => ({
                        ...prev,
                        itens: [...prev.itens, dados]
                    }));
                }, 50);
            });
        }

        return () => {
            if (pastaAtual) DragDropSystem.unregister(`Pasta-${pastaAtual.id}`);
        };
    }, [modalPastaAberto, pastaAtual]);

    //handlers globais de drag
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
            if (e.target.closest('.MuiModal-root')) setOpen(true);
        } catch (erro) {
            console.log("erro no drop:", erro);
        }
    };

    //funções da biblioteca
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
        setBibliotecaTokens(prev => prev.map(p =>
            p.id === idPasta && p.tipo === "pasta"
                ? { ...p, itens: [...p.itens, item] }
                : p
        ));
    };

    const removerItemDaPasta = (idPasta, idItem) => {
        setBibliotecaTokens(prev => prev.map(p =>
            p.id === idPasta && p.tipo === "pasta"
                ? { ...p, itens: p.itens.filter(i => i.id !== idItem) }
                : p
        ));
    };

    const excluirPasta = (idPasta) => {
        setBibliotecaTokens(prev => {
            const pasta = prev.find(item => item.id === idPasta && item.tipo === "pasta");
            return pasta
                ? [...prev.filter(item => item.id !== idPasta), ...(pasta.itens || [])]
                : prev;
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

    const salvarRenomeacaoPasta = () => {
        if (pastaRenomeando && novoNomePasta?.trim()) {
            renomearPasta(pastaRenomeando, novoNomePasta.trim());
        }
        setPastaRenomeando(null);
        setNovoNomePasta("");
    };

    const cancelarRenomeacaoPasta = () => {
        setPastaRenomeando(null);
        setNovoNomePasta("");
    };

    const buscarItensPorPastaPai = (idPastaPai) => {
        return bibliotecaTokens.filter(item =>
            idPastaPai === null ? !item.pastaPai : item.pastaPai === idPastaPai
        );
    };

    //funções do modal da pasta com histórico
    const adicionarItemNaPastaAtual = (idPasta, item) => {
        setBibliotecaTokens(prev => prev.map(p =>
            p.id === idPasta && p.tipo === "pasta"
                ? { ...p, itens: [...p.itens, item] }
                : p
        ));

        setPastaAtual(prev => prev?.id === idPasta
            ? { ...prev, itens: [...prev.itens, item] }
            : prev
        );
    };

    const removerItemDaPastaAtual = (idPasta, idItem) => {
        setBibliotecaTokens(prev => prev.map(p =>
            p.id === idPasta && p.tipo === "pasta"
                ? { ...p, itens: p.itens.filter(i => i.id !== idItem) }
                : p
        ));

        setPastaAtual(prev => prev?.id === idPasta
            ? { ...prev, itens: prev.itens.filter(i => i.id !== idItem) }
            : prev
        );
    };

    const abrirSubPasta = (subPasta) => {
        //guarda a pasta atual no histórico antes de abrir a subpasta
        setHistoricoPastas(prev => [...prev, pastaAtual]);

        setModalPastaAberto(false);
        setTimeout(() => {
            setPastaAtual(subPasta);
            setModalPastaAberto(true);
        }, 100);
    };

    const voltarPasta = () => {
        if (historicoPastas.length === 0) {
            //sem histórico, volta pra raiz
            setModalPastaAberto(false);
            setPastaAtual(null);
        } else {
            //pega a última pasta do histórico e remove
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
        iniciarRenomeacaoPasta(pastaAtual.id, pastaAtual.nome);
    };

    const excluirPastaAtual = () => {
        excluirPasta(pastaAtual.id);
        setModalPastaAberto(false);
        setPastaAtual(null);
    };

    const criarSubPastaAqui = () => {
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

    //evento global pra abrir pasta de outros componentes
    useEffect(() => {
        const handleAbrirPasta = (e) => {
            setPastaAtual(e.detail.pasta);
            setModalPastaAberto(true);
            setOpen(true);
        };

        window.addEventListener("abrirPasta", handleAbrirPasta);
        return () => window.removeEventListener("abrirPasta", handleAbrirPasta);
    }, []);

    if (!open) return null;

    return (
        <TokenDesign
            //controle do modal
            isOpen={open}
            onClose={onClose}
            modalRef={modalRef}
            pastaModalRef={pastaModalRef}

            //abas
            activeTab={activeTab}
            setActiveTab={setActiveTab}

            //token atual sendo importado
            imagemSelecionada={imagemSelecionada}
            setImagemSelecionada={setImagemSelecionada}
            nomeToken={nomeToken}
            setNomeToken={setNomeToken}

            //dados da biblioteca
            bibliotecaTokens={bibliotecaTokens}
            setBibliotecaTokens={setBibliotecaTokens}

            //pasta atual e seu modal
            modalPastaAberto={modalPastaAberto}
            setModalPastaAberto={setModalPastaAberto}
            pastaAtual={pastaAtual}
            setPastaAtual={setPastaAtual}

            //menus contextuais
            menuContextual={menuContextual}
            setMenuContextual={setMenuContextual}
            menuContextualPasta={menuContextualPasta}
            setMenuContextualPasta={setMenuContextualPasta}

            //renomeação
            pastaRenomeando={pastaRenomeando}
            setPastaRenomeando={setPastaRenomeando}
            novoNomePasta={novoNomePasta}
            setNovoNomePasta={setNovoNomePasta}

            //flags de estado
            criandoSubPasta={criandoSubPasta}
            setCriandoSubPasta={setCriandoSubPasta}

            //handlers de drag global
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}

            //funções da biblioteca
            salvarTokenNaBiblioteca={salvarTokenNaBiblioteca}
            criarPasta={criarPasta}
            adicionarItemNaPasta={adicionarItemNaPasta}
            removerItemDaPasta={removerItemDaPasta}
            excluirPasta={excluirPasta}
            renomearPasta={renomearPasta}
            buscarItensPorPastaPai={buscarItensPorPastaPai}

            //funções de renomeação
            iniciarRenomeacaoPasta={iniciarRenomeacaoPasta}
            salvarRenomeacaoPasta={salvarRenomeacaoPasta}
            cancelarRenomeacaoPasta={cancelarRenomeacaoPasta}

            //funções do modal da pasta
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