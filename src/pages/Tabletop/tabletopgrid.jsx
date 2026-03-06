// pages/testetabletop/tabletopgrid.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer } from "react";
import TokenModal from "../../components/TokenModal/TokenModal";
import { DragDropSystem } from "../../components/TokenModal/TokenModal";
import {
    GridContainer,
    BarraLateral,
    CanvasDesenho,
    MenuContextoToken,
    desenharBordaDeArrasto,
    desenharBolinhasRedimensionamento,
    desenharFallbackToken,
    desenharSelecao
} from "../../components/TabletopDesign";

// Importações organizadas - AGORA EM PORTUGUÊS
import { WORLD_WIDTH, WORLD_HEIGHT, TOLERANCIA_CLIQUE, RENDER_INTERVAL, BASE_GRID_SIZE, GRID_CONFIGS, clamp } from "../../components/Tabletop/ConstantesMesa";
import { useDesfazerRefazer } from "../../components/Tabletop/useDesfazerRefazer";
import { initialUIState, uiReducer } from "../../components/Tabletop/RedutorUI";
import { useMovimentoToken } from "../../components/Tabletop/useMovimentoToken";
import { useRedimensionamentoToken } from "../../components/Tabletop/useRedimensionamentoToken";
import { useEventosMouse } from "../../components/Tabletop/useEventosMouse";
import { useAtalhosTeclado } from "../../components/Tabletop/useAtalhosTeclado";
import { useSelecaoToken } from "../../components/Tabletop/useSelecaoToken";
import { useRenderizacaoToken } from "../../components/Tabletop/useRenderizacaoToken";
import { trazerTokenParaFrente } from "../../components/Tabletop/UtilitariosToken";

