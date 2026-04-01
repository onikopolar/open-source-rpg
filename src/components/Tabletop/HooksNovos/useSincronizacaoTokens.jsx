// src/components/Tabletop/HooksNovos/useSincronizacaoTokens.jsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCorSheet } from '../../TabletopDesign';

export function useSincronizacaoTokens({
  socket,
  tabletopId,
  isMaster,
  sheetId,
  playerName,
  tokensLocalRef,
  onTokenUpdate,
  onUIUpdate,
}) {
  console.log('[useSincronizacaoTokens] Inicializando hook', {
    hasSocket: !!socket,
    socketConnected: socket?.connected,
    tabletopId,
    isMaster,
    sheetId,
    playerName,
    hasTokensLocalRef: !!tokensLocalRef,
    hasOnTokenUpdate: !!onTokenUpdate,
    hasOnUIUpdate: !!onUIUpdate,
  });

  const [arrastosRemotos, setArrastosRemotos] = useState({});
  const userId = socket?.id;
  console.log('[useSincronizacaoTokens] userId:', userId);

  const emitirEvento = useCallback(
    (evento, dados) => {
      if (!socket || !socket.connected) {
        console.warn(`[useSincronizacaoTokens] Socket não conectado, não emitindo ${evento}`);
        return;
      }
      console.log(`[useSincronizacaoTokens] Emitindo ${evento}:`, dados);
      socket.emit(`tabletop:${evento}`, dados);
    },
    [socket]
  );

  const emitirSelecao = useCallback(
    (tokenId) => {
      console.log('[useSincronizacaoTokens] emitirSelecao chamado', { tokenId });
      const nomeUsuario = isMaster ? 'Mestre' : playerName || `Player ${sheetId}`;
      const cor = getCorSheet(sheetId);
      emitirEvento('tokenSelected', {
        tabletopId,
        tokenId,
        userId,
        nome: nomeUsuario,
        color: cor,
        sheetId,
      });
    },
    [socket, tabletopId, isMaster, sheetId, playerName, emitirEvento, userId]
  );

  const emitirDeselecao = useCallback(
    (tokenId) => {
      console.log('[useSincronizacaoTokens] emitirDeselecao chamado', { tokenId });
      emitirEvento('tokenDeselected', { tabletopId, tokenId, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirDragStart = useCallback(
    (tokenId) => {
      console.log('[useSincronizacaoTokens] emitirDragStart chamado', { tokenId });
      const nomeUsuario = isMaster ? 'Mestre' : playerName || `Player ${sheetId}`;
      emitirEvento('tokenDragStart', {
        tabletopId,
        tokenId,
        userId,
        nome: nomeUsuario,
        sheetId,
      });
    },
    [socket, tabletopId, isMaster, sheetId, playerName, emitirEvento, userId]
  );

  const emitirDragEnd = useCallback(
    (tokenId) => {
      console.log('[useSincronizacaoTokens] emitirDragEnd chamado', { tokenId });
      emitirEvento('tokenDragEnd', { tabletopId, tokenId, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenMoved = useCallback(
    (tokenId, dados) => {
      console.log('[useSincronizacaoTokens] emitirTokenMoved chamado', { tokenId, dados });
      emitirEvento('tokenMoved', { tabletopId, id: tokenId, userId, ...dados });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenCreated = useCallback(
    (token) => {
      console.log('[useSincronizacaoTokens] emitirTokenCreated chamado', { token });
      emitirEvento('tokenCreated', { tabletopId, ...token, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenDeleted = useCallback(
    (tokenId) => {
      console.log('[useSincronizacaoTokens] emitirTokenDeleted chamado', { tokenId });
      emitirEvento('tokenDeleted', { tabletopId, id: tokenId, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenVisibilityChanged = useCallback(
    (tokenId, oculto) => {
      console.log('[useSincronizacaoTokens] emitirTokenVisibilityChanged chamado', { tokenId, oculto });
      emitirEvento('tokenVisibilityChanged', { tabletopId, id: tokenId, oculto, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenLockChanged = useCallback(
    (tokenId, bloqueado) => {
      console.log('[useSincronizacaoTokens] emitirTokenLockChanged chamado', { tokenId, bloqueado });
      emitirEvento('tokenLockChanged', { tabletopId, id: tokenId, bloqueado, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenInverted = useCallback(
    (tokenId, invertido) => {
      console.log('[useSincronizacaoTokens] emitirTokenInverted chamado', { tokenId, invertido });
      emitirEvento('tokenInverted', { tabletopId, id: tokenId, invertido, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenZIndexChanged = useCallback(
    (tokenId, zIndex) => {
      console.log('[useSincronizacaoTokens] emitirTokenZIndexChanged chamado', { tokenId, zIndex });
      emitirEvento('tokenUpdated', { tabletopId, id: tokenId, zIndex, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  // Efeito para conectar na sala ao montar
  useEffect(() => {
    console.log('[useSincronizacaoTokens] useEffect de conexão executando');
    if (!socket) return;

    if (!socket.connected) {
      console.log('[useSincronizacaoTokens] Socket não conectado, aguardando connect');
      socket.on('connect', () => {
        console.log('[useSincronizacaoTokens] Socket conectado, emitindo tabletop:join');
        socket.emit('tabletop:join', { tabletopId });
      });
      return;
    }

    console.log('[useSincronizacaoTokens] Socket já conectado, emitindo tabletop:join');
    socket.emit('tabletop:join', { tabletopId });
  }, [tabletopId, socket]);

  // Efeito para configurar os listeners de eventos do socket
  useEffect(() => {
    if (!socket) return;
    console.log('[useSincronizacaoTokens] Configurando listeners de socket');

    const handleTokenUpdated = (data) => {
      console.log('[useSincronizacaoTokens] Recebido tokenUpdated', { data, userId, isSelf: data.userId === userId });
      if (data.userId === userId) {
        console.log('[useSincronizacaoTokens] Ignorando tokenUpdated (próprio cliente)');
        return;
      }

      // Atualiza o estado dos tokens via onTokenUpdate (se fornecido)
      if (onTokenUpdate) {
        console.log('[useSincronizacaoTokens] Chamando onTokenUpdate para tokenUpdated', data.id);
        onTokenUpdate(data, (prev) => {
          const index = prev.findIndex((t) => t.id === data.id);
          if (index === -1) {
            console.warn('[useSincronizacaoTokens] Token não encontrado para atualização', data.id);
            return prev;
          }
          const novos = [...prev];
          novos[index] = { ...novos[index], ...data };
          const sorted = novos.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
          console.log('[useSincronizacaoTokens] Token atualizado no estado local', data.id);
          return sorted;
        });
      }

      // Notifica a UI sobre mudanças visuais (oculto, bloqueado, invertido)
      if (onUIUpdate) {
        if (data.oculto !== undefined) {
          console.log('[useSincronizacaoTokens] Atualizando UI: oculto', data.id, data.oculto);
          onUIUpdate({
            type: 'SET_TOKEN_VISIBILITY',
            payload: { tokenId: data.id, oculto: data.oculto },
          });
        }
        if (data.bloqueado !== undefined) {
          console.log('[useSincronizacaoTokens] Atualizando UI: bloqueado', data.id, data.bloqueado);
          onUIUpdate({
            type: 'SET_TOKEN_BLOCK',
            payload: { tokenId: data.id, bloqueado: data.bloqueado },
          });
        }
        // 🔧 CORREÇÃO: Tratar invertido
        if (data.invertido !== undefined) {
          console.log('[useSincronizacaoTokens] Atualizando UI: invertido', data.id, data.invertido);
          onUIUpdate({
            type: 'SET_TOKEN_INVERT',
            payload: { tokenId: data.id, invertido: data.invertido },
          });
        }
      }
    };

    const handleTokenCreated = (data) => {
      console.log('[useSincronizacaoTokens] Recebido tokenCreated', { data, userId, isSelf: data.userId === userId });
      if (data.userId === userId) {
        console.log('[useSincronizacaoTokens] Ignorando tokenCreated (próprio cliente)');
        return;
      }

      if (tokensLocalRef?.current && tokensLocalRef.current.some((t) => t.id === data.id)) {
        console.log('[useSincronizacaoTokens] Token já existe localmente, ignorando criação', data.id);
        return;
      }

      if (onTokenUpdate) {
        console.log('[useSincronizacaoTokens] Chamando onTokenUpdate para tokenCreated', data.id);
        onTokenUpdate(data, (prev) => {
          const novos = [...prev, data];
          const sorted = novos.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
          console.log('[useSincronizacaoTokens] Token adicionado ao estado local', data.id);
          return sorted;
        });
      }
    };

    const handleTokenDeleted = (data) => {
      console.log('[useSincronizacaoTokens] Recebido tokenDeleted', { data, userId, isSelf: data.userId === userId });
      if (data.userId === userId) {
        console.log('[useSincronizacaoTokens] Ignorando tokenDeleted (próprio cliente)');
        return;
      }

      if (onTokenUpdate) {
        console.log('[useSincronizacaoTokens] Chamando onTokenUpdate para tokenDeleted', data.id);
        onTokenUpdate(data, (prev) => {
          const filtered = prev.filter((t) => t.id !== data.id);
          console.log('[useSincronizacaoTokens] Token removido do estado local', data.id);
          return filtered;
        });
      }
    };

    const handleTokenDragStart = (data) => {
      console.log('[useSincronizacaoTokens] Recebido tokenDragStart', { data, userId, isSelf: data.userId === userId });
      if (data.userId === userId) {
        console.log('[useSincronizacaoTokens] Ignorando tokenDragStart (próprio cliente)');
        return;
      }

      setArrastosRemotos((prev) => {
        const newState = {
          ...prev,
          [data.tokenId]: {
            nome: data.nome,
            cor: getCorSheet(data.sheetId),
            userId: data.userId,
          },
        };
        console.log('[useSincronizacaoTokens] Arrasto remoto adicionado', data.tokenId);
        return newState;
      });
    };

    const handleTokenDragEnd = (data) => {
      console.log('[useSincronizacaoTokens] Recebido tokenDragEnd', { data, userId, isSelf: data.userId === userId });
      if (data.userId === userId) {
        console.log('[useSincronizacaoTokens] Ignorando tokenDragEnd (próprio cliente)');
        return;
      }

      setArrastosRemotos((prev) => {
        const newState = { ...prev };
        delete newState[data.tokenId];
        console.log('[useSincronizacaoTokens] Arrasto remoto removido', data.tokenId);
        return newState;
      });
    };

    socket.on('tabletop:tokenUpdated', handleTokenUpdated);
    socket.on('tabletop:tokenCreated', handleTokenCreated);
    socket.on('tabletop:tokenDeleted', handleTokenDeleted);
    socket.on('tabletop:tokenDragStart', handleTokenDragStart);
    socket.on('tabletop:tokenDragEnd', handleTokenDragEnd);

    console.log('[useSincronizacaoTokens] Listeners configurados');

    return () => {
      console.log('[useSincronizacaoTokens] Removendo listeners');
      socket.off('tabletop:tokenUpdated', handleTokenUpdated);
      socket.off('tabletop:tokenCreated', handleTokenCreated);
      socket.off('tabletop:tokenDeleted', handleTokenDeleted);
      socket.off('tabletop:tokenDragStart', handleTokenDragStart);
      socket.off('tabletop:tokenDragEnd', handleTokenDragEnd);
    };
  }, [socket, onTokenUpdate, onUIUpdate, tokensLocalRef, userId]);

  console.log('[useSincronizacaoTokens] Hook finalizado, retornando funções');

  return {
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
  };
}