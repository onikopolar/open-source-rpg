import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
    useReducer,
} from 'react';
import TokenModal from '../TokenModal/TokenModal';
import {
    GridContainer,
    BarraLateral,
    CanvasDesenho,
    desenharBordaDeArrasto,
    desenharFallbackToken,
    desenharSelecao,
    getCorSheet,
} from '../TabletopDesign';
import { ModalNevoa } from './ModalNevoa';
import { MenuContextoToken } from './MenuContextoToken';
import {
    WORLD_WIDTH,
    WORLD_HEIGHT,
    TOLERANCIA_CLIQUE,
    RENDER_INTERVAL,
    BASE_GRID_SIZE,
    GRID_CONFIGS,
    clamp,
} from './ConstantesMesa';
import { initialUIState, uiReducer } from './RedutorUI';
import { useMovimentoToken } from './useMovimentoToken';
import { useRedimensionamentoToken } from './useRedimensionamentoToken';
import { useEventosMouse } from './useEventosMouse';
import { useAtalhosTeclado } from './useAtalhosTeclado';
import {
    useSelecaoToken,
    calcularBoundingBoxGrupo,
} from './useSelecaoToken';
import { useRenderizacaoToken } from './useRenderizacaoToken';
import { useSincronizacaoTokens } from './HooksNovos/useSincronizacaoTokens';
import { useDragDropToken } from './HooksNovos/useDragDropToken';
import { useNuvemFOV } from './NuvemFOV';
import { useMouseTabletop } from './MouseTabletop';
import { useMobileTabletop } from './Mobile/MobileTabletop';
import { useTabletopTokens } from '../../hooks/useTabletopTokens';
import socket from '../../utils/socket';

const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    const mobileRegex = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i;
    return mobileRegex.test(navigator.userAgent) || window.innerWidth < 768;
};

const getStorageKey = (tabletopId, isMaster, sheetId, playerName) => {
    const userPart = isMaster ? 'master' : `player_${sheetId || playerName || 'anon'}`;
    return `tabletop_view_${tabletopId}_${userPart}`;
};

