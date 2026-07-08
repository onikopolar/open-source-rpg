// CONSTANTES DO SISTEMA
export const BASE_GRID_SIZE = 50;
export const CELLS_X = 247;
export const CELLS_Y = 247;
export const WORLD_WIDTH = BASE_GRID_SIZE * CELLS_X;
export const WORLD_HEIGHT = BASE_GRID_SIZE * CELLS_Y;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
export const TOLERANCIA_CLIQUE = 0.1;
export const RENDER_INTERVAL = 16;
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