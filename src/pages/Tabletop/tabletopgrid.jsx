// pages/testetabletop/tabletopgrid.jsx
import { useState, useRef, useEffect, useCallback, useMemo, useReducer } from "react";
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
    desenharAreaSelecao
} from "../../components/TabletopDesign";

// CONSTANTES DO SISTEMA
const BASE_GRID_SIZE = 50;
const CELLS_X = 200;
const CELLS_Y = 200;
const WORLD_WIDTH = BASE_GRID_SIZE * CELLS_X;
const WORLD_HEIGHT = BASE_GRID_SIZE * CELLS_Y;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const TOLERANCIA_CLIQUE = 0.1;
const RENDER_INTERVAL = 16;
const GRID_CONFIGS = [
    { zoomThreshold: 0, sizeMultiplier: 8, alpha: 0.08 },
    { zoomThreshold: 0.125, sizeMultiplier: 4, alpha: 0.06 },
    { zoomThreshold: 0.25, sizeMultiplier: 1, alpha: 0.10 },
    { zoomThreshold: 2.0, sizeMultiplier: 0.5, alpha: 0.07 },
    { zoomThreshold: 3.0, sizeMultiplier: 0.25, alpha: 0.05 }
];

// HOOK DE UNDO/REDO
class UndoRedoManager {
    constructor(initialState) {
        this.history = [initialState];
        this.future = [];
    }

    push(newState) {
        this.history.push(newState);
        this.future = [];
    }

    undo() {
        if (this.history.length < 2) return null;
        const currentState = this.history.pop();
        this.future.push(currentState);
        return this.history[this.history.length - 1];
    }

    redo() {
        if (this.future.length === 0) return null;
        const nextState = this.future.pop();
        this.history.push(nextState);
        return nextState;
    }

    canUndo() {
        return this.history.length > 1;
    }

    canRedo() {
        return this.future.length > 0;
    }
}

function useUndoRedo(initialState) {
    const managerRef = useRef(null);

    if (!managerRef.current) {
        managerRef.current = new UndoRedoManager(initialState);
    }

    const [state, setState] = useState(initialState);

    const setStateDirect = useCallback((newState) => {
        setState(newState);
    }, []);

    const push = useCallback((newState) => {
        managerRef.current.push(newState);
        setState(newState);
    }, []);

    const undo = useCallback(() => {
        const previousState = managerRef.current.undo();
        if (previousState) {
            setState(previousState);
        }
        return previousState;
    }, []);

    const redo = useCallback(() => {
        const nextState = managerRef.current.redo();
        if (nextState) {
            setState(nextState);
        }
        return nextState;
    }, []);

    return {
        state,
        push,
        undo,
        redo,
        canUndo: managerRef.current.canUndo(),
        canRedo: managerRef.current.canRedo(),
        setStateDirect
    };
}

// FUNÇÕES UTILITÁRIAS
const clamp = (valor, minimo, maximo) => {
    return Math.min(Math.max(valor, minimo), maximo);
};

const calcularDistancia = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const calcularNovaEscalaToken = (
    mouseWorldX, mouseWorldY,
    tokenX, tokenY,
    larguraBase, alturaBase,
    modo,
    tamanhoInicial,
    escalaMaxima = Infinity
) => {
    let novaLargura = tamanhoInicial.largura;
    let novaAltura = tamanhoInicial.altura;

    if (modo === 'se') {
        novaLargura = Math.max(10, mouseWorldX - tokenX);
        novaAltura = Math.max(10, mouseWorldY - tokenY);
    } else if (modo === 'sw') {
        novaLargura = Math.max(10, tokenX + (larguraBase * tamanhoInicial.escala) - mouseWorldX);
        novaAltura = Math.max(10, mouseWorldY - tokenY);
    } else if (modo === 'ne') {
        novaLargura = Math.max(10, mouseWorldX - tokenX);
        novaAltura = Math.max(10, tokenY + (alturaBase * tamanhoInicial.escala) - mouseWorldY);
    } else if (modo === 'nw') {
        novaLargura = Math.max(10, tokenX + (larguraBase * tamanhoInicial.escala) - mouseWorldX);
        novaAltura = Math.max(10, tokenY + (alturaBase * tamanhoInicial.escala) - mouseWorldY);
    }

    const escalaX = novaLargura / larguraBase;
    const escalaY = novaAltura / alturaBase;
    const menorEscala = Math.min(escalaX, escalaY);
    const resultado = escalaMaxima === Infinity
        ? Math.max(0.1, menorEscala)
        : clamp(menorEscala, 0.1, escalaMaxima);

    return resultado;
};

