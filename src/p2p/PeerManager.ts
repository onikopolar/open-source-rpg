// src/p2p/PeerManager.ts
// Gerencia conexões WebRTC ponto-a-ponto.
//
// Responsabilidades:
// - Criar/destruir RTCPeerConnection por peer
// - Negociar ofertas/respostas (via SignalingService)
// - Gerenciar ICE candidates
// - Criar DataChannels para transferência de dados
//
// STUN apenas (gratuito). Se NAT simétrico bloquear,
// a conexão falha gracefulmente e o fallback é REST.

import { SignalingService } from './SignalingService';
import type { WebRTCConfig } from './types';
import { DEFAULT_WEBRTC_CONFIG } from './types';
import { p2pLog } from './logger';

export type PeerEventCallback = {
  onPeerConnected: (peerId: string) => void;
  onPeerDisconnected: (peerId: string) => void;
  onDataChannel: (peerId: string, channel: RTCDataChannel) => void;
  onError: (peerId: string, error: Error) => void;
};

interface PeerState {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  makingOffer: boolean;
  ignoreOffer: boolean;
  polite: boolean;
}

/**
 * Gerenciador de conexões P2P.
 *
 * Mantém um Map<peerId, PeerState> com todas as conexões ativas.
 * Implementa "perfect negotiation" pattern para evitar colisões
 * de ofertas simultâneas (glare).
 */
export class PeerManager {
  private peers = new Map<string, PeerState>();
  private signaling: SignalingService;
  private config: WebRTCConfig;
  private userId: string;
  private callbacks: PeerEventCallback;

  constructor(
    signaling: SignalingService,
    userId: string,
    callbacks: PeerEventCallback,
    config: Partial<WebRTCConfig> = {}
  ) {
    this.signaling = signaling;
    this.userId = userId;
    this.config = { ...DEFAULT_WEBRTC_CONFIG, ...config };
    this.callbacks = callbacks;

    this.setupSignaling();
  }

  // ─── API Pública ─────────────────────────────────────────

  /**
   * Inicia conexão com um peer.
   * Se já conectado, retorna o DataChannel existente.
   */
  async connectTo(peerId: string): Promise<RTCDataChannel> {
    // Já conectado
    const existing = this.peers.get(peerId);
    if (existing?.dataChannel?.readyState === 'open') {
      return existing.dataChannel;
    }
    // Conexão em andamento — espera
    if (existing && existing.connection.signalingState !== 'stable' && existing.connection.signalingState !== 'closed') {
      p2pLog.debug('PEER', `Conexão já em andamento com ${peerId.slice(0, 8)} (${existing.connection.signalingState})`);
      // Retorna o DataChannel existente (pode ainda não estar aberto)
      if (existing.dataChannel) return existing.dataChannel;
    }

    p2pLog.info('PEER', `Conectando a ${peerId.slice(0, 8)}...`);
    const pc = this.createPeerConnection(peerId);
    const channel = pc.createDataChannel('asset-transfer', {
      ordered: true,
    });

    this.setupDataChannel(peerId, channel);

    this.peers.set(peerId, {
      connection: pc,
      dataChannel: channel,
      makingOffer: false,
      ignoreOffer: false,
      polite: this.isPolite(peerId),
    });

    return channel;
  }

