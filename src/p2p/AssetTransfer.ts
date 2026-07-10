// src/p2p/AssetTransfer.ts
// Transferência de assets via WebRTC DataChannel com chunking.
//
// Protocolo (mensagens no DataChannel):
//   JSON:   { type: "asset:start", assetId, fileName, mimeType, totalChunks, ... }
//   BINARY: [4 bytes chunkIndex BigEndian][...chunk data...]
//   JSON:   { type: "asset:ack", assetId, chunkIndex }
//   JSON:   { type: "asset:complete", assetId }
//
// Chunking é necessário porque DataChannel tem limite ~16KB
// por mensagem em muitos browsers.

import type {
  AssetMetadata,
  ProgressCallback,
  AssetReceivedCallback,
} from './types';
import { TransferState } from './types';
import { p2pLog } from './logger';

const CHUNK_SIZE = 16 * 1024; // 16KB
const HEADER_SIZE = 4; // bytes do chunkIndex

interface ReceiveState {
  assetId: string;
  chunks: (ArrayBuffer | null)[];
  totalChunks: number;
  receivedChunks: number;
  metadata: AssetMetadata;
  /** Callback para enviar ACKs de volta pelo DataChannel */
  sendAck: (msg: string) => void;
}

interface SendState {
  assetId: string;
  chunks: ArrayBuffer[];
  totalChunks: number;
  channel: RTCDataChannel;
  metadata: AssetMetadata;
  ackedChunks: Set<number>;
}

export class AssetTransfer {
  private receiveStates = new Map<string, ReceiveState>();
  private sendStates = new Map<string, SendState>();
  private onProgress: ProgressCallback | null = null;
  private onAssetReceived: AssetReceivedCallback | null = null;

  setOnProgress(cb: ProgressCallback): void { this.onProgress = cb; }
  setOnAssetReceived(cb: AssetReceivedCallback): void { this.onAssetReceived = cb; }

  // ─── Envio ─────────────────────────────────────────────

