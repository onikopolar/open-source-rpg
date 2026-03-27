import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer } from "react";
import TokenModal from "../../components/TokenModal/TokenModal";
import { DragDropSystem } from "../../components/TokenModal/TokenModal";
import {
    GridContainer,
    BarraLateral,
    CanvasDesenho,
    desenharBordaDeArrasto,
    desenharFallbackToken,
    desenharSelecao,
    getCorSheet
} from "../../components/TabletopDesign";
import { ModalNevoa } from "../../components/Tabletop/ModalNevoa";
import { MenuContextoToken } from "../../components/Tabletop/MenuContextoToken";

import { WORLD_WIDTH, WORLD_HEIGHT, TOLERANCIA_CLIQUE, RENDER_INTERVAL, BASE_GRID_SIZE, GRID_CONFIGS, clamp } from "../../components/Tabletop/ConstantesMesa";
import { initialUIState, uiReducer } from "../../components/Tabletop/RedutorUI";
import { useMovimentoToken } from "../../components/Tabletop/useMovimentoToken";
import { useRedimensionamentoToken } from "../../components/Tabletop/useRedimensionamentoToken";
import { useEventosMouse } from "../../components/Tabletop/useEventosMouse";
import { useAtalhosTeclado } from "../../components/Tabletop/useAtalhosTeclado";
import { useSelecaoToken, calcularBoundingBoxGrupo } from "../../components/Tabletop/useSelecaoToken";
import { useRenderizacaoToken } from "../../components/Tabletop/useRenderizacaoToken";
import { trazerTokenParaFrente } from "../../components/Tabletop/UtilitariosToken";
import { useNuvemFOV } from "../../components/Tabletop/NuvemFOV";
import { useMouseTabletop } from "../../components/Tabletop/MouseTabletop";
import { useTabletopTokens } from "../../hooks/useTabletopTokens";
import socket from "../../utils/socket";

