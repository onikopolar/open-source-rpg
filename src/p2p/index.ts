// src/p2p/index.ts
// Barrel export para o módulo WebRTC/P2P

export { SignalingService } from './SignalingService';
export { PeerManager } from './PeerManager';
export { AssetTransfer } from './AssetTransfer';
export { useWebRTC } from './useWebRTC';
export { useP2PImageSync } from './useP2PImageSync';
export { p2pLog } from './logger';
export type {
  AssetMetadata,
  AssetCategory,
  TransferProgress,
  ProgressCallback,
  AssetReceivedCallback,
  WebRTCConfig,
  SignalingOffer,
  SignalingAnswer,
  SignalingIceCandidate,
} from './types';
export type {
  P2PImageSyncOptions,
  P2PImageSyncReturn,
} from './useP2PImageSync';
export { TransferState, DataMessageType, DEFAULT_WEBRTC_CONFIG } from './types';