  async sendAsset(
    channel: RTCDataChannel,
    assetId: string,
    blob: Blob,
    metadata: AssetMetadata,
  ): Promise<void> {
    if (channel.readyState !== 'open') {
      throw new Error(`DataChannel not open for ${assetId}: ${channel.readyState}`);
    }

    const buffer = await blob.arrayBuffer();
    const totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);
    const chunks: ArrayBuffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const s = i * CHUNK_SIZE;
      chunks.push(buffer.slice(s, Math.min(s + CHUNK_SIZE, buffer.byteLength)));
    }

    const state: SendState = {
      assetId, chunks, totalChunks, channel, metadata,
      ackedChunks: new Set(),
    };
    this.sendStates.set(assetId, state);

    // ASSET_START (JSON)
    p2pLog.info('XFER', `Iniciando ${assetId} (${(buffer.byteLength / 1024).toFixed(1)}KB, ${totalChunks} chunks)`);
    channel.send(JSON.stringify({
      type: 'asset:start',
      assetId,
      fileName: metadata.fileName,
      mimeType: metadata.mimeType,
      totalChunks,
      totalBytes: buffer.byteLength,
      chunkSize: CHUNK_SIZE,
      category: metadata.category,
    }));

    // 0 bytes: sem chunks, envia COMPLETE imediatamente
    if (totalChunks === 0) {
      p2pLog.info('XFER', `${assetId}: 0 bytes → COMPLETE imediato`);
      channel.send(JSON.stringify({ type: 'asset:complete', assetId }));
      this.sendStates.delete(assetId);
      return;
    }

    // Rajada inicial de chunks
    this.sendChunkBurst(state, 5);
  }

  // ─── Recebimento ───────────────────────────────────────

  handleMessage(peerId: string, event: MessageEvent, sendAck: (msg: string) => void): void {
    if (typeof event.data === 'string') {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'asset:start':
            this.onAssetStart(peerId, msg, sendAck);
            break;
          case 'asset:ack':
            this.onAssetAck(msg);
            break;
          case 'asset:complete':
            this.onAssetComplete(msg);
            break;
        }
      } catch { /* invalid JSON, ignore */ }
    } else if (event.data instanceof ArrayBuffer) {
      this.onBinaryChunk(peerId, event.data);
    } else if (event.data instanceof Blob) {
      const r = new FileReader();
      r.onload = () => {
        if (r.result instanceof ArrayBuffer) this.onBinaryChunk(peerId, r.result);
      };
      r.readAsArrayBuffer(event.data);
    }
  }

  // ─── Handlers ──────────────────────────────────────────

  private onAssetStart(
    peerId: string,
    msg: { assetId: string; fileName: string; mimeType: string;
           totalChunks: number; totalBytes: number; category: string },
    sendAck: (msg: string) => void,
  ): void {
    this.receiveStates.set(msg.assetId, {
      assetId: msg.assetId,
      chunks: new Array(msg.totalChunks).fill(null),
      totalChunks: msg.totalChunks,
      receivedChunks: 0,
      metadata: {
        assetId: msg.assetId,
        fileName: msg.fileName,
        mimeType: msg.mimeType,
        totalBytes: msg.totalBytes,
        category: (msg.category as AssetMetadata['category']) || 'generic',
      },
      sendAck,
    });

    this.onProgress?.({
      assetId: msg.assetId,
      state: TransferState.TRANSFERRING,
      bytesReceived: 0,
      totalBytes: msg.totalBytes,
      percentage: 0,
      peerId,
    });
  }

  private onBinaryChunk(peerId: string, buffer: ArrayBuffer): void {
    if (buffer.byteLength < HEADER_SIZE) return;
    const chunkIndex = new DataView(buffer, 0, HEADER_SIZE).getUint32(0, false);
    const data = buffer.slice(HEADER_SIZE);

    for (const [assetId, state] of this.receiveStates) {
      if (chunkIndex < state.totalChunks && !state.chunks[chunkIndex]) {
        state.chunks[chunkIndex] = data;
        state.receivedChunks++;

        // ACK
        state.sendAck(JSON.stringify({ type: 'asset:ack', assetId, chunkIndex }));

        const pct = Math.round((state.receivedChunks / state.totalChunks) * 100);
        this.onProgress?.({
          assetId, state: TransferState.TRANSFERRING,
          bytesReceived: state.receivedChunks * CHUNK_SIZE,
          totalBytes: state.metadata.totalBytes,
          percentage: Math.min(pct, 100),
          peerId,
        });
        return;
      }
    }
  }

  private onAssetAck(msg: { assetId: string; chunkIndex: number }): void {
    const state = this.sendStates.get(msg.assetId);
    if (!state) return;

    state.ackedChunks.add(msg.chunkIndex);

    if (state.ackedChunks.size >= state.totalChunks) {
      p2pLog.info('XFER', `${msg.assetId}: transferência concluída (${state.totalChunks} chunks)`);
      state.channel.send(JSON.stringify({ type: 'asset:complete', assetId: msg.assetId }));
      this.sendStates.delete(msg.assetId);
      this.onProgress?.({
        assetId: msg.assetId, state: TransferState.COMPLETE,
        bytesReceived: state.metadata.totalBytes,
        totalBytes: state.metadata.totalBytes,
        percentage: 100, peerId: '',
      });
    } else {
      this.sendChunkBurst(state, 3);
    }
  }

  private onAssetComplete(msg: { assetId: string }): void {
    const state = this.receiveStates.get(msg.assetId);
    if (!state) return;

    const missing = state.chunks.findIndex(c => c === null);
    if (missing !== -1) {
      console.error(`[AssetTransfer] Missing chunk ${missing} for ${msg.assetId}`);
      return;
    }

    const total = state.chunks.reduce((s, c) => s + (c?.byteLength ?? 0), 0);
    const merged = new Uint8Array(total);
    let off = 0;
    for (const c of state.chunks) {
      if (c) { merged.set(new Uint8Array(c), off); off += c.byteLength; }
    }

    const blob = new Blob([merged], { type: state.metadata.mimeType });
    this.receiveStates.delete(msg.assetId);
    this.onAssetReceived?.(msg.assetId, blob, state.metadata);
  }

  // ─── Chunk sending ─────────────────────────────────────

  private sendChunkBurst(state: SendState, count: number): void {
    let sent = 0;
    for (let i = 0; i < state.totalChunks && sent < count; i++) {
      if (!state.ackedChunks.has(i)) {
        this.sendChunk(state, i);
        sent++;
      }
    }
  }

  private sendChunk(state: SendState, idx: number): void {
    const data = state.chunks[idx];
    const packet = new ArrayBuffer(HEADER_SIZE + data.byteLength);
    new DataView(packet).setUint32(0, idx, false);
    new Uint8Array(packet, HEADER_SIZE).set(new Uint8Array(data));
    try { state.channel.send(packet); } catch (e) {
      console.error(`[AssetTransfer] Chunk ${idx}/${state.totalChunks} failed:`, e);
    }
  }
}