// Função para calcular o bounding box de um grupo de tokens
const calcularBoundingBoxGrupo = (tokens) => {
    if (!tokens || tokens.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    tokens.forEach(token => {
        minX = Math.min(minX, token.x);
        minY = Math.min(minY, token.y);
        maxX = Math.max(maxX, token.x + (token.larguraOriginal * token.escala));
        maxY = Math.max(maxY, token.y + (token.alturaOriginal * token.escala));
    });

    return {
        x: minX,
        y: minY,
        largura: maxX - minX,
        altura: maxY - minY,
        larguraBase: maxX - minX,
        alturaBase: maxY - minY,
        // Também retorna o token virtual para usar nas funções de detecção
        tokenVirtual: {
            x: minX,
            y: minY,
            larguraOriginal: maxX - minX,
            alturaOriginal: maxY - minY,
            escala: 1
        }
    };
};

const trazerTokenParaFrente = (tokens, indiceToken) => {
    if (indiceToken < 0 || indiceToken >= tokens.length) {
        return tokens;
    }

    const novosTokens = [...tokens];
    const [tokenSelecionado] = novosTokens.splice(indiceToken, 1);
    novosTokens.push(tokenSelecionado);

    return novosTokens;
};

// REDUCER UI
const initialUIState = {
    zoom: 1,
    position: { x: 0, y: 0 },
    tokenSelecionado: null,
    tokensSelecionados: [],
    tokenSendoArrastado: null,
    tokenRedimensionando: null,
    modoRedimensionamento: null,
    tamanhoInicialRedimensionamento: { largura: 0, altura: 0, escala: 1 },
    boundingBoxGrupo: null,
    offsetArrasto: { x: 0, y: 0 },
    visibilidadeTokens: {},
    tokensBloqueados: {},
    areaSelecao: {
        ativo: false,
        inicioX: 0,
        inicioY: 0,
        fimX: 0,
        fimY: 0
    },
    menuContexto: {
        aberto: false,
        x: 0,
        y: 0,
        tokenIndice: null,
        tokenId: null,
        token: null
    },
    ui: {
        usuarioInteragindo: null,
        mostrarFeedback: false,
        isDragging: false,
        isClickingToken: false,
        isSelectingArea: false,
        feedbackMessage: null,
        feedbackType: null
    },
    mouseDownInfo: null,
    dragStartPosition: null,
    ignoreMouseMove: false
};

function uiReducer(state, action) {
    switch (action.type) {
        case 'SET_ZOOM':
            return { ...state, zoom: clamp(action.payload, MIN_ZOOM, MAX_ZOOM) };

        case 'SET_POSITION':
            return { ...state, position: action.payload };

        case 'SELECT_TOKEN':
            if (action.payload === null) {
                return {
                    ...state,
                    tokenSelecionado: null,
                    tokensSelecionados: []
                };
            }
            return {
                ...state,
                tokenSelecionado: action.payload,
                tokensSelecionados: []
            };

        case 'SELECT_MULTIPLE_TOKENS':
            return {
                ...state,
                tokensSelecionados: action.payload,
                tokenSelecionado: action.payload.length > 0 ? action.payload[0] : null
            };

        case 'START_TOKEN_DRAG':
            if (!action.payload.tokenInfo?.token) {
                return state;
            }
            return {
                ...state,
                tokenSendoArrastado: action.payload.tokenInfo,
                offsetArrasto: action.payload.offset,
                dragStartPosition: {
                    x: action.payload.tokenInfo.token.x,
                    y: action.payload.tokenInfo.token.y
                }
            };

        case 'STOP_TOKEN_DRAG':
            return {
                ...state,
                tokenSendoArrastado: null,
                offsetArrasto: { x: 0, y: 0 }
            };

        case 'START_RESIZE':
            return {
                ...state,
                tokenRedimensionando: { 
                    token: action.payload.token, 
                    indice: action.payload.indice,
                    isGroupResize: action.payload.isGroupResize || false 
                },
                modoRedimensionamento: action.payload.canto,
                tamanhoInicialRedimensionamento: action.payload.tamanhoInicial,
                boundingBoxGrupo: action.payload.boundingBoxGrupo || null,
                offsetArrasto: action.payload.offset
            };

        case 'STOP_RESIZE':
            return {
                ...state,
                tokenRedimensionando: null,
                modoRedimensionamento: null,
                tamanhoInicialRedimensionamento: { largura: 0, altura: 0, escala: 1 },
                boundingBoxGrupo: null,
                offsetArrasto: { x: 0, y: 0 }
            };

        case 'TOGGLE_VISIBILITY':
            return {
                ...state,
                visibilidadeTokens: {
                    ...state.visibilidadeTokens,
                    [action.payload]: !state.visibilidadeTokens[action.payload]
                }
            };

        case 'TOGGLE_LOCK':
            return {
                ...state,
                tokensBloqueados: {
                    ...state.tokensBloqueados,
                    [action.payload]: !state.tokensBloqueados[action.payload]
                }
            };

        case 'OPEN_CONTEXT_MENU':
            return { ...state, menuContexto: action.payload };

        case 'CLOSE_CONTEXT_MENU':
            return {
                ...state,
                menuContexto: {
                    aberto: false,
                    x: 0,
                    y: 0,
                    tokenIndice: null,
                    tokenId: null,
                    token: null
                }
            };

        case 'SET_MOUSE_DOWN_INFO':
            return { ...state, mouseDownInfo: action.payload };

        case 'START_AREA_SELECTION':
            return {
                ...state,
                areaSelecao: {
                    ativo: true,
                    inicioX: action.payload.x,
                    inicioY: action.payload.y,
                    fimX: action.payload.x,
                    fimY: action.payload.y
                },
                ui: {
                    ...state.ui,
                    isSelectingArea: true
                }
            };

        case 'UPDATE_AREA_SELECTION':
            if (!state.areaSelecao.ativo) return state;
            return {
                ...state,
                areaSelecao: {
                    ...state.areaSelecao,
                    fimX: action.payload.x,
                    fimY: action.payload.y
                }
            };

        case 'END_AREA_SELECTION':
            return {
                ...state,
                areaSelecao: {
                    ativo: false,
                    inicioX: 0,
                    inicioY: 0,
                    fimX: 0,
                    fimY: 0
                },
                ui: {
                    ...state.ui,
                    isSelectingArea: false
                }
            };

        case 'SET_UI_STATE':
            return {
                ...state,
                ui: { ...state.ui, ...action.payload }
            };

        case 'SET_FEEDBACK':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    feedbackMessage: action.payload.message,
                    feedbackType: action.payload.type,
                    mostrarFeedback: true
                }
            };

        case 'RESET_UI_FEEDBACK':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    usuarioInteragindo: null,
                    mostrarFeedback: false,
                    feedbackMessage: null,
                    feedbackType: null
                }
            };

        case 'SET_IGNORE_MOUSE_MOVE':
            return {
                ...state,
                ignoreMouseMove: action.payload
            };

        default:
            return state;
    }
}

