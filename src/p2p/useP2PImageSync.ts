// src/p2p/useP2PImageSync.ts
// Hook orquestrador: conecta o P2P WebRTC com o fluxo de tokens.
//
// Responsabilidades:
// 1. Compartilhar imagens de tokens novos/editados via P2P
// 2. Receber imagens de peers e atualizar tokens locais
// 3. Gerenciar cache de Object URLs para blobs recebidos
//
// Fluxo:
//   Mestre cria token com imagem
//     → shareTokenImage(tokenId, blob)
//   Peer recebe imagem
//     → onAssetReceived → atualiza imageUrl do token local

import { useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { useWebRTC } from './useWebRTC';
import { p2pLog } from './logger';
import type { AssetMetadata } from './types';

export interface P2PImageSyncOptions {
  socket: Socket | null;
  tabletopId: string;
  /** Callback para atualizar a URL da imagem de um token no estado local */
  onTokenImageReceived: (tokenId: string, imageUrl: string) => void;
}

export interface P2PImageSyncReturn {
  /** Compartilha a imagem de um token com todos os peers conectados */
  shareTokenImage: (
    tokenId: string,
    imageSource: Blob | string
  ) => Promise<void>;
  /** Peers conectados via P2P */
  connectedPeers: string[];
  /** Se o P2P está pronto */
  isReady: boolean;
}

/**
 * Hook que gerencia a sincronização de imagens de tokens via P2P.
 *
 * Uso no tabletopgrid.jsx:
 *   const p2p = useP2PImageSync({
 *     socket, tabletopId,
 *     onTokenImageReceived: (tokenId, imageUrl) => {
 *       setTokensLocal(prev => prev.map(t =>
 *         t.id === tokenId ? { ...t, imageUrl } : t
 *       ));
 *     },
 *   });
 *
 *   // Ao criar token com imagem:
 *   await criarToken(novoToken);
 *   if (novoToken.imageUrl || novoToken.imageBase64) {
 *     p2p.shareTokenImage(novoToken.tokenId, novoToken.imageBase64 || novoToken.imageUrl);
 *   }
 */
export function useP2PImageSync(
  options: P2PImageSyncOptions
): P2PImageSyncReturn {
  const { socket, tabletopId, onTokenImageReceived } = options;

  // Cache de Object URLs para evitar leaks de memória
  const objectUrlCache = useRef(new Map<string, string>());

  // Revoga Object URLs antigas quando o componente desmonta
  const revokeObjectUrl = useCallback((tokenId: string) => {
    const url = objectUrlCache.current.get(tokenId);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrlCache.current.delete(tokenId);
    }
  }, []);

  const webrtc = useWebRTC({
    socket,
    tabletopId,
    onAssetReceived: useCallback(
      (assetId: string, blob: Blob, _metadata: AssetMetadata) => {
        p2pLog.info('SYNC', `Imagem recebida: ${assetId} (${(blob.size / 1024).toFixed(1)}KB)`);
        // Revoga URL anterior se existir
        revokeObjectUrl(assetId);

        // Cria Object URL a partir do blob recebido
        const objectUrl = URL.createObjectURL(blob);
        objectUrlCache.current.set(assetId, objectUrl);

        // Atualiza o token local com a nova URL
        onTokenImageReceived(assetId, objectUrl);
      },
      [onTokenImageReceived, revokeObjectUrl]
    ),
    onProgress: undefined, // pode adicionar progress bar depois
  });

  /**
   * Compartilha a imagem de um token com todos os peers.
   *
   * @param tokenId - ID do token
   * @param imageSource - Blob (File) ou string (base64 data URL ou HTTP URL)
   */
  const shareTokenImage = useCallback(
    async (tokenId: string, imageSource: Blob | string): Promise<void> => {
      p2pLog.debug('SYNC', `shareTokenImage chamado: ${tokenId}, ready=${webrtc.isReady}, peers=${webrtc.connectedPeers.length}`);

      if (!webrtc.isReady || webrtc.connectedPeers.length === 0) {
        p2pLog.info('SYNC', `P2P indisponível para ${tokenId} (ready=${webrtc.isReady}, peers=${webrtc.connectedPeers.length}) — usando REST fallback`);
        return;
      }

      let blob: Blob;

      if (imageSource instanceof Blob) {
        blob = imageSource;
        p2pLog.debug('SYNC', `Fonte: Blob (${(blob.size / 1024).toFixed(1)}KB)`);
      } else if (typeof imageSource === 'string') {
        p2pLog.debug('SYNC', `Fonte: string (${imageSource.substring(0, 60)}...)`);
        if (imageSource.startsWith('data:')) {
          // Base64 data URL → converte pra Blob
          const response = await fetch(imageSource);
          blob = await response.blob();
        } else if (imageSource.startsWith('http')) {
          // URL externa → fetch
          const response = await fetch(imageSource);
          blob = await response.blob();
        } else if (imageSource.startsWith('/')) {
          // Caminho local → fetch
          const response = await fetch(imageSource);
          blob = await response.blob();
        } else {
          console.warn('[P2P] Fonte de imagem desconhecida:', imageSource.substring(0, 50));
          return;
        }
      } else {
        return;
      }

      const metadata: AssetMetadata = {
        assetId: tokenId,
        fileName: `token-${tokenId}.png`,
        mimeType: blob.type || 'image/png',
        totalBytes: blob.size,
        category: 'token-image',
        entityId: tokenId,
      };

      try {
        p2pLog.info('SYNC', `Compartilhando ${tokenId} (${(blob.size / 1024).toFixed(1)}KB) com ${webrtc.connectedPeers.length} peers`);
        await webrtc.sendAssetToAll(tokenId, blob, metadata);
      } catch (err) {
        // P2P falhou — a imagem ainda chega via REST/DB
        console.warn('[P2P] Falha ao compartilhar imagem, fallback REST:', err);
      }
    },
    [webrtc.isReady, webrtc.connectedPeers, webrtc.sendAssetToAll]
  );

  return {
    shareTokenImage,
    connectedPeers: webrtc.connectedPeers,
    isReady: webrtc.isReady,
  };
}
