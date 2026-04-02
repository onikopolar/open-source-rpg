// src/components/Tabletop/NuvemFOV.jsx
import { useState, useCallback, useRef, useEffect } from "react";

export function useNuvemFOV({
    isMaster = false,
    socket,
    tabletopId,
    onRenderCallback
}) {
    const [modoDesenho, setModoDesenho] = useState(false);
    const [camadasNevoa, setCamadasNevoa] = useState([]);
    const [desenhando, setDesenhando] = useState(false);
    const [inicioDesenho, setInicioDesenho] = useState({ x: 0, y: 0 });
    const [fimDesenho, setFimDesenho] = useState({ x: 0, y: 0 });

    const rafRef = useRef(null);
    const uiStateRef = useRef({ zoom: 1, position: { x: 0, y: 0 } });
    const initialLoadDone = useRef(false);

    // ✅ FIX PRINCIPAL: Refs espelho dos states
    // renderizarNevoa lê SEMPRE dessas refs, nunca do closure do useCallback.
    // Isso garante que qualquer versão antiga de renderizarTudo (via renderCallbackRef
    // no TabletopGrid) ainda enxergue as camadas mais recentes — resolvendo o problema
    // do player não ver a névoa sem precisar de F5.
    const camadasNevoaRef = useRef([]);
    const desenhandoRef = useRef(false);
    const inicioDesenhoRef = useRef({ x: 0, y: 0 });
    const fimDesenhoRef = useRef({ x: 0, y: 0 });

    // ✅ FIX: Ref estável para o callback de render — evita race condition no carregamento
    const onRenderCallbackRef = useRef(onRenderCallback);
    useEffect(() => {
        onRenderCallbackRef.current = onRenderCallback;
    }, [onRenderCallback]);

        const dispararRender = useCallback(() => {
        console.log('[NuvemFOV] dispararRender chamado, callback existe?', !!onRenderCallbackRef.current);
        if (onRenderCallbackRef.current) onRenderCallbackRef.current();
    }, []);

    // ✅ Sincroniza refs com os states e dispara render a cada mudança
    useEffect(() => {
        camadasNevoaRef.current = camadasNevoa;
        dispararRender();
    }, [camadasNevoa, dispararRender]);

    useEffect(() => {
        desenhandoRef.current = desenhando;
    }, [desenhando]);

    useEffect(() => {
        inicioDesenhoRef.current = inicioDesenho;
    }, [inicioDesenho]);

    useEffect(() => {
        fimDesenhoRef.current = fimDesenho;
    }, [fimDesenho]);

    const criarCamadaServidor = useCallback(async (camada) => {
        if (!isMaster) return null;
        try {
            const response = await fetch('/api/Tabletop/nevoa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: camada.nome || 'Camada de Névoa',
                    x: camada.x,
                    y: camada.y,
                    escala: camada.escala,
                    larguraOriginal: camada.larguraOriginal,
                    alturaOriginal: camada.alturaOriginal,
                    imageData: null
                })
            });
            const data = await response.json();
            if (response.ok) {
                console.log('[NuvemFOV] Camada criada no servidor:', data.id);
                return data;
            }
            console.error('[NuvemFOV] Erro ao criar camada:', data.error);
            return null;
        } catch (error) {
            console.error('[NuvemFOV] Erro na requisição POST:', error);
            return null;
        }
    }, [isMaster]);

    const atualizarCamadaServidor = useCallback(async (camada) => {
        if (!isMaster) return null;
        try {
            const response = await fetch(`/api/Tabletop/nevoa/${camada.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    x: camada.x,
                    y: camada.y,
                    escala: camada.escala
                })
            });
            const data = await response.json();
            if (response.ok) {
                console.log('[NuvemFOV] Camada atualizada no servidor:', camada.id);
                return data;
            }
            console.error('[NuvemFOV] Erro ao atualizar camada:', data.error);
            return null;
        } catch (error) {
            console.error('[NuvemFOV] Erro na requisição PUT:', error);
            return null;
        }
    }, [isMaster]);

    const deletarCamadaServidor = useCallback(async (id) => {
        if (!isMaster) return false;
        try {
            const response = await fetch(`/api/Tabletop/nevoa/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                console.log('[NuvemFOV] Camada deletada do servidor:', id);
                return true;
            }
            const data = await response.json();
            console.error('[NuvemFOV] Erro ao deletar camada:', data.error);
            return false;
        } catch (error) {
            console.error('[NuvemFOV] Erro na requisição DELETE:', error);
            return false;
        }
    }, [isMaster]);

        // ✅ Garantir que o socket entre na sala do tabletop
    useEffect(() => {
        if (!socket) return;

        console.log('[NuvemFOV] Entrando na sala do tabletop:', tabletopId);
        
        if (!socket.connected) {
            socket.on('connect', () => {
                socket.emit('tabletop:join', { tabletopId });
            });
            return;
        }

        socket.emit('tabletop:join', { tabletopId });
    }, [socket, tabletopId]);

    // ✅ FIX: Master ignora eventos de socket que ele mesmo emitiu — evita duplicação
    useEffect(() => {
        if (!socket) return;

        console.log('[NuvemFOV] Registrando ouvintes de socket para névoa');

        const handleNevoaCreated = (data) => {
            console.log('[NuvemFOV] nevoaCreated recebido:', data);
            if (isMaster) return;
            setCamadasNevoa(prev => {
                if (prev.some(c => c.id === data.id)) return prev;
                return [...prev, { ...data, tipo: 'nevoa' }];
            });
        };

                const handleNevoaUpdated = (data) => {
            console.log('[NuvemFOV] nevoaUpdated recebido:', data, 'escala:', data.escala, 'x:', data.x, 'y:', data.y);
            if (isMaster) return;
            setCamadasNevoa(prev =>
                prev.map(c => c.id === data.id ? { ...c, ...data } : c)
            );
        };

        const handleNevoaDeleted = (data) => {
            console.log('[NuvemFOV] nevoaDeleted recebido:', data);
            if (isMaster) return;
            setCamadasNevoa(prev => prev.filter(c => c.id !== data.id));
        };

        const handleNevoaMoved = (data) => {
            console.log('[NuvemFOV] nevoaMoved recebido:', data);
            if (isMaster) return;
            setCamadasNevoa(prev =>
                prev.map(c => c.id === data.id ? { ...c, x: data.x, y: data.y } : c)
            );
        };

        socket.on('tabletop:nevoaCreated', handleNevoaCreated);
        socket.on('tabletop:nevoaUpdated', handleNevoaUpdated);
        socket.on('tabletop:nevoaDeleted', handleNevoaDeleted);
        socket.on('tabletop:nevoaMoved', handleNevoaMoved);

        return () => {
            socket.off('tabletop:nevoaCreated', handleNevoaCreated);
            socket.off('tabletop:nevoaUpdated', handleNevoaUpdated);
            socket.off('tabletop:nevoaDeleted', handleNevoaDeleted);
            socket.off('tabletop:nevoaMoved', handleNevoaMoved);
        };
    }, [socket, isMaster]);

    // ✅ FIX: Array vazio — roda exatamente uma vez, sem dependência instável
    useEffect(() => {
        if (initialLoadDone.current) return;
        initialLoadDone.current = true;

        const carregarCamadas = async () => {
            try {
                const response = await fetch('/api/Tabletop/nevoa');
                const data = await response.json();
                if (response.ok) {
                    setCamadasNevoa(data.map(c => ({ ...c, tipo: 'nevoa' })));
                    // dispararRender é chamado automaticamente pelo useEffect de camadasNevoa
                } else {
                    console.error('[NuvemFOV] Erro ao carregar camadas:', data.error);
                }
            } catch (error) {
                console.error('[NuvemFOV] Erro na requisição GET:', error);
            }
        };

        carregarCamadas();
    }, []); // ✅ Array vazio — sem dependências instáveis

        const adicionarCamada = useCallback(async (camada) => {
        if (!isMaster) return;

        console.log('[NuvemFOV] adicionarCamada chamado:', camada);
        const camadaPersistida = await criarCamadaServidor(camada);
        if (!camadaPersistida) return;

        // ✅ Master adiciona localmente
        setCamadasNevoa(prev => {
            if (prev.some(c => c.id === camadaPersistida.id)) return prev;
            return [...prev, { ...camadaPersistida, tipo: 'nevoa' }];
        });

        // ✅ Emite para os outros (servidor deve usar broadcast, não io.emit)
        console.log('[NuvemFOV] Emitindo nevoaCreated, socket conectado?', socket?.connected);
        if (socket?.connected) {
            socket.emit('tabletop:nevoaCreated', { tabletopId, ...camadaPersistida });
        } else {
            console.warn('[NuvemFOV] Socket não conectado, não emitindo evento');
        }
    }, [isMaster, criarCamadaServidor, socket, tabletopId]);

        const atualizarCamada = useCallback(async (id, alteracoes) => {
        if (!isMaster) return;

        console.log('[NuvemFOV] atualizarCamada chamado:', id, alteracoes);
        setCamadasNevoa(prev => {
            const nova = prev.map(c =>
                c.id === id ? { ...c, ...alteracoes } : c
            );
            const camadaAlterada = nova.find(c => c.id === id);
            if (!camadaAlterada) return prev;

            atualizarCamadaServidor(camadaAlterada);

            console.log('[NuvemFOV] Emitindo nevoaUpdated, socket conectado?', socket?.connected);
            if (socket?.connected) {
                socket.emit('tabletop:nevoaUpdated', { tabletopId, ...camadaAlterada });
            } else {
                console.warn('[NuvemFOV] Socket não conectado, não emitindo evento');
            }

            return nova;
        });
    }, [isMaster, atualizarCamadaServidor, socket, tabletopId]);

        const removerCamada = useCallback(async (id) => {
        if (!isMaster) return;

        console.log('[NuvemFOV] removerCamada chamado:', id);
        setCamadasNevoa(prev => prev.filter(c => c.id !== id));

        deletarCamadaServidor(id);

        console.log('[NuvemFOV] Emitindo nevoaDeleted, socket conectado?', socket?.connected);
        if (socket?.connected) {
            socket.emit('tabletop:nevoaDeleted', { tabletopId, id });
        } else {
            console.warn('[NuvemFOV] Socket não conectado, não emitindo evento');
        }
    }, [isMaster, deletarCamadaServidor, socket, tabletopId]);

    const ativarModoDesenho = useCallback(() => {
        if (!isMaster) return;
        setModoDesenho(true);
    }, [isMaster]);

    const desativarModoDesenho = useCallback(() => {
        if (!isMaster) return;
        setModoDesenho(false);
        setDesenhando(false);
    }, [isMaster]);

    const telaParaMundo = useCallback((telaX, telaY) => {
        const { zoom, position } = uiStateRef.current;
        return {
            x: (telaX - position.x) / zoom,
            y: (telaY - position.y) / zoom
        };
    }, []);

    const iniciarDesenho = useCallback((telaX, telaY) => {
        if (!isMaster || !modoDesenho) return;
        const mundo = telaParaMundo(telaX, telaY);
        setDesenhando(true);
        setInicioDesenho(mundo);
        setFimDesenho(mundo);
    }, [isMaster, modoDesenho, telaParaMundo]);

    const atualizarDesenho = useCallback((telaX, telaY) => {
        if (!isMaster || !desenhando) return;
        const mundo = telaParaMundo(telaX, telaY);
        setFimDesenho(mundo);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            dispararRender();
            rafRef.current = null;
        });
    }, [isMaster, desenhando, telaParaMundo, dispararRender]);

    const finalizarDesenho = useCallback(() => {
        if (!isMaster || !desenhando) return;

        const x1 = Math.min(inicioDesenho.x, fimDesenho.x);
        const y1 = Math.min(inicioDesenho.y, fimDesenho.y);
        const x2 = Math.max(inicioDesenho.x, fimDesenho.x);
        const y2 = Math.max(inicioDesenho.y, fimDesenho.y);
        const largura = x2 - x1;
        const altura = y2 - y1;

        if (Math.abs(largura) > 20 && Math.abs(altura) > 20) {
            const novaCamada = {
                id: Date.now() + Math.random(),
                x: x1,
                y: y1,
                larguraOriginal: largura,
                alturaOriginal: altura,
                escala: 1.0,
                tipo: 'nevoa'
            };
            adicionarCamada(novaCamada);
        } else {
            console.log('[NuvemFOV] desenho ignorado (área muito pequena)');
        }

        setDesenhando(false);
        dispararRender();
    }, [isMaster, desenhando, inicioDesenho, fimDesenho, adicionarCamada, dispararRender]);

    const limparTudo = useCallback(() => {
        if (!isMaster) return;
        camadasNevoa.forEach(camada => {
            removerCamada(camada.id);
        });
    }, [isMaster, camadasNevoa, removerCamada]);

    const desfazer = useCallback(() => {
        if (!isMaster) return;
        const ultima = camadasNevoa[camadasNevoa.length - 1];
        if (ultima) removerCamada(ultima.id);
    }, [isMaster, camadasNevoa, removerCamada]);

    const deletarCamada = useCallback((id) => {
        if (!isMaster) return;
        removerCamada(id);
    }, [isMaster, removerCamada]);

    const atualizarEscalaCamada = useCallback((id, novaEscala) => {
        atualizarCamada(id, { escala: novaEscala });
    }, [atualizarCamada]);

    const atualizarPosicaoCamada = useCallback((id, novaX, novaY) => {
        atualizarCamada(id, { x: novaX, y: novaY });
    }, [atualizarCamada]);

    const setUIStateRef = useCallback((zoom, position) => {
        uiStateRef.current = { zoom, position };
    }, []);

    const renderizarNevoa = useCallback((context, zoom, position) => {
        uiStateRef.current = { zoom, position };
        const alpha = isMaster ? 0.6 : 1.0;
        context.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        camadasNevoa.forEach(area => {
            const larguraMundo = area.larguraOriginal * area.escala;
            const alturaMundo = area.alturaOriginal * area.escala;
            const telaX = area.x * zoom + position.x;
            const telaY = area.y * zoom + position.y;
            const telaLargura = larguraMundo * zoom;
            const telaAltura = alturaMundo * zoom;
            context.fillRect(telaX, telaY, telaLargura, telaAltura);
        });

        if (desenhando && isMaster) {
            const x1 = Math.min(inicioDesenho.x, fimDesenho.x);
            const y1 = Math.min(inicioDesenho.y, fimDesenho.y);
            const x2 = Math.max(inicioDesenho.x, fimDesenho.x);
            const y2 = Math.max(inicioDesenho.y, fimDesenho.y);
            const telaX = x1 * zoom + position.x;
            const telaY = y1 * zoom + position.y;
            const telaLargura = (x2 - x1) * zoom;
            const telaAltura = (y2 - y1) * zoom;
            context.strokeStyle = '#ff4444';
            context.lineWidth = 2 / zoom;
            context.setLineDash([5 / zoom, 5 / zoom]);
            context.strokeRect(telaX, telaY, telaLargura, telaAltura);
            context.setLineDash([]);
        }
    }, [camadasNevoa, desenhando, inicioDesenho, fimDesenho, isMaster]);

    const getCamadaComInfo = useCallback((camada, zoom, position) => {
        const larguraMundo = camada.larguraOriginal * camada.escala;
        const alturaMundo = camada.alturaOriginal * camada.escala;
        const posicaoTela = {
            x: (camada.x * zoom) + position.x,
            y: (camada.y * zoom) + position.y
        };
        const larguraTela = larguraMundo * zoom;
        const alturaTela = alturaMundo * zoom;
        return {
            ...camada,
            posicaoTela,
            tamanhoTela: {
                larguraOriginal: camada.larguraOriginal,
                alturaOriginal: camada.alturaOriginal,
                larguraMundo,
                alturaMundo,
                larguraTela,
                alturaTela
            }
        };
    }, []);

    const encontrarCamadaNaPosicao = useCallback((mundoX, mundoY) => {
        for (let i = camadasNevoa.length - 1; i >= 0; i--) {
            const camada = camadasNevoa[i];
            const larguraAtual = camada.larguraOriginal * camada.escala;
            const alturaAtual = camada.alturaOriginal * camada.escala;
            const dentro = mundoX >= camada.x &&
                mundoX <= camada.x + larguraAtual &&
                mundoY >= camada.y &&
                mundoY <= camada.y + alturaAtual;
            if (dentro) return camada;
        }
        return null;
    }, [camadasNevoa]);

    const estaCoberto = useCallback((mundoX, mundoY) => {
        for (let i = 0; i < camadasNevoa.length; i++) {
            const area = camadasNevoa[i];
            const larguraAtual = area.larguraOriginal * area.escala;
            const alturaAtual = area.alturaOriginal * area.escala;
            const dentro = mundoX >= area.x &&
                mundoX <= area.x + larguraAtual &&
                mundoY >= area.y &&
                mundoY <= area.y + alturaAtual;
            if (dentro) return true;
        }
        return false;
    }, [camadasNevoa]);

    return {
        modoDesenho,
        camadasNevoa,
        setCamadasNevoa,
        desenhando,
        inicioDesenho,
        fimDesenho,
        ativarModoDesenho,
        desativarModoDesenho,
        iniciarDesenho,
        atualizarDesenho,
        finalizarDesenho,
        limparTudo,
        desfazer,
        deletarCamada,
        atualizarEscalaCamada,
        atualizarPosicaoCamada,
        telaParaMundo,
        mundoParaTela: (mundoX, mundoY) => {
            const { zoom, position } = uiStateRef.current;
            return { x: mundoX * zoom + position.x, y: mundoY * zoom + position.y };
        },
        setUIStateRef,
        registrarCallbackRender: () => { },
        renderizarNevoa,
        getCamadaComInfo,
        encontrarCamadaNaPosicao,
        estaCoberto
    };
}