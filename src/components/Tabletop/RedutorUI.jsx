// src/components/Tabletop/RedutorUI.jsx
import { clamp, MIN_ZOOM, MAX_ZOOM } from "./ConstantesMesa";

export const initialUIState = {
    zoom: 1,
    position: { x: 0, y: 0 },

    tokenSelecionado: null,
    tokensSelecionados: [],
    tokenSendoArrastado: null,
    tokenRedimensionando: null,

    camadaSelecionada: null,
    camadasSelecionadas: [],
    camadaSendoArrastada: null,
    camadaRedimensionando: null,

    modoRedimensionamento: null,
    tamanhoInicialRedimensionamento: { largura: 0, altura: 0, escala: 1 },
    boundingBoxGrupo: null,
    offsetArrasto: { x: 0, y: 0 },

    visibilidadeTokens: {},
    tokensBloqueados: {},

    camadasBloqueadas: {},

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
        token: null,
        camadaId: null,
        camada: null,
        tipo: null
    },

    ui: {
        usuarioInteragindo: null,
        mostrarFeedback: false,
        isDragging: false,
        isClickingToken: false,
        isClickingCamada: false,
        isSelectingArea: false,
        feedbackMessage: null,
        feedbackType: null
    },

    mouseDownInfo: null,
    dragStartPosition: null,
    ignoreMouseMove: false,
    debugMode: false
};

