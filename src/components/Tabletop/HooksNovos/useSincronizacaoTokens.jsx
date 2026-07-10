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

    const joinRoom = () => {
      socket.emit('tabletop:join', { tabletopId });
    };

    if (!socket.connected) {
      socket.on('connect', joinRoom);
      // Reconectou após desconexão (ex: aba voltou do background)
      socket.on('reconnect', joinRoom);
      return;
    }

    joinRoom();

    // Re-emitir join sempre que o socket reconectar
    socket.on('reconnect', joinRoom);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('reconnect', joinRoom);
    };
  }, [tabletopId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleTokenUpdated = (data) => {
      if (data.userId === userId) return;

      if (onTokenUpdate) {
        onTokenUpdate(data, (prev) => {
          const index = prev.findIndex((t) => t.id === data.id);
          if (index === -1) return prev;
          const novos = [...prev];
          novos[index] = { ...novos[index], ...data };
          return novos; // Sem sort — índices estáveis, ordem visual vem do renderizarTokens
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
        if (data.invertido !== undefined) {
          onUIUpdate({
            type: 'SET_TOKEN_INVERT',
            payload: { tokenId: data.id, invertido: data.invertido },
          });
        }
      }
    };

    const handleTokenCreated = (data) => {
      if (data.userId === userId) return;

      if (tokensLocalRef?.current && tokensLocalRef.current.some((t) => t.id === data.id)) {
        return;
      }

      if (onTokenUpdate) {
        onTokenUpdate(data, (prev) => {
          const novos = [...prev, data];
          return novos; // Sem sort — índices estáveis
        });
      }
    };

    const handleTokenDeleted = (data) => {
      if (data.userId === userId) return;

      if (onTokenUpdate) {
        onTokenUpdate(data, (prev) => prev.filter((t) => t.id !== data.id));
      }
    };

    const handleTokenDragStart = (data) => {
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
      if (data.userId === userId) return;

      setArrastosRemotos((prev) => {
        const newState = { ...prev };
        delete newState[data.tokenId];
        return newState;
      });
    };

    const handleTokensMoved = (data) => {
      if (data.userId === userId) return;

      // Batch: atualiza vários tokens de uma vez (arrasto em grupo)
      if (onTokenUpdate && data.tokens) {
        onTokenUpdate(data, (prev) => {
          const novos = [...prev];
          data.tokens.forEach(({ id, x, y }) => {
            const index = novos.findIndex((t) => t.id === id);
            if (index !== -1) {
              novos[index] = { ...novos[index], x, y };
            }
          });
          return novos;
        });
      }
    };

    socket.on('tabletop:tokenUpdated', handleTokenUpdated);
    socket.on('tabletop:tokensMoved', handleTokensMoved);
    socket.on('tabletop:tokenCreated', handleTokenCreated);
    socket.on('tabletop:tokenDeleted', handleTokenDeleted);
    socket.on('tabletop:tokenDragStart', handleTokenDragStart);
    socket.on('tabletop:tokenDragEnd', handleTokenDragEnd);

    return () => {
      socket.off('tabletop:tokenUpdated', handleTokenUpdated);
      socket.off('tabletop:tokensMoved', handleTokensMoved);
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