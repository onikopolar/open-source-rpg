// src/p2p/types.ts
// Tipos compartilhados para o sistema P2P de transferência de assets

/** Metadados de um asset sendo transferido via P2P */
export interface AssetMetadata {
  assetId: string;
  fileName: string;
  mimeType: string;
  totalBytes: number;
  /** Contexto: ex: 'token-image', 'portrait', 'map' */
  category: AssetCategory;
  /** ID do token/personagem associado */
  entityId?: string;
}

export type AssetCategory = 'token-image' | 'portrait' | 'map' | 'generic';

/** Estados possíveis de uma transferência de asset */
export enum TransferState {
  PENDING = 'pending',
  TRANSFERRING = 'transferring',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

/** Progresso de uma transferência */
export interface TransferProgress {
  assetId: string;
  state: TransferState;
  bytesReceived: number;
  totalBytes: number;
  percentage: number;
  peerId: string;
}

/** Callback de progresso */
export type ProgressCallback = (progress: TransferProgress) => void;

/** Callback quando asset é recebido completamente */
export type AssetReceivedCallback = (
  assetId: string,
  blob: Blob,
  metadata: AssetMetadata
) => void;

// ─── WebRTC Signaling Messages ───────────────────────────────

export interface SignalingOffer {
  fromUserId: string;
  offer: RTCSessionDescriptionInit;
}

export interface SignalingAnswer {
  fromUserId: string;
  answer: RTCSessionDescriptionInit;
}

export interface SignalingIceCandidate {
  fromUserId: string;
  candidate: RTCIceCandidateInit;
}

// ─── DataChannel Protocol ──────────────────────────────────

/** Tipos de mensagem no protocolo DataChannel */
export const DataMessageType = {
  ASSET_START: 'asset:start',
  ASSET_CHUNK: 'asset:chunk',
  ASSET_ACK: 'asset:ack',
  ASSET_COMPLETE: 'asset:complete',
} as const;

// ─── Config ──────────────────────────────────────────────────

export interface WebRTCConfig {
  /** STUN servers (gratuitos). TURN é opcional para relay quando
   *  NAT simétrico bloqueia conexão direta. */
  iceServers: RTCIceServer[];
  /** Tamanho de cada chunk de dados (bytes). 16KB é seguro para
   *  DataChannel sem fragmentação adicional. */
  chunkSize: number;
  /** Timeout para conexão WebRTC (ms) */
  connectionTimeout: number;
}

export const DEFAULT_WEBRTC_CONFIG: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  chunkSize: 16 * 1024, // 16KB
  connectionTimeout: 15000, // 15s
};
