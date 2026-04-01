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
  const [arrastosRemotos, setArrastosRemotos] = useState({});
  const userId = socket?.id;

  const emitirEvento = useCallback(
    (evento, dados) => {
      if (!socket || !socket.connected) return;
      socket.emit(`tabletop:${evento}`, dados);
    },
    [socket]
  );

  const emitirSelecao = useCallback(
    (tokenId) => {
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
      emitirEvento('tokenDeselected', { tabletopId, tokenId, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirDragStart = useCallback(
    (tokenId) => {
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
      emitirEvento('tokenDragEnd', { tabletopId, tokenId, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenMoved = useCallback(
    (tokenId, dados) => {
      emitirEvento('tokenMoved', { tabletopId, id: tokenId, userId, ...dados });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenCreated = useCallback(
    (token) => {
      emitirEvento('tokenCreated', { tabletopId, ...token, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenDeleted = useCallback(
    (tokenId) => {
      emitirEvento('tokenDeleted', { tabletopId, id: tokenId, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenVisibilityChanged = useCallback(
    (tokenId, oculto) => {
      emitirEvento('tokenVisibilityChanged', { tabletopId, id: tokenId, oculto, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenLockChanged = useCallback(
    (tokenId, bloqueado) => {
      emitirEvento('tokenLockChanged', { tabletopId, id: tokenId, bloqueado, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenInverted = useCallback(
    (tokenId, invertido) => {
      emitirEvento('tokenInverted', { tabletopId, id: tokenId, invertido, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  const emitirTokenZIndexChanged = useCallback(
    (tokenId, zIndex) => {
      emitirEvento('tokenUpdated', { tabletopId, id: tokenId, zIndex, userId });
    },
    [socket, tabletopId, emitirEvento, userId]
  );

  useEffect(() => {
    if (!socket) return;

    if (!socket.connected) {
      socket.on('connect', () => {
        socket.emit('tabletop:join', { tabletopId });
      });
      return;
    }

    socket.emit('tabletop:join', { tabletopId });
  }, [tabletopId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleTokenUpdated = (data) => {
      // Ignora eventos originados pelo próprio cliente
      if (data.userId === userId) return;

      if (onTokenUpdate) {
        onTokenUpdate(data, (prev) => {
          const index = prev.findIndex((t) => t.id === data.id);
          if (index === -1) return prev;
          const novos = [...prev];
          novos[index] = { ...novos[index], ...data };
          return novos.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        });
      }
      if (onUIUpdate) {
        if (data.oculto !== undefined) {
          onUIUpdate({
            type: 'SET_TOKEN_VISIBILITY',
            payload: { tokenId: data.id, oculto: data.oculto },
          });
        }
        if (data.bloqueado !== undefined) {
          onUIUpdate({
            type: 'SET_TOKEN_BLOCK',
            payload: { tokenId: data.id, bloqueado: data.bloqueado },
          });
        }
      }
    };

    const handleTokenCreated = (data) => {
      // Ignora eventos originados pelo próprio cliente
      if (data.userId === userId) return;

      // Evita duplicação: se o token já existe no estado local, ignora
      if (tokensLocalRef?.current && tokensLocalRef.current.some((t) => t.id === data.id)) {
        return;
      }
      if (onTokenUpdate) {
        onTokenUpdate(data, (prev) => {
          const novos = [...prev, data];
          return novos.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        });
      }
    };

    const handleTokenDeleted = (data) => {
      // Ignora eventos originados pelo próprio cliente
      if (data.userId === userId) return;

      if (onTokenUpdate) {
        onTokenUpdate(data, (prev) => prev.filter((t) => t.id !== data.id));
      }
    };

    const handleTokenDragStart = (data) => {
      // Ignora eventos originados pelo próprio cliente
      if (data.userId === userId) return;

      setArrastosRemotos((prev) => ({
        ...prev,
        [data.tokenId]: {
          nome: data.nome,
          cor: getCorSheet(data.sheetId),
          userId: data.userId,
        },
      }));
    };

    const handleTokenDragEnd = (data) => {
      // Ignora eventos originados pelo próprio cliente
      if (data.userId === userId) return;

      setArrastosRemotos((prev) => {
        const newState = { ...prev };
        delete newState[data.tokenId];
        return newState;
      });
    };

    socket.on('tabletop:tokenUpdated', handleTokenUpdated);
    socket.on('tabletop:tokenCreated', handleTokenCreated);
    socket.on('tabletop:tokenDeleted', handleTokenDeleted);
    socket.on('tabletop:tokenDragStart', handleTokenDragStart);
    socket.on('tabletop:tokenDragEnd', handleTokenDragEnd);

    return () => {
      socket.off('tabletop:tokenUpdated', handleTokenUpdated);
      socket.off('tabletop:tokenCreated', handleTokenCreated);
      socket.off('tabletop:tokenDeleted', handleTokenDeleted);
      socket.off('tabletop:tokenDragStart', handleTokenDragStart);
      socket.off('tabletop:tokenDragEnd', handleTokenDragEnd);
    };
  }, [socket, onTokenUpdate, onUIUpdate, tokensLocalRef, userId]);

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