// COMPONENTE PRINCIPAL
function TabletopGrid() {
    const [modalOpen, setModalOpen] = useState(false);

    const {
        state: tokensState,
        push: pushTokens,
        undo,
        redo,
        canUndo,
        canRedo,
        setStateDirect
    } = useUndoRedo([]);

    const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);

    // REFS
    const isDraggingRef = useRef(false);
    const dragInProgressRef = useRef(false);
    const resizeInProgressRef = useRef(false);
    const resizeStartStateRef = useRef(null);
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

    // FUNÇÕES DE TRANSFORMAÇÃO
    const restringirPosicao = useCallback((newX, newY) => {
        if (!containerRef.current) {
            return { x: newX, y: newY };
        }

        const rect = containerRef.current.getBoundingClientRect();
        const worldWidthScaled = WORLD_WIDTH * uiState.zoom;
        const worldHeightScaled = WORLD_HEIGHT * uiState.zoom;

        return {
            x: clamp(newX, rect.width - worldWidthScaled, 0),
            y: clamp(newY, rect.height - worldHeightScaled, 0)
        };
    }, [uiState.zoom]);

    const converterMouseParaMundo = useCallback((mouseX, mouseY) => {
        return {
            mundoX: (mouseX - uiState.position.x) / uiState.zoom,
            mundoY: (mouseY - uiState.position.y) / uiState.zoom
        };
    }, [uiState.position, uiState.zoom]);

    const calcularSeMouseEstaDentro = useCallback((mouseX, mouseY, elemX, elemY, largura, altura) => {
        const TOLERANCIA = TOLERANCIA_CLIQUE;

        return mouseX >= elemX - TOLERANCIA &&
            mouseX <= elemX + largura + TOLERANCIA &&
            mouseY >= elemY - TOLERANCIA &&
            mouseY <= elemY + altura + TOLERANCIA;
    }, []);

    // MEMOS
    const visibleGrids = useMemo(() => {
        return GRID_CONFIGS
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
                    }
                }

                return { size: baseSize, alpha, strokeWidth };
            });
    }, [uiState.zoom]);

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
                estaSelecionado
            };
        });
    }, [tokensState, uiState.zoom, uiState.position, uiState.visibilidadeTokens,
        uiState.tokensBloqueados, uiState.tokenSelecionado, uiState.tokensSelecionados]);

    const verificarSeMouseSobreToken = useCallback((mouseX, mouseY, modo = 'esquerdo') => {
        if (modo === 'esquerdo') {
            for (let i = tokensComInfo.length - 1; i >= 0; i--) {
                const token = tokensComInfo[i];
                if (token.bloqueado) continue;

                const dentro = calcularSeMouseEstaDentro(
                    mouseX, mouseY,
                    token.posicaoTela.x, token.posicaoTela.y,
                    token.tamanhoTela.larguraTela, token.tamanhoTela.alturaTela
                );

                if (dentro) {
                    return {
                        token: tokensState[i],
                        indice: i,
                        ...token.tamanhoTela,
                        telaX: token.posicaoTela.x,
                        telaY: token.posicaoTela.y,
                        bloqueado: token.bloqueado
                    };
                }
            }
            return null;
        }

        if (modo === 'direito') {
            // Primeiro procura tokens não bloqueados
            for (let i = tokensComInfo.length - 1; i >= 0; i--) {
                const token = tokensComInfo[i];
                if (token.bloqueado) continue;

                const dentro = calcularSeMouseEstaDentro(
                    mouseX, mouseY,
                    token.posicaoTela.x, token.posicaoTela.y,
                    token.tamanhoTela.larguraTela, token.tamanhoTela.alturaTela
                );

                if (dentro) {
                    return {
                        token: tokensState[i],
                        indice: i,
                        ...token.tamanhoTela,
                        telaX: token.posicaoTela.x,
                        telaY: token.posicaoTela.y,
                        bloqueado: token.bloqueado
                    };
                }
            }

            // Se não achou, procura qualquer token (incluindo bloqueados)
            for (let i = tokensComInfo.length - 1; i >= 0; i--) {
                const token = tokensComInfo[i];

                const dentro = calcularSeMouseEstaDentro(
                    mouseX, mouseY,
                    token.posicaoTela.x, token.posicaoTela.y,
                    token.tamanhoTela.larguraTela, token.tamanhoTela.alturaTela
                );

                if (dentro) {
                    return {
                        token: tokensState[i],
                        indice: i,
                        ...token.tamanhoTela,
                        telaX: token.posicaoTela.x,
                        telaY: token.posicaoTela.y,
                        bloqueado: token.bloqueado
                    };
                }
            }
            return null;
        }

        return null;
    }, [tokensComInfo, tokensState, calcularSeMouseEstaDentro]);

    // Verifica se o mouse está sobre as bolinhas de redimensionamento (para token individual OU grupo)
    const verificarSeMousePodeRedimensionar = useCallback((mouseX, mouseY, tokenTelaX, tokenTelaY, larguraTela, alturaTela, tokenBloqueado) => {
        if (tokenBloqueado) return null;

        const TAMANHO_BOLINHA = Math.max(8, 16 * uiState.zoom);
        const DISTANCIA_EXTERNA = Math.max(4, 8 * Math.min(uiState.zoom, 1));
        const RAIO = TAMANHO_BOLINHA / 2;

        const DETECT_MULTIPLIER = 1.5;
        const DETECT_RAIO = RAIO * DETECT_MULTIPLIER;

        const posicoes = [
            { nome: 'se', x: tokenTelaX + larguraTela + DISTANCIA_EXTERNA, y: tokenTelaY + alturaTela + DISTANCIA_EXTERNA },
            { nome: 'sw', x: tokenTelaX - DISTANCIA_EXTERNA, y: tokenTelaY + alturaTela + DISTANCIA_EXTERNA },
            { nome: 'ne', x: tokenTelaX + larguraTela + DISTANCIA_EXTERNA, y: tokenTelaY - DISTANCIA_EXTERNA },
            { nome: 'nw', x: tokenTelaX - DISTANCIA_EXTERNA, y: tokenTelaY - DISTANCIA_EXTERNA }
        ];

        for (const bolinha of posicoes) {
            if (mouseX >= (bolinha.x - DETECT_RAIO) && mouseX <= (bolinha.x + DETECT_RAIO) &&
                mouseY >= (bolinha.y - DETECT_RAIO) && mouseY <= (bolinha.y + DETECT_RAIO)) {
                return bolinha.nome;
            }
        }
        return null;
    }, [uiState.zoom]);

    const tokenEstaNaAreaSelecao = useCallback((token, area) => {
        if (!area.ativo) return false;

        const x1 = Math.min(area.inicioX, area.fimX);
        const x2 = Math.max(area.inicioX, area.fimX);
        const y1 = Math.min(area.inicioY, area.fimY);
        const y2 = Math.max(area.inicioY, area.fimY);

        const tokenX1 = token.posicaoTela.x;
        const tokenY1 = token.posicaoTela.y;
        const tokenX2 = token.posicaoTela.x + token.tamanhoTela.larguraTela;
        const tokenY2 = token.posicaoTela.y + token.tamanhoTela.alturaTela;

        return !(tokenX2 < x1 || tokenX1 > x2 || tokenY2 < y1 || tokenY1 > y2);
    }, []);

    // FUNÇÕES DE RENDERIZAÇÃO
    const getCanvasContext = useCallback(() => {
        if (contextRef.current) {
            return contextRef.current;
        }

        const canvas = canvasRef.current;
        if (!canvas) return null;

        contextRef.current = canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true
        });

        return contextRef.current;
    }, []);

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

    const drawSingleToken = useCallback((token, context) => {
        let img = imageCache.current.get(token.id);

        if (!img) {
            img = new Image();
            img.onload = () => {
                scheduleRender();
            };
            img.onerror = () => {
                console.log('❌ Erro ao carregar imagem:', token.nome);
            };
            img.src = token.imagemUrl;
            imageCache.current.set(token.id, img);

            desenharFallbackToken(
                context,
                token.posicaoTela.x,
                token.posicaoTela.y,
                uiState.zoom,
                token.nome
            );
            return false;
        }

        if (!img.complete) {
            desenharFallbackToken(
                context,
                token.posicaoTela.x,
                token.posicaoTela.y,
                uiState.zoom,
                token.nome
            );
            return false;
        }

        if (token.oculto) {
            context.globalAlpha = 0.3;
        }

        context.drawImage(
            img,
            token.posicaoTela.x,
            token.posicaoTela.y,
            token.tamanhoTela.larguraTela,
            token.tamanhoTela.alturaTela
        );

        context.globalAlpha = 1.0;
        return true;
    }, [uiState.zoom, scheduleRender]);

    const drawTokenWithCache = useCallback((token, indice, context) => {
        if (!context) {
            context = getCanvasContext();
            if (!context) return;
        }

        drawSingleToken(token, context);

        if (uiState.tokenSendoArrastado?.indice === indice) {
            desenharBordaDeArrasto(
                context,
                token.posicaoTela.x,
                token.posicaoTela.y,
                token.tamanhoTela.larguraTela,
                token.tamanhoTela.alturaTela,
                uiState.ui.usuarioInteragindo
            );
        }

        const tokenEstaSelecionado =
            uiState.tokenSelecionado === indice ||
            uiState.tokensSelecionados.includes(indice);

        // Desenha bolinhas de redimensionamento apenas para token individual selecionado
        if (tokenEstaSelecionado && !token.bloqueado && uiState.tokensSelecionados.length === 0) {
            desenharBolinhasRedimensionamento(
                context,
                token.posicaoTela.x,
                token.posicaoTela.y,
                token.tamanhoTela.larguraTela,
                token.tamanhoTela.alturaTela,
                uiState.zoom
            );
        }
    }, [uiState.zoom, uiState.tokenSendoArrastado, uiState.ui.usuarioInteragindo,
        uiState.tokenSelecionado, uiState.tokensSelecionados, getCanvasContext, drawSingleToken]);

    const renderGridToCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();

        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        const context = getCanvasContext();
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(1, 0, 0, 1, 0, 0);

        drawGrid();

        // Desenha todos os tokens
        for (let i = 0; i < tokensComInfo.length; i++) {
            const token = tokensComInfo[i];
            drawTokenWithCache(token, i, context);
        }

        // Desenha a borda do grupo (apenas visual, sem bolinhas de redimensionamento)
        if (uiState.tokensSelecionados.length > 1) {
            const tokensSelecionadosInfo = uiState.tokensSelecionados
                .map(indice => tokensComInfo[indice])
                .filter(token => token && !token.bloqueado);

            if (tokensSelecionadosInfo.length > 0) {
                // Desenha apenas a borda tracejada, sem bolinhas
                context.save();

                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                tokensSelecionadosInfo.forEach(token => {
                    minX = Math.min(minX, token.posicaoTela.x);
                    minY = Math.min(minY, token.posicaoTela.y);
                    maxX = Math.max(maxX, token.posicaoTela.x + token.tamanhoTela.larguraTela);
                    maxY = Math.max(maxY, token.posicaoTela.y + token.tamanhoTela.alturaTela);
                });

                const padding = 8;
                const x = minX - padding;
                const y = minY - padding;
                const width = (maxX - minX) + (padding * 2);
                const height = (maxY - minY) + (padding * 2);

                // Borda externa tracejada (apenas visual)
                ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 3]);
                ctx.strokeRect(x, y, width, height);
                ctx.setLineDash([]);

                // Texto com quantidade de tokens selecionados
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 4;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${tokensSelecionadosInfo.length} tokens selecionados`, x + width/2, y - 10);
                
                context.restore();
            }
        }

        if (uiState.areaSelecao.ativo) {
            desenharAreaSelecao(context, uiState.areaSelecao);
        }
    }, [tokensComInfo, drawGrid, drawTokenWithCache, getCanvasContext, uiState.areaSelecao,
        uiState.tokensSelecionados, uiState.zoom]);

    useEffect(() => {
        renderGridToCanvasRef.current = renderGridToCanvas;
    }, [renderGridToCanvas]);

    const processarArrastoToken = useCallback((
        mouseX,
        mouseY,
        tokenSendoArrastado,
        offsetArrasto,
        tokensAtuais,
        zoom,
        position,
        isGroupDrag = false,
        indicesGrupo = []
    ) => {
        if (!tokenSendoArrastado || !tokenSendoArrastado.token) {
            return tokensAtuais;
        }

        if (typeof offsetArrasto.x !== 'number' || typeof offsetArrasto.y !== 'number' ||
            isNaN(offsetArrasto.x) || isNaN(offsetArrasto.y)) {
            return tokensAtuais;
        }

        const mundo = {
            mundoX: (mouseX - position.x) / zoom,
            mundoY: (mouseY - position.y) / zoom
        };

        if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
            return tokensAtuais;
        }

        const posX = mundo.mundoX - (offsetArrasto.x / zoom);
        const posY = mundo.mundoY - (offsetArrasto.y / zoom);

        if (isNaN(posX) || isNaN(posY)) {
            return tokensAtuais;
        }

        const novosTokens = [...tokensAtuais];
        const tokenReferencia = tokensAtuais[tokenSendoArrastado.indice];

        if (!tokenReferencia) {
            return tokensAtuais;
        }

        if (isGroupDrag && indicesGrupo.length > 0) {
            const deltaX = posX - tokenReferencia.x;
            const deltaY = posY - tokenReferencia.y;

            if (isNaN(deltaX) || isNaN(deltaY)) {
                return tokensAtuais;
            }

            if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
                indicesGrupo.forEach(indice => {
                    if (novosTokens[indice]) {
                        novosTokens[indice] = {
                            ...novosTokens[indice],
                            x: novosTokens[indice].x + deltaX,
                            y: novosTokens[indice].y + deltaY
                        };
                    }
                });
            }
        } else {
            novosTokens[tokenSendoArrastado.indice] = {
                ...novosTokens[tokenSendoArrastado.indice],
                x: posX,
                y: posY
            };
        }

        return novosTokens;
    }, []);

    // Função ÚNICA de redimensionamento - usa a mesma lógica para token individual E grupo
    const processarRedimensionamento = useCallback((
        mouseX,
        mouseY,
        tokenRedimensionando,
        modoRedimensionamento,
        tamanhoInicial,
        boundingBoxGrupo,
        tokensAtuais,
        zoom,
        position,
        isGroupResize = false,
        indicesGrupo = []
    ) => {
        // Se for grupo, usa o bounding box como token virtual
        if (isGroupResize && indicesGrupo.length > 0 && boundingBoxGrupo) {
            const mundo = {
                mundoX: (mouseX - position.x) / zoom,
                mundoY: (mouseY - position.y) / zoom
            };

            if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
                return tokensAtuais;
            }

            // Calcula a nova escala usando a MESMA função do token individual
            const novaEscala = calcularNovaEscalaToken(
                mundo.mundoX, mundo.mundoY,
                boundingBoxGrupo.x, boundingBoxGrupo.y,
                boundingBoxGrupo.larguraBase, boundingBoxGrupo.alturaBase,
                modoRedimensionamento,
                {
                    largura: boundingBoxGrupo.largura,
                    altura: boundingBoxGrupo.altura,
                    escala: 1
                }
            );

            if (isNaN(novaEscala)) {
                return tokensAtuais;
            }

            // Aplica a MESMA escala para todos os tokens do grupo
            const novosTokens = [...tokensAtuais];
            
            indicesGrupo.forEach(indice => {
                if (novosTokens[indice]) {
                    novosTokens[indice] = {
                        ...novosTokens[indice],
                        escala: novaEscala  // MESMA lógica do token individual!
                    };
                }
            });

            return novosTokens;
        }

        // Redimensionamento individual (mesma lógica de antes)
        if (!tokenRedimensionando || !tokenRedimensionando.token) {
            return tokensAtuais;
        }

        const mundo = {
            mundoX: (mouseX - position.x) / zoom,
            mundoY: (mouseY - position.y) / zoom
        };

        if (isNaN(mundo.mundoX) || isNaN(mundo.mundoY)) {
            return tokensAtuais;
        }

        const novosTokens = [...tokensAtuais];
        const tokenAtual = tokensAtuais[tokenRedimensionando.indice];
        
        if (!tokenAtual) {
            return tokensAtuais;
        }

        const novaEscala = calcularNovaEscalaToken(
            mundo.mundoX, mundo.mundoY,
            tokenAtual.x, tokenAtual.y,
            tokenAtual.larguraOriginal || 50,
            tokenAtual.alturaOriginal || 50,
            modoRedimensionamento,
            tamanhoInicial
        );

        if (isNaN(novaEscala)) {
            return tokensAtuais;
        }

        novosTokens[tokenRedimensionando.indice] = {
            ...novosTokens[tokenRedimensionando.indice],
            escala: novaEscala
        };

        return novosTokens;
    }, []);

    const handleWheel = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const worldXBefore = (mouseX - uiState.position.x) / uiState.zoom;
        const worldYBefore = (mouseY - uiState.position.y) / uiState.zoom;

        const zoomSpeed = 0.1;
        const zoomFactor = event.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
        const newZoom = clamp(uiState.zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);

        if (uiState.zoom !== newZoom) {
            const worldXAfter = (mouseX - uiState.position.x) / newZoom;
            const worldYAfter = (mouseY - uiState.position.y) / newZoom;

            uiDispatch({ type: 'SET_ZOOM', payload: newZoom });
            uiDispatch({
                type: 'SET_POSITION',
                payload: restringirPosicao(
                    uiState.position.x + ((worldXAfter - worldXBefore) * newZoom),
                    uiState.position.y + ((worldYAfter - worldYBefore) * newZoom)
                )
            });
        }
    }, [uiState.zoom, uiState.position, restringirPosicao]);

    const handleMouseDown = useCallback((event) => {
        if (uiState.ignoreMouseMove) {
            uiDispatch({ type: 'SET_IGNORE_MOUSE_MOVE', payload: false });
        }

        if (event.button === 2) {
            event.preventDefault();

            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'direito');

            if (tokenSobre) {
                uiDispatch({
                    type: 'SET_MOUSE_DOWN_INFO',
                    payload: {
                        token: tokenSobre,
                        mouseX,
                        mouseY,
                        timestamp: Date.now(),
                        tokenIndice: tokenSobre.indice,
                        isRightClick: true
                    }
                });
                uiDispatch({ type: 'SET_UI_STATE', payload: { isClickingToken: true } });
            } else {
                uiDispatch({ type: 'SET_UI_STATE', payload: { isDragging: true } });
                dragStartRef.current = {
                    x: event.clientX - uiState.position.x,
                    y: event.clientY - uiState.position.y
                };
            }
            return;
        }

        if (event.button === 0) {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // PRIMEIRO: Verifica se tem grupo selecionado e se o mouse está na borda do grupo
            if (uiState.tokensSelecionados.length > 1) {
                const tokensSelecionadosInfo = uiState.tokensSelecionados
                    .map(indice => tokensComInfo[indice])
                    .filter(token => token && !token.bloqueado);

                if (tokensSelecionadosInfo.length > 0) {
                    // Calcula o bounding box do grupo em coordenadas de tela
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    
                    tokensSelecionadosInfo.forEach(token => {
                        minX = Math.min(minX, token.posicaoTela.x);
                        minY = Math.min(minY, token.posicaoTela.y);
                        maxX = Math.max(maxX, token.posicaoTela.x + token.tamanhoTela.larguraTela);
                        maxY = Math.max(maxY, token.posicaoTela.y + token.tamanhoTela.alturaTela);
                    });

                    const padding = 16; // Um padding maior para facilitar o clique na borda
                    const x = minX - padding;
                    const y = minY - padding;
                    const width = (maxX - minX) + (padding * 2);
                    const height = (maxY - minY) + (padding * 2);

                    // Verifica se o mouse está na área da borda do grupo
                    const mouseNaBorda = mouseX >= x && mouseX <= x + width &&
                                        mouseY >= y && mouseY <= y + height;

                    if (mouseNaBorda) {
                        // Calcula o bounding box em coordenadas de mundo para o redimensionamento
                        let minXMundo = Infinity, minYMundo = Infinity, maxXMundo = -Infinity, maxYMundo = -Infinity;
                        
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

                        // Usa o primeiro token como referência
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
                                canto: 'se', // Canto padrão, pode ser refinado depois
                                tamanhoInicial: {
                                    largura: boundingBoxMundo.largura,
                                    altura: boundingBoxMundo.altura,
                                    escala: 1
                                },
                                boundingBoxGrupo: boundingBoxMundo,
                                offset: {
                                    x: mouseX - x,
                                    y: mouseY - y
                                },
                                isGroupResize: true
                            }
                        });
                        event.preventDefault();
                        return;
                    }
                }
            }

            // DEPOIS: Verifica token individual
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

            const tokenSobre = verificarSeMouseSobreToken(mouseX, mouseY, 'esquerdo');

            if (tokenSobre) {
                const tokenBloqueado = uiState.tokensBloqueados[tokenSobre.token.id] === true;

                if (tokenBloqueado) {
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
                    const tokenClicado = tokenSobre;

                    const grupoTokenInfo = {
                        token: tokenClicado.token,
                        indice: tokenClicado.indice,
                        telaX: tokenClicado.telaX,
                        telaY: tokenClicado.telaY,
                        isGroupDrag: true
                    };

                    const offsetX = mouseX - tokenClicado.telaX;
                    const offsetY = mouseY - tokenClicado.telaY;

                    if (isNaN(offsetX) || isNaN(offsetY)) {
                        event.preventDefault();
                        return;
                    }

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
                } else {
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
                uiDispatch({
                    type: 'START_AREA_SELECTION',
                    payload: { x: mouseX, y: mouseY }
                });

                uiDispatch({ type: 'SELECT_TOKEN', payload: null });
                event.preventDefault();
            }
        }
    }, [uiState.tokenSelecionado, uiState.position, uiState.zoom, uiState.ignoreMouseMove,
        uiState.tokensBloqueados, uiState.tokensSelecionados, tokensState, tokensComInfo,
        verificarSeMouseSobreToken, verificarSeMousePodeRedimensionar, setStateDirect]);

    const handleMouseMove = useCallback((event) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        rafRef.current = requestAnimationFrame(() => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            if (uiState.ignoreMouseMove) return;

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
        processarArrastoToken, processarRedimensionamento, setStateDirect]);

    const finalizarArrasto = useCallback(() => {
        if (dragInProgressRef.current && (uiState.tokenSendoArrastado || uiState.tokensSelecionados.length > 0)) {
            const novosTokens = [...tokensState];
            pushTokens(novosTokens);

            uiDispatch({
                type: 'SET_FEEDBACK',
                payload: {
                    message: uiState.tokensSelecionados.length > 1 ? 'Tokens movidos' : 'Token movido',
                    type: 'success'
                }
            });

            dragInProgressRef.current = false;
        }
    }, [tokensState, uiState.tokenSendoArrastado, uiState.tokensSelecionados, pushTokens]);

    const finalizarRedimensionamento = useCallback(() => {
        if (resizeInProgressRef.current && uiState.tokenRedimensionando) {
            const novosTokens = [...tokensState];
            pushTokens(novosTokens);
            resizeInProgressRef.current = false;
            resizeStartStateRef.current = null;
        }
    }, [tokensState, uiState.tokenRedimensionando, pushTokens]);

    const handleMouseUp = useCallback((event) => {
        if (event.button === 2) {
            if (uiState.mouseDownInfo && uiState.ui.isClickingToken && uiState.mouseDownInfo.isRightClick) {
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
        }

        if (event.button === 0) {
            if (uiState.ui.isSelectingArea) {
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
    }, [uiState, finalizarArrasto, finalizarRedimensionamento]);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

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
            console.error('❌ Erro no drop:', erro);
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
    }, [canUndo, undo]);

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
    }, [canRedo, redo]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const evt = window.event ? window.event : event;
            const keyCode = evt.keyCode || evt.which;
            const ctrlPressed = evt.ctrlKey || evt.metaKey;

            if (evt.target.tagName === 'INPUT' ||
                evt.target.tagName === 'TEXTAREA' ||
                evt.target.isContentEditable) {
                return;
            }

            if (ctrlPressed && keyCode === 90 && !evt.shiftKey) {
                evt.preventDefault();
                evt.stopPropagation();
                handleUndo();
                return;
            }

            if ((ctrlPressed && keyCode === 89) ||
                (ctrlPressed && evt.shiftKey && keyCode === 90)) {
                evt.preventDefault();
                evt.stopPropagation();
                handleRedo();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    useEffect(() => {
        getCanvasContext();
        return () => {
            contextRef.current = null;
        };
    }, [getCanvasContext]);

    useEffect(() => {
        scheduleRender();
    }, [tokensComInfo, uiState.tokenSendoArrastado, uiState.ui.usuarioInteragindo,
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
    }, [uiState.ui.mostrarFeedback]);

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
        if (!uiState.menuContexto.aberto) return;

        const handleClickFora = (event) => {
            if (event.button === 2) return;
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
            }
        };

        document.addEventListener('mousedown', handleClickFora);
        return () => document.removeEventListener('mousedown', handleClickFora);
    }, [uiState.menuContexto.aberto]);

    useEffect(() => {
        const bloquearMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', bloquearMenu);
        return () => document.removeEventListener('contextmenu', bloquearMenu);
    }, []);

    useEffect(() => {
        const tokenIds = new Set(tokensState.map(t => t.id));
        for (const [id] of imageCache.current.entries()) {
            if (!tokenIds.has(id)) {
                imageCache.current.delete(id);
            }
        }
    }, [tokensState]);

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

    useEffect(() => {
        return () => {
            if (ignoreMouseTimeoutRef.current) {
                clearTimeout(ignoreMouseTimeoutRef.current);
            }
        };
    }, []);

    const handleDeleteToken = useCallback((tokenIndice) => {
        const novosTokens = tokensState.filter((_, i) => i !== tokenIndice);
        pushTokens(novosTokens);
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
    }, [tokensState, pushTokens]);

    const handleToggleVisibility = useCallback((tokenId) => {
        uiDispatch({ type: 'TOGGLE_VISIBILITY', payload: tokenId });
        uiDispatch({ type: 'CLOSE_CONTEXT_MENU' });
    }, []);

    const handleToggleLock = useCallback((tokenId) => {
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
    }, [uiState.tokensBloqueados]);

    return (
        <>
            <GridContainer
                containerRef={containerRef}
                isDragging={uiState.ui.isDragging}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <BarraLateral onAbrirModal={() => setModalOpen(true)} />
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
                tokenNome={uiState.menuContexto.token?.nome || 'Token'}
                tokenId={uiState.menuContexto.tokenId}
                estaOculto={uiState.visibilidadeTokens[uiState.menuContexto.tokenId] === true}
                estaBloqueado={uiState.tokensBloqueados[uiState.menuContexto.tokenId] === true}
                onFechar={() => uiDispatch({ type: 'CLOSE_CONTEXT_MENU' })}
                onDeletar={() => handleDeleteToken(uiState.menuContexto.tokenIndice)}
                onOcultar={() => handleToggleVisibility(uiState.menuContexto.tokenId)}
                onBloquear={() => handleToggleLock(uiState.menuContexto.tokenId)}
            />
        </>
    );
}

export default TabletopGrid;