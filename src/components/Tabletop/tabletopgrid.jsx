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
    isMobileDevice,
    getStorageKey,
    loadSavedView,
    computeScreenInfo,
    showFeedback,
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
import { useImageDropPaste } from './HooksNovos/useImageDropPaste';
import { useHistoricoTokens } from './HooksNovos/useHistoricoTokens';
import { useInterpolacaoTokens } from './HooksNovos/useInterpolacaoTokens';
import { useP2PImageSync } from '../../p2p/useP2PImageSync';
import { useNuvemFOV } from './NuvemFOV';
import { useMouseTabletop } from './MouseTabletop';
import { useMobileTabletop } from './Mobile/MobileTabletop';
import { useTabletopTokens } from '../../hooks/useTabletopTokens';
import { useRotacaoToken } from './useRotacaoToken';
import socket from '../../utils/socket';

function TabletopGrid({ isMaster = true, sheetId = null, playerName = null }) {
    const [isClient, setIsClient] = useState(false);
    const [modalTokenAberto, setModalTokenAberto] = useState(false);
    const [menuNevoaAberto, setMenuNevoaAberto] = useState(false);
    const [menuNevoaPosicao, setMenuNevoaPosicao] = useState({ x: 0, y: 0 });
    const tabletopId = 'default';

    useEffect(() => {
        setIsClient(true);
    }, []);

    const savedView = useMemo(
        () => loadSavedView(tabletopId, isMaster, sheetId, playerName),
        [tabletopId, isMaster, sheetId, playerName]
    );
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
    const dbInitializedRef = useRef(false);

    useEffect(() => {
        tokensLocalRef.current = tokensLocal;
    }, [tokensLocal]);

    // Inicializa tokensLocal com dados do banco na primeira carga.
    // Usa ref para evitar condição de corrida com StrictMode (double-mount).
    useEffect(() => {
        if (tokens.length > 0 && !dbInitializedRef.current) {
            dbInitializedRef.current = true;
            setTokensLocal(tokens);
            console.log(`[TabletopGrid] Inicializado com ${tokens.length} tokens do banco`);

            tokens.forEach((token) => {
                if (token.bloqueado) {
                    despacharUI({
                        type: 'SET_TOKEN_BLOCK',
                        payload: { tokenId: token.id, bloqueado: true },
                    });
                }
            });
        }
    }, [tokens]);

    // Interpolação OBR-style: suaviza movimento de tokens remotos
    const interpolacao = useInterpolacaoTokens();

    // P2P WebRTC: compartilha imagens de tokens diretamente entre peers
    // (sem custo de banda do servidor)
    const p2p = useP2PImageSync({
        socket,
        tabletopId,
        onTokenImageReceived: useCallback((tokenId, imageUrl) => {
            setTokensLocal((prev) =>
                prev.map((t) =>
                    (t.id === tokenId || t.tokenId === tokenId)
                        ? { ...t, imageUrl, imageBase64: null } // imageUrl P2P substitui base64
                        : t
                )
            );
        }, []),
    });

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
        onAnimateTarget: interpolacao.animateTo,
    });

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
    const uiStateRef = useRef(estadoUI);

    // Mantem uiStateRef sempre sincronizado com o estadoUI atual.
    // Essencial para evitar stale closure nos handlers de touch/mouse
    // que precisam de zoom e position atualizados em tempo real.
    useEffect(() => {
        uiStateRef.current = estadoUI;
    }, [estadoUI]);

    // Hook para histórico de undo/redo de tokens
    const {
        tokensHistorico,
        canUndo: canUndoTokens,
        canRedo: canRedoTokens,
        handleUndo: handleUndoTokens,
        handleRedo: handleRedoTokens,
        capturarAcao,
        iniciarCapturaArrasto,
        finalizarCapturaArrasto,
        atualizarToken: atualizarTokenComHistorico,
        emitirTokenMoved: emitirTokenMovedComHistorico,
        emitirTokenCreated: emitirTokenCreatedComHistorico,
        emitirTokenDeleted: emitirTokenDeletedComHistorico,
        emitirTokenVisibilityChanged: emitirTokenVisibilityChangedComHistorico,
        emitirTokenLockChanged: emitirTokenLockChangedComHistorico,
        emitirTokenInverted: emitirTokenInvertedComHistorico,
        emitirTokenZIndexChanged: emitirTokenZIndexChangedComHistorico
    } = useHistoricoTokens({
        isMaster,
        socket,
        tabletopId,
        tokensState: tokensLocal,
        setTokensDirect: setTokensLocal,
        atualizarToken,
        emitirTokenMoved,
        emitirTokenCreated,
        emitirTokenDeleted,
        emitirTokenVisibilityChanged,
        emitirTokenLockChanged,
        emitirTokenInverted,
        emitirTokenZIndexChanged
    });

    const { processarArrastoToken } = useMovimentoToken();

    const salvarToken = useCallback(
        (tokenId, dados) => {
            atualizarTokenComHistorico(tokenId, dados);
            if (socket?.connected) {
                emitirTokenMovedComHistorico(tokenId, dados);
                emitirDragEnd(tokenId);
            }
        },
        [atualizarTokenComHistorico, emitirTokenMovedComHistorico, emitirDragEnd, socket]
    );

    const { processarRedimensionamento, resizeStartStateRef, redimensionandoRef: redimensionandoRefHook, finalizarRedimensionamento } = useRedimensionamentoToken({
        salvarToken,
        emitirTokenMoved: emitirTokenMovedComHistorico,
        emitirDragEnd
    });

    const limitarPosicaoMapa = useCallback(
        (novaX, novaY, zoom = estadoUI.zoom) => {
            if (!containerRef.current) return { x: novaX, y: novaY };
            const rect = containerRef.current.getBoundingClientRect();
            const mundoLarguraZoom = WORLD_WIDTH * zoom;
            const mundoAlturaZoom = WORLD_HEIGHT * zoom;
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
        const z = estadoUI.zoom;
        const TARGET_SCREEN_SIZE = 150; // Tamanho alvo da célula na tela (px)

        // Calcula o tamanho real na tela de cada grid no zoom atual
        const allGrids = GRID_CONFIGS.map((config) => {
            const size = BASE_GRID_SIZE * config.sizeMultiplier;
            const screenSize = size * z;
            return { size, screenSize, ...config };
        });

        // Ordena do maior para o menor (sizeMultiplier decrescente)
        allGrids.sort((a, b) => b.sizeMultiplier - a.sizeMultiplier);

        // Encontra o grid PRIMÁRIO: aquele cujo tamanho na tela está mais próximo do alvo
        let primaryIdx = 0;
        let bestDiff = Infinity;
        for (let i = 0; i < allGrids.length; i++) {
            const diff = Math.abs(allGrids[i].screenSize - TARGET_SCREEN_SIZE);
            if (diff < bestDiff) {
                bestDiff = diff;
                primaryIdx = i;
            }
        }

        const strokeWidth = Math.max(0.5, 1 / z);
        const result = [];

        // Grid primário (célula dominante)
        result.push({
            size: allGrids[primaryIdx].size,
            alpha: allGrids[primaryIdx].alpha,
            strokeWidth,
            threshold: allGrids[primaryIdx].zoomThreshold,
        });

        // Sub-grid: o próximo nível menor (subdivisão 2x2 dentro de cada célula dominante)
        if (primaryIdx + 1 < allGrids.length) {
            const sub = allGrids[primaryIdx + 1];
            result.push({
                size: sub.size,
                alpha: sub.alpha,
                strokeWidth,
                threshold: sub.zoomThreshold,
            });
        }

        return result;
    }, [estadoUI.zoom]);

    const tokensInfo = useMemo(() => {
        return tokensLocal.map((token, indice) => {
            const info = computeScreenInfo(
                token, indice,
                estadoUI.zoom, estadoUI.position,
                estadoUI.tokensBloqueados,
                'token'
            );
            return {
                ...info,
                oculto: estadoUI.visibilidadeTokens[token.id] === true,
                estaSelecionado:
                    estadoUI.tokenSelecionado === indice ||
                    estadoUI.tokensSelecionados.includes(indice),
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

    const { RotateButton } = useRotacaoToken({
        tokenSelecionado: estadoUI.tokenSelecionado,
        zoom: estadoUI.zoom,
        tokensInfo,
        arrastando: !!estadoUI.tokenSendoArrastado,
        onGirar: (id, ang) => {
            setTokensLocal(prev => prev.map(t => t.id === id ? { ...t, rotacao: ang } : t));
            atualizarToken(id, { rotacao: ang }).catch(() => { });
            if (socket?.connected) {
                emitirTokenMovedComHistorico(id, { rotacao: ang });
            }
        },
        containerRef,   
    });

    const nevoa = useNuvemFOV({
        isMaster,
        socket,
        tabletopId,
        onRenderCallback: () => agendarRender(),
    });

    const camadasInfo = useMemo(() => {
        return nevoa.camadasNevoa.map((camada, indice) =>
            computeScreenInfo(
                camada, indice,
                estadoUI.zoom, estadoUI.position,
                estadoUI.camadasBloqueadas,
                'nevoa'
            )
        );
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
        if (contextRef.current) {
            contextRef.current.imageSmoothingEnabled = true;
            contextRef.current.imageSmoothingQuality = 'high';
        }
        return contextRef.current;
    }, []);

    const desenharGrade = useCallback(() => {
        const contexto = pegarContextoCanvas();
        if (!contexto) return;

        contexto.save();

        contexto.translate(estadoUI.position.x, estadoUI.position.y);
        contexto.scale(estadoUI.zoom, estadoUI.zoom);

        for (const grade of gradesVisiveis) {
            contexto.strokeStyle = `rgba(255, 255, 255, ${grade.alpha})`;
            contexto.lineWidth = grade.strokeWidth;

            const stepsX = Math.round(WORLD_WIDTH / grade.size);
            for (let i = 0; i <= stepsX; i++) {
                const x = i * grade.size;
                contexto.beginPath();
                contexto.moveTo(x, 0);
                contexto.lineTo(x, WORLD_HEIGHT);
                contexto.stroke();
            }

            const stepsY = Math.round(WORLD_HEIGHT / grade.size);
            for (let i = 0; i <= stepsY; i++) {
                const y = i * grade.size;
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
        desenharSelecao,
        interpolacao.getDisplayPosition  // interpolação OBR-style
    );

    useDragDropToken({
        isMaster,
        containerRef,
        setModalTokenAberto,
        criarToken,
        telaParaMundo,
        emitirTokenCreated: emitirTokenCreatedComHistorico,
        socket,
        onTokenCreated: (tokenCriado) => {
            setTokensLocal((prev) => [...prev, tokenCriado]);
        },
        onTokenImageReady: (tokenId, imageSource) => {
            p2p.shareTokenImage(tokenId, imageSource);
        },
    });

    // Hook para drag & drop de imagens do SO e Ctrl+V (paste) direto no tabletop
    useImageDropPaste({
        isMaster,
        containerRef,
        criarToken,
        telaParaMundo,
        emitirTokenCreated: emitirTokenCreatedComHistorico,
        socket,
        onTokenCreated: (tokenOtimista) => {
            // UI otimista: token aparece instantaneamente
            setTokensLocal((prev) => [...prev, tokenOtimista]);
        },
        onTokenConfirmed: (tempId, tokenReal) => {
            // Servidor confirmou: substitui o temp pelo real (ou remove se falhou)
            setTokensLocal((prev) => {
                if (tokenReal === null) {
                    // Falhou: remove o token otimista
                    return prev.filter((t) => t.id !== tempId);
                }
                // Sucesso: substitui o token temporario pelo real do banco
                return prev.map((t) => (t.id === tempId ? { ...tokenReal, _otimista: false } : t));
            });
        },
        onTokenImageReady: (tokenId, imageSource) => {
            p2p.shareTokenImage(tokenId, imageSource);
        },
    });

    useEffect(() => {
        nevoa.setUIStateRef(estadoUI.zoom, estadoUI.position);
    }, [nevoa, estadoUI.zoom, estadoUI.position]);

    const desenharItemArrastado = useCallback(
        (contexto, arrastandoState, offsetIndice, nomeFallback, cor) => {
            if (!arrastandoState) return;
            const itemInfo = todosItens[offsetIndice + arrastandoState.indice];
            if (!itemInfo) return;
            desenharBordaDeArrasto(
                contexto,
                itemInfo.posicaoTela.x,
                itemInfo.posicaoTela.y,
                itemInfo.tamanhoTela.larguraTela,
                itemInfo.tamanhoTela.alturaTela,
                nomeFallback,
                cor
            );
        },
        [todosItens]
    );

    const desenharArrastoProprio = useCallback(
        (contexto) => {
            desenharItemArrastado(
                contexto,
                estadoUI.tokenSendoArrastado,
                0,
                (todosItens[estadoUI.tokenSendoArrastado?.indice]?.nome || ''),
                getCorSheet(sheetId)
            );
            desenharItemArrastado(
                contexto,
                estadoUI.camadaSendoArrastada,
                tokensInfo.length,
                'Névoa'
            );
        },
        [estadoUI, todosItens, tokensInfo.length, sheetId, desenharItemArrastado]
    );

    const desenharSelecoes = useCallback(
        (contexto) => {
            const { zoom, tokensSelecionados, tokenSelecionado, tokenSendoArrastado,
                camadasSelecionadas, camadaSelecionada, camadaSendoArrastada,
                tokenRedimensionando, camadaRedimensionando, areaSelecao } = estadoUI;

            // --- Helper: bounding box de um item individual ---
            const bboxDoItem = (item) => item ? {
                x: item.posicaoTela.x,
                y: item.posicaoTela.y,
                largura: item.tamanhoTela.larguraTela,
                altura: item.tamanhoTela.alturaTela,
            } : null;

            // --- Helper: filtro de itens válidos (não bloqueados, tipo esperado) ---
            const itemValido = (item, tipo) =>
                item && !item.bloqueado && item.tipo === tipo && (isMaster || !item.oculto);

            // --- Grupo de tokens ---
            if (tokensSelecionados.length > 1) {
                const itens = tokensSelecionados
                    .map((i) => todosItens[i])
                    .filter((item) => itemValido(item, 'token'));
                if (itens.length > 0) {
                    desenharSelecao(contexto, calcularBoundingBoxGrupo(itens), zoom, itens.length, true);
                }
            }

            // --- Token individual (se não estiver em grupo) ---
            if (tokenSelecionado !== null && !tokenSendoArrastado && !camadaSendoArrastada
                && tokensSelecionados.length <= 1) {
                const item = todosItens[tokenSelecionado];
                if (itemValido(item, 'token')) {
                    if (!isMaster && item.oculto) return; // preserva early-exit original
                    desenharSelecao(contexto, bboxDoItem(item), zoom, 1, true,
                        item.escala, item.rotacao, !!tokenRedimensionando);
                }
            }

            // --- Grupo de camadas de névoa ---
            if (camadasSelecionadas.length > 1) {
                const offset = tokensInfo.length;
                const itens = camadasSelecionadas
                    .map((i) => todosItens[offset + i])
                    .filter((item) => itemValido(item, 'nevoa'));
                if (itens.length > 0) {
                    desenharSelecao(contexto, calcularBoundingBoxGrupo(itens), zoom, itens.length, true);
                }
            }

            // --- Camada de névoa individual ---
            if (camadaSelecionada !== null && !camadaSendoArrastada && !tokenSendoArrastado) {
                const item = todosItens[tokensInfo.length + camadaSelecionada];
                if (itemValido(item, 'nevoa')) {
                    desenharSelecao(contexto, bboxDoItem(item), zoom, 1, true,
                        item.escala, 0, !!camadaRedimensionando);
                }
            }

            // --- Área de seleção retangular (arrasto do mouse) ---
            if (areaSelecao.ativo) {
                desenharSelecao(contexto, {
                    x: Math.min(areaSelecao.inicioX, areaSelecao.fimX),
                    y: Math.min(areaSelecao.inicioY, areaSelecao.fimY),
                    largura: Math.abs(areaSelecao.fimX - areaSelecao.inicioX),
                    altura: Math.abs(areaSelecao.fimY - areaSelecao.inicioY),
                }, zoom, 1, false);
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

        // Tick de interpolação OBR-style: atualiza posições display dos tokens remotos
        interpolacao.tick(performance.now());

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = container.getBoundingClientRect();
        const widthCSS = rect.width;
        const heightCSS = rect.height;

        if (canvas.width !== widthCSS * dpr || canvas.height !== heightCSS * dpr) {
            canvas.width = widthCSS * dpr;
            canvas.height = heightCSS * dpr;
            canvas.style.width = widthCSS + 'px';
            canvas.style.height = heightCSS + 'px';
        }

        const contexto = pegarContextoCanvas();
        if (!contexto) return;

        contexto.clearRect(0, 0, canvas.width, canvas.height);
        contexto.setTransform(dpr, 0, 0, dpr, 0, 0);

        desenharGrade();

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
        interpolacao,
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

            setTokensLocal((prev) =>
                prev.map((t) =>
                    t.id === tokenId ? { ...t, zIndex: novoZIndex } : t
                )
            );

            atualizarTokenComHistorico(tokenId, { zIndex: novoZIndex })
                .then(() => {
                    if (socket?.connected) {
                        emitirTokenZIndexChangedComHistorico(tokenId, novoZIndex);
                    }
                })
                .catch((err) => {
                    console.error('[TabletopGrid] Erro ao atualizar token:', err);
                });
        },
        [tokensLocal, setTokensLocal, atualizarTokenComHistorico, socket, emitirTokenZIndexChangedComHistorico]
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
        uiStateRef,  // ref sempre atualizada, evita stale closure
        uiDispatch: despacharUI,
        tokensState: tokensLocal,
        tokensComInfo: tokensInfo,
        camadasComInfo: camadasInfo,
        converterMouseParaMundo: telaParaMundo,
        verificarSeMouseSobreToken,
        tokenEstaNaAreaSelecao,
        restringirPosicao: limitarPosicaoMapa,
        processarArrastoToken,
        processarRedimensionamento,
        setStateDirect: setTokensLocal,
        atualizarToken: atualizarTokenComHistorico,
        socket: socket,
        tabletopId: tabletopId,
        emitirSelecao: emitirSelecao,
        emitirDragStart: emitirDragStart,
        emitirDragEnd: emitirDragEnd,
        emitirTokenMoved: emitirTokenMovedComHistorico,
        fov: nevoa,
        trazerTokenParaFrente: handleTrazerParaFrente,
        finalizarRedimensionamento,
        redimensionandoRef: redimensionandoRefHook,
        isMaster,
        iniciarCapturaArrasto,
        finalizarCapturaArrasto,
        salvarToken,
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
        tokenEstaNaAreaSelecao,
        limitarPosicaoMapa,
        processarArrastoToken,
        processarRedimensionamento,
        setTokensLocal,
        atualizarTokenComHistorico,
        socket,
        tabletopId,
        emitirSelecao,
        emitirDragStart,
        emitirDragEnd,
        emitirTokenMovedComHistorico,
        nevoa,
        handleTrazerParaFrente,
        finalizarRedimensionamento,
        redimensionandoRefHook,
        isMaster,
        iniciarCapturaArrasto,
        finalizarCapturaArrasto,
        salvarToken,
    ]);

    const isMobile = isMobileDevice();
    const mouseEvents = useMouseTabletop(commonProps);
    const mobileEvents = useMobileTabletop(commonProps);
    const { handleMouseDown, handleMouseMove, handleMouseUp } = isMobile ? mobileEvents : mouseEvents;

    const createHistoryHandler = useCallback(
        (actionFn, successMsg, emptyMsg) => () => {
            if (!isMaster) {
                showFeedback(despacharUI, 'Histórico não disponível para jogadores', 'warning');
                return;
            }
            const resultado = actionFn();
            if (resultado) {
                showFeedback(despacharUI, successMsg, 'success');
            } else {
                showFeedback(despacharUI, emptyMsg, 'info');
            }
        },
        [isMaster, despacharUI]
    );

    const handleUndo = useMemo(
        () => createHistoryHandler(handleUndoTokens, 'Ação desfeita', 'Nada para desfazer'),
        [createHistoryHandler, handleUndoTokens]
    );

    const handleRedo = useMemo(
        () => createHistoryHandler(handleRedoTokens, 'Ação refeita', 'Nada para refazer'),
        [createHistoryHandler, handleRedoTokens]
    );

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
        estadoUI.tokenRedimensionando,
        estadoUI.camadaRedimensionando,
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
        nevoa.camadasNevoa,
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
        container.addEventListener('contextmenu', (e) => e.preventDefault());

        if (isMobile) {
            // Touch events para mobile
            container.addEventListener('touchstart', handleMouseDown, { passive: false });
            container.addEventListener('touchmove', handleMouseMove, { passive: false });
            container.addEventListener('touchend', handleMouseUp, { passive: false });
            container.addEventListener('touchcancel', handleMouseUp, { passive: false });
        } else {
            // Mouse events para desktop
            container.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('contextmenu', (e) => e.preventDefault());

            if (isMobile) {
                container.removeEventListener('touchstart', handleMouseDown);
                container.removeEventListener('touchmove', handleMouseMove);
                container.removeEventListener('touchend', handleMouseUp);
                container.removeEventListener('touchcancel', handleMouseUp);
            } else {
                container.removeEventListener('mousedown', handleMouseDown);
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            }
        };
    }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, isMobile]);

    useEffect(() => {
        if (!estadoUI.menuContexto.aberto) return;

        const handleClickFora = (event) => {
            if (event.button === 2) return;
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                despacharUI({ type: 'CLOSE_CONTEXT_MENU' });
            }
        };

        document.addEventListener('mousedown', handleClickFora);
        document.addEventListener('touchstart', handleClickFora);
        return () => {
            document.removeEventListener('mousedown', handleClickFora);
            document.removeEventListener('touchstart', handleClickFora);
        };
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
                            onAbrirModal={() => setModalTokenAberto(prev => !prev)}
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
                {RotateButton}
            </GridContainer>

            <MenuContextoToken
                ref={menuRef}
                aberto={estadoUI.menuContexto.aberto}
                x={estadoUI.menuContexto.x}
                y={estadoUI.menuContexto.y}
                tokenId={estadoUI.menuContexto.tokenId}
                camadaId={estadoUI.menuContexto.camadaId}
                tipo={estadoUI.menuContexto.tipo || 'token'}
                grupoSelecionado={estadoUI.menuContexto.grupoSelecionado || []}
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
                atualizarToken={atualizarTokenComHistorico}
                socket={socket}
                tabletopId={tabletopId}
                nevoa={nevoa}
                despacharUI={despacharUI}
                emitirTokenDeleted={emitirTokenDeletedComHistorico}
                emitirTokenVisibilityChanged={emitirTokenVisibilityChangedComHistorico}
                emitirTokenLockChanged={emitirTokenLockChangedComHistorico}
                emitirTokenInverted={emitirTokenInvertedComHistorico}
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
            {/* REMOVIDO: segundo {RotateButton} que ficava fora do GridContainer */}
        </>
    );
}

export default TabletopGrid;