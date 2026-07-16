// CONSTANTES DO SISTEMA
export const BASE_GRID_SIZE = 50;
export const CELLS_X = 247;
export const CELLS_Y = 247;
export const WORLD_WIDTH = BASE_GRID_SIZE * CELLS_X;
export const WORLD_HEIGHT = BASE_GRID_SIZE * CELLS_Y;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
export const TOLERANCIA_CLIQUE = 0.1;
export const RENDER_INTERVAL = 8; // 8ms ≈ 120fps (monitores gaming)
export const GRID_CONFIGS = [
    { zoomThreshold: 0, sizeMultiplier: 8, alpha: 0.08 },
    { zoomThreshold: 0.125, sizeMultiplier: 4, alpha: 0.06 },
    { zoomThreshold: 0.4, sizeMultiplier: 2, alpha: 0.08 },
    { zoomThreshold: 0.25, sizeMultiplier: 1, alpha: 0.10 },
    { zoomThreshold: 2.0, sizeMultiplier: 0.5, alpha: 0.07 },
    { zoomThreshold: 3.0, sizeMultiplier: 0.25, alpha: 0.05 }
];

// FUNÇÕES UTILITÁRIAS

export const clamp = (valor, minimo, maximo) => {
    return Math.min(Math.max(valor, minimo), maximo);
};

/** Detecta se o dispositivo atual é mobile */
export const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    const mobileRegex = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i;
    return mobileRegex.test(navigator.userAgent) || window.innerWidth < 768;
};

/** Gera chave de localStorage para salvar o estado da view */
export const getStorageKey = (tabletopId, isMaster, sheetId, playerName) => {
    const userPart = isMaster ? 'master' : `player_${sheetId || playerName || 'anon'}`;
    return `tabletop_view_${tabletopId}_${userPart}`;
};

/** Carrega view salva do localStorage, com fallback */
export const loadSavedView = (tabletopId, isMaster, sheetId, playerName) => {
    try {
        const key = getStorageKey(tabletopId, isMaster, sheetId, playerName);
        const saved = localStorage.getItem(key);
        if (saved) {
            const { zoom, position } = JSON.parse(saved);
            return { zoom: zoom ?? 1, position: position ?? { x: 0, y: 0 } };
        }
    } catch (e) { /* ignora erros de parse */ }
    return { zoom: 1, position: { x: 0, y: 0 } };
};

/**
 * Calcula informações de renderização na tela para um item (token ou camada de névoa).
 * Evita duplicação entre tokensInfo e camadasInfo.
 */
export const computeScreenInfo = (item, indice, zoom, position, bloqueadoMap, tipo) => {
    const larguraOriginal = item.larguraOriginal || 50;
    const alturaOriginal = item.alturaOriginal || 50;
    const escala = item.escala || 1;

    const posicaoTela = {
        x: item.x * zoom + position.x,
        y: item.y * zoom + position.y,
    };

    const larguraMundo = larguraOriginal * escala;
    const alturaMundo = alturaOriginal * escala;

    return {
        ...item,
        indice,
        posicaoTela,
        larguraOriginal,
        alturaOriginal,
        tamanhoTela: {
            larguraOriginal,
            alturaOriginal,
            larguraMundo,
            alturaMundo,
            larguraTela: larguraMundo * zoom,
            alturaTela: alturaMundo * zoom,
        },
        bloqueado: bloqueadoMap?.[item.id] === true,
        tipo,
    };
};

/** Exibe feedback visual e limpa após o timeout padrão */
export const showFeedback = (dispatch, message, type = 'info') => {
    dispatch({ type: 'SET_FEEDBACK', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'RESET_UI_FEEDBACK' }), 1000);
};