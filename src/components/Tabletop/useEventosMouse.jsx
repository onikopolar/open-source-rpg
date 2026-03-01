// src/components/Tabletop/useEventosMouse.jsx
import { useCallback } from "react";
import { clamp, MIN_ZOOM, MAX_ZOOM } from "./ConstantesMesa";

export function useEventosMouse(uiState, uiDispatch, containerRef, dragStartRef, restringirPosicao) {
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
    }, [uiState.zoom, uiState.position, uiDispatch, containerRef, restringirPosicao]);

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    return { handleWheel, handleDragOver };
}