// src/p2p/useWebRTC.ts
// Hook React para integração do sistema P2P WebRTC.
//
// Uso típico:
//   const webrtc = useWebRTC({ socket, tabletopId });
//   webrtc.sendAssetToAll(assetId, blob, metadata);
//
// Arquitetura:
//   SignalingService → Socket.io (relay de ofertas/respostas/ICE)
//   PeerManager       → RTCPeerConnection por peer
//   AssetTransfer     → DataChannel + chunking de arquivos

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  SignalingService,
  PeerManager,
  AssetTransfer,
} from './index';
import type {
  AssetMetadata,
  TransferProgress,
  AssetReceivedCallback,
  ProgressCallback,
  WebRTCConfig,
} from './types';

export interface UseWebRTCOptions {
  socket: Socket | null;
  /** Se fornecido, gerencia peers automaticamente na sala */
  tabletopId?: string;
  /** Configuração WebRTC (STUN servers, chunk size, etc.) */
  config?: Partial<WebRTCConfig>;
  /** Callback quando um asset é recebido completamente */
  onAssetReceived?: AssetReceivedCallback;
  /** Callback de progresso de transferência */
  onProgress?: ProgressCallback;
  /** Callback quando peers conectam/desconectam */
  onPeersChanged?: (peers: string[]) => void;
}

export interface UseWebRTCReturn {
  /** Envia um asset para um peer específico */
  sendAssetTo: (
    peerId: string,
    assetId: string,
    blob: Blob,
    metadata: AssetMetadata
  ) => Promise<void>;

  /** Envia um asset para todos os peers conectados */
  sendAssetToAll: (
    assetId: string,
    blob: Blob,
    metadata: AssetMetadata
  ) => Promise<void>;

  /** Transfers em andamento */
  transfers: Map<string, TransferProgress>;

  /** Lista de peers conectados */
  connectedPeers: string[];

  /** Conecta manualmente a um peer (se não usar tabletopId) */
  connectTo: (peerId: string) => Promise<void>;

  /** Desconecta de um peer */
  disconnect: (peerId: string) => void;

  /** Desconecta de todos os peers */
  disconnectAll: () => void;

  /** Se o WebRTC está pronto */
  isReady: boolean;
}

