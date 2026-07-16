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
  onAnimateTarget,
}) {
  const [arrastosRemotos, setArrastosRemotos] = useState({});
  const arrastosRemotosRef = useRef({});
  const userId = socket?.id;

  // Mantem ref sincronizada para uso nos handlers de socket (evita stale closure)
  useEffect(() => {
    arrastosRemotosRef.current = arrastosRemotos;
  }, [arrastosRemotos]);

  const emitirEvento = useCallback(
    (evento, dados) => {
      // ⏱️ TRACING: log detalhado do estado do socket
      if (dados._traceId) {
        const _tsRef = dados._tsClique || 0;
        if (!socket || !socket.connected) {
          console.log(
            `%c[⏱️ INVERT] %ctraceId=${dados._traceId} %cetapa=SOCKET-FALHOU %cmotivo=${!socket ? 'socket-nulo' : 'desconectado'} %cts=+${(performance.now() - _tsRef).toFixed(1)}ms`,
            'font-weight:bold;color:#ff9800', 'color:#4fc3f7', 'color:#f44336', 'color:#f44336', 'color:#888'
          );
          return;
        }
        console.log(
          `%c[⏱️ INVERT] %ctraceId=${dados._traceId} %cetapa=SOCKET-EMIT-REAL %cts=+${(performance.now() - _tsRef).toFixed(1)}ms %ctransport=${socket.io?.engine?.transport?.name || '?'} %csid=${socket.id?.slice(0, 8)}`,
          'font-weight:bold;color:#ff9800', 'color:#4fc3f7', 'color:#ab47bc', 'color:#888', 'color:#888', 'color:#888'
        );
      }
      if (!socket || !socket.connected) return;
      // ⏱️ Adiciona timestamp Date.now() no payload (compara com relógio do servidor)
      if (dados._traceId) {
        dados._tsEmit = Date.now();
      }
      // Ack callback: servidor confirma recebimento → mede roundtrip client→server
      socket.emit(`tabletop:${evento}`, dados, dados._traceId ? () => {
        console.log(
          `%c[⏱️ INVERT] %ctraceId=${dados._traceId} %cetapa=SOCKET-ACK %cts=+${(performance.now() - (dados._tsClique || 0)).toFixed(1)}ms %c✅ servidor confirmou`,
          'font-weight:bold;color:#ff9800', 'color:#4fc3f7', 'color:#ce93d8', 'color:#888', 'color:#4caf50'
        );
      } : undefined);
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
      if (!socket || !socket.connected) return;
      // Remove imageBase64 do payload — imagens grandes excedem o limite
      // de 1MB do Socket.IO e sao descartadas silenciosamente.
      // O P2P (WebRTC) cuida da transferencia da imagem.
      const { imageBase64, ...tokenSemBase64 } = token;
      emitirEvento('tokenCreated', { tabletopId, ...tokenSemBase64, userId });
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
    (tokenId, invertido, _traceId, _tsClique) => {
      emitirEvento('tokenInverted', { tabletopId, id: tokenId, invertido, userId, ...(_traceId && { _traceId, _tsClique }) });
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

      // ⏱️ TRACING: log quando chega no cliente destino
      if (data._traceId) {
        const _tRecebido = performance.now();
        console.log(
          `%c[⏱️ INVERT] %ctraceId=${data._traceId} %cetapa=CLIENTE-RECEBE %cts=+${_tRecebido.toFixed(1)}ms %ctokenId=${data.id} invertido=${data.invertido}`,
          'font-weight:bold;color:#ff9800', 'color:#4fc3f7', 'color:#ef5350', 'color:#888', 'color:#aaa'
        );
        // Mede render: setTimeout(0) dispara após React processar o state + microtasks.
        // RAF mediria paint mas é throttled em background tabs (pode dar 1s+ falso).
        const _traceRecebido = data._traceId;
        const _tRecebidoRef = _tRecebido;
        setTimeout(() => {
          console.log(
            `%c[⏱️ INVERT] %ctraceId=${_traceRecebido} %cetapa=RENDER %cts=+${performance.now().toFixed(1)}ms %cdiff=+${(performance.now() - _tRecebidoRef).toFixed(1)}ms`,
            'font-weight:bold;color:#ff9800', 'color:#4fc3f7', 'color:#66bb6a', 'color:#888', 'color:#888'
          );
        }, 0);
      }

      const sendoArrastadoRemotamente = !!arrastosRemotosRef.current[data.id];

      if (onAnimateTarget && data.x !== undefined && data.y !== undefined) {
        if (sendoArrastadoRemotamente) {
          // Snap: cancela interpolacao, token renderiza via tokensLocal
          onAnimateTarget(data.id, data.x, data.y, true);
        } else {
          // Interpolacao normal para settle suave
          onAnimateTarget(data.id, data.x, data.y);
        }
      }

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
      console.log(`[SincTokens] handleTokenCreated recebido: data.userId=${data.userId?.slice(0,8)}, meu userId=${userId?.slice(0,8)}, data.id=${data.id}, data.nome=${data.nome}`);
      
      if (data.userId === userId) {
        console.log(`[SincTokens] handleTokenCreated: IGNORADO (evento proprio)`);
        return;
      }

      if (tokensLocalRef?.current && tokensLocalRef.current.some((t) => t.id === data.id)) {
        console.log(`[SincTokens] handleTokenCreated: IGNORADO (token ja existe localmente)`);
        return;
      }

      console.log(`[SincTokens] handleTokenCreated: ADICIONANDO token remoto, id=${data.id}, nome=${data.nome}`);
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

      // Interpolação OBR-style para batch de tokens (arrasto em grupo)
      if (onAnimateTarget && data.tokens) {
        data.tokens.forEach(({ id, x, y }) => {
          if (x !== undefined && y !== undefined) {
            onAnimateTarget(id, x, y);
          }
        });
      }

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
  }, [socket, onTokenUpdate, onUIUpdate, tokensLocalRef, userId, onAnimateTarget]);

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