  /**
   * Fecha conexão com um peer específico.
   */
  disconnect(peerId: string): void {
    p2pLog.info('PEER', `Desconectando ${peerId.slice(0, 8)}`);
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.dataChannel?.close();
      peer.connection.close();
      this.peers.delete(peerId);
    }
  }

  /**
   * Fecha TODAS as conexões.
   */
  disconnectAll(): void {
    for (const [peerId] of this.peers) {
      this.disconnect(peerId);
    }
  }

  /**
   * Retorna o DataChannel para um peer, se conectado.
   */
  getChannel(peerId: string): RTCDataChannel | null {
    return this.peers.get(peerId)?.dataChannel ?? null;
  }

  /**
   * Lista de peers conectados.
   */
  getConnectedPeers(): string[] {
    const connected: string[] = [];
    for (const [peerId, state] of this.peers) {
      if (state.dataChannel?.readyState === 'open') {
        connected.push(peerId);
      }
    }
    return connected;
  }

  // ─── Negociação WebRTC ───────────────────────────────────

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    // ICE candidate → envia via signaling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendIceCandidate(peerId, event.candidate.toJSON());
      }
    };

    // Mudança no estado de conexão ICE
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      p2pLog.debug('PEER', `ICE state [${peerId.slice(0, 8)}]: ${state}`);
      if (state === 'connected' || state === 'completed') {
        p2pLog.info('PEER', `✅ Conectado a ${peerId.slice(0, 8)}`);
        this.callbacks.onPeerConnected(peerId);
      } else if (state === 'failed' || state === 'disconnected') {
        p2pLog.warn('PEER', `Desconectado de ${peerId.slice(0, 8)} (${state})`);
        this.callbacks.onPeerDisconnected(peerId);
      }
    };

    // DataChannel recebido do peer remoto
    pc.ondatachannel = (event) => {
      this.setupDataChannel(peerId, event.channel);
      const peer = this.peers.get(peerId);
      if (peer && !peer.dataChannel) {
        peer.dataChannel = event.channel;
      }
    };

    // Negociação necessária (ex: após adicionar tracks)
    pc.onnegotiationneeded = async () => {
      const peer = this.peers.get(peerId);
      if (!peer) return;

      try {
        peer.makingOffer = true;
        await pc.setLocalDescription();
        this.signaling.sendOffer(peerId, pc.localDescription!.toJSON());
      } catch (err) {
        this.callbacks.onError(peerId, err as Error);
      } finally {
        peer.makingOffer = false;
      }
    };

    return pc;
  }

  private setupSignaling(): void {
    this.signaling.registerHandlers({
      onOffer: async (data) => {
        const { fromUserId, offer } = data;
        let peer = this.peers.get(fromUserId);

        // Se já tem conexão estável, ignora oferta duplicada
        if (peer?.connection.signalingState === 'stable' && peer.dataChannel?.readyState === 'open') {
          p2pLog.debug('PEER', `Ignorando oferta duplicada de ${fromUserId.slice(0, 8)} (já conectado)`);
          return;
        }

        // Cria RTCPeerConnection se não existe ainda
        if (!peer) {
          const pc = this.createPeerConnection(fromUserId);
          peer = {
            connection: pc,
            dataChannel: null,
            makingOffer: false,
            ignoreOffer: false,
            polite: this.isPolite(fromUserId),
          };
          this.peers.set(fromUserId, peer);
        }

        try {
          // Perfect negotiation: evita colisão de ofertas
          const readyForOffer =
            !peer.makingOffer &&
            (peer.connection.signalingState === 'stable' ||
              peer.connection.signalingState === 'have-local-offer');

          if (!readyForOffer) {
            peer.ignoreOffer = !this.isPolite(fromUserId);
            if (peer.ignoreOffer) return;
          }

          await peer.connection.setRemoteDescription(
            new RTCSessionDescription(offer)
          );

          // Só cria answer se não for oferta duplicada
          if (peer.connection.signalingState !== 'stable') {
            await peer.connection.setLocalDescription();
            this.signaling.sendAnswer(
              fromUserId,
              peer.connection.localDescription!.toJSON()
            );
          }
        } catch (err) {
          this.callbacks.onError(fromUserId, err as Error);
        }
      },

      onAnswer: async (data) => {
        const { fromUserId, answer } = data;
        const peer = this.peers.get(fromUserId);
        if (!peer) return;

        // Só aceita answer se estivermos no estado correto
        // (have-local-offer). Se já estiver stable, é answer duplicada
        // de uma negociação anterior (glare resolvido).
        const state = peer.connection.signalingState;
        if (state !== 'have-local-offer') {
          p2pLog.debug('PEER', `Ignorando answer duplicada de ${fromUserId.slice(0, 8)} (state: ${state})`);
          return;
        }

        try {
          await peer.connection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        } catch (err) {
          p2pLog.warn('PEER', `Erro ao processar answer de ${fromUserId.slice(0, 8)}: ${(err as Error).message}`);
          // Não propaga erro — é esperado em colisões de glare
        }
      },

      onIceCandidate: async (data) => {
        const { fromUserId, candidate } = data;
        const peer = this.peers.get(fromUserId);
        if (!peer) return;

        try {
          await peer.connection.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          this.callbacks.onError(fromUserId, err as Error);
        }
      },
    });
  }

  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      p2pLog.info('PEER', `DataChannel aberto [${peerId.slice(0, 8)}]`);
      this.callbacks.onDataChannel(peerId, channel);
      this.callbacks.onPeerConnected(peerId);
    };

    channel.onclose = () => {
      p2pLog.info('PEER', `DataChannel fechado [${peerId.slice(0, 8)}]`);
      this.callbacks.onPeerDisconnected(peerId);
    };

    channel.onerror = (event) => {
      p2pLog.error('PEER', `DataChannel erro [${peerId.slice(0, 8)}]`, event);
      const error = new Error(
        `DataChannel error with peer ${peerId}: ${JSON.stringify(event)}`
      );
      this.callbacks.onError(peerId, error);
    };
  }

  // ─── Polite Peer ─────────────────────────────────────────

  /**
   * Determina se somos o peer "polido" nesta conexão.
   * O peer com menor userId é o "polido" — ele recua em
   * caso de colisão de ofertas (glare).
   *
   * Perfect negotiation pattern:
   * https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
   */
  private isPolite(peerId: string): boolean {
    return this.userId < peerId;
  }
}
