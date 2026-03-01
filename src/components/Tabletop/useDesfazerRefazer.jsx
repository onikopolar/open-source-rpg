// src/components/Tabletop/useDesfazerRefazer.jsx
import { useRef, useState, useCallback } from "react";

class GerenciadorDesfazerRefazer {
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

export function useDesfazerRefazer(initialState) {
    const managerRef = useRef(null);

    if (!managerRef.current) {
        managerRef.current = new GerenciadorDesfazerRefazer(initialState);
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