function TabletopGrid({ isMaster = true, sheetId = null }) {

    const [modalTokenAberto, setModalTokenAberto] = useState(false);
    const [menuNevoaAberto, setMenuNevoaAberto] = useState(false);
    const [menuNevoaPosicao, setMenuNevoaPosicao] = useState({ x: 0, y: 0 });

    const nevoa = useNuvemFOV();
    const tabletopId = "default";

    const {
        tokens,
        loading: tokensLoading,
        criarToken,
        atualizarToken,
        deletarToken
    } = useTabletopTokens();

    const [tokensLocal, setTokensLocal] = useState([]);
    const [arrastosRemotos, setArrastosRemotos] = useState({});

    useEffect(() => {
        setTokensLocal(tokens);
    }, [tokens]);

    const emitirEvento = useCallback((evento, dados) => {
        if (!socket || !socket.connected) return;
        socket.emit(`tabletop:${evento}`, dados);
    }, [socket]);

    const emitirSelecao = useCallback((tokenId) => {
        const nomeUsuario = isMaster ? 'Mestre' : `Player ${sheetId}`;
        const cor = getCorSheet(sheetId);
        emitirEvento('tokenSelected', {
            tabletopId, tokenId, userId: socket.id,
            nome: nomeUsuario, color: cor, sheetId
        });
    }, [socket, tabletopId, isMaster, sheetId, emitirEvento]);

    const emitirDeselecao = useCallback((tokenId) => {
        emitirEvento('tokenDeselected', { tabletopId, tokenId, userId: socket.id });
    }, [socket, tabletopId, emitirEvento]);

    const emitirDragStart = useCallback((tokenId) => {
        const nomeUsuario = isMaster ? 'Mestre' : `Player ${sheetId}`;
        emitirEvento('tokenDragStart', {
            tabletopId, tokenId, userId: socket.id,
            nome: nomeUsuario, sheetId
        });
    }, [socket, tabletopId, isMaster, sheetId, emitirEvento]);

    const emitirDragEnd = useCallback((tokenId) => {
        emitirEvento('tokenDragEnd', { tabletopId, tokenId, userId: socket.id });
    }, [socket, tabletopId, emitirEvento]);

    useEffect(() => {
        if (!socket) return;

        if (!socket.connected) {
            socket.on('connect', () => {
                socket.emit('tabletop:join', { tabletopId });
            });
            return;
        }

        socket.emit('tabletop:join', { tabletopId });
    }, [tabletopId]);

    useEffect(() => {
        if (!socket) return;

        const handleTokenUpdated = (data) => {
            setTokensLocal(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
        };

        const handleTokenCreated = (data) => {
            setTokensLocal(prev => [...prev, data]);
        };

        const handleTokenDeleted = (data) => {
            setTokensLocal(prev => prev.filter(t => t.id !== data.id));
        };

        const handleTokenDragStart = (data) => {
            if (data.userId === socket.id) return;
            setArrastosRemotos(prev => ({
                ...prev,
                [data.tokenId]: {
                    nome: data.nome,
                    cor: getCorSheet(data.sheetId),
                    userId: data.userId
                }
            }));
        };

        const handleTokenDragEnd = (data) => {
            if (data.userId === socket.id) return;
            setArrastosRemotos(prev => {
                const newState = { ...prev };
                delete newState[data.tokenId];
                return newState;
            });
        };

        socket.on('tabletop:tokenUpdated', handleTokenUpdated);
        socket.on('tabletop:tokenCreated', handleTokenCreated);
        socket.on('tabletop:tokenDeleted', handleTokenDeleted);
        socket.on('tabletop:tokenDragStart', handleTokenDragStart);
        socket.on('tabletop:tokenDragEnd', handleTokenDragEnd);

        return () => {
            socket.off('tabletop:tokenUpdated', handleTokenUpdated);
            socket.off('tabletop:tokenCreated', handleTokenCreated);
            socket.off('tabletop:tokenDeleted', handleTokenDeleted);
            socket.off('tabletop:tokenDragStart', handleTokenDragStart);
            socket.off('tabletop:tokenDragEnd', handleTokenDragEnd);
        };
    }, [socket]);

    const [estadoUI, despacharUI] = useReducer(uiReducer, initialUIState);

    const estaArrastandoRef = useRef(false);
    const arrastoEmProgressoRef = useRef(false);
    const redimensionandoRef = useRef(false);
    const ignoreMouseTimeoutRef = useRef(null);
    const teveMovimentoRef = useRef(false);
    const isRightClickDragRef = useRef(false);

    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const menuRef = useRef(null);

    const cacheImagens = useRef(new Map());
    const inicioArrastoRef = useRef({ x: 0, y: 0 });
    const frameAnimacaoRef = useRef(null);

    const renderAgendadoRef = useRef(false);
    const ultimoRenderTimeRef = useRef(0);
    const contextRef = useRef(null);
    const renderCallbackRef = useRef(null);

    const { processarArrastoToken } = useMovimentoToken();
    const { processarRedimensionamento, resizeStartStateRef } = useRedimensionamentoToken();

    const limitarPosicaoMapa = useCallback((novaX, novaY) => {
        if (!containerRef.current) return { x: novaX, y: novaY };

        const rect = containerRef.current.getBoundingClientRect();
        const mundoLarguraZoom = WORLD_WIDTH * estadoUI.zoom;
        const mundoAlturaZoom = WORLD_HEIGHT * estadoUI.zoom;

        const minX = rect.width - mundoLarguraZoom;
        const maxX = 0;
        const minY = rect.height - mundoAlturaZoom;
        const maxY = 0;

        const xLimitado = clamp(novaX, minX, maxX);
        const yLimitado = clamp(novaY, minY, maxY);

        return {
            x: xLimitado,
            y: yLimitado
        };
    }, [estadoUI.zoom]);

    const telaParaMundo = useCallback((mouseX, mouseY) => {
        const x = (mouseX - estadoUI.position.x) / estadoUI.zoom;
        const y = (mouseY - estadoUI.position.y) / estadoUI.zoom;
        return { x, y };
    }, [estadoUI.position, estadoUI.zoom]);

    const estaDentroDoElemento = useCallback((mouseX, mouseY, elemX, elemY, largura, altura) => {
        return mouseX >= elemX - TOLERANCIA_CLIQUE &&
            mouseX <= elemX + largura + TOLERANCIA_CLIQUE &&
            mouseY >= elemY - TOLERANCIA_CLIQUE &&
            mouseY <= elemY + altura + TOLERANCIA_CLIQUE;
    }, []);

    const gradesVisiveis = useMemo(() => {
        return GRID_CONFIGS
            .filter(config => estadoUI.zoom >= config.zoomThreshold)
            .map((config, index, array) => {
                const strokeWidth = Math.max(0.5, 1 / estadoUI.zoom);
                const baseSize = BASE_GRID_SIZE * config.sizeMultiplier;
                let alpha = config.alpha;

                if (index > 0) {
                    const configAnterior = array[index - 1];
                    const rangeTransicao = (config.zoomThreshold - configAnterior.zoomThreshold) * 0.2;
                    const inicioFade = config.zoomThreshold - rangeTransicao;

                    if (estadoUI.zoom > inicioFade && estadoUI.zoom < config.zoomThreshold + rangeTransicao) {
                        const progresso = (estadoUI.zoom - inicioFade) / (rangeTransicao * 2);
                        alpha = config.alpha * Math.min(1, Math.max(0, progresso));
                    }
                }

                return { size: baseSize, alpha, strokeWidth };
            });
    }, [estadoUI.zoom]);

    const tokensInfo = useMemo(() => {
        return tokensLocal.map((token, indice) => {
            const larguraOriginal = token.larguraOriginal || 50;
            const alturaOriginal = token.alturaOriginal || 50;
            const escala = token.escala || 1;

            const posicaoTela = {
                x: (token.x * estadoUI.zoom) + estadoUI.position.x,
                y: (token.y * estadoUI.zoom) + estadoUI.position.y
            };

            const larguraMundo = larguraOriginal * escala;
            const alturaMundo = alturaOriginal * escala;
            const larguraTela = larguraMundo * estadoUI.zoom;
            const alturaTela = alturaMundo * estadoUI.zoom;

            const estaSelecionado = estadoUI.tokenSelecionado === indice ||
                estadoUI.tokensSelecionados.includes(indice);
            const estaBloqueado = estadoUI.tokensBloqueados[token.id] === true;

            return {
                ...token,
                indice,
                posicaoTela,
                larguraOriginal,
                alturaOriginal,
                tamanhoTela: {
                    larguraOriginal,
                    alturaOriginal,
                    larguraMundo,
                    alturaMundo,
                    larguraTela,
                    alturaTela
                },
                oculto: estadoUI.visibilidadeTokens[token.id] === true,
                bloqueado: estaBloqueado,
                estaSelecionado,
                tipo: 'token'
            };
        });
    }, [tokensLocal, estadoUI.zoom, estadoUI.position, estadoUI.visibilidadeTokens,
        estadoUI.tokensBloqueados, estadoUI.tokenSelecionado, estadoUI.tokensSelecionados]);

    const camadasInfo = useMemo(() => {
        return nevoa.camadasNevoa.map((camada, indice) => {
            const larguraMundo = camada.larguraOriginal * camada.escala;
            const alturaMundo = camada.alturaOriginal * camada.escala;

            const posicaoTela = {
                x: (camada.x * estadoUI.zoom) + estadoUI.position.x,
                y: (camada.y * estadoUI.zoom) + estadoUI.position.y
            };

            const larguraTela = larguraMundo * estadoUI.zoom;
            const alturaTela = alturaMundo * estadoUI.zoom;

            return {
                ...camada,
                indice,
                posicaoTela,
                tamanhoTela: {
                    larguraOriginal: camada.larguraOriginal,
                    alturaOriginal: camada.alturaOriginal,
                    larguraMundo,
                    alturaMundo,
                    larguraTela,
                    alturaTela
                },
                bloqueado: false,
                tipo: 'nevoa'
            };
        });
    }, [nevoa.camadasNevoa, estadoUI.zoom, estadoUI.position]);

    const todosItens = useMemo(() => {
        return [...tokensInfo, ...camadasInfo];
    }, [tokensInfo, camadasInfo]);

    const {
        verificarSeMouseSobreToken,
        verificarSeMousePodeRedimensionar,
        tokenEstaNaAreaSelecao
    } = useSelecaoToken(tokensLocal, tokensInfo, estadoUI, estaDentroDoElemento);

    const pegarContextoCanvas = useCallback(() => {
        if (contextRef.current) return contextRef.current;

        const canvas = canvasRef.current;
        if (!canvas) return null;

        contextRef.current = canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true
        });

        return contextRef.current;
    }, []);

    const desenharGrade = useCallback(() => {
        const contexto = pegarContextoCanvas();
        if (!contexto) return;

        contexto.save();
        contexto.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        contexto.translate(estadoUI.position.x, estadoUI.position.y);
        contexto.scale(estadoUI.zoom, estadoUI.zoom);

        for (const grade of gradesVisiveis) {
            contexto.strokeStyle = `rgba(255, 255, 255, ${grade.alpha})`;
            contexto.lineWidth = grade.strokeWidth;

            for (let x = 0; x <= WORLD_WIDTH; x += grade.size) {
                contexto.beginPath();
                contexto.moveTo(x, 0);
                contexto.lineTo(x, WORLD_HEIGHT);
                contexto.stroke();
            }

            for (let y = 0; y <= WORLD_HEIGHT; y += grade.size) {
                contexto.beginPath();
                contexto.moveTo(0, y);
                contexto.lineTo(WORLD_WIDTH, y);
                contexto.stroke();
            }
        }

        contexto.restore();
    }, [estadoUI.zoom, estadoUI.position, gradesVisiveis, pegarContextoCanvas]);

    const agendarRender = useCallback(() => {
        const agora = Date.now();

        if (agora - ultimoRenderTimeRef.current < RENDER_INTERVAL) {
            if (!renderAgendadoRef.current) {
                renderAgendadoRef.current = true;
                requestAnimationFrame(() => {
                    renderAgendadoRef.current = false;
                    ultimoRenderTimeRef.current = Date.now();
                    if (renderCallbackRef.current) {
                        renderCallbackRef.current();
                    }
                });
            }
            return;
        }

        ultimoRenderTimeRef.current = agora;
        if (renderCallbackRef.current) {
            renderCallbackRef.current();
        }
    }, []);

    const { drawTokenWithCache } = useRenderizacaoToken(
        estadoUI,
        cacheImagens,
        pegarContextoCanvas,
        agendarRender,
        desenharFallbackToken,
        desenharBordaDeArrasto,
        desenharSelecao
    );

    useEffect(() => {
        nevoa.registrarCallbackRender(agendarRender);
        nevoa.setUIStateRef(estadoUI.zoom, estadoUI.position);
    }, [nevoa, agendarRender, estadoUI.zoom, estadoUI.position]);

    const desenharArrastoProprio = useCallback((contexto) => {
        if (estadoUI.tokenSendoArrastado) {
            const itemInfo = todosItens[estadoUI.tokenSendoArrastado.indice];
            if (itemInfo) {
                const nome = itemInfo.tipo === 'token' ? (itemInfo.nome || "Token") : "Névoa";
                const minhaCor = getCorSheet(sheetId);
                desenharBordaDeArrasto(
                    contexto,
                    itemInfo.posicaoTela.x,
                    itemInfo.posicaoTela.y,
                    itemInfo.tamanhoTela.larguraTela,
                    itemInfo.tamanhoTela.alturaTela,
                    nome,
                    minhaCor
                );
            }
        }

        if (estadoUI.camadaSendoArrastada) {
            const itemInfo = todosItens[tokensInfo.length + estadoUI.camadaSendoArrastada.indice];
            if (itemInfo) {
                desenharBordaDeArrasto(
                    contexto,
                    itemInfo.posicaoTela.x,
                    itemInfo.posicaoTela.y,
                    itemInfo.tamanhoTela.larguraTela,
                    itemInfo.tamanhoTela.alturaTela,
                    "Névoa"
                );
            }
        }
    }, [estadoUI, todosItens, tokensInfo.length, sheetId]);

    const desenharSelecoes = useCallback((contexto) => {
        if (estadoUI.tokensSelecionados.length > 1) {
            const itensSelecionados = estadoUI.tokensSelecionados
                .map(indice => todosItens[indice])
                .filter(item => item && !item.bloqueado && item.tipo === 'token');

            if (itensSelecionados.length > 0) {
                const boundingBox = calcularBoundingBoxGrupo(itensSelecionados);
                desenharSelecao(contexto, boundingBox, estadoUI.zoom, itensSelecionados.length, true);
            }
        }

        if (estadoUI.tokenSelecionado !== null && !estadoUI.tokenSendoArrastado && !estadoUI.camadaSendoArrastada) {
            const itemInfo = todosItens[estadoUI.tokenSelecionado];
            if (itemInfo && !itemInfo.bloqueado && itemInfo.tipo === 'token') {
                const isPartOfGroup = estadoUI.tokensSelecionados.length > 1;
                if (!isPartOfGroup) {
                    const boundingBox = {
                        x: itemInfo.posicaoTela.x,
                        y: itemInfo.posicaoTela.y,
                        largura: itemInfo.tamanhoTela.larguraTela,
                        altura: itemInfo.tamanhoTela.alturaTela
                    };
                    desenharSelecao(contexto, boundingBox, estadoUI.zoom, 1, true);
                }
            }
        }

        if (estadoUI.camadasSelecionadas.length > 1) {
            const itensSelecionados = estadoUI.camadasSelecionadas
                .map(indice => todosItens[tokensInfo.length + indice])
                .filter(item => item && item.tipo === 'nevoa');

            if (itensSelecionados.length > 0) {
                const boundingBox = calcularBoundingBoxGrupo(itensSelecionados);
                desenharSelecao(contexto, boundingBox, estadoUI.zoom, itensSelecionados.length, true);
            }
        }

        if (estadoUI.camadaSelecionada !== null && !estadoUI.camadaSendoArrastada && !estadoUI.tokenSendoArrastado) {
            const itemInfo = todosItens[tokensInfo.length + estadoUI.camadaSelecionada];
            if (itemInfo && itemInfo.tipo === 'nevoa') {
                const boundingBox = {
                    x: itemInfo.posicaoTela.x,
                    y: itemInfo.posicaoTela.y,
                    largura: itemInfo.tamanhoTela.larguraTela,
                    altura: itemInfo.tamanhoTela.alturaTela
                };
                desenharSelecao(contexto, boundingBox, estadoUI.zoom, 1, true);
            }
        }

        if (estadoUI.areaSelecao.ativo) {
            const boundingBox = {
                x: Math.min(estadoUI.areaSelecao.inicioX, estadoUI.areaSelecao.fimX),
                y: Math.min(estadoUI.areaSelecao.inicioY, estadoUI.areaSelecao.fimY),
                largura: Math.abs(estadoUI.areaSelecao.fimX - estadoUI.areaSelecao.inicioX),
                altura: Math.abs(estadoUI.areaSelecao.fimY - estadoUI.areaSelecao.inicioY)
            };
            desenharSelecao(contexto, boundingBox, estadoUI.zoom, 1, false);
        }
    }, [estadoUI, todosItens, tokensInfo.length]);

    const desenharArrastoRemoto = useCallback((contexto) => {
        if (arrastosRemotos && Object.keys(arrastosRemotos).length > 0) {
            Object.entries(arrastosRemotos).forEach(([tokenId, arrasto]) => {
                const tokenIndex = tokensLocal.findIndex(t => t.id === tokenId);
                if (tokenIndex === -1) return;

                const tokenInfo = todosItens[tokenIndex];
                if (!tokenInfo || tokenInfo.bloqueado) return;

                desenharBordaDeArrasto(
                    contexto,
                    tokenInfo.posicaoTela.x,
                    tokenInfo.posicaoTela.y,
                    tokenInfo.tamanhoTela.larguraTela,
                    tokenInfo.tamanhoTela.alturaTela,
                    arrasto.nome,
                    arrasto.cor
                );
            });
        }
    }, [arrastosRemotos, tokensLocal, todosItens]);

    const renderizarTudo = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        const contexto = pegarContextoCanvas();
        if (!contexto) return;

        contexto.clearRect(0, 0, canvas.width, canvas.height);
        contexto.setTransform(1, 0, 0, 1, 0, 0);

        desenharGrade();

        for (let i = 0; i < todosItens.length; i++) {
            const item = todosItens[i];
            if (item.tipo === 'token') {
                drawTokenWithCache(item, item.indice, contexto);
            }
        }

        nevoa.setUIStateRef(estadoUI.zoom, estadoUI.position);
        nevoa.renderizarNevoa(contexto, estadoUI.zoom, estadoUI.position);

        desenharArrastoProprio(contexto);
        desenharSelecoes(contexto);
        desenharArrastoRemoto(contexto);

    }, [todosItens, tokensInfo.length, tokensLocal, arrastosRemotos, desenharGrade, drawTokenWithCache, pegarContextoCanvas,
        estadoUI, nevoa, desenharArrastoProprio, desenharSelecoes, desenharArrastoRemoto]);

    useEffect(() => {
        renderCallbackRef.current = renderizarTudo;
    }, [renderizarTudo]);

    const { handleWheel, handleDragOver } = useEventosMouse(estadoUI, despacharUI, containerRef, inicioArrastoRef, limitarPosicaoMapa);

    const salvarToken = useCallback((tokenId, dados) => {
        atualizarToken(tokenId, dados);
        if (socket?.connected) {
            socket.emit('tabletop:tokenMoved', { tabletopId, id: tokenId, ...dados });
            emitirDragEnd(tokenId);
        }
    }, [atualizarToken, socket, tabletopId, emitirDragEnd]);

    const finalizarArrasto = useCallback(() => {
        if (arrastoEmProgressoRef.current && (estadoUI.tokenSendoArrastado || estadoUI.camadaSendoArrastada || estadoUI.tokensSelecionados.length > 0)) {

            if (estadoUI.tokenSendoArrastado) {
                const tokenId = estadoUI.tokenSendoArrastado.token.id;
                const tokenData = tokensLocal.find(t => t.id === tokenId);
                if (tokenData) {
                    // EMITIR DRAG END IMEDIATAMENTE - remove a borda no outro cliente
                    emitirDragEnd(tokenId);
                    // SALVAR NO BANCO (operação assíncrona)
                    salvarToken(tokenId, { x: tokenData.x, y: tokenData.y });
                }
            }

            despacharUI({
                type: 'SET_FEEDBACK',
                payload: {
                    message: estadoUI.tokensSelecionados.length > 1 ? 'Itens movidos' : 'Item movido',
                    type: 'success'
                }
            });

            if (teveMovimentoRef.current) {
                despacharUI({ type: 'SELECT_TOKEN', payload: null });
                despacharUI({ type: 'SELECT_CAMADA', payload: null });
            }

            arrastoEmProgressoRef.current = false;
            teveMovimentoRef.current = false;
        }
    }, [tokensLocal, estadoUI, salvarToken, emitirDragEnd, despacharUI]);

    const finalizarRedimensionamento = useCallback(() => {
        if (redimensionandoRef.current) {
            if (estadoUI.tokenRedimensionando) {
                const tokenId = estadoUI.tokenRedimensionando.token.id;
                const tokenData = tokensLocal.find(t => t.id === tokenId);
                if (tokenData) {
                    salvarToken(tokenId, {
                        escala: tokenData.escala,
                        x: tokenData.x,
                        y: tokenData.y
                    });
                }
            }
            redimensionandoRef.current = false;
            resizeStartStateRef.current = null;
        }
    }, [tokensLocal, estadoUI, salvarToken, resizeStartStateRef]);

    const deletarCamada = useCallback((camadaId) => {
        nevoa.deletarCamada(camadaId);
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });
    }, [nevoa, despacharUI]);

    const { handleMouseDown, handleMouseMove, handleMouseUp } = useMouseTabletop({
        containerRef,
        dragStartRef: inicioArrastoRef,
        resizeStartStateRef,
        isDraggingRef: estaArrastandoRef,
        dragInProgressRef: arrastoEmProgressoRef,
        resizeInProgressRef: redimensionandoRef,
        teveMovimentoRef,
        isRightClickDragRef,
        rafRef: frameAnimacaoRef,
        uiState: estadoUI,
        uiDispatch: despacharUI,
        tokensState: tokensLocal,
        tokensComInfo: tokensInfo,
        camadasComInfo: camadasInfo,
        converterMouseParaMundo: telaParaMundo,
        verificarSeMouseSobreToken,
        verificarSeMousePodeRedimensionar,
        tokenEstaNaAreaSelecao,
        restringirPosicao: limitarPosicaoMapa,
        processarArrastoToken,
        processarRedimensionamento,
        setStateDirect: setTokensLocal,
        atualizarToken: atualizarToken,
        socket: socket,
        tabletopId: tabletopId,
        emitirSelecao: emitirSelecao,
        emitirDragStart: emitirDragStart,
        fov: nevoa,
        trazerTokenParaFrente,
        finalizarArrasto,
        finalizarRedimensionamento
    });

    const handleUndo = useCallback(() => {
        despacharUI({
            type: 'SET_FEEDBACK',
            payload: { message: 'Histórico não disponível em modo online', type: 'warning' }
        });
        setTimeout(() => despacharUI({ type: 'RESET_UI_FEEDBACK' }), 1000);
    }, [despacharUI]);

    const handleRedo = useCallback(() => {
        despacharUI({
            type: 'SET_FEEDBACK',
            payload: { message: 'Histórico não disponível em modo online', type: 'warning' }
        });
        setTimeout(() => despacharUI({ type: 'RESET_UI_FEEDBACK' }), 1000);
    }, [despacharUI]);

    useAtalhosTeclado(handleUndo, handleRedo);

    useEffect(() => {
        pegarContextoCanvas();
        return () => {
            contextRef.current = null;
        };
    }, [pegarContextoCanvas]);

    useEffect(() => {
        agendarRender();
    }, [todosItens, estadoUI.tokenSendoArrastado, estadoUI.camadaSendoArrastada,
        estadoUI.tokenSelecionado, estadoUI.camadaSelecionada, estadoUI.zoom, estadoUI.position,
        estadoUI.areaSelecao, estadoUI.tokensSelecionados, estadoUI.camadasSelecionadas,
        estadoUI.visibilidadeTokens, arrastosRemotos, agendarRender]);

    useEffect(() => {
        if (estadoUI.ui.mostrarFeedback) {
            const timer = setTimeout(() => {
                despacharUI({ type: 'RESET_UI_FEEDBACK' });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [estadoUI.ui.mostrarFeedback, despacharUI]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('contextmenu', (e) => e.preventDefault());

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        if (!estadoUI.menuContexto.aberto) return;

        const handleClickFora = (event) => {
            if (event.button === 2) return;
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                despacharUI({ type: 'CLOSE_CONTEXT_MENU' });
            }
        };

        document.addEventListener('mousedown', handleClickFora);
        return () => document.removeEventListener('mousedown', handleClickFora);
    }, [estadoUI.menuContexto.aberto, despacharUI]);

    useEffect(() => {
        const bloquearMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', bloquearMenu);
        return () => document.removeEventListener('contextmenu', bloquearMenu);
    }, []);

    useEffect(() => {
        const idsTokens = new Set(tokensLocal.map(t => t.id));
        for (const [id] of cacheImagens.current.entries()) {
            if (!idsTokens.has(id)) {
                cacheImagens.current.delete(id);
            }
        }
    }, [tokensLocal]);

    useEffect(() => {
        if (!isMaster) return;

        DragDropSystem.register('TabletopGrid', containerRef.current, async (dados, event) => {
            if (dados.tipo !== 'token') {
                return;
            }

            setModalTokenAberto(false);

            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const mundo = telaParaMundo(mouseX, mouseY);

            const imageUrlParaSalvar = dados.imageUrl || dados.imagemUrl || null;
            const imageBase64ParaSalvar = dados.imageBase64 || dados.imagemBase64 || null;

            const novoToken = {
                tokenId: `${dados.id}-${Date.now()}`,
                nome: dados.nome || "Token",
                x: mundo.x - ((dados.larguraOriginal || 50) / 2),
                y: mundo.y - ((dados.alturaOriginal || 50) / 2),
                escala: 1.0,
                larguraOriginal: dados.larguraOriginal || 50,
                alturaOriginal: dados.alturaOriginal || 50,
                invertido: false,
                oculto: false,
                bloqueado: false,
                imageUrl: imageUrlParaSalvar,
                imageBase64: imageBase64ParaSalvar,
                mimeType: dados.mimeType || null
            };

            const tokenCriado = await criarToken(novoToken);

            if (tokenCriado && socket && socket.connected) {
                socket.emit('tabletop:tokenCreated', {
                    tabletopId,
                    ...tokenCriado
                });
            }
        });

        return () => {
            DragDropSystem.unregister('TabletopGrid');
        };
    }, [isMaster, criarToken, telaParaMundo, tabletopId]);

    useEffect(() => {
        return () => {
            if (ignoreMouseTimeoutRef.current) {
                clearTimeout(ignoreMouseTimeoutRef.current);
            }
        };
    }, []);

    const handleDeleteToken = useCallback((tokenId) => {
        deletarToken(tokenId);
        if (socket && socket.connected) {
            socket.emit('tabletop:tokenDeleted', { tabletopId, id: tokenId });
        }
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });
    }, [deletarToken, tabletopId, despacharUI]);

    const handleToggleVisibility = useCallback((tokenId) => {
        if (!isMaster) return;

        const token = tokensLocal.find(t => t.id === tokenId);
        if (token) {
            const novoEstado = !token.oculto;
            atualizarToken(tokenId, { oculto: novoEstado });
            if (socket && socket.connected) {
                socket.emit('tabletop:tokenVisibilityChanged', {
                    tabletopId,
                    id: tokenId,
                    oculto: novoEstado
                });
            }
        }
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });
    }, [isMaster, tokensLocal, atualizarToken, tabletopId, despacharUI]);

    const handleToggleLock = useCallback((tokenId) => {
        if (!isMaster) return;

        const token = tokensLocal.find(t => t.id === tokenId);
        if (token) {
            const estaBloqueado = !token.bloqueado;
            atualizarToken(tokenId, { bloqueado: estaBloqueado });
            if (socket && socket.connected) {
                socket.emit('tabletop:tokenLockChanged', {
                    tabletopId,
                    id: tokenId,
                    bloqueado: estaBloqueado
                });
            }

            despacharUI({
                type: 'SET_FEEDBACK',
                payload: {
                    message: estaBloqueado ? 'Token bloqueado' : 'Token desbloqueado',
                    type: estaBloqueado ? 'warning' : 'success'
                }
            });
        }
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });
    }, [isMaster, tokensLocal, atualizarToken, tabletopId, despacharUI]);

    const handleToggleCamadaLock = useCallback((camadaId) => {
        if (!isMaster) return;
        const camada = nevoa.camadasNevoa.find(c => c.id === camadaId);
        if (!camada) return;

        const estaBloqueado = estadoUI.camadasBloqueadas?.[camadaId] === true;

        despacharUI({ type: 'TOGGLE_CAMADA_LOCK', payload: camadaId });
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });

        despacharUI({
            type: 'SET_FEEDBACK',
            payload: {
                message: estaBloqueado ? 'Camada desbloqueada' : 'Camada bloqueada',
                type: estaBloqueado ? 'success' : 'warning'
            }
        });
    }, [isMaster, estadoUI.camadasBloqueadas, despacharUI, nevoa.camadasNevoa]);

    const handleInverterToken = useCallback((tokenId) => {
        const token = tokensLocal.find(t => t.id === tokenId);
        if (token) {
            const novoEstado = !token.invertido;
            atualizarToken(tokenId, { invertido: novoEstado });
            if (socket && socket.connected) {
                socket.emit('tabletop:tokenInverted', {
                    tabletopId,
                    id: tokenId,
                    invertido: novoEstado
                });
            }
        }
        despacharUI({ type: 'CLOSE_CONTEXT_MENU' });

        despacharUI({
            type: 'SET_FEEDBACK',
            payload: {
                message: token?.invertido ? 'Token invertido' : 'Token normal',
                type: 'success'
            }
        });
    }, [tokensLocal, atualizarToken, tabletopId, despacharUI]);

    return (
        <>
            <GridContainer
                containerRef={containerRef}
                isDragging={estadoUI.ui.isDragging}
                onDragOver={handleDragOver}
                sx={{
                    width: '100%',
                    height: '100%',
                }}
            >
                {isMaster ? (
                    <>
                        <BarraLateral
                            onAbrirModal={() => setModalTokenAberto(true)}
                            onAbrirModalNevoa={(event) => {
                                const rect = event.currentTarget.getBoundingClientRect();
                                setMenuNevoaPosicao({ x: rect.right, y: rect.top });
                                setMenuNevoaAberto(true);
                            }}
                        />
                        <TokenModal
                            open={modalTokenAberto}
                            onClose={() => setModalTokenAberto(false)}
                        />
                    </>
                ) : null}

                <CanvasDesenho canvasRef={canvasRef} />
            </GridContainer>

            <MenuContextoToken
                ref={menuRef}
                aberto={estadoUI.menuContexto.aberto}
                x={estadoUI.menuContexto.x}
                y={estadoUI.menuContexto.y}
                tokenNome={estadoUI.menuContexto.tipo === 'nevoa' ? 'Camada de Névoa' : (estadoUI.menuContexto.token?.nome || 'Token')}
                tokenId={estadoUI.menuContexto.tipo === 'nevoa' ? estadoUI.menuContexto.camadaId : estadoUI.menuContexto.tokenId}
                estaOculto={estadoUI.menuContexto.tipo === 'nevoa' ? false : estadoUI.visibilidadeTokens[estadoUI.menuContexto.tokenId] === true}
                estaBloqueado={
                    estadoUI.menuContexto.tipo === 'nevoa'
                        ? estadoUI.camadasBloqueadas?.[estadoUI.menuContexto.camadaId] === true
                        : estadoUI.tokensBloqueados[estadoUI.menuContexto.tokenId] === true
                }
                tipo={estadoUI.menuContexto.tipo || 'token'}
                onFechar={() => despacharUI({ type: 'CLOSE_CONTEXT_MENU' })}
                onDeletar={() => {
                    if (estadoUI.menuContexto.tipo === 'nevoa') {
                        if (isMaster) deletarCamada(estadoUI.menuContexto.camadaId);
                    } else {
                        handleDeleteToken(estadoUI.menuContexto.tokenId);
                    }
                }}
                onOcultar={isMaster ? () => {
                    handleToggleVisibility(estadoUI.menuContexto.tokenId);
                } : undefined}
                onBloquear={isMaster ? () => {
                    if (estadoUI.menuContexto.tipo === 'nevoa') {
                        handleToggleCamadaLock(estadoUI.menuContexto.camadaId);
                    } else {
                        handleToggleLock(estadoUI.menuContexto.tokenId);
                    }
                } : undefined}
                onInverter={() => {
                    handleInverterToken(estadoUI.menuContexto.tokenId);
                }}
            />

            {isMaster && (
                <ModalNevoa
                    aberto={menuNevoaAberto}
                    onClose={() => setMenuNevoaAberto(false)}
                    posicao={menuNevoaPosicao}
                    modoDesenho={nevoa.modoDesenho}
                    ativarModoDesenho={nevoa.ativarModoDesenho}
                    desativarModoDesenho={nevoa.desativarModoDesenho}
                    limparTudo={nevoa.limparTudo}
                    desfazer={nevoa.desfazer}
                />
            )}
        </>
    );
}

export default TabletopGrid;