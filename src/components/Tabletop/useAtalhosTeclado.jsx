// src/components/Tabletop/useAtalhosTeclado.jsx
import { useEffect } from "react";

export function useAtalhosTeclado(handleUndo, handleRedo) {
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
}