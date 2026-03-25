// pages/testetabletop/tabletopgrid.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer } from "react";
import TokenModal from "../../components/TokenModal/TokenModal";
import { DragDropSystem } from "../../components/TokenModal/TokenModal";
import {
    GridContainer,
    BarraLateral,
    CanvasDesenho,
    desenharBordaDeArrasto,
    desenharFallbackToken,
    desenharSelecao
} from "../../components/TabletopDesign";
import { ModalNevoa } from "../../components/Tabletop/ModalNevoa";
import { MenuContextoToken } from "../../components/Tabletop/MenuContextoToken";

// Importa as paradas da mesa
import { WORLD_WIDTH, WORLD_HEIGHT, TOLERANCIA_CLIQUE, RENDER_INTERVAL, BASE_GRID_SIZE, GRID_CONFIGS, clamp } from "../../components/Tabletop/ConstantesMesa";
import { useDesfazerRefazer } from "../../components/Tabletop/useDesfazerRefazer";
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

// Componente principal da mesa
function TabletopGrid() {

    const [modalOpen, setModalOpen] = useState(false);
    const [menuNevoaAberto, setMenuNevoaAberto] = useState(false);
    const [menuNevoaPosicao, setMenuNevoaPosicao] = useState({ x: 0, y: 0 });

    // Hook da névoa
    const fov = useNuvemFOV();

    // Historico de ações (ctrl+z)
    const {
        state: tokensState,
        push: pushTokens,
        undo,
        redo,
        canUndo,
        canRedo,
        setStateDirect
    } = useDesfazerRefazer([]);

    const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);

    // Refs pra caramba
    const isDraggingRef = useRef(false);
    const dragInProgressRef = useRef(false);
    const resizeInProgressRef = useRef(false);
    const ignoreMouseTimeoutRef = useRef(null);
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const imageCache = useRef(new Map());
    const dragStartRef = useRef({ x: 0, y: 0 });
    const menuRef = useRef(null);
    const rafRef = useRef(null);
    const renderScheduled = useRef(false);
    const lastRenderTime = useRef(0);
    const contextRef = useRef(null);
    const renderGridToCanvasRef = useRef(null);
    const teveMovimentoRef = useRef(false);
    const isRightClickDragRef = useRef(false);

    // Hooks de funcionalidades
    const { processarArrastoToken } = useMovimentoToken();
    const { processarRedimensionamento, resizeStartStateRef } = useRedimensionamentoToken();

    // Limita o movimento do mapa
    const restringirPosicao = useCallback((newX, newY) => {
        if (!containerRef.current) return { x: newX, y: newY };

        const rect = containerRef.current.getBoundingClientRect();
        const worldWidthScaled = WORLD_WIDTH * uiState.zoom;
        const worldHeightScaled = WORLD_HEIGHT * uiState.zoom;

        return {
            x: clamp(newX, rect.width - worldWidthScaled, 0),
            y: clamp(newY, rect.height - worldHeightScaled, 0)
        };
    }, [uiState.zoom]);

    // Converte pixel da tela pra coordenada do mundo
    const converterMouseParaMundo = useCallback((mouseX, mouseY) => {
        return {
            mundoX: (mouseX - uiState.position.x) / uiState.zoom,
            mundoY: (mouseY - uiState.position.y) / uiState.zoom
        };
    }, [uiState.position, uiState.zoom]);

    // Ve se o mouse ta em cima de um elemento
    const calcularSeMouseEstaDentro = useCallback((mouseX, mouseY, elemX, elemY, largura, altura) => {
        const TOLERANCIA = TOLERANCIA_CLIQUE;

        return mouseX >= elemX - TOLERANCIA &&
            mouseX <= elemX + largura + TOLERANCIA &&
            mouseY >= elemY - TOLERANCIA &&
            mouseY <= elemY + altura + TOLERANCIA;
    }, []);

    // Filtra as grades baseado no zoom
    const visibleGrids = useMemo(() => {
        return GRID_CONFIGS
            .filter(config => uiState.zoom >= config.zoomThreshold)
            .map((config, index, array) => {
                const strokeWidth = Math.max(0.5, 1 / uiState.zoom);
                const baseSize = BASE_GRID_SIZE * config.sizeMultiplier;
                let alpha = config.alpha;

                // Transicao suave entre grades
                if (index > 0) {
                    const prevConfig = array[index - 1];
                    const transitionRange = (config.zoomThreshold - prevConfig.zoomThreshold) * 0.2;
                    const fadeStart = config.zoomThreshold - transitionRange;

                    if (uiState.zoom > fadeStart && uiState.zoom < config.zoomThreshold + transitionRange) {
                        const progress = (uiState.zoom - fadeStart) / (transitionRange * 2);
                        alpha = config.alpha * Math.min(1, Math.max(0, progress));
                    }
                }

                return { size: baseSize, alpha, strokeWidth };
            });
    }, [uiState.zoom]);

    // Prepara os tokens com informacoes de tela
    const tokensComInfo = useMemo(() => {
        return tokensState.map((token, indice) => {
            const larguraOriginal = token.larguraOriginal || 50;
            const alturaOriginal = token.alturaOriginal || 50;
            const escala = token.escala || 1;

            const posicaoTela = {
                x: (token.x * uiState.zoom) + uiState.position.x,
                y: (token.y * uiState.zoom) + uiState.position.y
            };

            const larguraMundo = larguraOriginal * escala;
            const alturaMundo = alturaOriginal * escala;

            const larguraTela = larguraMundo * uiState.zoom;
            const alturaTela = alturaMundo * uiState.zoom;

            const estaSelecionado = uiState.tokenSelecionado === indice ||
                uiState.tokensSelecionados.includes(indice);
            const estaBloqueado = uiState.tokensBloqueados[token.id] === true;

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
                oculto: uiState.visibilidadeTokens[token.id] === true,
                bloqueado: estaBloqueado,
                estaSelecionado,
                tipo: 'token'
            };
        });
    }, [tokensState, uiState.zoom, uiState.position, uiState.visibilidadeTokens,
        uiState.tokensBloqueados, uiState.tokenSelecionado, uiState.tokensSelecionados]);

    // Prepara as camadas de nevoa com informacoes de tela (mesma estrutura dos tokens)
    const camadasComInfo = useMemo(() => {
        return fov.camadasNevoa.map((camada, indice) => {
            const larguraMundo = camada.larguraOriginal * camada.escala;
            const alturaMundo = camada.alturaOriginal * camada.escala;

            const posicaoTela = {
                x: (camada.x * uiState.zoom) + uiState.position.x,
                y: (camada.y * uiState.zoom) + uiState.position.y
            };

            const larguraTela = larguraMundo * uiState.zoom;
            const alturaTela = alturaMundo * uiState.zoom;

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
    }, [fov.camadasNevoa, uiState.zoom, uiState.position]);

    // TODOS os itens (tokens + névoa) unificados para seleção e arrasto
    const todosItens = useMemo(() => {
        return [...tokensComInfo, ...camadasComInfo];
    }, [tokensComInfo, camadasComInfo]);

    // Hook de selecao
    const { verificarSeMouseSobreToken, verificarSeMousePodeRedimensionar, tokenEstaNaAreaSelecao } =
        useSelecaoToken(tokensState, tokensComInfo, uiState, calcularSeMouseEstaDentro);

    // Pega o contexto do canvas
    const getCanvasContext = useCallback(() => {
        if (contextRef.current) return contextRef.current;

        const canvas = canvasRef.current;
        if (!canvas) return null;

        contextRef.current = canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true
        });

        return contextRef.current;
    }, []);

    // Desenha a grade
    const drawGrid = useCallback(() => {
        const context = getCanvasContext();
        if (!context) return;

        context.save();
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        context.translate(uiState.position.x, uiState.position.y);
        context.scale(uiState.zoom, uiState.zoom);

        for (const grid of visibleGrids) {
            context.strokeStyle = `rgba(255, 255, 255, ${grid.alpha})`;
            context.lineWidth = grid.strokeWidth;

            for (let x = 0; x <= WORLD_WIDTH; x += grid.size) {
                context.beginPath();
                context.moveTo(x, 0);
                context.lineTo(x, WORLD_HEIGHT);
                context.stroke();
            }

            for (let y = 0; y <= WORLD_HEIGHT; y += grid.size) {
                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(WORLD_WIDTH, y);
                context.stroke();
            }
        }

        context.restore();
    }, [uiState.zoom, uiState.position, visibleGrids, getCanvasContext]);

    // Agenda renderizacao (performance)
    const scheduleRender = useCallback(() => {
        const now = Date.now();

        if (now - lastRenderTime.current < RENDER_INTERVAL) {
            if (!renderScheduled.current) {
                renderScheduled.current = true;
                requestAnimationFrame(() => {
                    renderScheduled.current = false;
                    lastRenderTime.current = Date.now();
                    if (renderGridToCanvasRef.current) {
                        renderGridToCanvasRef.current();
                    }
                });
            }
            return;
        }

        lastRenderTime.current = now;
        if (renderGridToCanvasRef.current) {
            renderGridToCanvasRef.current();
        }
    }, []);

    // Hook de renderizacao de tokens
    const { drawTokenWithCache } = useRenderizacaoToken(
        uiState,
        imageCache,
        getCanvasContext,
        scheduleRender,
        desenharFallbackToken,
        desenharBordaDeArrasto,
        desenharSelecao
    );

    // Registra o callback de render no hook da névoa
    useEffect(() => {
        fov.registrarCallbackRender(scheduleRender);
    }, [fov, scheduleRender]);

    // Render principal
    const renderGridToCanvas = useCallback(() => {

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) {
            return;
        }

        const rect = container.getBoundingClientRect();

        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        const context = getCanvasContext();
        if (!context) {
            return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(1, 0, 0, 1, 0, 0);

        drawGrid();

        // Desenha tokens e névoa (unificado)
        for (let i = 0; i < todosItens.length; i++) {
            const item = todosItens[i];
            if (item.tipo === 'token') {
                drawTokenWithCache(item, item.indice, context);
            }
        }

        // Desenha a névoa por cima
        fov.renderizarNevoa(context, uiState.zoom, uiState.position);

        // ===== SELEÇÃO MÚLTIPLA =====
        if (uiState.tokensSelecionados.length > 1) {
            const itensSelecionadosInfo = uiState.tokensSelecionados
                .map(indice => todosItens[indice])
                .filter(item => item && !item.bloqueado && item.tipo === 'token');

            if (itensSelecionadosInfo.length > 0) {
                const boundingBox = calcularBoundingBoxGrupo(itensSelecionadosInfo);
                desenharSelecao(context, boundingBox, uiState.zoom, itensSelecionadosInfo.length, true);
            }
        }

        // ===== BORDA DE ARRASTO =====
        if (uiState.tokenSendoArrastado) {
            const itemInfo = todosItens[uiState.tokenSendoArrastado.indice];
            if (itemInfo) {
                const nome = itemInfo.tipo === 'token' ? (itemInfo.nome || "Token") : "Névoa";
                desenharBordaDeArrasto(
                    context,
                    itemInfo.posicaoTela.x,
                    itemInfo.posicaoTela.y,
                    itemInfo.tamanhoTela.larguraTela,
                    itemInfo.tamanhoTela.alturaTela,
                    nome
                );
            }
        }

        // ===== SELEÇÃO INDIVIDUAL =====
        if (uiState.tokenSelecionado !== null && !uiState.tokenSendoArrastado) {
            const itemInfo = todosItens[uiState.tokenSelecionado];
            if (itemInfo && !itemInfo.bloqueado) {
                const isPartOfGroup = uiState.tokensSelecionados.length > 1;
                if (!isPartOfGroup) {
                    const boundingBox = {
                        x: itemInfo.posicaoTela.x,
                        y: itemInfo.posicaoTela.y,
                        largura: itemInfo.tamanhoTela.larguraTela,
                        altura: itemInfo.tamanhoTela.alturaTela
                    };
                    desenharSelecao(context, boundingBox, uiState.zoom, 1, true);
                }
            }
        }

        // Desenha area de selecao (sempre por último)
        if (uiState.areaSelecao.ativo) {
            const boundingBox = {
                x: Math.min(uiState.areaSelecao.inicioX, uiState.areaSelecao.fimX),
                y: Math.min(uiState.areaSelecao.inicioY, uiState.areaSelecao.fimY),
                largura: Math.abs(uiState.areaSelecao.fimX - uiState.areaSelecao.inicioX),
                altura: Math.abs(uiState.areaSelecao.fimY - uiState.areaSelecao.inicioY)
            };
            desenharSelecao(context, boundingBox, uiState.zoom, 1, false);
        }

    }, [todosItens, drawGrid, drawTokenWithCache, getCanvasContext, uiState.areaSelecao,
        uiState.tokensSelecionados, uiState.tokenSendoArrastado, uiState.tokenSelecionado,
        uiState.zoom, desenharSelecao, desenharBordaDeArrasto, fov]);

    useEffect(() => {
        renderGridToCanvasRef.current = renderGridToCanvas;
    }, [renderGridToCanvas]);

    // Eventos do mouse
    const { handleWheel, handleDragOver } = useEventosMouse(uiState, uiDispatch, containerRef, dragStartRef, restringirPosicao);

    const finalizarArrasto = useCallback(() => {
        if (dragInProgressRef.current && (uiState.tokenSendoArrastado || uiState.tokensSelecionados.length > 0)) {
            const tokenInfo = uiState.tokenSendoArrastado;

            const novosTokens = [...tokensState];
            pushTokens(novosTokens);

            uiDispatch({
                type: 'SET_FEEDBACK',
                payload: {
                    message: uiState.tokensSelecionados.length > 1 ? 'Itens movidos' : 'Item movido',
                    type: 'success'
                }
            });

            if (teveMovimentoRef.current) {
                uiDispatch({ type: 'SELECT_TOKEN', payload: null });
            }

            dragInProgressRef.current = false;
            teveMovimentoRef.current = false;
        }
    }, [tokensState, uiState.tokenSendoArrastado, uiState.tokensSelecionados, pushTokens, uiDispatch]);

    const finalizarRedimensionamento = useCallback(() => {
        if (resizeInProgressRef.current) {
            if (uiState.tokenRedimensionando) {
                const novosTokens = [...tokensState];
                pushTokens(novosTokens);
            }
            resizeInProgressRef.current = false;
            resizeStartStateRef.current = null;
        }
    }, [tokensState, uiState.tokenRedimensionando, pushTokens, resizeStartStateRef]);

    const handleDeleteCamada = useCallback((camadaId) => {
        fov.deletarCamada(camadaId);
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
    }, [fov]);

    // Mouse events do hook customizado
    const { handleMouseDown, handleMouseMove, handleMouseUp } = useMouseTabletop({
        containerRef,
        dragStartRef,
        resizeStartStateRef,
        isDraggingRef,
        dragInProgressRef,
        resizeInProgressRef,
        teveMovimentoRef,
        isRightClickDragRef,
        rafRef,
        uiState,
        uiDispatch,
        tokensState,
        tokensComInfo,
        camadasComInfo,
        converterMouseParaMundo,
        verificarSeMouseSobreToken,
        verificarSeMousePodeRedimensionar,
        tokenEstaNaAreaSelecao,
        restringirPosicao,
        processarArrastoToken,
        processarRedimensionamento,
        setStateDirect,
        fov,
        trazerTokenParaFrente,
        finalizarArrasto,
        finalizarRedimensionamento
    });

    const handleDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
            const dados = JSON.parse(event.dataTransfer.getData('application/json'));

            if (dados.origem !== 'grid' && dados.tipo === 'token') {
                setModalOpen(false);

                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                const mundo = converterMouseParaMundo(mouseX, mouseY);

                const novoToken = {
                    ...dados,
                    id: `${dados.id}-${Date.now()}`,
                    x: mundo.mundoX - ((dados.larguraOriginal || 50) / 2),
                    y: mundo.mundoY - ((dados.alturaOriginal || 50) / 2),
                    escala: 1.0
                };

                const novosTokens = [...tokensState, novoToken];
                pushTokens(novosTokens);
            }
        } catch (erro) {
            // Silencia erro
        }
    }, [tokensState, pushTokens, converterMouseParaMundo]);

    const handleUndo = useCallback(() => {
        if (!canUndo) {
            uiDispatch({
                type: 'SET_FEEDBACK',
                payload: { message: 'Fim do histórico', type: 'warning' }
            });
            setTimeout(() => uiDispatch({ type: 'RESET_UI_FEEDBACK' }), 1000);
            return;
        }

        uiDispatch({ type: 'STOP_TOKEN_DRAG' });
        uiDispatch({ type: 'STOP_RESIZE' });
        uiDispatch({ type: 'SET_MOUSE_DOWN_INFO', payload: null });

        isDraggingRef.current = false;
        dragInProgressRef.current = false;
        resizeInProgressRef.current = false;
        resizeStartStateRef.current = null;

        uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: true });

        window.dispatchEvent(new MouseEvent('mouseup', {
            view: window,
            bubbles: true,
            cancelable: true
        }));

        undo();

        if (ignoreMouseTimeoutRef.current) clearTimeout(ignoreMouseTimeoutRef.current);
        ignoreMouseTimeoutRef.current = setTimeout(() => {
            uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: false });
        }, 100);
    }, [canUndo, undo, uiDispatch, resizeStartStateRef]);

    const handleRedo = useCallback(() => {
        if (!canRedo) {
            uiDispatch({
                type: 'SET_FEEDBACK',
                payload: { message: 'Fim do histórico de refazer', type: 'warning' }
            });
            setTimeout(() => uiDispatch({ type: 'RESET_UI_FEEDBACK' }), 1000);
            return;
        }

        uiDispatch({ type: 'STOP_TOKEN_DRAG' });
        uiDispatch({ type: 'STOP_RESIZE' });
        uiDispatch({ type: 'SET_MOUSE_DOWN_INFO', payload: null });

        isDraggingRef.current = false;
        dragInProgressRef.current = false;
        resizeInProgressRef.current = false;
        resizeStartStateRef.current = null;

        uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: true });

        window.dispatchEvent(new MouseEvent('mouseup', {
            view: window,
            bubbles: true,
            cancelable: true
        }));

        redo();

        if (ignoreMouseTimeoutRef.current) clearTimeout(ignoreMouseTimeoutRef.current);
        ignoreMouseTimeoutRef.current = setTimeout(() => {
            uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: false });
        }, 100);
    }, [canRedo, redo, uiDispatch, resizeStartStateRef]);

    // Atalhos de teclado
    useAtalhosTeclado(handleUndo, handleRedo);

    // Efeitos
    useEffect(() => {
        getCanvasContext();
        return () => {
            contextRef.current = null;
        };
    }, [getCanvasContext]);

    useEffect(() => {
        scheduleRender();
    }, [todosItens, uiState.tokenSendoArrastado, uiState.ui.usuarioInteragindo,
        uiState.tokenSelecionado, uiState.zoom, uiState.position, uiState.areaSelecao,
        uiState.tokensSelecionados, scheduleRender]);

    useEffect(() => {
        scheduleRender();
    }, [uiState.visibilidadeTokens, scheduleRender]);

    useEffect(() => {
        if (uiState.ui.mostrarFeedback) {
            const timer = setTimeout(() => {
                uiDispatch({ type: 'RESET_UI_FEEDBACK' });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [uiState.ui.mostrarFeedback, uiDispatch]);

    // Event listeners
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

    // Fecha menu ao clicar fora
    useEffect(() => {
        if (!uiState.menuContexto.aberto) return;

        const handleClickFora = (event) => {
            if (event.button === 2) return;
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
            }
        };

        document.addEventListener('mousedown', handleClickFora);
        return () => document.removeEventListener('mousedown', handleClickFora);
    }, [uiState.menuContexto.aberto, uiDispatch]);

    // Bloqueia menu padrao do browser
    useEffect(() => {
        const bloquearMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', bloquearMenu);
        return () => document.removeEventListener('contextmenu', bloquearMenu);
    }, []);

    // Limpa cache de imagens
    useEffect(() => {
        const tokenIds = new Set(tokensState.map(t => t.id));
        for (const [id] of imageCache.current.entries()) {
            if (!tokenIds.has(id)) {
                imageCache.current.delete(id);
            }
        }
    }, [tokensState]);

    // Sistema de drag and drop
    useEffect(() => {
        DragDropSystem.register('TabletopGrid', containerRef.current, (dados, event) => {
            if (dados.tipo === 'token') {
                setModalOpen(false);

                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                const mundo = converterMouseParaMundo(mouseX, mouseY);

                const novoToken = {
                    ...dados,
                    id: `${dados.id}-${Date.now()}`,
                    x: mundo.mundoX - ((dados.larguraOriginal || 50) / 2),
                    y: mundo.mundoY - ((dados.alturaOriginal || 50) / 2),
                    escala: 1.0
                };

                const novosTokens = [...tokensState, novoToken];
                pushTokens(novosTokens);
            }
        });

        return () => {
            DragDropSystem.unregister('TabletopGrid');
        };
    }, [tokensState, pushTokens, converterMouseParaMundo]);

    // Limpa timeout no unmount
    useEffect(() => {
        return () => {
            if (ignoreMouseTimeoutRef.current) {
                clearTimeout(ignoreMouseTimeoutRef.current);
            }
        };
    }, []);

    const handleDeleteToken = useCallback((tokenIndice) => {
        const token = tokensState[tokenIndice];
        const novosTokens = tokensState.filter((_, i) => i !== tokenIndice);
        pushTokens(novosTokens);
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
    }, [tokensState, pushTokens, uiDispatch]);

    const handleToggleVisibility = useCallback((tokenId) => {
        const token = tokensState.find(t => t.id === tokenId);
        const novaVisibilidade = !uiState.visibilidadeTokens[tokenId];

        uiDispatch({ type: 'TOGGLE_VISIBILITY', payload: tokenId });
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
    }, [tokensState, uiDispatch, uiState.visibilidadeTokens]);

    const handleToggleLock = useCallback((tokenId) => {
        const token = tokensState.find(t => t.id === tokenId);
        const estaBloqueado = !uiState.tokensBloqueados[tokenId];

        uiDispatch({ type: 'TOGGLE_LOCK', payload: tokenId });
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });

        uiDispatch({
            type: 'SET_FEEDBACK',
            payload: {
                message: estaBloqueado ? 'Token bloqueado' : 'Token desbloqueado',
                type: estaBloqueado ? 'warning' : 'success'
            }
        });
    }, [uiState.tokensBloqueados, uiDispatch, tokensState]);

const handleInverterToken = useCallback((tokenId) => {
        const tokenIndex = tokensState.findIndex(t => t.id === tokenId);

        if (tokenIndex === -1) {
            return;
        }

        const token = tokensState[tokenIndex];

        // Inverte o token (exemplo: flip horizontal)
        const tokenInvertido = {
            ...token,
            invertido: !token.invertido
        };

        const novosTokens = [...tokensState];
        novosTokens[tokenIndex] = tokenInvertido;

        pushTokens(novosTokens);

        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });

        uiDispatch({
            type: 'SET_FEEDBACK',
            payload: {
                message: tokenInvertido.invertido ? 'Token invertido' : 'Token normal',
                type: 'success'
            }
        });
    }, [tokensState, pushTokens, uiDispatch]);

    return (
        <>
            <GridContainer
                containerRef={containerRef}
                isDragging={uiState.ui.isDragging}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <BarraLateral
                    onAbrirModal={() => setModalOpen(true)}
                    onAbrirModalNevoa={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        setMenuNevoaPosicao({ x: rect.right, y: rect.top });
                        setMenuNevoaAberto(true);
                    }}
                />
                <CanvasDesenho canvasRef={canvasRef} />
                <TokenModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                />
            </GridContainer>

            <MenuContextoToken
                ref={menuRef}
                aberto={uiState.menuContexto.aberto}
                x={uiState.menuContexto.x}
                y={uiState.menuContexto.y}
                tokenNome={uiState.menuContexto.tipo === 'nevoa' ? 'Camada de Névoa' : (uiState.menuContexto.token?.nome || 'Token')}
                tokenId={uiState.menuContexto.tipo === 'nevoa' ? uiState.menuContexto.camadaId : uiState.menuContexto.tokenId}
                estaOculto={uiState.menuContexto.tipo === 'nevoa' ? false : uiState.visibilidadeTokens[uiState.menuContexto.tokenId] === true}
                estaBloqueado={uiState.menuContexto.tipo === 'nevoa' ? false : uiState.tokensBloqueados[uiState.menuContexto.tokenId] === true}
                tipo={uiState.menuContexto.tipo || 'token'}
                onFechar={() => uiDispatch({ type: 'CLOSE_CONTEXT_MENU' })}
                onDeletar={() => {
                    if (uiState.menuContexto.tipo === 'nevoa') {
                        handleDeleteCamada(uiState.menuContexto.camadaId);
                    } else {
                        handleDeleteToken(uiState.menuContexto.tokenIndice);
                    }
                }}
                onOcultar={() => handleToggleVisibility(uiState.menuContexto.tokenId)}
                onBloquear={() => handleToggleLock(uiState.menuContexto.tokenId)}
                onInverter={() => handleInverterToken(uiState.menuContexto.tokenId)}
            />

            <ModalNevoa
                aberto={menuNevoaAberto}
                onClose={() => setMenuNevoaAberto(false)}
                posicao={menuNevoaPosicao}
                ferramenta={fov.ferramenta}
                setFerramenta={fov.setFerramenta}
                ativarModoDesenho={() => fov.setModoDesenho(true)}
                desativarModoDesenho={() => fov.setModoDesenho(false)}
                limparTudo={fov.limparTudo}
                desfazer={fov.desfazer}
            />
        </>
    );
}

export default TabletopGrid;