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

// Importa as paradas da mesa
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

// Componente principal da mesa
function TabletopGrid() {
    console.log('🏁 [TabletopGrid] INICIALIZANDO');
    console.log(`📏 Mundo configurado: ${WORLD_WIDTH} x ${WORLD_HEIGHT} pixels`);
    console.log(`🔲 Grade base: ${BASE_GRID_SIZE}px, células: ${WORLD_WIDTH/BASE_GRID_SIZE} x ${WORLD_HEIGHT/BASE_GRID_SIZE}`);

    const [modalOpen, setModalOpen] = useState(false);
    console.log(`📂 modalOpen: ${modalOpen}`);

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
    
    console.log(`🎲 tokensState inicializado, total: ${tokensState.length}`);

    const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);
    console.log(`🎛️ uiState inicializado`);

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

    // Controle de clique vs arrasto
    const cliqueDireitoTimerRef = useRef(null);
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

        const resultado = {
            x: clamp(newX, rect.width - worldWidthScaled, 0),
            y: clamp(newY, rect.height - worldHeightScaled, 0)
        };
        
        console.log(`🔄 [restringirPosicao]`, {
            novoX: newX,
            novoY: newY,
            limitadoX: resultado.x,
            limitadoY: resultado.y,
            zoom: uiState.zoom,
            mundoEscalado: `${worldWidthScaled.toFixed(0)} x ${worldHeightScaled.toFixed(0)}`,
            tela: `${rect.width.toFixed(0)} x ${rect.height.toFixed(0)}`
        });
        
        return resultado;
    }, [uiState.zoom]);

    // Converte pixel da tela pra coordenada do mundo
    const converterMouseParaMundo = useCallback((mouseX, mouseY) => {
        const resultado = {
            mundoX: (mouseX - uiState.position.x) / uiState.zoom,
            mundoY: (mouseY - uiState.position.y) / uiState.zoom
        };
        
        console.log(`🖱️ [converterMouseParaMundo]`, {
            mouse: { x: mouseX, y: mouseY },
            camera: uiState.position,
            zoom: uiState.zoom,
            mundo: resultado
        });
        
        return resultado;
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
        const grids = GRID_CONFIGS
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
            
        console.log(`📐 [visibleGrids] zoom: ${uiState.zoom.toFixed(2)}, grades visíveis: ${grids.length}`);
        return grids;
    }, [uiState.zoom]);

    // Prepara os tokens com informacoes de tela
    const tokensComInfo = useMemo(() => {
        console.log(`🔄 [tokensComInfo] Calculando posições de ${tokensState.length} tokens`);
        
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
        
        if (tokens.length > 0) {
            console.log(`📊 Exemplo primeiro token:`, {
                nome: tokens[0].nome,
                posMundo: { x: tokens[0].x, y: tokens[0].y },
                posTela: tokens[0].posicaoTela,
                tamanhoTela: tokens[0].tamanhoTela.larguraTela.toFixed(0) + 'x' + tokens[0].tamanhoTela.alturaTela.toFixed(0)
            });
        }
        
        return tokens;
    }, [tokensState, uiState.zoom, uiState.position, uiState.visibilidadeTokens,
        uiState.tokensBloqueados, uiState.tokenSelecionado, uiState.tokensSelecionados]);

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

        console.log(`🖌️ [getCanvasContext] Novo contexto criado`);
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

    // Render principal
    const renderGridToCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();

        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            console.log(`📏 [render] Redimensionando canvas: ${rect.width} x ${rect.height}`);
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        const context = getCanvasContext();
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(1, 0, 0, 1, 0, 0);

        drawGrid();

        for (let i = 0; i < tokensComInfo.length; i++) {
            const token = tokensComInfo[i];
            drawTokenWithCache(token, i, context);
        }

        // Desenha selecao multipla
        if (uiState.tokensSelecionados.length > 1) {
            const tokensSelecionadosInfo = uiState.tokensSelecionados
                .map(indice => tokensComInfo[indice])
                .filter(token => token && !token.bloqueado);

            if (tokensSelecionadosInfo.length > 0) {
                desenharSelecao(context, tokensSelecionadosInfo, uiState.zoom, 'grupo', true);
            }
        }

        // Desenha area de selecao
        if (uiState.areaSelecao.ativo) {
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
        
        console.log(`✅ [render] Frame renderizado, câmera: (${uiState.position.x.toFixed(0)}, ${uiState.position.y.toFixed(0)}) zoom: ${uiState.zoom.toFixed(2)}`);
    }, [tokensComInfo, drawGrid, drawTokenWithCache, getCanvasContext, uiState.areaSelecao,
        uiState.tokensSelecionados, uiState.zoom, desenharSelecao]);

    useEffect(() => {
        renderGridToCanvasRef.current = renderGridToCanvas;
    }, [renderGridToCanvas]);

    // Eventos do mouse
    const { handleWheel, handleDragOver } = useEventosMouse(uiState, uiDispatch, containerRef, dragStartRef, restringirPosicao);

    const handleMouseDown = useCallback((event) => {
        if (uiState.ignoreMouseMove) {
            uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: false });
        }

        // Botao direito
        if (event.button === 2) {
            event.preventDefault();

            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'direito');

            if (tokenSobre) {
                const tokenBloqueado = uiState.tokensBloqueados[tokenSobre.token.id] === true;

                if (tokenBloqueado) {
                    console.log(`🔒 [mouseDown] Token BLOQUEADO: ${tokenSobre.token.nome}`);
                    isRightClickDragRef.current = false;

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
                } else {
                    console.log(`✅ [mouseDown] Token: ${tokenSobre.token.nome}`);
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
                console.log(`🗺️ [mouseDown] Iniciando arrasto do mapa`);
                uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
                dragStartRef.current = {
                    x: event.clientX - uiState.position.x,
                    y: event.clientY - uiState.position.y
                };
            }
            return;
        }

        // Botao esquerdo
        if (event.button === 0) {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            teveMovimentoRef.current = false;

            // Grupo selecionado
            if (uiState.tokensSelecionados.length > 1) {
                console.log(`👥 [mouseDown] Grupo selecionado: ${uiState.tokensSelecionados.length} tokens`);
                const tokensSelecionadosInfo = uiState.tokensSelecionados
                    .map(indice => tokensComInfo[indice])
                    .filter(token => token && !token.bloqueado);

                if (tokensSelecionadosInfo.length > 0) {
                    // Calcula bounding box do grupo
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                    tokensSelecionadosInfo.forEach(token => {
                        minX = Math.min(minX, token.posicaoTela.x);
                        minY = Math.min(minY, token.posicaoTela.y);
                        maxX = Math.max(maxX, token.posicaoTela.x + token.tamanhoTela.larguraTela);
                        maxY = Math.max(maxY, token.posicaoTela.y + token.tamanhoTela.alturaTela);
                    });

                    // Ve se clicou em algum token do grupo
                    const tokenClicadoDoGrupo = tokensSelecionadosInfo.find(token =>
                        mouseX >= token.posicaoTela.x &&
                        mouseX <= token.posicaoTela.x + token.tamanhoTela.larguraTela &&
                        mouseY >= token.posicaoTela.y &&
                        mouseY <= token.posicaoTela.y + token.tamanhoTela.alturaTela
                    );

                    if (tokenClicadoDoGrupo) {
                        console.log(`🎯 [mouseDown] Movendo grupo`);
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

                    // Ve se clicou na borda do grupo (redimensionamento)
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

                    if (mouseNaBorda) {
                        console.log(`📏 [mouseDown] Redimensionando grupo`);
                        // Bounding box em coordenadas de mundo
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

            // Redimensionamento individual
            if (uiState.tokenSelecionado !== null) {
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

                    if (canto) {
                        console.log(`📏 [mouseDown] Redimensionando token individual: ${token.nome}`);
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

            // Clique em token individual
            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'esquerdo');

            if (tokenSobre) {
                const tokenBloqueado = uiState.tokensBloqueados[tokenSobre.token.id] === true;

                if (tokenBloqueado) {
                    console.log(`🔒 [mouseDown] Token bloqueado: ${tokenSobre.token.nome}`);
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

                if (canto) {
                    console.log(`📏 [mouseDown] Redimensionando token: ${tokenSobre.token.nome}`);
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

                if (tokenJaSelecionado && uiState.tokensSelecionados.length > 0) {
                    console.log(`🎯 [mouseDown] Movendo token já selecionado: ${tokenSobre.token.nome}`);
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
                    console.log(`🎯 [mouseDown] Movendo token: ${tokenSobre.token.nome}`);
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
                console.log(`🟦 [mouseDown] Clique em área vazia`);
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

            // Inicia selecao por area
            if (uiState.mouseDownInfo?.isBlankArea && !uiState.ui.isSelectingArea && !uiState.ui.isDragging) {
                console.log(`🔲 [mouseMove] Iniciando seleção por área`);
                uiDispatch({
                    type: 'START_AREA_SELECTION',
                    payload: {
                        x: uiState.mouseDownInfo.mouseX,
                        y: uiState.mouseDownInfo.mouseY
                    }
                });
            }

            // Token bloqueado vira arrasto do mapa
            if (uiState.mouseDownInfo?.isBlocked && !uiState.ui.isDragging && !uiState.ui.isSelectingArea) {
                console.log(`🗺️ [mouseMove] Token bloqueado -> arrasto do mapa`);
                uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
                dragStartRef.current = {
                    x: event.clientX - uiState.position.x,
                    y: event.clientY - uiState.position.y
                };
                isRightClickDragRef.current = true;
            }

            // Selecao por area
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

            // Arrastando token(s)
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

            // Redimensionando token(s)
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

            // Arrastando mapa
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
        if (dragInProgressRef.current && (uiState.tokenSendoArrastado || uiState.tokensSelecionados.length > 0)) {
            console.log(`🏁 [finalizarArrasto] Salvando movimento no histórico`);
            const novosTokens = [...tokensState];
            pushTokens(novosTokens);

            uiDispatch({
                type: 'SET_FEEDBACK',
                payload: {
                    message: uiState.tokensSelecionados.length > 1 ? 'Tokens movidos' : 'Token movido',
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
        if (resizeInProgressRef.current && uiState.tokenRedimensionando) {
            console.log(`🏁 [finalizarRedimensionamento] Salvando redimensionamento no histórico`);
            const novosTokens = [...tokensState];
            pushTokens(novosTokens);
            resizeInProgressRef.current = false;
            resizeStartStateRef.current = null;
        }
    }, [tokensState, uiState.tokenRedimensionando, pushTokens, resizeStartStateRef]);

    const handleMouseUp = useCallback((event) => {
        console.log(`🖱️ [mouseUp] Botão: ${event.button}`);

        // Botao direito
        if (event.button === 2) {
            if (uiState.mouseDownInfo?.isBlocked) {
                if (!isRightClickDragRef.current) {
                    console.log(`📋 [mouseUp] Abrindo menu de token bloqueado`);
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

            if (uiState.mouseDownInfo && uiState.ui.isClickingToken && uiState.mouseDownInfo.isRightClick && !uiState.mouseDownInfo.isBlocked) {
                console.log(`📋 [mouseUp] Abrindo menu de token`);
                const tokenSobre = uiState.mouseDownInfo.token;

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

            isRightClickDragRef.current = false;
        }

        // Botao esquerdo
        if (event.button === 0) {
            if (uiState.mouseDownInfo?.isBlankArea && !uiState.ui.isSelectingArea) {
                console.log(`🟦 [mouseUp] Desselecionando tokens`);
                uiDispatch({ type: 'SELECT_TOKEN', payload: null });
            }

            if (uiState.ui.isSelectingArea) {
                console.log(`🔲 [mouseUp] Finalizando seleção por área`);
                uiDispatch({ type: 'END_AREA_SELECTION' });

                if (uiState.tokensSelecionados.length === 0) {
                    uiDispatch({ type: 'SELECT_TOKEN', payload: null });
                }
            }

            if (isDraggingRef.current || dragInProgressRef.current) {
                finalizarArrasto();
                isDraggingRef.current = false;
            }

            if (resizeInProgressRef.current || uiState.tokenRedimensionando) {
                finalizarRedimensionamento();
            }
        }

        if (uiState.tokenRedimensionando) {
            uiDispatch({ type: 'STOP_RESIZE' });
        }

        if (uiState.ui.isDragging) {
            uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: false } });
        }

        if (uiState.tokenSendoArrastado) {
            uiDispatch({ type: 'STOP_TOKEN_DRAG' });
        }

        uiDispatch({ type: 'SET_MOUSE_DOWN_INFO', payload: null });
        uiDispatch({ type: 'SET_UI_STATE', payload: { isClickingToken: false } });
    }, [uiState, finalizarArrasto, finalizarRedimensionamento, uiDispatch]);

    const handleDrop = useCallback((event) => {
        console.log(`📥 [handleDrop] Drop detectado`);
        event.preventDefault();
        event.stopPropagation();

        try {
            const dados = JSON.parse(event.dataTransfer.getData('application/json'));
            console.log(`📦 Dados do drop:`, dados);

            if (dados.origem !== 'grid' && dados.tipo === 'token') {
                console.log(`✅ Token válido para adicionar à mesa`);
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

                console.log(`✨ Novo token criado em: (${novoToken.x.toFixed(0)}, ${novoToken.y.toFixed(0)})`);

                const novosTokens = [...tokensState, novoToken];
                pushTokens(novosTokens);
                console.log(`📊 Total de tokens agora: ${novosTokens.length}`);
            }
        } catch (erro) {
            console.log(`❌ Erro no drop:`, erro);
        }
    }, [tokensState, pushTokens, converterMouseParaMundo]);

    const handleUndo = useCallback(() => {
        console.log(`↩️ [undo] canUndo: ${canUndo}`);
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
        console.log(`↪️ [redo] canRedo: ${canRedo}`);
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
        console.log(`🎨 [useEffect] Inicializando canvas`);
        getCanvasContext();
        return () => {
            console.log(`🧹 [useEffect] Limpando canvas`);
            contextRef.current = null;
        };
    }, [getCanvasContext]);

    useEffect(() => {
        console.log(`🔄 [useEffect] Agendando render`);
        scheduleRender();
    }, [tokensComInfo, uiState.tokenSendoArrastado, uiState.ui.usuarioInteragindo,
        uiState.tokenSelecionado, uiState.zoom, uiState.position, uiState.areaSelecao,
        uiState.tokensSelecionados, scheduleRender]);

    useEffect(() => {
        scheduleRender();
    }, [uiState.visibilidadeTokens, scheduleRender]);

    useEffect(() => {
        if (uiState.ui.mostrarFeedback) {
            console.log(`💬 Feedback: ${uiState.ui.feedbackMessage}`);
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

        console.log(`🎧 [useEffect] Event listeners configurados`);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            console.log(`🧹 [useEffect] Event listeners removidos`);
        };
    }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

    // Fecha menu ao clicar fora
    useEffect(() => {
        if (!uiState.menuContexto.aberto) return;

        const handleClickFora = (event) => {
            if (event.button === 2) return;
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                console.log(`❌ [menu] Fechando menu por clique fora`);
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
                console.log(`🗑️ Removendo imagem do cache: ${id}`);
                imageCache.current.delete(id);
            }
        }
    }, [tokensState]);

    // Sistema de drag and drop
    useEffect(() => {
        console.log(`📦 [DragDrop] Registrando TabletopGrid`);
        DragDropSystem.register('TabletopGrid', containerRef.current, (dados, event) => {
            if (dados.tipo === 'token') {
                console.log(`📥 [DragDrop] Callback recebido para token`);
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

                console.log(`✨ Token criado via DragDropSystem: ${novoToken.nome}`);
                const novosTokens = [...tokensState, novoToken];
                pushTokens(novosTokens);
            }
        });

        return () => {
            console.log(`🧹 [DragDrop] Removendo TabletopGrid`);
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
        console.log(`🗑️ [handleDeleteToken] Deletando token índice: ${tokenIndice}`);
        const novosTokens = tokensState.filter((_, i) => i !== tokenIndice);
        pushTokens(novosTokens);
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
    }, [tokensState, pushTokens, uiDispatch]);

    const handleToggleVisibility = useCallback((tokenId) => {
        console.log(`👁️ [handleToggleVisibility] Token: ${tokenId}`);
        uiDispatch({ type: 'TOGGLE_VISIBILITY', payload: tokenId });
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
    }, [uiDispatch]);

    const handleToggleLock = useCallback((tokenId) => {
        console.log(`🔒 [handleToggleLock] Token: ${tokenId}`);
        uiDispatch({ type: 'TOGGLE_LOCK', payload: tokenId });
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });

        const estaBloqueado = !uiState.tokensBloqueados[tokenId];

        uiDispatch({
            type: 'SET_FEEDBACK',
            payload: {
                message: estaBloqueado ? 'Token bloqueado' : 'Token desbloqueado',
                type: estaBloqueado ? 'warning' : 'success'
            }
        });
    }, [uiState.tokensBloqueados, uiDispatch]);

    return (
        <>
            <GridContainer
                containerRef={containerRef}
                isDragging={uiState.ui.isDragging}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <BarraLateral onAbrirModal={() => {
                    console.log(`📂 [BarraLateral] Abrindo modal`);
                    setModalOpen(true);
                }} />
                <CanvasDesenho canvasRef={canvasRef} />
                <TokenModal
                    open={modalOpen}
                    onClose={() => {
                        console.log(`❌ [TokenModal] Fechando modal`);
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
                    console.log(`❌ [Menu] Fechando`);
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