export function useWebRTC(options: UseWebRTCOptions): UseWebRTCReturn {
  const {
    socket,
    tabletopId,
    config,
    onAssetReceived,
    onProgress,
    onPeersChanged,
  } = options;

  const signalingRef = useRef<SignalingService | null>(null);
  const peerManagerRef = useRef<PeerManager | null>(null);
  const assetTransferRef = useRef<AssetTransfer | null>(null);
  const connectedPeersRef = useRef<Set<string>>(new Set());
  const pendingConnectionsRef = useRef<Set<string>>(new Set());

  const [isReady, setIsReady] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [transfers, setTransfers] = useState<Map<string, TransferProgress>>(
    new Map()
  );

  // ─── Inicialização ─────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    const userId = socket.id;
    if (!userId) {
      // Socket ainda não conectado — espera
      const onConnect = () => {
        initWebRTC(socket, socket.id!);
      };
      socket.once('connect', onConnect);
      return () => {
        socket.off('connect', onConnect);
      };
    }

    initWebRTC(socket, userId);

    return () => {
      // Cleanup
      peerManagerRef.current?.disconnectAll();
      signalingRef.current?.unregisterHandlers();
      signalingRef.current = null;
      peerManagerRef.current = null;
      assetTransferRef.current = null;
      setIsReady(false);
    };
  }, [socket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function initWebRTC(socket: Socket, userId: string): void {
    const signaling = new SignalingService(socket);
    signalingRef.current = signaling;

    const assetTransfer = new AssetTransfer();
    assetTransferRef.current = assetTransfer;

    if (onProgress) {
      assetTransfer.setOnProgress((progress) => {
        onProgress(progress);
        setTransfers((prev) => {
          const next = new Map(prev);
          next.set(progress.assetId, progress);
          return next;
        });
      });
    }

    if (onAssetReceived) {
      assetTransfer.setOnAssetReceived(onAssetReceived);
    }

    const peerManager = new PeerManager(signaling, userId, {
      onPeerConnected: (peerId) => {
        connectedPeersRef.current.add(peerId);
        const peers = Array.from(connectedPeersRef.current);
        setConnectedPeers(peers);
        onPeersChanged?.(peers);
      },
      onPeerDisconnected: (peerId) => {
        connectedPeersRef.current.delete(peerId);
        pendingConnectionsRef.current.delete(peerId);
        const peers = Array.from(connectedPeersRef.current);
        setConnectedPeers(peers);
        onPeersChanged?.(peers);
      },
      onDataChannel: (peerId, channel) => {
        // Redireciona mensagens do DataChannel para o AssetTransfer
        // Passa o próprio channel como sender de ACKs
        channel.onmessage = (event) => {
          assetTransfer.handleMessage(peerId, event, (msg: string) => {
            if (channel.readyState === 'open') {
              channel.send(msg);
            }
          });
        };
      },
      onError: (peerId, error) => {
        console.error(`[useWebRTC] Peer ${peerId} error:`, error);
      },
    }, config);
    peerManagerRef.current = peerManager;

    setIsReady(true);
  }

  // ─── Gerenciamento de peers na sala ────────────────────

  useEffect(() => {
    if (!socket || !tabletopId || !isReady) return;

    // Detecta peers na sala e conecta automaticamente
    const handleUserJoined = (data: { userId: string }) => {
      if (data.userId !== socket.id) {
        connectIfNew(data.userId);
      }
    };

    const handleRoomUsers = (data: { userIds: string[] }) => {
      for (const userId of data.userIds) {
        if (userId !== socket.id) {
          connectIfNew(userId);
        }
      }
    };

    // Solicita lista de usuários na sala
    socket.emit('webrtc:get-users', { tabletopId });

    socket.on('webrtc:user-joined', handleUserJoined);
    socket.on('webrtc:room-users', handleRoomUsers);

    return () => {
      socket.off('webrtc:user-joined', handleUserJoined);
      socket.off('webrtc:room-users', handleRoomUsers);
    };
  }, [socket, tabletopId, isReady]);

  async function connectIfNew(peerId: string): Promise<void> {
    if (
      connectedPeersRef.current.has(peerId) ||
      pendingConnectionsRef.current.has(peerId)
    ) {
      return;
    }

    pendingConnectionsRef.current.add(peerId);
    try {
      await peerManagerRef.current?.connectTo(peerId);
    } catch (err) {
      console.warn(`[useWebRTC] Failed to connect to ${peerId}:`, err);
    } finally {
      pendingConnectionsRef.current.delete(peerId);
    }
  }

  // ─── API de envio ──────────────────────────────────────

  const sendAssetTo = useCallback(
    async (
      peerId: string,
      assetId: string,
      blob: Blob,
      metadata: AssetMetadata
    ): Promise<void> => {
      const channel = peerManagerRef.current?.getChannel(peerId);
      if (!channel || channel.readyState !== 'open') {
        // Tenta conectar primeiro
        const newChannel = await peerManagerRef.current?.connectTo(peerId);
        if (!newChannel) {
          throw new Error(`Cannot connect to peer ${peerId}`);
        }
        // Espera o channel abrir
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error('Connection timeout')),
            15000
          );
          newChannel.onopen = () => {
            clearTimeout(timeout);
            resolve();
          };
        });
        await assetTransferRef.current?.sendAsset(
          newChannel,
          assetId,
          blob,
          metadata
        );
      } else {
        await assetTransferRef.current?.sendAsset(
          channel,
          assetId,
          blob,
          metadata
        );
      }
    },
    []
  );

  const sendAssetToAll = useCallback(
    async (
      assetId: string,
      blob: Blob,
      metadata: AssetMetadata
    ): Promise<void> => {
      const peers = Array.from(connectedPeersRef.current);
      const results = await Promise.allSettled(
        peers.map((peerId) => sendAssetTo(peerId, assetId, blob, metadata))
      );

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn(
          `[useWebRTC] Failed to send to ${failed.length}/${peers.length} peers`
        );
      }
    },
    [sendAssetTo]
  );

  const connectTo = useCallback(async (peerId: string) => {
    await peerManagerRef.current?.connectTo(peerId);
  }, []);

  const disconnect = useCallback((peerId: string) => {
    peerManagerRef.current?.disconnect(peerId);
    connectedPeersRef.current.delete(peerId);
    setConnectedPeers(Array.from(connectedPeersRef.current));
  }, []);

  const disconnectAll = useCallback(() => {
    peerManagerRef.current?.disconnectAll();
    connectedPeersRef.current.clear();
    setConnectedPeers([]);
  }, []);

  return {
    sendAssetTo,
    sendAssetToAll,
    transfers,
    connectedPeers,
    connectTo,
    disconnect,
    disconnectAll,
    isReady,
  };
}
