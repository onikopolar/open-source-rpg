// src/p2p/SignalingService.ts
// Abstrai a troca de mensagens de sinalização WebRTC via Socket.io.
//
// O Socket.io é usado apenas como "signal server" — as ofertas,
// respostas e ICE candidates são roteadas pelo servidor, mas
// os dados (assets) vão direto via WebRTC DataChannel (P2P).

import type { Socket } from 'socket.io-client';
import type {
  SignalingOffer,
  SignalingAnswer,
  SignalingIceCandidate,
} from './types';
import { p2pLog } from './logger';

export type SignalingHandler = {
  onOffer: (data: SignalingOffer) => void;
  onAnswer: (data: SignalingAnswer) => void;
  onIceCandidate: (data: SignalingIceCandidate) => void;
};

/**
 * Serviço de sinalização WebRTC.
 *
 * Encapsula o envio e recebimento de mensagens de sinalização
 * pelo Socket.io existente. O servidor atua como relay puro —
 * sem lógica de negócio, apenas roteamento.
 */
export class SignalingService {
  private socket: Socket;
  private handlers: SignalingHandler | null = null;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  // ─── Registro de handlers ────────────────────────────────

  /**
   * Registra os callbacks para receber mensagens de sinalização.
   * Deve ser chamado ANTES de iniciar conexões WebRTC.
   */
  registerHandlers(handlers: SignalingHandler): void {
    this.handlers = handlers;
    this.setupListeners();
  }

  /**
   * Remove todos os listeners de sinalização.
   */
  unregisterHandlers(): void {
    this.socket.off('webrtc:offer');
    this.socket.off('webrtc:answer');
    this.socket.off('webrtc:ice-candidate');
    this.handlers = null;
  }

  // ─── Envio de mensagens ──────────────────────────────────

  /**
   * Envia uma oferta WebRTC para um peer específico.
   */
  sendOffer(targetUserId: string, offer: RTCSessionDescriptionInit): void {
    p2pLog.debug('SIG', `offer → ${targetUserId.slice(0, 8)}`);
    this.socket.emit('webrtc:offer', {
      targetUserId,
      offer,
    });
  }

  /**
   * Envia uma resposta WebRTC para um peer específico.
   */
  sendAnswer(targetUserId: string, answer: RTCSessionDescriptionInit): void {
    p2pLog.debug('SIG', `answer → ${targetUserId.slice(0, 8)}`);
    this.socket.emit('webrtc:answer', {
      targetUserId,
      answer,
    });
  }

  /**
   * Envia um ICE candidate para um peer específico.
   */
  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit): void {
    p2pLog.debug('SIG', `ICE → ${targetUserId.slice(0, 8)}`);
    this.socket.emit('webrtc:ice-candidate', {
      targetUserId,
      candidate,
    });
  }

  // ─── Listeners ───────────────────────────────────────────

  private setupListeners(): void {
    this.socket.on('webrtc:offer', (data: SignalingOffer) => {
      p2pLog.debug('SIG', `offer ← ${data.fromUserId.slice(0, 8)}`);
      this.handlers?.onOffer(data);
    });

    this.socket.on('webrtc:answer', (data: SignalingAnswer) => {
      p2pLog.debug('SIG', `answer ← ${data.fromUserId.slice(0, 8)}`);
      this.handlers?.onAnswer(data);
    });

    this.socket.on('webrtc:ice-candidate', (data: SignalingIceCandidate) => {
      p2pLog.debug('SIG', `ICE ← ${data.fromUserId.slice(0, 8)}`);
      this.handlers?.onIceCandidate(data);
    });
  }
}
