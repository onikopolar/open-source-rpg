// src/components/Tabletop/NuvemFOV.jsx
import { useState, useCallback, useRef, useEffect } from "react";

export function useNuvemFOV({
    isMaster = false,
    socket,
    tabletopId,
    onRenderCallback // função para agendar re-renderização do canvas
}) {
    const [modoDesenho, setModoDesenho] = useState(false);
    const [camadasNevoa, setCamadasNevoa] = useState([]);
    const [desenhando, setDesenhando] = useState(false);
    const [inicioDesenho, setInicioDesenho] = useState({ x: 0, y: 0 });
    const [fimDesenho, setFimDesenho] = useState({ x: 0, y: 0 });

    const rafRef = useRef(null);
    const uiStateRef = useRef({ zoom: 1, position: { x: 0, y: 0 } });
    const initialLoadDone = useRef(false);

    // ==================== Persistência no servidor ====================
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

    // ==================== Sincronização via socket ====================
    useEffect(() => {
        if (!socket) return;

        const handleNevoaCreated = (data) => {
            console.log('[NuvemFOV] nevoaCreated recebido:', data);
            setCamadasNevoa(prev => [...prev, { ...data, tipo: 'nevoa' }]);
            if (onRenderCallback) onRenderCallback();
        };

        const handleNevoaUpdated = (data) => {
            console.log('[NuvemFOV] nevoaUpdated recebido:', data);
            setCamadasNevoa(prev =>
                prev.map(c => c.id === data.id ? { ...c, ...data } : c)
            );
            if (onRenderCallback) onRenderCallback();
        };

        const handleNevoaDeleted = (data) => {
            console.log('[NuvemFOV] nevoaDeleted recebido:', data);
            setCamadasNevoa(prev => prev.filter(c => c.id !== data.id));
            if (onRenderCallback) onRenderCallback();
        };

        socket.on('tabletop:nevoaCreated', handleNevoaCreated);
        socket.on('tabletop:nevoaUpdated', handleNevoaUpdated);
        socket.on('tabletop:nevoaDeleted', handleNevoaDeleted);

        return () => {
            socket.off('tabletop:nevoaCreated', handleNevoaCreated);
            socket.off('tabletop:nevoaUpdated', handleNevoaUpdated);
            socket.off('tabletop:nevoaDeleted', handleNevoaDeleted);
        };
    }, [socket, onRenderCallback]);

    // ==================== Carregamento inicial ====================
    useEffect(() => {
        if (initialLoadDone.current) return;
        initialLoadDone.current = true;

        const carregarCamadas = async () => {
            try {
                const response = await fetch('/api/Tabletop/nevoa');
                const data = await response.json();
                if (response.ok) {
                    console.log('[NuvemFOV] Camadas carregadas:', data.length);
                    setCamadasNevoa(data.map(c => ({ ...c, tipo: 'nevoa' })));
                    if (onRenderCallback) onRenderCallback();
                } else {
                    console.error('[NuvemFOV] Erro ao carregar camadas:', data.error);
                }
            } catch (error) {
                console.error('[NuvemFOV] Erro na requisição GET:', error);
            }
        };
        carregarCamadas();
    }, [onRenderCallback]);

    // ==================== Funções que modificam camadas (com persistência e socket) ====================
    const adicionarCamada = useCallback(async (camada) => {
        if (!isMaster) return;

        // Salvar no servidor primeiro
        const camadaPersistida = await criarCamadaServidor(camada);
        if (!camadaPersistida) return;

        // Atualizar estado local com o ID real do servidor
        setCamadasNevoa(prev => {
            const nova = [...prev, { ...camadaPersistida, tipo: 'nevoa' }];
            if (onRenderCallback) onRenderCallback();
            return nova;
        });

        // Emitir via socket para outros clientes
        if (socket?.connected) {
            socket.emit('tabletop:nevoaCreated', { tabletopId, ...camadaPersistida });
        }
    }, [isMaster, criarCamadaServidor, socket, tabletopId, onRenderCallback]);

    const atualizarCamada = useCallback(async (id, alteracoes) => {
        if (!isMaster) return;

        setCamadasNevoa(prev => {
            const nova = prev.map(c =>
                c.id === id ? { ...c, ...alteracoes } : c
            );
            const camadaAlterada = nova.find(c => c.id === id);
            if (camadaAlterada && onRenderCallback) onRenderCallback();

            // Persistir no servidor
            atualizarCamadaServidor(camadaAlterada);

            // Emitir via socket
            if (socket?.connected) {
                socket.emit('tabletop:nevoaUpdated', { tabletopId, ...camadaAlterada });
            }

            return nova;
        });
    }, [isMaster, atualizarCamadaServidor, socket, tabletopId, onRenderCallback]);

    const removerCamada = useCallback(async (id) => {
        if (!isMaster) return;

        setCamadasNevoa(prev => {
            const nova = prev.filter(c => c.id !== id);
            if (onRenderCallback) onRenderCallback();

            // Remover do servidor
            deletarCamadaServidor(id);

            // Emitir via socket
            if (socket?.connected) {
                socket.emit('tabletop:nevoaDeleted', { tabletopId, id });
            }

            return nova;
        });
    }, [isMaster, deletarCamadaServidor, socket, tabletopId, onRenderCallback]);

    // ==================== Lógica de desenho (já existente, adaptada) ====================
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
            if (onRenderCallback) onRenderCallback();
            rafRef.current = null;
        });
    }, [isMaster, desenhando, telaParaMundo, onRenderCallback]);

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
                id: Date.now() + Math.random(), // id temporário
                x: x1,
                y: y1,
                larguraOriginal: largura,
                alturaOriginal: altura,
                escala: 1.0,
                tipo: 'nevoa'
            };
            adicionarCamada(novaCamada); // agora usa persistência e socket
        } else {
            console.log('[NuvemFOV] desenho ignorado (área muito pequena)');
        }

        setDesenhando(false);
        if (onRenderCallback) onRenderCallback();
    }, [isMaster, desenhando, inicioDesenho, fimDesenho, adicionarCamada, onRenderCallback]);

    const limparTudo = useCallback(() => {
        if (!isMaster) return;
        // Remover todas as camadas uma a uma
        camadasNevoa.forEach(camada => {
            removerCamada(camada.id);
        });
        // O estado será atualizado pelos efeitos de removerCamada
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

    // ==================== Utilitários de renderização ====================
    const registrarCallbackRender = useCallback((callback) => {
        // Já recebemos onRenderCallback via parâmetro, mas mantemos compatibilidade
        // Aqui poderíamos armazenar em uma ref, mas vamos simplesmente atualizar a referência externa.
        // Como onRenderCallback é passado na criação do hook, não precisamos desse método.
        // Porém, para não quebrar chamadas existentes, podemos manter.
        if (callback) {
            // Se quisermos, podemos atualizar uma ref interna, mas não é necessário.
            // Vamos ignorar, pois o callback já está sendo usado.
        }
    }, []);

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

    // ==================== Retorno ====================
    return {
        // Estados
        modoDesenho,
        camadasNevoa,
        desenhando,
        inicioDesenho,
        fimDesenho,
        // Funções de controle
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
        // Utilitários
        telaParaMundo,
        mundoParaTela: (mundoX, mundoY) => {
            const { zoom, position } = uiStateRef.current;
            return { x: mundoX * zoom + position.x, y: mundoY * zoom + position.y };
        },
        setUIStateRef,
        registrarCallbackRender,
        renderizarNevoa,
        getCamadaComInfo,
        encontrarCamadaNaPosicao,
        estaCoberto
    };
}