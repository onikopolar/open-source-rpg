// src/components/Tabletop/HooksNovos/useHistoricoTokens.jsx
import { useCallback, useEffect, useRef } from 'react';
import { useDesfazerRefazer } from '../useDesfazerRefazer';

export function useHistoricoTokens({
    isMaster,
    socket,
    tabletopId,
    tokensState,
    setTokensDirect,
    atualizarToken,
    emitirTokenMoved,
    emitirTokenCreated,
    emitirTokenDeleted,
    emitirTokenVisibilityChanged,
    emitirTokenLockChanged,
    emitirTokenInverted,
    emitirTokenZIndexChanged
}) {
    // Histórico de tokens
    const { 
        state: tokensHistorico, 
        push: pushTokensHistory, 
        undo: undoTokens, 
        redo: redoTokens, 
        canUndo: canUndoTokens, 
        canRedo: canRedoTokens,
        setStateDirect: setTokensHistoricoDirect
    } = useDesfazerRefazer([]);

    // Refs para controle de fluxo
    const ignorarProximoPushRef = useRef(false);
    const ultimoEstadoRef = useRef([]);
    const emOperacaoRef = useRef(false);
    const estadoInicialArrastoRef = useRef(null);

    // Sincronizar estado histórico com estado local
    useEffect(() => {
        // Apenas inicialização na primeira carga
        if (tokensState.length > 0 && tokensHistorico.length === 0) {
            const tokensOrdenados = [...tokensState].sort(
                (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
            );
            setTokensHistoricoDirect(tokensOrdenados);
            ultimoEstadoRef.current = tokensOrdenados;
        }
    }, [tokensState, tokensHistorico, setTokensHistoricoDirect]);

    // Aplicar estado do histórico ao estado local
    const aplicarEstadoLocal = useCallback((novoTokens) => {
        emOperacaoRef.current = true;
        setTokensDirect(novoTokens);
        ultimoEstadoRef.current = novoTokens;
    }, [setTokensDirect]);

    // Função para sincronizar mudanças via socket quando aplicar histórico
    const sincronizarMudancasComSocket = useCallback((estadoAnterior, estadoNovo) => {
        if (!socket?.connected || !isMaster) return;
        
        // Encontrar tokens que mudaram de posição/escala
        estadoNovo.forEach((tokenNovo) => {
            const tokenAntigo = estadoAnterior.find(t => t.id === tokenNovo.id);
            if (!tokenAntigo) {
                // Token novo foi criado (provavelmente via redo)
                emitirTokenCreated(tokenNovo);
            } else {
                // Verificar mudanças
                if (tokenNovo.x !== tokenAntigo.x || tokenNovo.y !== tokenAntigo.y) {
                    emitirTokenMoved(tokenNovo.id, { x: tokenNovo.x, y: tokenNovo.y });
                }
                if (tokenNovo.escala !== tokenAntigo.escala) {
                    emitirTokenMoved(tokenNovo.id, { escala: tokenNovo.escala });
                }
                if (tokenNovo.oculto !== tokenAntigo.oculto) {
                    emitirTokenVisibilityChanged(tokenNovo.id, tokenNovo.oculto);
                }
                if (tokenNovo.bloqueado !== tokenAntigo.bloqueado) {
                    emitirTokenLockChanged(tokenNovo.id, tokenNovo.bloqueado);
                }
                if (tokenNovo.invertido !== tokenAntigo.invertido) {
                    emitirTokenInverted(tokenNovo.id, tokenNovo.invertido);
                }
                if (tokenNovo.zIndex !== tokenAntigo.zIndex) {
                    emitirTokenZIndexChanged(tokenNovo.id, tokenNovo.zIndex);
                }
            }
        });
        
        // Verificar tokens deletados (estão no anterior mas não no novo)
        estadoAnterior.forEach((tokenAntigo) => {
            const tokenNovo = estadoNovo.find(t => t.id === tokenAntigo.id);
            if (!tokenNovo) {
                // Token foi deletado (provavelmente via undo/redo)
                emitirTokenDeleted(tokenAntigo.id);
            }
        });
    }, [socket, isMaster, emitirTokenMoved, emitirTokenCreated, emitirTokenDeleted, 
        emitirTokenVisibilityChanged, emitirTokenLockChanged, emitirTokenInverted, emitirTokenZIndexChanged]);

    // Handler para undo
    const handleUndo = useCallback(() => {
        if (!isMaster || !canUndoTokens) return null;
        
        const estadoAnterior = undoTokens();
        if (estadoAnterior) {
            const estadoAtual = tokensState;
            ignorarProximoPushRef.current = true;
            emOperacaoRef.current = true;
            
            aplicarEstadoLocal(estadoAnterior);
            
            // Sincronizar mudanças via socket
            sincronizarMudancasComSocket(estadoAtual, estadoAnterior);
            
            return estadoAnterior;
        }
        return null;
    }, [isMaster, canUndoTokens, undoTokens, aplicarEstadoLocal, tokensState, sincronizarMudancasComSocket]);

    // Handler para redo
    const handleRedo = useCallback(() => {
        if (!isMaster || !canRedoTokens) return null;
        
        const proximoEstado = redoTokens();
        if (proximoEstado) {
            const estadoAtual = tokensState;
            ignorarProximoPushRef.current = true;
            emOperacaoRef.current = true;
            
            aplicarEstadoLocal(proximoEstado);
            
            // Sincronizar mudanças via socket
            sincronizarMudancasComSocket(estadoAtual, proximoEstado);
            
            return proximoEstado;
        }
        return null;
    }, [isMaster, canRedoTokens, redoTokens, aplicarEstadoLocal, tokensState, sincronizarMudancasComSocket]);

    // Funções para capturar arrasto de token
    const iniciarCapturaArrasto = useCallback(() => {
        if (!isMaster) return;
        estadoInicialArrastoRef.current = [...tokensState];
        console.log('[HistoricoTokens] Iniciando captura de arrasto');
        
        // Se o estado atual é diferente do último estado no histórico, adiciona ao histórico
        // Isso garante que o estado inicial da ação esteja no histórico
        if (JSON.stringify(tokensState) !== JSON.stringify(ultimoEstadoRef.current)) {
            pushTokensHistory(tokensState);
            ultimoEstadoRef.current = tokensState;
            console.log('[HistoricoTokens] Estado inicial capturado no histórico');
        }
    }, [isMaster, tokensState, pushTokensHistory]);

    const finalizarCapturaArrasto = useCallback(() => {
        if (!isMaster || !estadoInicialArrastoRef.current) return;
        
        // Verificar se houve mudança real
        if (JSON.stringify(tokensState) !== JSON.stringify(estadoInicialArrastoRef.current)) {
            // O estado inicial já deve estar no histórico (adicionado por iniciarCapturaArrasto)
            // Agora adiciona o estado final
            pushTokensHistory(tokensState);
            ultimoEstadoRef.current = tokensState;
            console.log('[HistoricoTokens] Estado final capturado no histórico');
        }
        
        estadoInicialArrastoRef.current = null;
    }, [isMaster, tokensState, pushTokensHistory]);

    // Capturar ações que devem entrar no histórico (para ações discretas)
    const capturarAcaoDiscreta = useCallback((descricao = 'Ação') => {
        if (!isMaster) return;
        
        // Verificar se houve mudança real
        if (JSON.stringify(tokensState) !== JSON.stringify(ultimoEstadoRef.current)) {
            pushTokensHistory(tokensState);
            ultimoEstadoRef.current = tokensState;
            console.log(`[HistoricoTokens] Capturada ação: ${descricao}`);
        }
    }, [isMaster, tokensState, pushTokensHistory]);

    // Wrappers para funções que devem capturar histórico
    const atualizarTokenComHistorico = useCallback(async (tokenId, dados) => {
        const resultado = await atualizarToken(tokenId, dados);
        capturarAcaoDiscreta('Atualização de token');
        return resultado;
    }, [atualizarToken, capturarAcaoDiscreta]);

    const emitirTokenMovedComHistorico = useCallback((tokenId, dados) => {
        emitirTokenMoved(tokenId, dados);
        // NÃO capturar histórico aqui - será capturado no final do arrasto
        // capturarAcao('Movimento de token');
    }, [emitirTokenMoved]);

    const emitirTokenCreatedComHistorico = useCallback((token) => {
        emitirTokenCreated(token);
        capturarAcaoDiscreta('Criação de token');
    }, [emitirTokenCreated, capturarAcaoDiscreta]);

    const emitirTokenDeletedComHistorico = useCallback((tokenId) => {
        emitirTokenDeleted(tokenId);
        capturarAcaoDiscreta('Exclusão de token');
    }, [emitirTokenDeleted, capturarAcaoDiscreta]);

    // Wrappers para outras funções de emitir
    const emitirTokenVisibilityChangedComHistorico = useCallback((tokenId, oculto) => {
        emitirTokenVisibilityChanged(tokenId, oculto);
        capturarAcaoDiscreta(`Visibilidade alterada: ${oculto ? 'oculto' : 'visível'}`);
    }, [emitirTokenVisibilityChanged, capturarAcaoDiscreta]);

    const emitirTokenLockChangedComHistorico = useCallback((tokenId, bloqueado) => {
        emitirTokenLockChanged(tokenId, bloqueado);
        capturarAcaoDiscreta(`Bloqueio alterado: ${bloqueado ? 'bloqueado' : 'desbloqueado'}`);
    }, [emitirTokenLockChanged, capturarAcaoDiscreta]);

    const emitirTokenInvertedComHistorico = useCallback((tokenId, invertido) => {
        emitirTokenInverted(tokenId, invertido);
        capturarAcaoDiscreta(`Inversão alterada: ${invertido ? 'invertido' : 'normal'}`);
    }, [emitirTokenInverted, capturarAcaoDiscreta]);

    const emitirTokenZIndexChangedComHistorico = useCallback((tokenId, zIndex) => {
        emitirTokenZIndexChanged(tokenId, zIndex);
        capturarAcaoDiscreta('Z-index alterado');
    }, [emitirTokenZIndexChanged, capturarAcaoDiscreta]);

    // Função para limpar histórico
    const limparHistorico = useCallback(() => {
        setTokensHistoricoDirect([]);
        ultimoEstadoRef.current = [];
    }, [setTokensHistoricoDirect]);

    return {
        // Estado e controle
        tokensHistorico,
        canUndo: canUndoTokens,
        canRedo: canRedoTokens,
        
        // Ações principais
        handleUndo,
        handleRedo,
        capturarAcao: capturarAcaoDiscreta,
        iniciarCapturaArrasto,
        finalizarCapturaArrasto,
        limparHistorico,
        
        // Wrappers com histórico
        atualizarToken: atualizarTokenComHistorico,
        emitirTokenMoved: emitirTokenMovedComHistorico,
        emitirTokenCreated: emitirTokenCreatedComHistorico,
        emitirTokenDeleted: emitirTokenDeletedComHistorico,
        emitirTokenVisibilityChanged: emitirTokenVisibilityChangedComHistorico,
        emitirTokenLockChanged: emitirTokenLockChangedComHistorico,
        emitirTokenInverted: emitirTokenInvertedComHistorico,
        emitirTokenZIndexChanged: emitirTokenZIndexChangedComHistorico,
        
        // Controle interno
        _ignorarProximoPushRef: ignorarProximoPushRef,
        _emOperacaoRef: emOperacaoRef
    };
}