function TabletopGrid({ isMaster = true, sheetId = null, playerName = null }) {
    const [isClient, setIsClient] = useState(false);
    const [modalTokenAberto, setModalTokenAberto] = useState(false);
    const [menuNevoaAberto, setMenuNevoaAberto] = useState(false);
    const [menuNevoaPosicao, setMenuNevoaPosicao] = useState({ x: 0, y: 0 });
    const tabletopId = 'default';

    useEffect(() => {
        setIsClient(true);
    }, []);

    const loadSavedView = useCallback(() => {
        try {
            const key = getStorageKey(tabletopId, isMaster, sheetId, playerName);
            const saved = localStorage.getItem(key);
            if (saved) {
                const { zoom, position } = JSON.parse(saved);
                return { zoom: zoom ?? 1, position: position ?? { x: 0, y: 0 } };
            }
        } catch (e) { }
        return { zoom: 1, position: { x: 0, y: 0 } };
    }, [tabletopId, isMaster, sheetId, playerName]);

    const savedView = loadSavedView();
    const customInitialState = {
        ...initialUIState,
        zoom: savedView.zoom,
        position: savedView.position,
    };
    const [estadoUI, despacharUI] = useReducer(uiReducer, customInitialState);

    useEffect(() => {
        try {
            const key = getStorageKey(tabletopId, isMaster, sheetId, playerName);
            localStorage.setItem(key, JSON.stringify({
                zoom: estadoUI.zoom,
                position: estadoUI.position,
            }));
        } catch (e) { }
    }, [estadoUI.zoom, estadoUI.position, tabletopId, isMaster, sheetId, playerName]);

    const {
        tokens,
        loading: tokensLoading,
        criarToken,
        atualizarToken,
        deletarToken,
    } = useTabletopTokens();

    const [tokensLocal, setTokensLocal] = useState([]);
    const tokensLocalRef = useRef(tokensLocal);

    useEffect(() => {
        tokensLocalRef.current = tokensLocal;
    }, [tokensLocal]);

    const {
        arrastosRemotos,
        emitirSelecao,
        emitirDeselecao,
        emitirDragStart,
        emitirDragEnd,
        emitirTokenMoved,
        emitirTokenCreated,
        emitirTokenDeleted,
        emitirTokenVisibilityChanged,
        emitirTokenLockChanged,
        emitirTokenInverted,
        emitirTokenZIndexChanged,
    } = useSincronizacaoTokens({
        socket,
        tabletopId,
        isMaster,
        sheetId,
        playerName,
        tokensLocalRef,
        onTokenUpdate: (data, transform) => {
            setTokensLocal((prev) => transform(prev));
        },
        onUIUpdate: (action) => {
            despacharUI(action);
        },
    });

    useEffect(() => {
        if (tokens.length > 0 && tokensLocal.length === 0) {
            const tokensOrdenados = [...tokens].sort(
                (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
            );
            setTokensLocal(tokensOrdenados);

            tokensOrdenados.forEach((token) => {
                if (token.bloqueado) {
                    despacharUI({
                        type: 'SET_TOKEN_BLOCK',
                        payload: { tokenId: token.id, bloqueado: true },
                    });
                }
            });
        }
    }, [tokens]);

    const menuAbertoTimestampRef = useRef(0);
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
    const { processarRedimensionamento, resizeStartStateRef, redimensionandoRef: redimensionandoRefHook, finalizarRedimensionamento } = useRedimensionamentoToken({
        salvarToken: (tokenId, dados) => {
            atualizarToken(tokenId, dados);
            if (socket?.connected) {
                emitirTokenMoved(tokenId, dados);
                emitirDragEnd(tokenId);
            }
        },
        emitirTokenMoved,
        emitirDragEnd
    });

    const limitarPosicaoMapa = useCallback(
        (novaX, novaY) => {
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
            return { x: xLimitado, y: yLimitado };
        },
        [estadoUI.zoom]
    );

    const telaParaMundo = useCallback(
        (mouseX, mouseY) => {
            const x = (mouseX - estadoUI.position.x) / estadoUI.zoom;
            const y = (mouseY - estadoUI.position.y) / estadoUI.zoom;
            return { x, y };
        },
        [estadoUI.position, estadoUI.zoom]
    );

    const estaDentroDoElemento = useCallback(
        (mouseX, mouseY, elemX, elemY, largura, altura) => {
            return (
                mouseX >= elemX - TOLERANCIA_CLIQUE &&
                mouseX <= elemX + largura + TOLERANCIA_CLIQUE &&
                mouseY >= elemY - TOLERANCIA_CLIQUE &&
                mouseY <= elemY + altura + TOLERANCIA_CLIQUE
            );
        },
        []
    );

    const gradesVisiveis = useMemo(() => {
        return GRID_CONFIGS.filter((config) => estadoUI.zoom >= config.zoomThreshold).map(
            (config, index, array) => {
                const strokeWidth = Math.max(0.5, 1 / estadoUI.zoom);
                const baseSize = BASE_GRID_SIZE * config.sizeMultiplier;
                let alpha = config.alpha;

                if (index > 0) {
                    const configAnterior = array[index - 1];
                    const rangeTransicao = (config.zoomThreshold - configAnterior.zoomThreshold) * 0.2;
                    const inicioFade = config.zoomThreshold - rangeTransicao;
                    if (
                        estadoUI.zoom > inicioFade &&
                        estadoUI.zoom < config.zoomThreshold + rangeTransicao
                    ) {
                        const progresso = (estadoUI.zoom - inicioFade) / (rangeTransicao * 2);
                        alpha = config.alpha * Math.min(1, Math.max(0, progresso));
                    }
                }

                return { size: baseSize, alpha, strokeWidth };
            }
        );
    }, [estadoUI.zoom]);

    const tokensInfo = useMemo(() => {
        return tokensLocal.map((token, indice) => {
            const larguraOriginal = token.larguraOriginal || 50;
            const alturaOriginal = token.alturaOriginal || 50;
            const escala = token.escala || 1;

            const posicaoTela = {
                x: token.x * estadoUI.zoom + estadoUI.position.x,
                y: token.y * estadoUI.zoom + estadoUI.position.y,
            };

            const larguraMundo = larguraOriginal * escala;
            const alturaMundo = alturaOriginal * escala;
            const larguraTela = larguraMundo * estadoUI.zoom;
            const alturaTela = alturaMundo * estadoUI.zoom;

            const estaSelecionado =
                estadoUI.tokenSelecionado === indice ||
                estadoUI.tokensSelecionados.includes(indice);
            const estaBloqueado = estadoUI.tokensBloqueados[token.id] === true;
            const estaOculto = estadoUI.visibilidadeTokens[token.id] === true;

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
                    alturaTela,
                },
                oculto: estaOculto,
                bloqueado: estaBloqueado,
                estaSelecionado,
                tipo: 'token',
            };
        });
    }, [
        tokensLocal,
        estadoUI.zoom,
        estadoUI.position,
        estadoUI.visibilidadeTokens,
        estadoUI.tokensBloqueados,
        estadoUI.tokenSelecionado,
        estadoUI.tokensSelecionados,
    ]);

    const nevoa = useNuvemFOV({
        isMaster,
        socket,
        tabletopId,
        onRenderCallback: () => agendarRender(),
    });

    const camadasInfo = useMemo(() => {
        return nevoa.camadasNevoa.map((camada, indice) => {
            const larguraMundo = camada.larguraOriginal * camada.escala;
            const alturaMundo = camada.alturaOriginal * camada.escala;

            const posicaoTela = {
                x: camada.x * estadoUI.zoom + estadoUI.position.x,
                y: camada.y * estadoUI.zoom + estadoUI.position.y,
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
                    alturaTela,
                },
                bloqueado: estadoUI.camadasBloqueadas?.[camada.id] === true,
                tipo: 'nevoa',
            };
        });
    }, [
        nevoa.camadasNevoa,
        estadoUI.zoom,
        estadoUI.position,
        estadoUI.camadasBloqueadas,
    ]);

    const todosItens = useMemo(() => {
        return [...tokensInfo, ...camadasInfo];
    }, [tokensInfo, camadasInfo]);

    const {
        verificarSeMouseSobreToken,
        verificarSeMousePodeRedimensionar,
        tokenEstaNaAreaSelecao,
    } = useSelecaoToken(tokensLocal, tokensInfo, estadoUI, estaDentroDoElemento);

    const pegarContextoCanvas = useCallback(() => {
        if (contextRef.current) return contextRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return null;
        contextRef.current = canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true,
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

    const { renderizarTokens } = useRenderizacaoToken(
        estadoUI,
        cacheImagens,
        pegarContextoCanvas,
        agendarRender,
        desenharFallbackToken,
        desenharBordaDeArrasto,
        desenharSelecao
    );

    useDragDropToken({
        isMaster,
        containerRef,
        setModalTokenAberto,
        criarToken,
        telaParaMundo,
        emitirTokenCreated,
        socket,
    });

    useEffect(() => {
        nevoa.setUIStateRef(estadoUI.zoom, estadoUI.position);
    }, [nevoa, estadoUI.zoom, estadoUI.position]);

    const desenharArrastoProprio = useCallback(
        (contexto) => {
            if (estadoUI.tokenSendoArrastado) {
                const itemInfo = todosItens[estadoUI.tokenSendoArrastado.indice];
                if (itemInfo) {
                    const nome = itemInfo.tipo === 'token' ? itemInfo.nome || 'Token' : 'Névoa';
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
                        'Névoa'
                    );
                }
            }
        },
        [estadoUI, todosItens, tokensInfo.length, sheetId]
    );

    const desenharSelecoes = useCallback(
        (contexto) => {
            if (estadoUI.tokensSelecionados.length > 1) {
                const itensSelecionados = estadoUI.tokensSelecionados
                    .map((indice) => todosItens[indice])
                    .filter((item) => {
                        if (!item || item.bloqueado || item.tipo !== 'token') return false;
                        if (!isMaster && item.oculto) return false;
                        return true;
                    });

                if (itensSelecionados.length > 0) {
                    const boundingBox = calcularBoundingBoxGrupo(itensSelecionados);
                    desenharSelecao(
                        contexto,
                        boundingBox,
                        estadoUI.zoom,
                        itensSelecionados.length,
                        true
                    );
                }
            }

            if (
                estadoUI.tokenSelecionado !== null &&
                !estadoUI.tokenSendoArrastado &&
                !estadoUI.camadaSendoArrastada
            ) {
                const itemInfo = todosItens[estadoUI.tokenSelecionado];
                if (itemInfo && !itemInfo.bloqueado && itemInfo.tipo === 'token') {
                    if (!isMaster && itemInfo.oculto) {
                        return;
                    }
                    const isPartOfGroup = estadoUI.tokensSelecionados.length > 1;
                    if (!isPartOfGroup) {
                        const boundingBox = {
                            x: itemInfo.posicaoTela.x,
                            y: itemInfo.posicaoTela.y,
                            largura: itemInfo.tamanhoTela.larguraTela,
                            altura: itemInfo.tamanhoTela.alturaTela,
                        };
                        desenharSelecao(contexto, boundingBox, estadoUI.zoom, 1, true);
                    }
                }
            }

            if (estadoUI.camadasSelecionadas.length > 1) {
                const itensSelecionados = estadoUI.camadasSelecionadas
                    .map((indice) => todosItens[tokensInfo.length + indice])
                    .filter((item) => item && item.tipo === 'nevoa');

                if (itensSelecionados.length > 0) {
                    const boundingBox = calcularBoundingBoxGrupo(itensSelecionados);
                    desenharSelecao(
                        contexto,
                        boundingBox,
                        estadoUI.zoom,
                        itensSelecionados.length,
                        true
                    );
                }
            }

            if (
                estadoUI.camadaSelecionada !== null &&
                !estadoUI.camadaSendoArrastada &&
                !estadoUI.tokenSendoArrastado
            ) {
                const itemInfo = todosItens[tokensInfo.length + estadoUI.camadaSelecionada];
                if (itemInfo && itemInfo.tipo === 'nevoa') {
                    const boundingBox = {
                        x: itemInfo.posicaoTela.x,
                        y: itemInfo.posicaoTela.y,
                        largura: itemInfo.tamanhoTela.larguraTela,
                        altura: itemInfo.tamanhoTela.alturaTela,
                    };
                    desenharSelecao(contexto, boundingBox, estadoUI.zoom, 1, true);
                }
            }

            if (estadoUI.areaSelecao.ativo) {
                const boundingBox = {
                    x: Math.min(estadoUI.areaSelecao.inicioX, estadoUI.areaSelecao.fimX),
                    y: Math.min(estadoUI.areaSelecao.inicioY, estadoUI.areaSelecao.fimY),
                    largura: Math.abs(
                        estadoUI.areaSelecao.fimX - estadoUI.areaSelecao.inicioX
                    ),
                    altura: Math.abs(
                        estadoUI.areaSelecao.fimY - estadoUI.areaSelecao.inicioY
                    ),
                };
                desenharSelecao(contexto, boundingBox, estadoUI.zoom, 1, false);
            }
        },
        [estadoUI, todosItens, tokensInfo.length, isMaster]
    );

    const desenharArrastoRemoto = useCallback(
        (contexto) => {
            if (arrastosRemotos && Object.keys(arrastosRemotos).length > 0) {
                Object.entries(arrastosRemotos).forEach(([tokenId, arrasto]) => {
                    const tokenIndex = tokensLocal.findIndex((t) => t.id === tokenId);
                    if (tokenIndex === -1) return;

                    const tokenInfo = todosItens[tokenIndex];
                    if (!tokenInfo || tokenInfo.bloqueado) return;

                    if (!isMaster && tokenInfo.oculto) return;

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
        },
        [arrastosRemotos, tokensLocal, todosItens, isMaster]
    );

    const renderizarTudo = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
            console.log('[TabletopGrid] Canvas redimensionado:', { width: rect.width, height: rect.height });
        }

        const contexto = pegarContextoCanvas();
        if (!contexto) return;

        contexto.clearRect(0, 0, canvas.width, canvas.height);
        contexto.setTransform(1, 0, 0, 1, 0, 0);

        desenharGrade();

        console.log('[TabletopGrid] Desenhando tokens, total:', tokensInfo.length);
        renderizarTokens(contexto, todosItens, tokensInfo, isMaster);

        desenharArrastoProprio(contexto);
        desenharSelecoes(contexto);
        desenharArrastoRemoto(contexto);

        nevoa.renderizarNevoa(contexto, estadoUI.zoom, estadoUI.position);
    }, [
        todosItens,
        tokensInfo,
        isMaster,
        desenharGrade,
        renderizarTokens,
        pegarContextoCanvas,
        desenharArrastoProprio,
        desenharSelecoes,
        desenharArrastoRemoto,
        nevoa,
        estadoUI.zoom,
        estadoUI.position,
    ]);

    useEffect(() => {
        renderCallbackRef.current = renderizarTudo;
    }, [renderizarTudo]);

    useEffect(() => {
        const agora = Date.now();
        const tempoDesdeAbertura = agora - menuAbertoTimestampRef.current;

        if (estadoUI.menuContexto.aberto && tempoDesdeAbertura < 300) {
            return;
        }

        if (
            estadoUI.menuContexto.aberto &&
            (estadoUI.ui.isDragging ||
                estadoUI.tokenSendoArrastado ||
                estadoUI.camadaSendoArrastada)
        ) {
            despacharUI({ type: 'CLOSE_CONTEXT_MENU' });
        }
    }, [
        estadoUI.ui.isDragging,
        estadoUI.tokenSendoArrastado,
        estadoUI.camadaSendoArrastada,
        estadoUI.menuContexto.aberto,
        despacharUI,
    ]);

    useEffect(() => {
        if (estadoUI.menuContexto.aberto) {
            menuAbertoTimestampRef.current = Date.now();
        }
    }, [estadoUI.menuContexto.aberto]);

    const { handleWheel, handleDragOver } = useEventosMouse(
        estadoUI,
        despacharUI,
        containerRef,
        inicioArrastoRef,
        limitarPosicaoMapa
    );

    const handleTrazerParaFrente = useCallback(
        (tokenId) => {
            const token = tokensLocal.find((t) => t.id === tokenId);
            if (!token) return;

            const maxZIndex = Math.max(...tokensLocal.map((t) => t.zIndex || 0), 0);
            const novoZIndex = maxZIndex + 1;

            atualizarToken(tokenId, { zIndex: novoZIndex })
                .then(() => {
                    if (socket?.connected) {
                        emitirTokenZIndexChanged(tokenId, novoZIndex);
                    }
                })
                .catch((err) => {
                    console.error('[TabletopGrid] Erro ao atualizar token:', err);
                });
        },
        [tokensLocal, atualizarToken, socket, emitirTokenZIndexChanged]
    );

    const commonProps = useMemo(() => ({
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
        emitirDragEnd: emitirDragEnd,
        emitirTokenMoved: emitirTokenMoved,
        fov: nevoa,
        trazerTokenParaFrente: handleTrazerParaFrente,
        finalizarRedimensionamento,
        redimensionandoRef: redimensionandoRefHook,
        isMaster,
        salvarToken: (tokenId, dados) => {
            atualizarToken(tokenId, dados);
            if (socket?.connected) {
                emitirTokenMoved(tokenId, dados);
                emitirDragEnd(tokenId);
            }
        },
    }), [
        containerRef,
        inicioArrastoRef,
        resizeStartStateRef,
        estaArrastandoRef,
        arrastoEmProgressoRef,
        redimensionandoRef,
        teveMovimentoRef,
        isRightClickDragRef,
        frameAnimacaoRef,
        estadoUI,
        despacharUI,
        tokensLocal,
        tokensInfo,
        camadasInfo,
        telaParaMundo,
        verificarSeMouseSobreToken,
        verificarSeMousePodeRedimensionar,
        tokenEstaNaAreaSelecao,
        limitarPosicaoMapa,
        processarArrastoToken,
        processarRedimensionamento,
        setTokensLocal,
        atualizarToken,
        socket,
        tabletopId,
        emitirSelecao,
        emitirDragStart,
        emitirDragEnd,
        emitirTokenMoved,
        nevoa,
        handleTrazerParaFrente,
        finalizarRedimensionamento,
        redimensionandoRefHook,
        isMaster,
    ]);

    const isMobile = isMobileDevice();
    const mouseEvents = useMouseTabletop(commonProps);
    const mobileEvents = useMobileTabletop(commonProps);
    const { handleMouseDown, handleMouseMove, handleMouseUp } = isMobile ? mobileEvents : mouseEvents;

    const handleUndo = useCallback(() => {
        despacharUI({
            type: 'SET_FEEDBACK',
            payload: { message: 'Histórico não disponível em modo online', type: 'warning' },
        });
        setTimeout(() => despacharUI({ type: 'RESET_UI_FEEDBACK' }), 1000);
    }, [despacharUI]);

    const handleRedo = useCallback(() => {
        despacharUI({
            type: 'SET_FEEDBACK',
            payload: { message: 'Histórico não disponível em modo online', type: 'warning' },
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
    }, [
        todosItens,
        estadoUI.tokenSendoArrastado,
        estadoUI.camadaSendoArrastada,
        estadoUI.tokenSelecionado,
        estadoUI.camadaSelecionada,
        estadoUI.zoom,
        estadoUI.position,
        estadoUI.areaSelecao,
        estadoUI.tokensSelecionados,
        estadoUI.camadasSelecionadas,
        estadoUI.visibilidadeTokens,
        estadoUI.tokensBloqueados,
        arrastosRemotos,
        agendarRender,
    ]);

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
        const idsTokens = new Set(tokensLocal.map((t) => t.id));
        for (const [id] of cacheImagens.current.entries()) {
            if (!idsTokens.has(id)) {
                cacheImagens.current.delete(id);
            }
        }
    }, [tokensLocal]);

    useEffect(() => {
        return () => {
            if (ignoreMouseTimeoutRef.current) {
                clearTimeout(ignoreMouseTimeoutRef.current);
            }
        };
    }, []);

    if (!isClient) {
        return <div style={{ width: '100%', height: '100%', backgroundColor: '#1a1a1a' }} />;
    }

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
                            modoDesenhoAtivo={nevoa.modoDesenho}
                        />
                        <TokenModal open={modalTokenAberto} onClose={() => setModalTokenAberto(false)} />
                    </>
                ) : null}

                <CanvasDesenho canvasRef={canvasRef} />
            </GridContainer>

            <MenuContextoToken
                ref={menuRef}
                aberto={estadoUI.menuContexto.aberto}
                x={estadoUI.menuContexto.x}
                y={estadoUI.menuContexto.y}
                tokenId={estadoUI.menuContexto.tokenId}
                camadaId={estadoUI.menuContexto.camadaId}
                tipo={estadoUI.menuContexto.tipo || 'token'}
                tokenNome={
                    estadoUI.menuContexto.tipo === 'nevoa'
                        ? 'Camada de Névoa'
                        : estadoUI.menuContexto.token?.nome || 'Token'
                }
                estaOculto={
                    estadoUI.menuContexto.tipo === 'nevoa'
                        ? false
                        : estadoUI.visibilidadeTokens[estadoUI.menuContexto.tokenId] === true
                }
                estaBloqueado={
                    estadoUI.menuContexto.tipo === 'nevoa'
                        ? estadoUI.camadasBloqueadas?.[estadoUI.menuContexto.camadaId] === true
                        : estadoUI.tokensBloqueados[estadoUI.menuContexto.tokenId] === true
                }
                isMaster={isMaster}
                onFechar={() => despacharUI({ type: 'CLOSE_CONTEXT_MENU' })}
                deletarToken={deletarToken}
                atualizarToken={atualizarToken}
                socket={socket}
                tabletopId={tabletopId}
                nevoa={nevoa}
                despacharUI={despacharUI}
                emitirTokenDeleted={emitirTokenDeleted}
                emitirTokenVisibilityChanged={emitirTokenVisibilityChanged}
                emitirTokenLockChanged={emitirTokenLockChanged}
                emitirTokenInverted={emitirTokenInverted}
                tokensLocal={tokensLocal}
                setTokensLocal={setTokensLocal}
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