// COMPONENTE PRINCIPAL
function TabletopGrid() {
    console.log('🎯 [TabletopGrid] RENDERIZOU');

    const [modalOpen, setModalOpen] = useState(false);
    console.log('📦 [TabletopGrid] modalOpen:', modalOpen);

    const {
        state: tokensState,
        push: pushTokens,
        undo,
        redo,
        canUndo,
        canRedo,
        setStateDirect
    } = useDesfazerRefazer([]);

    console.log('📦 [TabletopGrid] tokensState:', tokensState.length, 'tokens');

    const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);
    console.log('📦 [TabletopGrid] uiState inicializado');

    // REFS
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

    // NOVAS REFS PARA LÓGICA DE CLIQUE VS ARRASTO
    const cliqueDireitoTimerRef = useRef(null);
    const isRightClickDragRef = useRef(false);

    console.log('🔧 [TabletopGrid] Refs inicializadas');

    // Hooks personalizados
    console.log('🔌 [TabletopGrid] Inicializando hooks...');
    const { processarArrastoToken } = useMovimentoToken();
    const { processarRedimensionamento, resizeStartStateRef } = useRedimensionamentoToken();
    console.log('✅ [TabletopGrid] Hooks de movimento/redimensionamento inicializados');

    // FUNÇÕES DE TRANSFORMAÇÃO
    const restringirPosicao = useCallback((newX, newY) => {
        console.log('🔄 [restringirPosicao] Input:', { newX, newY });

        if (!containerRef.current) {
            console.log('⚠️ [restringirPosicao] containerRef não disponível');
            return { x: newX, y: newY };
        }

        const rect = containerRef.current.getBoundingClientRect();
        const worldWidthScaled = WORLD_WIDTH * uiState.zoom;
        const worldHeightScaled = WORLD_HEIGHT * uiState.zoom;

        const resultado = {
            x: clamp(newX, rect.width - worldWidthScaled, 0),
            y: clamp(newY, rect.height - worldHeightScaled, 0)
        };

        console.log('✅ [restringirPosicao] Resultado:', resultado);
        return resultado;
    }, [uiState.zoom]);

    const converterMouseParaMundo = useCallback((mouseX, mouseY) => {
        console.log('🔄 [converterMouseParaMundo] Mouse:', { mouseX, mouseY });

        const resultado = {
            mundoX: (mouseX - uiState.position.x) / uiState.zoom,
            mundoY: (mouseY - uiState.position.y) / uiState.zoom
        };

        console.log('✅ [converterMouseParaMundo] Mundo:', resultado);
        return resultado;
    }, [uiState.position, uiState.zoom]);

    const calcularSeMouseEstaDentro = useCallback((mouseX, mouseY, elemX, elemY, largura, altura) => {
        const TOLERANCIA = TOLERANCIA_CLIQUE;

        const dentro = mouseX >= elemX - TOLERANCIA &&
            mouseX <= elemX + largura + TOLERANCIA &&
            mouseY >= elemY - TOLERANCIA &&
            mouseY <= elemY + altura + TOLERANCIA;

        console.log('🖱️ [calcularSeMouseEstaDentro]', {
            mouse: { x: mouseX, y: mouseY },
            elemento: { x: elemX, y: elemY, largura, altura },
            tolerancia: TOLERANCIA,
            dentro
        });

        return dentro;
    }, []);

    // MEMOS
    const visibleGrids = useMemo(() => {
        console.log('🔄 [useMemo] Calculando visibleGrids, zoom:', uiState.zoom);

        const grids = GRID_CONFIGS
            .filter(config => uiState.zoom >= config.zoomThreshold)
            .map((config, index, array) => {
                const strokeWidth = Math.max(0.5, 1 / uiState.zoom);
                const baseSize = BASE_GRID_SIZE * config.sizeMultiplier;
                let alpha = config.alpha;

                if (index > 0) {
                    const prevConfig = array[index - 1];
                    const transitionRange = (config.zoomThreshold - prevConfig.zoomThreshold) * 0.2;
                    const fadeStart = config.zoomThreshold - transitionRange;

                    if (uiState.zoom > fadeStart && uiState.zoom < config.zoomThreshold + transitionRange) {
                        const progress = (uiState.zoom - fadeStart) / (transitionRange * 2);
                        alpha = config.alpha * Math.min(1, Math.max(0, progress));
                        console.log('📊 [grid] Ajuste alpha:', { index, progress, alpha });
                    }
                }

                return { size: baseSize, alpha, strokeWidth };
            });

        console.log('✅ [useMemo] visibleGrids calculado:', grids.length, 'grades');
        return grids;
    }, [uiState.zoom]);

    const tokensComInfo = useMemo(() => {
        console.log('🔄 [useMemo] Calculando tokensComInfo, total tokens:', tokensState.length);

        const tokens = tokensState.map((token, indice) => {
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

            if (indice === 0) {
                console.log('📊 [tokenInfo] Exemplo primeiro token:', {
                    indice,
                    nome: token.nome,
                    posicaoMundo: { x: token.x, y: token.y },
                    posicaoTela,
                    selecionado: estaSelecionado,
                    bloqueado: estaBloqueado
                });
            }

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
                estaSelecionado
            };
        });

        console.log('✅ [useMemo] tokensComInfo calculado, total:', tokens.length);
        return tokens;
    }, [tokensState, uiState.zoom, uiState.position, uiState.visibilidadeTokens,
        uiState.tokensBloqueados, uiState.tokenSelecionado, uiState.tokensSelecionados]);

    // Hooks de seleção
    console.log('🔌 [TabletopGrid] Inicializando useSelecaoToken...');
    const { verificarSeMouseSobreToken, verificarSeMousePodeRedimensionar, tokenEstaNaAreaSelecao } =
        useSelecaoToken(tokensState, tokensComInfo, uiState, calcularSeMouseEstaDentro);
    console.log('✅ [TabletopGrid] useSelecaoToken inicializado');

    // FUNÇÕES DE RENDERIZAÇÃO
    const getCanvasContext = useCallback(() => {
        console.log('🖌️ [getCanvasContext] Obtendo contexto do canvas');

        if (contextRef.current) {
            console.log('✅ [getCanvasContext] Usando contexto existente');
            return contextRef.current;
        }

        const canvas = canvasRef.current;
        if (!canvas) {
            console.log('❌ [getCanvasContext] Canvas não encontrado');
            return null;
        }

        contextRef.current = canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true
        });

        console.log('✅ [getCanvasContext] Novo contexto criado');
        return contextRef.current;
    }, []);

    const drawGrid = useCallback(() => {
        console.log('📐 [drawGrid] Desenhando grade');

        const context = getCanvasContext();
        if (!context) {
            console.log('❌ [drawGrid] Contexto inválido');
            return;
        }

        context.save();
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        context.translate(uiState.position.x, uiState.position.y);
        context.scale(uiState.zoom, uiState.zoom);

        console.log('📐 [drawGrid] Transformação aplicada:', {
            translate: uiState.position,
            zoom: uiState.zoom
        });

        for (const grid of visibleGrids) {
            console.log('📐 [drawGrid] Desenhando grade:', grid);
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
        console.log('✅ [drawGrid] Grade desenhada');
    }, [uiState.zoom, uiState.position, visibleGrids, getCanvasContext]);

    const scheduleRender = useCallback(() => {
        const now = Date.now();
        console.log('⏰ [scheduleRender] Iniciando, tempo desde último render:', now - lastRenderTime.current);

        if (now - lastRenderTime.current < RENDER_INTERVAL) {
            console.log('⏰ [scheduleRender] Intervalo mínimo não atingido, agendando...');
            if (!renderScheduled.current) {
                renderScheduled.current = true;
                requestAnimationFrame(() => {
                    console.log('⏰ [scheduleRender] Executando render agendado');
                    renderScheduled.current = false;
                    lastRenderTime.current = Date.now();
                    if (renderGridToCanvasRef.current) {
                        renderGridToCanvasRef.current();
                    }
                });
            }
            return;
        }

        console.log('⏰ [scheduleRender] Renderizando imediatamente');
        lastRenderTime.current = now;
        if (renderGridToCanvasRef.current) {
            renderGridToCanvasRef.current();
        }
    }, []);

    // Hook de renderização de tokens
    console.log('🔌 [TabletopGrid] Inicializando useRenderizacaoToken...');
    const { drawTokenWithCache } = useRenderizacaoToken(
        uiState,
        imageCache,
        getCanvasContext,
        scheduleRender,
        desenharFallbackToken,
        desenharBordaDeArrasto,
        desenharSelecao
    );
    console.log('✅ [TabletopGrid] useRenderizacaoToken inicializado');

    const renderGridToCanvas = useCallback(() => {
        console.log('🎨 [renderGridToCanvas] INICIANDO RENDER COMPLETO');

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) {
            console.log('❌ [renderGridToCanvas] Canvas ou container não disponível');
            return;
        }

        const rect = container.getBoundingClientRect();
        console.log('📏 [renderGridToCanvas] Dimensões container:', rect);

        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            console.log('📏 [renderGridToCanvas] Redimensionando canvas:', {
                antes: { w: canvas.width, h: canvas.height },
                depois: { w: rect.width, h: rect.height }
            });
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        const context = getCanvasContext();
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(1, 0, 0, 1, 0, 0);

        console.log('🎨 [renderGridToCanvas] Desenhando grade...');
        drawGrid();

        console.log('🎨 [renderGridToCanvas] Desenhando', tokensComInfo.length, 'tokens...');
        for (let i = 0; i < tokensComInfo.length; i++) {
            const token = tokensComInfo[i];
            drawTokenWithCache(token, i, context);
        }

        if (uiState.tokensSelecionados.length > 1) {
            console.log('🎨 [renderGridToCanvas] Desenhando seleção múltipla:', uiState.tokensSelecionados);
            const tokensSelecionadosInfo = uiState.tokensSelecionados
                .map(indice => tokensComInfo[indice])
                .filter(token => token && !token.bloqueado);

            if (tokensSelecionadosInfo.length > 0) {
                desenharSelecao(context, tokensSelecionadosInfo, uiState.zoom, 'grupo', true);
            }
        }

        if (uiState.areaSelecao.ativo) {
            console.log('🎨 [renderGridToCanvas] Desenhando área de seleção:', uiState.areaSelecao);
            const tokenVirtual = {
                posicaoTela: {
                    x: Math.min(uiState.areaSelecao.inicioX, uiState.areaSelecao.fimX),
                    y: Math.min(uiState.areaSelecao.inicioY, uiState.areaSelecao.fimY)
                },
                tamanhoTela: {
                    larguraTela: Math.abs(uiState.areaSelecao.fimX - uiState.areaSelecao.inicioX),
                    alturaTela: Math.abs(uiState.areaSelecao.fimY - uiState.areaSelecao.inicioY)
                }
            };

            desenharSelecao(context, [tokenVirtual], uiState.zoom, 'individual', false);
        }

        console.log('✅ [renderGridToCanvas] RENDER COMPLETO FINALIZADO');
    }, [tokensComInfo, drawGrid, drawTokenWithCache, getCanvasContext, uiState.areaSelecao,
        uiState.tokensSelecionados, uiState.zoom, desenharSelecao]);

    useEffect(() => {
        console.log('🔗 [useEffect] Atualizando renderGridToCanvasRef');
        renderGridToCanvasRef.current = renderGridToCanvas;
    }, [renderGridToCanvas]);

    // Eventos do mouse
    console.log('🔌 [TabletopGrid] Inicializando useEventosMouse...');
    const { handleWheel, handleDragOver } = useEventosMouse(uiState, uiDispatch, containerRef, dragStartRef, restringirPosicao);
    console.log('✅ [TabletopGrid] useEventosMouse inicializado');

    const handleMouseDown = useCallback((event) => {
        console.log('🖱️ [handleMouseDown] INÍCIO - Botão:', event.button, 'Tipo:', event.type);
        console.log('📊 [handleMouseDown] uiState:', {
            ignoreMouseMove: uiState.ignoreMouseMove,
            tokenSelecionado: uiState.tokenSelecionado,
            tokensSelecionados: uiState.tokensSelecionados.length,
            zoom: uiState.zoom
        });

        if (uiState.ignoreMouseMove) {
            console.log('🖱️ [handleMouseDown] Ignorando mouse move ativo, resetando');
            uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: false });
        }

        if (event.button === 2) {
            console.log('🖱️ [handleMouseDown] Clique DIREITO detectado');
            event.preventDefault();

            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            console.log('🖱️ [handleMouseDown] Mouse posição (clique direito):', { mouseX, mouseY });

            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'direito');
            console.log('🔍 [handleMouseDown] Token sobre (direito):', tokenSobre ? tokenSobre.token.nome : 'nenhum');

            if (tokenSobre) {
                const tokenBloqueado = uiState.tokensBloqueados[tokenSobre.token.id] === true;
                console.log('🔒 [handleMouseDown] Token bloqueado?', tokenBloqueado);

                if (tokenBloqueado) {
                    console.log('📝 [handleMouseDown] Token bloqueado - guardando info para decisão');

                    // Reseta flag de movimento
                    isRightClickDragRef.current = false;

                    // Guarda info para usar no mouseMove e mouseUp
                    uiDispatch({
                        type: 'SET_MOUSE_DOWN_INFO',
                        payload: {
                            token: tokenSobre,
                            mouseX,
                            mouseY,
                            timestamp: Date.now(),
                            tokenIndice: tokenSobre.indice,
                            isRightClick: true,
                            isBlocked: true
                        }
                    });

                    // NÃO inicia arrasto ainda - aguarda mouseMove decidir
                } else {
                    // Token não bloqueado - menu normal
                    console.log('✅ [handleMouseDown] Token não bloqueado, preparando menu');
                    uiDispatch({
                        type: 'SET_MOUSE_DOWN_INFO',
                        payload: {
                            token: tokenSobre,
                            mouseX,
                            mouseY,
                            timestamp: Date.now(),
                            tokenIndice: tokenSobre.indice,
                            isRightClick: true,
                            isBlocked: false
                        }
                    });
                    uiDispatch({ type: 'SET_UI_STATE', payload: { isClickingToken: true } });
                }
            } else {
                // Sem token - arrasto imediato do mapa
                console.log('🖱️ [handleMouseDown] Nenhum token, iniciando arrasto do mapa');
                uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
                dragStartRef.current = {
                    x: event.clientX - uiState.position.x,
                    y: event.clientY - uiState.position.y
                };
            }
            return;
        }

        if (event.button === 0) {
            console.log('🖱️ [handleMouseDown] Clique ESQUERDO detectado');

            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            console.log('🖱️ [handleMouseDown] Mouse posição (clique esquerdo):', { mouseX, mouseY });

            teveMovimentoRef.current = false;

            // PRIMEIRO: Verificar se tem grupo selecionado
            if (uiState.tokensSelecionados.length > 1) {
                console.log('👥 [handleMouseDown] Grupo selecionado detectado:', uiState.tokensSelecionados);

                const tokensSelecionadosInfo = uiState.tokensSelecionados
                    .map(indice => tokensComInfo[indice])
                    .filter(token => token && !token.bloqueado);

                if (tokensSelecionadosInfo.length > 0) {
                    // Calcular bounding box do grupo na tela
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                    tokensSelecionadosInfo.forEach(token => {
                        minX = Math.min(minX, token.posicaoTela.x);
                        minY = Math.min(minY, token.posicaoTela.y);
                        maxX = Math.max(maxX, token.posicaoTela.x + token.tamanhoTela.larguraTela);
                        maxY = Math.max(maxY, token.posicaoTela.y + token.tamanhoTela.alturaTela);
                    });

                    console.log('📐 [handleMouseDown] Bounding box grupo:', { minX, minY, maxX, maxY });

                    // Verificar se o mouse está DENTRO de algum token do grupo (MOVIMENTO)
                    const tokenClicadoDoGrupo = tokensSelecionadosInfo.find(token =>
                        mouseX >= token.posicaoTela.x &&
                        mouseX <= token.posicaoTela.x + token.tamanhoTela.larguraTela &&
                        mouseY >= token.posicaoTela.y &&
                        mouseY <= token.posicaoTela.y + token.tamanhoTela.alturaTela
                    );

                    if (tokenClicadoDoGrupo) {
                        console.log('🎯 [handleMouseDown] INICIANDO MOVIMENTO DE GRUPO - Token clicado:', tokenClicadoDoGrupo.nome);

                        const primeiroTokenGrupo = tokensSelecionadosInfo[0];

                        const grupoTokenInfo = {
                            token: primeiroTokenGrupo,
                            indice: primeiroTokenGrupo.indice,
                            telaX: primeiroTokenGrupo.posicaoTela.x,
                            telaY: primeiroTokenGrupo.posicaoTela.y,
                            isGroupDrag: true
                        };

                        const offsetX = mouseX - primeiroTokenGrupo.posicaoTela.x;
                        const offsetY = mouseY - primeiroTokenGrupo.posicaoTela.y;

                        console.log('📊 [handleMouseDown] Offset grupo:', { offsetX, offsetY });

                        uiDispatch({
                            type: 'START_TOKEN_DRAG',
                            payload: {
                                tokenInfo: grupoTokenInfo,
                                offset: { x: offsetX, y: offsetY }
                            }
                        });

                        isDraggingRef.current = true;
                        dragInProgressRef.current = true;
                        event.preventDefault();
                        return;
                    }

                    // Se NÃO clicou em um token, verificar se está na área de REDIMENSIONAMENTO (bordas)
                    const padding = 16;
                    const areaBorda = {
                        x: minX - padding,
                        y: minY - padding,
                        width: (maxX - minX) + (padding * 2),
                        height: (maxY - minY) + (padding * 2)
                    };

                    const mouseNaBorda = mouseX >= areaBorda.x &&
                        mouseX <= areaBorda.x + areaBorda.width &&
                        mouseY >= areaBorda.y &&
                        mouseY <= areaBorda.y + areaBorda.height;

                    console.log('📐 [handleMouseDown] Verificando borda grupo:', {
                        areaBorda,
                        mouseNaBorda
                    });

                    if (mouseNaBorda) {
                        console.log('📏 [handleMouseDown] INICIANDO REDIMENSIONAMENTO DE GRUPO');

                        // Calcular bounding box em coordenadas de mundo
                        let minXMundo = Infinity, minYMundo = Infinity,
                            maxXMundo = -Infinity, maxYMundo = -Infinity;

                        tokensSelecionadosInfo.forEach(token => {
                            minXMundo = Math.min(minXMundo, token.x);
                            minYMundo = Math.min(minYMundo, token.y);
                            maxXMundo = Math.max(maxXMundo, token.x + (token.larguraOriginal * token.escala));
                            maxYMundo = Math.max(maxYMundo, token.y + (token.alturaOriginal * token.escala));
                        });

                        const boundingBoxMundo = {
                            x: minXMundo,
                            y: minYMundo,
                            largura: maxXMundo - minXMundo,
                            altura: maxYMundo - minYMundo,
                            larguraBase: maxXMundo - minXMundo,
                            alturaBase: maxYMundo - minYMundo
                        };

                        const primeiroToken = tokensSelecionadosInfo[0];

                        resizeStartStateRef.current = {
                            tokenIndice: primeiroToken.indice,
                            escalaInicial: primeiroToken.escala || 1,
                            isGroupResize: true
                        };

                        uiDispatch({
                            type: 'START_RESIZE',
                            payload: {
                                token: primeiroToken,
                                indice: primeiroToken.indice,
                                canto: 'se',
                                tamanhoInicial: {
                                    largura: boundingBoxMundo.largura,
                                    altura: boundingBoxMundo.altura,
                                    escala: 1
                                },
                                boundingBoxGrupo: boundingBoxMundo,
                                offset: {
                                    x: mouseX - minX,
                                    y: mouseY - minY
                                },
                                isGroupResize: true
                            }
                        });
                        event.preventDefault();
                        return;
                    }
                }
            }

            // SEGUNDO: Verificar redimensionamento de token individual
            if (uiState.tokenSelecionado !== null) {
                console.log('🔍 [handleMouseDown] Verificando redimensionamento individual');

                const token = tokensState[uiState.tokenSelecionado];
                const tokenBloqueado = uiState.tokensBloqueados[token?.id] === true;

                if (token && !tokenBloqueado) {
                    const posicaoTela = {
                        x: (token.x * uiState.zoom) + uiState.position.x,
                        y: (token.y * uiState.zoom) + uiState.position.y
                    };

                    const larguraMundo = (token.larguraOriginal || 50) * (token.escala || 1);
                    const alturaMundo = (token.alturaOriginal || 50) * (token.escala || 1);

                    const canto = verificarSeMousePodeRedimensionar(
                        mouseX, mouseY,
                        posicaoTela.x, posicaoTela.y,
                        larguraMundo * uiState.zoom,
                        alturaMundo * uiState.zoom,
                        tokenBloqueado
                    );

                    console.log('🔍 [handleMouseDown] Resultado verificação redimensionamento:', canto);

                    if (canto) {
                        console.log('📏 [handleMouseDown] INICIANDO REDIMENSIONAMENTO INDIVIDUAL, canto:', canto);

                        resizeStartStateRef.current = {
                            tokenIndice: uiState.tokenSelecionado,
                            escalaInicial: token.escala || 1
                        };

                        uiDispatch({
                            type: 'START_RESIZE',
                            payload: {
                                token,
                                indice: uiState.tokenSelecionado,
                                canto,
                                tamanhoInicial: {
                                    largura: larguraMundo,
                                    altura: alturaMundo,
                                    escala: token.escala || 1
                                },
                                offset: {
                                    x: mouseX - posicaoTela.x,
                                    y: mouseY - posicaoTela.y
                                },
                                isGroupResize: false
                            }
                        });
                        event.preventDefault();
                        return;
                    }
                }
            }

            // TERCEIRO: Verificar clique em token individual
            console.log('🔍 [handleMouseDown] Verificando clique em token individual');
            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'esquerdo');
            console.log('🔍 [handleMouseDown] Token sobre (esquerdo):', tokenSobre ? tokenSobre.token.nome : 'nenhum');

            if (tokenSobre) {
                const tokenBloqueado = uiState.tokensBloqueados[tokenSobre.token.id] === true;
                console.log('🔒 [handleMouseDown] Token bloqueado?', tokenBloqueado);

                if (tokenBloqueado) {
                    console.log('⚠️ [handleMouseDown] Token bloqueado, mostrando feedback');
                    uiDispatch({
                        type: 'SET_FEEDBACK',
                        payload: { message: 'Token bloqueado', type: 'warning' }
                    });
                    event.preventDefault();
                    return;
                }

                const canto = verificarSeMousePodeRedimensionar(
                    mouseX, mouseY,
                    tokenSobre.telaX, tokenSobre.telaY,
                    tokenSobre.larguraTela, tokenSobre.alturaTela,
                    false
                );

                console.log('🔍 [handleMouseDown] Verificação redimensionamento token:', canto);

                if (canto) {
                    console.log('📏 [handleMouseDown] INICIANDO REDIMENSIONAMENTO INDIVIDUAL (clique direto), canto:', canto);

                    resizeStartStateRef.current = {
                        tokenIndice: tokenSobre.indice,
                        escalaInicial: tokenSobre.token.escala || 1
                    };

                    uiDispatch({
                        type: 'START_RESIZE',
                        payload: {
                            token: tokenSobre.token,
                            indice: tokenSobre.indice,
                            canto,
                            tamanhoInicial: {
                                largura: tokenSobre.largura,
                                altura: tokenSobre.altura,
                                escala: tokenSobre.token.escala || 1
                            },
                            offset: {
                                x: mouseX - tokenSobre.telaX,
                                y: mouseY - tokenSobre.telaY
                            },
                            isGroupResize: false
                        }
                    });
                    event.preventDefault();
                    return;
                }

                const tokenJaSelecionado = uiState.tokensSelecionados.includes(tokenSobre.indice) ||
                    uiState.tokenSelecionado === tokenSobre.indice;

                console.log('🔍 [handleMouseDown] Token já selecionado?', tokenJaSelecionado);

                if (tokenJaSelecionado && uiState.tokensSelecionados.length > 0) {

                    console.log('🎯 [handleMouseDown] Token já selecionado, INICIANDO MOVIMENTO');

                    const novosTokens = trazerTokenParaFrente(tokensState, tokenSobre.indice);
                    setStateDirect(novosTokens);

                    const novoIndice = novosTokens.length - 1;
                    const tokenInfo = {
                        token: novosTokens[novoIndice],
                        indice: novoIndice,
                        telaX: tokenSobre.telaX,
                        telaY: tokenSobre.telaY,
                        isGroupDrag: false
                    };

                    const offsetX = mouseX - tokenSobre.telaX;
                    const offsetY = mouseY - tokenSobre.telaY;

                    console.log('📊 [handleMouseDown] Offset movimento:', { offsetX, offsetY });

                    uiDispatch({
                        type: 'SELECT_TOKEN',
                        payload: novoIndice
                    });

                    uiDispatch({
                        type: 'START_TOKEN_DRAG',
                        payload: {
                            tokenInfo: tokenInfo,
                            offset: { x: offsetX, y: offsetY }
                        }
                    });

                    isDraggingRef.current = true;
                    dragInProgressRef.current = true;
                    event.preventDefault();
                    return;
                } else {
                    console.log('🎯 [handleMouseDown] INICIANDO MOVIMENTO INDIVIDUAL');

                    const novosTokens = trazerTokenParaFrente(tokensState, tokenSobre.indice);
                    setStateDirect(novosTokens);

                    const novoIndice = novosTokens.length - 1;
                    const tokenInfo = {
                        token: novosTokens[novoIndice],
                        indice: novoIndice,
                        telaX: tokenSobre.telaX,
                        telaY: tokenSobre.telaY,
                        isGroupDrag: false
                    };

                    const offsetX = mouseX - tokenSobre.telaX;
                    const offsetY = mouseY - tokenSobre.telaY;

                    console.log('📊 [handleMouseDown] Offset movimento individual:', { offsetX, offsetY });

                    uiDispatch({
                        type: 'SELECT_TOKEN',
                        payload: novoIndice
                    });

                    uiDispatch({
                        type: 'START_TOKEN_DRAG',
                        payload: {
                            tokenInfo: tokenInfo,
                            offset: { x: offsetX, y: offsetY }
                        }
                    });

                    isDraggingRef.current = true;
                    dragInProgressRef.current = true;
                    event.preventDefault();
                    return;
                }
            } else {

                console.log('🖱️ [handleMouseDown] Nenhum token - aguardando movimento');

                // Apenas guarda que começou em área vazia
                uiDispatch({
                    type: 'SET_MOUSE_DOWN_INFO',
                    payload: {
                        mouseX,
                        mouseY,
                        timestamp: Date.now(),
                        isLeftClick: true,
                        isBlankArea: true
                    }
                });

                event.preventDefault();
            }
        }
    }, [uiState.tokenSelecionado, uiState.position, uiState.zoom, uiState.ignoreMouseMove,
    uiState.tokensBloqueados, uiState.tokensSelecionados, tokensState, tokensComInfo,
        verificarSeMouseSobreToken, verificarSeMousePodeRedimensionar, setStateDirect, resizeStartStateRef, uiDispatch]);

    const handleMouseMove = useCallback((event) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            if (uiState.ignoreMouseMove) return;

            if (uiState.mouseDownInfo?.isBlankArea && !uiState.ui.isSelectingArea && !uiState.ui.isDragging) {
                console.log('🖱️ [handleMouseMove] Movimento em área vazia - INICIANDO SELEÇÃO POR ÁREA');
                uiDispatch({
                    type: 'START_AREA_SELECTION',
                    payload: {
                        x: uiState.mouseDownInfo.mouseX,
                        y: uiState.mouseDownInfo.mouseY
                    }
                });
            }

            // DETECÇÃO DE MOVIMENTO PARA TOKENS BLOQUEADOS
            if (uiState.mouseDownInfo?.isBlocked && !uiState.ui.isDragging && !uiState.ui.isSelectingArea) {
                console.log('🖱️ [handleMouseMove] Movimento detectado em token bloqueado - INICIANDO ARRASTO DO MAPA');
                uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
                dragStartRef.current = {
                    x: event.clientX - uiState.position.x,
                    y: event.clientY - uiState.position.y
                };
                isRightClickDragRef.current = true;
            }

            if (uiState.ui.isSelectingArea) {
                uiDispatch({
                    type: 'UPDATE_AREA_SELECTION',
                    payload: { x: mouseX, y: mouseY }
                });

                const tokensNaArea = [];
                for (let i = 0; i < tokensComInfo.length; i++) {
                    const token = tokensComInfo[i];
                    if (!token.bloqueado && tokenEstaNaAreaSelecao(token, uiState.areaSelecao)) {
                        tokensNaArea.push(i);
                    }
                }

                uiDispatch({
                    type: 'SELECT_MULTIPLE_TOKENS',
                    payload: tokensNaArea
                });

                event.preventDefault();
                return;
            }

            if (uiState.tokenSendoArrastado) {
                teveMovimentoRef.current = true;

                const isGroupDrag = uiState.tokenSendoArrastado.isGroupDrag || false;
                const indicesGrupo = isGroupDrag ? uiState.tokensSelecionados : [];

                const novosTokens = processarArrastoToken(
                    mouseX,
                    mouseY,
                    uiState.tokenSendoArrastado,
                    uiState.offsetArrasto,
                    tokensState,
                    uiState.zoom,
                    uiState.position,
                    isGroupDrag,
                    indicesGrupo
                );

                setStateDirect(novosTokens);
                event.preventDefault();
                return;
            }

            if (uiState.tokenRedimensionando && uiState.modoRedimensionamento) {
                const isGroupResize = uiState.tokenRedimensionando.isGroupResize || false;
                const indicesGrupo = isGroupResize ? uiState.tokensSelecionados : [];

                const novosTokens = processarRedimensionamento(
                    mouseX,
                    mouseY,
                    uiState.tokenRedimensionando,
                    uiState.modoRedimensionamento,
                    uiState.tamanhoInicialRedimensionamento,
                    uiState.boundingBoxGrupo,
                    tokensState,
                    uiState.zoom,
                    uiState.position,
                    isGroupResize,
                    indicesGrupo
                );

                if (!resizeInProgressRef.current) {
                    resizeInProgressRef.current = true;
                }

                setStateDirect(novosTokens);
                event.preventDefault();
                return;
            }

            if (uiState.ui.isDragging) {
                const constrained = restringirPosicao(
                    event.clientX - dragStartRef.current.x,
                    event.clientY - dragStartRef.current.y
                );

                uiDispatch({ type: 'SET_POSITION', payload: constrained });
                event.preventDefault();
                return;
            }
        });
    }, [uiState, tokensState, tokensComInfo, tokenEstaNaAreaSelecao, restringirPosicao,
        processarArrastoToken, processarRedimensionamento, setStateDirect, uiDispatch]);

    const finalizarArrasto = useCallback(() => {
        console.log('🏁 [finalizarArrasto] INICIANDO FINALIZAÇÃO');
        console.log('📊 [finalizarArrasto] Estado:', {
            dragInProgress: dragInProgressRef.current,
            tokenSendoArrastado: !!uiState.tokenSendoArrastado,
            tokensSelecionados: uiState.tokensSelecionados.length,
            teveMovimento: teveMovimentoRef.current
        });

        if (dragInProgressRef.current && (uiState.tokenSendoArrastado || uiState.tokensSelecionados.length > 0)) {
            const novosTokens = [...tokensState];
            console.log('💾 [finalizarArrasto] Salvando estado no histórico, tokens:', novosTokens.length);

            pushTokens(novosTokens);

            uiDispatch({
                type: 'SET_FEEDBACK',
                payload: {
                    message: uiState.tokensSelecionados.length > 1 ? 'Tokens movidos' : 'Token movido',
                    type: 'success'
                }
            });

            if (teveMovimentoRef.current) {
                console.log('🎯 [finalizarArrasto] Houve movimento, desselecionando token');
                uiDispatch({ type: 'SELECT_TOKEN', payload: null });
            }

            dragInProgressRef.current = false;
            teveMovimentoRef.current = false;
        }

        console.log('✅ [finalizarArrasto] FINALIZADO');
    }, [tokensState, uiState.tokenSendoArrastado, uiState.tokensSelecionados, pushTokens, uiDispatch]);

    const finalizarRedimensionamento = useCallback(() => {
        console.log('🏁 [finalizarRedimensionamento] INICIANDO FINALIZAÇÃO');
        console.log('📊 [finalizarRedimensionamento] Estado:', {
            resizeInProgress: resizeInProgressRef.current,
            tokenRedimensionando: !!uiState.tokenRedimensionando
        });

        if (resizeInProgressRef.current && uiState.tokenRedimensionando) {
            const novosTokens = [...tokensState];
            console.log('💾 [finalizarRedimensionamento] Salvando estado no histórico, tokens:', novosTokens.length);

            pushTokens(novosTokens);
            resizeInProgressRef.current = false;
            resizeStartStateRef.current = null;
        }

        console.log('✅ [finalizarRedimensionamento] FINALIZADO');
    }, [tokensState, uiState.tokenRedimensionando, pushTokens, resizeStartStateRef]);

    const handleMouseUp = useCallback((event) => {
        console.log('🖱️ [handleMouseUp] INÍCIO - Botão:', event.button);
        console.log('📊 [handleMouseUp] Estado mouseDownInfo:', uiState.mouseDownInfo);

        if (event.button === 2) {
            console.log('🖱️ [handleMouseUp] Soltou botão DIREITO');

            if (uiState.mouseDownInfo?.isBlocked) {
                if (isRightClickDragRef.current) {
                    // TEVE MOVIMENTO - já arrastou, não faz nada
                    console.log('🎯 [handleMouseUp] Arrasto concluído');
                } else {
                    // NÃO TEVE MOVIMENTO - clique puro em token bloqueado
                    console.log('🎯 [handleMouseUp] Clique puro em token bloqueado - ABRINDO MENU');

                    // ABRE O MENU DIRETAMENTE!
                    const tokenSobre = uiState.mouseDownInfo.token;
                    uiDispatch({
                        type: 'SELECT_TOKEN',
                        payload: uiState.mouseDownInfo.tokenIndice
                    });

                    uiDispatch({
                        type: 'OPEN_CONTEXT_MENU',
                        payload: {
                            aberto: true,
                            x: event.clientX,
                            y: event.clientY,
                            tokenIndice: uiState.mouseDownInfo.tokenIndice,
                            tokenId: tokenSobre.token.id,
                            token: tokenSobre.token
                        }
                    });
                }
            }

            // Menu normal para token não bloqueado
            if (uiState.mouseDownInfo && uiState.ui.isClickingToken && uiState.mouseDownInfo.isRightClick && !uiState.mouseDownInfo.isBlocked) {
                const tokenSobre = uiState.mouseDownInfo.token;
                console.log('🎯 [handleMouseUp] Abrindo menu contexto para token:', tokenSobre.token.nome);

                uiDispatch({
                    type: 'SELECT_TOKEN',
                    payload: tokenSobre.indice
                });

                uiDispatch({
                    type: 'OPEN_CONTEXT_MENU',
                    payload: {
                        aberto: true,
                        x: event.clientX,
                        y: event.clientY,
                        tokenIndice: tokenSobre.indice,
                        tokenId: tokenSobre.token.id,
                        token: tokenSobre.token
                    }
                });
            }

            // Reset
            isRightClickDragRef.current = false;
        }

        if (event.button === 0) {
            console.log('🖱️ [handleMouseUp] Soltou botão ESQUERDO');

            if (uiState.mouseDownInfo?.isBlankArea && !uiState.ui.isSelectingArea) {
                console.log('🖱️ [handleMouseUp] Clique puro em área vazia - DESSELECIONANDO');
                uiDispatch({ type: 'SELECT_TOKEN', payload: null });
            }

            if (uiState.ui.isSelectingArea) {
                console.log('📐 [handleMouseUp] Finalizando seleção por área');
                uiDispatch({ type: 'END_AREA_SELECTION' });

                if (uiState.tokensSelecionados.length === 0) {
                    console.log('📐 [handleMouseUp] Nenhum token selecionado, limpando seleção');
                    uiDispatch({ type: 'SELECT_TOKEN', payload: null });
                }
            }

            if (isDraggingRef.current || dragInProgressRef.current) {
                console.log('🖱️ [handleMouseUp] Finalizando arrasto');
                finalizarArrasto();
                isDraggingRef.current = false;
            }

            if (resizeInProgressRef.current || uiState.tokenRedimensionando) {
                console.log('📏 [handleMouseUp] Finalizando redimensionamento');
                finalizarRedimensionamento();
            }
        }

        if (uiState.tokenRedimensionando) {
            console.log('📏 [handleMouseUp] Parando redimensionamento');
            uiDispatch({ type: 'STOP_RESIZE' });
        }

        if (uiState.ui.isDragging) {
            console.log('🖱️ [handleMouseUp] Parando arrasto do mapa');
            uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: false } });
        }

        if (uiState.tokenSendoArrastado) {
            console.log('🎯 [handleMouseUp] Parando arrasto de token');
            uiDispatch({ type: 'STOP_TOKEN_DRAG' });
        }

        console.log('🖱️ [handleMouseUp] Resetando estados de mouse');
        uiDispatch({ type: 'SET_MOUSE_DOWN_INFO', payload: null });
        uiDispatch({ type: 'SET_UI_STATE', payload: { isClickingToken: false } });

        console.log('✅ [handleMouseUp] FINALIZADO');
    }, [uiState, finalizarArrasto, finalizarRedimensionamento, uiDispatch]);

    const handleDrop = useCallback((event) => {
        console.log('📥 [handleDrop] INÍCIO');
        event.preventDefault();
        event.stopPropagation();

        try {
            const dados = JSON.parse(event.dataTransfer.getData('application/json'));
            console.log('📦 [handleDrop] Dados recebidos:', dados);

            if (dados.origem !== 'grid' && dados.tipo === 'token') {
                console.log('✅ [handleDrop] Token válido para adicionar');
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

                console.log('➕ [handleDrop] Novo token criado:', novoToken);

                const novosTokens = [...tokensState, novoToken];
                pushTokens(novosTokens);

                console.log('✅ [handleDrop] Token adicionado com sucesso');
            }
        } catch (erro) {
            console.error('❌ [handleDrop] Erro:', erro);
        }
    }, [tokensState, pushTokens, converterMouseParaMundo]);

    const handleUndo = useCallback(() => {
        console.log('↩️ [handleUndo] INÍCIO, canUndo:', canUndo);

        if (!canUndo) {
            console.log('⚠️ [handleUndo] Fim do histórico');
            uiDispatch({
                type: 'SET_FEEDBACK',
                payload: { message: 'Fim do histórico', type: 'warning' }
            });
            setTimeout(() => uiDispatch({ type: 'RESET_UI_FEEDBACK' }), 1000);
            return;
        }

        console.log('🔄 [handleUndo] Parando ações em progresso');
        uiDispatch({ type: 'STOP_TOKEN_DRAG' });
        uiDispatch({ type: 'STOP_RESIZE' });
        uiDispatch({ type: 'SET_MOUSE_DOWN_INFO', payload: null });

        isDraggingRef.current = false;
        dragInProgressRef.current = false;
        resizeInProgressRef.current = false;
        resizeStartStateRef.current = null;

        uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: true });

        console.log('🖱️ [handleUndo] Disparando mouseup virtual');
        window.dispatchEvent(new MouseEvent('mouseup', {
            view: window,
            bubbles: true,
            cancelable: true
        }));

        console.log('↩️ [handleUndo] Executando undo');
        undo();

        if (ignoreMouseTimeoutRef.current) clearTimeout(ignoreMouseTimeoutRef.current);
        ignoreMouseTimeoutRef.current = setTimeout(() => {
            console.log('⏰ [handleUndo] Reativando mouse move');
            uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: false });
        }, 100);

        console.log('✅ [handleUndo] FINALIZADO');
    }, [canUndo, undo, uiDispatch, resizeStartStateRef]);

    const handleRedo = useCallback(() => {
        console.log('↪️ [handleRedo] INÍCIO, canRedo:', canRedo);

        if (!canRedo) {
            console.log('⚠️ [handleRedo] Fim do histórico de refazer');
            uiDispatch({
                type: 'SET_FEEDBACK',
                payload: { message: 'Fim do histórico de refazer', type: 'warning' }
            });
            setTimeout(() => uiDispatch({ type: 'RESET_UI_FEEDBACK' }), 1000);
            return;
        }

        console.log('🔄 [handleRedo] Parando ações em progresso');
        uiDispatch({ type: 'STOP_TOKEN_DRAG' });
        uiDispatch({ type: 'STOP_RESIZE' });
        uiDispatch({ type: 'SET_MOUSE_DOWN_INFO', payload: null });

        isDraggingRef.current = false;
        dragInProgressRef.current = false;
        resizeInProgressRef.current = false;
        resizeStartStateRef.current = null;

        uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: true });

        console.log('🖱️ [handleRedo] Disparando mouseup virtual');
        window.dispatchEvent(new MouseEvent('mouseup', {
            view: window,
            bubbles: true,
            cancelable: true
        }));

        console.log('↪️ [handleRedo] Executando redo');
        redo();

        if (ignoreMouseTimeoutRef.current) clearTimeout(ignoreMouseTimeoutRef.current);
        ignoreMouseTimeoutRef.current = setTimeout(() => {
            console.log('⏰ [handleRedo] Reativando mouse move');
            uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: false });
        }, 100);

        console.log('✅ [handleRedo] FINALIZADO');
    }, [canRedo, redo, uiDispatch, resizeStartStateRef]);

    // Keyboard shortcuts
    console.log('🔌 [TabletopGrid] Inicializando useAtalhosTeclado...');
    useAtalhosTeclado(handleUndo, handleRedo);
    console.log('✅ [TabletopGrid] useAtalhosTeclado inicializado');

    // Efeitos
    useEffect(() => {
        console.log('🔄 [useEffect] Inicializando contexto do canvas');
        getCanvasContext();
        return () => {
            console.log('🧹 [useEffect] Limpando contexto do canvas');
            contextRef.current = null;
        };
    }, [getCanvasContext]);

    useEffect(() => {
        console.log('🔄 [useEffect] Agendando render por mudanças');
        scheduleRender();
    }, [tokensComInfo, uiState.tokenSendoArrastado, uiState.ui.usuarioInteragindo,
        uiState.tokenSelecionado, uiState.zoom, uiState.position, uiState.areaSelecao,
        uiState.tokensSelecionados, scheduleRender]);

    useEffect(() => {
        console.log('🔄 [useEffect] Agendando render por visibilidade');
        scheduleRender();
    }, [uiState.visibilidadeTokens, scheduleRender]);

    useEffect(() => {
        if (uiState.ui.mostrarFeedback) {
            console.log('💬 [useEffect] Feedback visível:', uiState.ui.feedbackMessage);
            const timer = setTimeout(() => {
                console.log('⏰ [useEffect] Resetando feedback');
                uiDispatch({ type: 'RESET_UI_FEEDBACK' });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [uiState.ui.mostrarFeedback, uiDispatch]);

    useEffect(() => {
        console.log('🔌 [useEffect] Configurando event listeners');

        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('contextmenu', (e) => e.preventDefault());

        console.log('✅ [useEffect] Event listeners configurados');

        return () => {
            console.log('🧹 [useEffect] Removendo event listeners');
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        if (!uiState.menuContexto.aberto) return;

        console.log('🔌 [useEffect] Menu contexto aberto, configurando listener para fechar');

        const handleClickFora = (event) => {
            if (event.button === 2) return;
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                console.log('🖱️ [useEffect] Clique fora do menu, fechando');
                uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
            }
        };

        document.addEventListener('mousedown', handleClickFora);
        return () => document.removeEventListener('mousedown', handleClickFora);
    }, [uiState.menuContexto.aberto, uiDispatch]);

    useEffect(() => {
        console.log('🔌 [useEffect] Bloqueando menu de contexto global');
        const bloquearMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', bloquearMenu);
        return () => document.removeEventListener('contextmenu', bloquearMenu);
    }, []);

    useEffect(() => {
        console.log('🧹 [useEffect] Limpando cache de imagens');
        const tokenIds = new Set(tokensState.map(t => t.id));
        for (const [id] of imageCache.current.entries()) {
            if (!tokenIds.has(id)) {
                console.log('🗑️ [useEffect] Removendo imagem do cache:', id);
                imageCache.current.delete(id);
            }
        }
    }, [tokensState]);

    useEffect(() => {
        console.log('🔌 [useEffect] Registrando DragDropSystem');

        DragDropSystem.register('TabletopGrid', containerRef.current, (dados, event) => {
            console.log('📥 [DragDropSystem] Callback recebido:', dados);

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

                console.log('➕ [DragDropSystem] Novo token criado:', novoToken);

                const novosTokens = [...tokensState, novoToken];
                pushTokens(novosTokens);
            }
        });

        return () => {
            console.log('🧹 [useEffect] Removendo DragDropSystem');
            DragDropSystem.unregister('TabletopGrid');
        };
    }, [tokensState, pushTokens, converterMouseParaMundo]);

    useEffect(() => {
        return () => {
            console.log('🧹 [useEffect] Limpando timeout ignoreMouse');
            if (ignoreMouseTimeoutRef.current) {
                clearTimeout(ignoreMouseTimeoutRef.current);
            }
        };
    }, []);

    const handleDeleteToken = useCallback((tokenIndice) => {
        console.log('🗑️ [handleDeleteToken] Deletando token índice:', tokenIndice);
        const novosTokens = tokensState.filter((_, i) => i !== tokenIndice);
        pushTokens(novosTokens);
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
        console.log('✅ [handleDeleteToken] Token deletado');
    }, [tokensState, pushTokens, uiDispatch]);

    const handleToggleVisibility = useCallback((tokenId) => {
        console.log('👁️ [handleToggleVisibility] Toggling visibilidade token:', tokenId);
        uiDispatch({ type: 'TOGGLE_VISIBILITY', payload: tokenId });
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
    }, [uiDispatch]);

    const handleToggleLock = useCallback((tokenId) => {
        console.log('🔒 [handleToggleLock] Toggling bloqueio token:', tokenId);
        uiDispatch({ type: 'TOGGLE_LOCK', payload: tokenId });
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });

        const estaBloqueado = !uiState.tokensBloqueados[tokenId];
        console.log('🔒 [handleToggleLock] Novo estado:', estaBloqueado ? 'BLOQUEADO' : 'DESBLOQUEADO');

        uiDispatch({
            type: 'SET_FEEDBACK',
            payload: {
                message: estaBloqueado ? 'Token bloqueado' : 'Token desbloqueado',
                type: estaBloqueado ? 'warning' : 'success'
            }
        });
    }, [uiState.tokensBloqueados, uiDispatch]);

    console.log('🎨 [TabletopGrid] Renderizando JSX');

    return (
        <>
            <GridContainer
                containerRef={containerRef}
                isDragging={uiState.ui.isDragging}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <BarraLateral onAbrirModal={() => {
                    console.log('📂 [BarraLateral] Abrindo modal');
                    setModalOpen(true);
                }} />
                <CanvasDesenho canvasRef={canvasRef} />
                <TokenModal
                    open={modalOpen}
                    onClose={() => {
                        console.log('❌ [TokenModal] Fechando modal');
                        setModalOpen(false);
                    }}
                />
            </GridContainer>

            <MenuContextoToken
                ref={menuRef}
                aberto={uiState.menuContexto.aberto}
                x={uiState.menuContexto.x}
                y={uiState.menuContexto.y}
                tokenNome={uiState.menuContexto.token?.nome || 'Token'}
                tokenId={uiState.menuContexto.tokenId}
                estaOculto={uiState.visibilidadeTokens[uiState.menuContexto.tokenId] === true}
                estaBloqueado={uiState.tokensBloqueados[uiState.menuContexto.tokenId] === true}
                onFechar={() => {
                    console.log('❌ [MenuContextoToken] Fechando menu');
                    uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
                }}
                onDeletar={() => handleDeleteToken(uiState.menuContexto.tokenIndice)}
                onOcultar={() => handleToggleVisibility(uiState.menuContexto.tokenId)}
                onBloquear={() => handleToggleLock(uiState.menuContexto.tokenId)}
            />
        </>
    );
}

export default TabletopGrid;