export function uiReducer(state, action) {
    console.log('[RedutorUI] action recebida:', action.type, action.payload);

    switch (action.type) {
        case 'SET_ZOOM': {
            const novoZoom = clamp(action.payload, MIN_ZOOM, MAX_ZOOM);
            console.log('[RedutorUI] zoom alterado de', state.zoom, 'para', novoZoom);
            return { ...state, zoom: novoZoom };
        }

        case 'SET_POSITION': {
            console.log('[RedutorUI] posição alterada para:', action.payload);
            return { ...state, position: action.payload };
        }

        case 'SELECT_TOKEN': {
            if (action.payload === null) {
                console.log('[RedutorUI] deselecionando todos os tokens e camadas');
                return {
                    ...state,
                    tokenSelecionado: null,
                    tokensSelecionados: [],
                    camadaSelecionada: null,
                    camadasSelecionadas: []
                };
            }
            console.log('[RedutorUI] token selecionado:', action.payload);
            return {
                ...state,
                tokenSelecionado: action.payload,
                tokensSelecionados: [action.payload],
                camadaSelecionada: null,
                camadasSelecionadas: []
            };
        }

        case 'SELECT_MULTIPLE_TOKENS': {
            console.log('[RedutorUI] múltiplos tokens selecionados:', action.payload);
            return {
                ...state,
                tokensSelecionados: action.payload,
                tokenSelecionado: action.payload.length > 0 ? action.payload[0] : null,
                camadaSelecionada: null,
                camadasSelecionadas: []
            };
        }

        case 'START_TOKEN_DRAG': {
            if (!action.payload.tokenInfo?.token) {
                console.warn('[RedutorUI] START_TOKEN_DRAG sem token válido');
                return state;
            }
            console.log('[RedutorUI] iniciando arrasto do token:', action.payload.tokenInfo.token.id);
            return {
                ...state,
                tokenSendoArrastado: action.payload.tokenInfo,
                offsetArrasto: action.payload.offset,
                dragStartPosition: {
                    x: action.payload.tokenInfo.token.x,
                    y: action.payload.tokenInfo.token.y
                }
            };
        }

        case 'STOP_TOKEN_DRAG': {
            console.log('[RedutorUI] parando arrasto de token');
            return {
                ...state,
                tokenSendoArrastado: null,
                offsetArrasto: { x: 0, y: 0 }
            };
        }

        case 'SELECT_CAMADA': {
            if (action.payload === null) {
                console.log('[RedutorUI] deselecionando todas as camadas');
                return {
                    ...state,
                    camadaSelecionada: null,
                    camadasSelecionadas: [],
                    tokenSelecionado: null,
                    tokensSelecionados: []
                };
            }
            console.log('[RedutorUI] camada selecionada:', action.payload);
            return {
                ...state,
                camadaSelecionada: action.payload,
                camadasSelecionadas: [action.payload],
                tokenSelecionado: null,
                tokensSelecionados: []
            };
        }

        case 'SELECT_MULTIPLE_CAMADAS': {
            console.log('[RedutorUI] múltiplas camadas selecionadas:', action.payload);
            return {
                ...state,
                camadasSelecionadas: action.payload,
                camadaSelecionada: action.payload.length > 0 ? action.payload[0] : null,
                tokenSelecionado: null,
                tokensSelecionados: []
            };
        }

        case 'START_CAMADA_DRAG': {
            if (!action.payload.camada) {
                console.warn('[RedutorUI] START_CAMADA_DRAG sem camada válida');
                return state;
            }
            console.log('[RedutorUI] iniciando arrasto da camada:', action.payload.camada.id);
            return {
                ...state,
                camadaSendoArrastada: {
                    camada: action.payload.camada,
                    indice: action.payload.indice,
                    offsetX: action.payload.offsetX,
                    offsetY: action.payload.offsetY,
                    mouseInicialX: action.payload.mouseInicialX,
                    mouseInicialY: action.payload.mouseInicialY
                },
                offsetArrasto: { x: action.payload.offsetX, y: action.payload.offsetY }
            };
        }

        case 'STOP_CAMADA_DRAG': {
            console.log('[RedutorUI] parando arrasto de camada');
            return {
                ...state,
                camadaSendoArrastada: null,
                offsetArrasto: { x: 0, y: 0 }
            };
        }

        case 'START_CAMADA_RESIZE': {
            console.log('[RedutorUI] iniciando redimensionamento de camada:', action.payload.camada.id);
            return {
                ...state,
                camadaRedimensionando: {
                    camada: action.payload.camada,
                    indice: action.payload.indice,
                    canto: action.payload.canto,
                    isGroupResize: action.payload.isGroupResize || false
                },
                modoRedimensionamento: action.payload.canto,
                tamanhoInicialRedimensionamento: {
                    largura: action.payload.camada.larguraOriginal,
                    altura: action.payload.camada.alturaOriginal,
                    escala: action.payload.camada.escala
                },
                offsetArrasto: action.payload.offset || { x: 0, y: 0 }
            };
        }

        case 'STOP_CAMADA_RESIZE': {
            console.log('[RedutorUI] parando redimensionamento de camada');
            return {
                ...state,
                camadaRedimensionando: null,
                modoRedimensionamento: null,
                tamanhoInicialRedimensionamento: { largura: 0, altura: 0, escala: 1 },
                offsetArrasto: { x: 0, y: 0 }
            };
        }

        case 'START_RESIZE': {
            if (action.payload.token?.tipo === 'nevoa') {
                console.log('[RedutorUI] iniciando redimensionamento de camada via START_RESIZE:', action.payload.token.id);
                return {
                    ...state,
                    camadaRedimensionando: {
                        camada: action.payload.token,
                        indice: action.payload.indice,
                        canto: action.payload.canto,
                        isGroupResize: action.payload.isGroupResize || false
                    },
                    modoRedimensionamento: action.payload.canto,
                    tamanhoInicialRedimensionamento: action.payload.tamanhoInicial,
                    boundingBoxGrupo: action.payload.boundingBoxGrupo || null,
                    offsetArrasto: action.payload.offset
                };
            }
            console.log('[RedutorUI] iniciando redimensionamento de token:', action.payload.token.id);
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
        }

        case 'STOP_RESIZE': {
            console.log('[RedutorUI] parando redimensionamento');
            return {
                ...state,
                tokenRedimensionando: null,
                camadaRedimensionando: null,
                modoRedimensionamento: null,
                tamanhoInicialRedimensionamento: { largura: 0, altura: 0, escala: 1 },
                boundingBoxGrupo: null,
                offsetArrasto: { x: 0, y: 0 }
            };
        }

        case 'START_DRAG': {
            const { tipo, item, indice, offset } = action.payload;
            if (tipo === 'token') {
                console.log('[RedutorUI] iniciando arrasto de token via START_DRAG:', item.id);
                return {
                    ...state,
                    tokenSendoArrastado: {
                        token: item,
                        indice: indice,
                        telaX: offset.telaX,
                        telaY: offset.telaY,
                        isGroupDrag: false
                    },
                    offsetArrasto: { x: offset.offsetX, y: offset.offsetY }
                };
            } else if (tipo === 'nevoa') {
                console.log('[RedutorUI] iniciando arrasto de camada via START_DRAG:', item.id);
                return {
                    ...state,
                    camadaSendoArrastada: {
                        camada: item,
                        indice: indice,
                        offsetX: offset.offsetX,
                        offsetY: offset.offsetY,
                        mouseInicialX: offset.mouseX,
                        mouseInicialY: offset.mouseY
                    },
                    offsetArrasto: { x: offset.offsetX, y: offset.offsetY }
                };
            }
            console.warn('[RedutorUI] START_DRAG com tipo desconhecido:', tipo);
            return state;
        }

        case 'STOP_DRAG': {
            console.log('[RedutorUI] parando arrasto (STOP_DRAG)');
            return {
                ...state,
                tokenSendoArrastado: null,
                camadaSendoArrastada: null,
                offsetArrasto: { x: 0, y: 0 }
            };
        }

        case 'TOGGLE_VISIBILITY': {
            const tokenId = action.payload;
            const novoEstado = !state.visibilidadeTokens[tokenId];
            console.log('[RedutorUI] alternando visibilidade do token', tokenId, 'para', novoEstado);
            return {
                ...state,
                visibilidadeTokens: {
                    ...state.visibilidadeTokens,
                    [tokenId]: novoEstado
                }
            };
        }

        case 'SET_TOKEN_VISIBILITY': {
            const { tokenId, oculto } = action.payload;
            console.log('[RedutorUI] definindo visibilidade do token', tokenId, 'como', oculto);
            return {
                ...state,
                visibilidadeTokens: {
                    ...state.visibilidadeTokens,
                    [tokenId]: oculto
                }
            };
        }

        case 'SET_TOKEN_BLOCK': {
            const { tokenId, bloqueado } = action.payload;
            console.log('[RedutorUI] definindo bloqueio do token', tokenId, 'como', bloqueado);
            return {
                ...state,
                tokensBloqueados: {
                    ...state.tokensBloqueados,
                    [tokenId]: bloqueado
                }
            };
        }

        case 'TOGGLE_LOCK': {
            const tokenId = action.payload;
            const novoEstado = !state.tokensBloqueados[tokenId];
            console.log('[RedutorUI] alternando bloqueio do token', tokenId, 'para', novoEstado);
            return {
                ...state,
                tokensBloqueados: {
                    ...state.tokensBloqueados,
                    [tokenId]: novoEstado
                }
            };
        }

        case 'TOGGLE_CAMADA_LOCK': {
            const camadaId = action.payload;
            const novoEstado = !state.camadasBloqueadas[camadaId];
            console.log('[RedutorUI] alternando bloqueio da camada', camadaId, 'para', novoEstado);
            return {
                ...state,
                camadasBloqueadas: {
                    ...state.camadasBloqueadas,
                    [camadaId]: novoEstado
                }
            };
        }

        case 'OPEN_CONTEXT_MENU': {
            console.log('[RedutorUI] abrindo menu de contexto:', action.payload);
            return { ...state, menuContexto: action.payload };
        }

        case 'CLOSE_CONTEXT_MENU': {
            console.log('[RedutorUI] fechando menu de contexto');
            return {
                ...state,
                menuContexto: {
                    aberto: false,
                    x: 0,
                    y: 0,
                    tokenIndice: null,
                    tokenId: null,
                    token: null,
                    camadaId: null,
                    camada: null,
                    tipo: null
                }
            };
        }

        case 'SET_MOUSE_DOWN_INFO': {
            console.log('[RedutorUI] definindo mouseDownInfo:', action.payload);
            return { ...state, mouseDownInfo: action.payload };
        }

        case 'START_AREA_SELECTION': {
            console.log('[RedutorUI] iniciando área de seleção em', action.payload);
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
        }

        case 'UPDATE_AREA_SELECTION': {
            if (!state.areaSelecao.ativo) return state;
            console.log('[RedutorUI] atualizando área de seleção para', action.payload);
            return {
                ...state,
                areaSelecao: {
                    ...state.areaSelecao,
                    fimX: action.payload.x,
                    fimY: action.payload.y
                }
            };
        }

        case 'END_AREA_SELECTION': {
            console.log('[RedutorUI] finalizando área de seleção');
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
        }

        case 'SET_UI_STATE': {
            console.log('[RedutorUI] atualizando estado UI:', action.payload);
            return {
                ...state,
                ui: { ...state.ui, ...action.payload }
            };
        }

        case 'SET_FEEDBACK': {
            console.log('[RedutorUI] definindo feedback:', action.payload);
            return {
                ...state,
                ui: {
                    ...state.ui,
                    feedbackMessage: action.payload.message,
                    feedbackType: action.payload.type,
                    mostrarFeedback: true
                }
            };
        }

        case 'RESET_UI_FEEDBACK': {
            console.log('[RedutorUI] resetando feedback');
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
        }

        case 'SET_IGNORE_MOUSE_MOVE': {
            console.log('[RedutorUI] definindo ignoreMouseMove:', action.payload);
            return {
                ...state,
                ignoreMouseMove: action.payload
            };
        }

        case 'TOGGLE_DEBUG_MODE': {
            console.log('[RedutorUI] alternando modo debug para', !state.debugMode);
            return {
                ...state,
                debugMode: !state.debugMode
            };
        }

        default:
            console.warn('[RedutorUI] ação desconhecida:', action.type);
            return state;
    }
}