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
                    tokensSelecionados: [],
                    camadaSelecionada: null,
                    camadasSelecionadas: []
                };
            }
            return {
                ...state,
                tokenSelecionado: action.payload,
                tokensSelecionados: [action.payload],
                camadaSelecionada: null,
                camadasSelecionadas: []
            };

        case 'SELECT_MULTIPLE_TOKENS':
            return {
                ...state,
                tokensSelecionados: action.payload,
                tokenSelecionado: action.payload.length > 0 ? action.payload[0] : null,
                camadaSelecionada: null,
                camadasSelecionadas: []
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

        case 'SELECT_CAMADA':
            if (action.payload === null) {
                return {
                    ...state,
                    camadaSelecionada: null,
                    camadasSelecionadas: [],
                    tokenSelecionado: null,
                    tokensSelecionados: []
                };
            }
            return {
                ...state,
                camadaSelecionada: action.payload,
                camadasSelecionadas: [action.payload],
                tokenSelecionado: null,
                tokensSelecionados: []
            };

        case 'SELECT_MULTIPLE_CAMADAS':
            return {
                ...state,
                camadasSelecionadas: action.payload,
                camadaSelecionada: action.payload.length > 0 ? action.payload[0] : null,
                tokenSelecionado: null,
                tokensSelecionados: []
            };

        case 'START_CAMADA_DRAG':
            if (!action.payload.camada) {
                return state;
            }
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

        case 'STOP_CAMADA_DRAG':
            return {
                ...state,
                camadaSendoArrastada: null,
                offsetArrasto: { x: 0, y: 0 }
            };

        case 'START_CAMADA_RESIZE':
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

        case 'STOP_CAMADA_RESIZE':
            return {
                ...state,
                camadaRedimensionando: null,
                modoRedimensionamento: null,
                tamanhoInicialRedimensionamento: { largura: 0, altura: 0, escala: 1 },
                offsetArrasto: { x: 0, y: 0 }
            };

        case 'START_RESIZE':
            if (action.payload.token?.tipo === 'nevoa') {
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
                camadaRedimensionando: null,
                modoRedimensionamento: null,
                tamanhoInicialRedimensionamento: { largura: 0, altura: 0, escala: 1 },
                boundingBoxGrupo: null,
                offsetArrasto: { x: 0, y: 0 }
            };

        case 'START_DRAG':
            const { tipo, item, indice, offset } = action.payload;
            if (tipo === 'token') {
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
            return state;

        case 'STOP_DRAG':
            return {
                ...state,
                tokenSendoArrastado: null,
                camadaSendoArrastada: null,
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

        case 'SET_TOKEN_VISIBILITY':
            return {
                ...state,
                visibilidadeTokens: {
                    ...state.visibilidadeTokens,
                    [action.payload.tokenId]: action.payload.oculto
                }
            };

        case 'SET_TOKEN_BLOCK':
            return {
                ...state,
                tokensBloqueados: {
                    ...state.tokensBloqueados,
                    [action.payload.tokenId]: action.payload.bloqueado
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

        case 'TOGGLE_CAMADA_LOCK':
            return {
                ...state,
                camadasBloqueadas: {
                    ...state.camadasBloqueadas,
                    [action.payload]: !state.camadasBloqueadas[action.payload]
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
                    token: null,
                    camadaId: null,
                    camada: null,
                    tipo: null
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

        case 'TOGGLE_DEBUG_MODE':
            return {
                ...state,
                debugMode: !state.debugMode
            };

        default:
            return state;
    }
}