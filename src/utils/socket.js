import io from 'socket.io-client';

const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// ⏱️ Habilita debug interno do socket.io-client (mostra timing de cada pacote)
if (!isProd && typeof localStorage !== 'undefined') {
  localStorage.debug = 'socket.io-client:*';
}

const socket = io({
  // WebSocket primeiro, polling como fallback
  // Essencial: mobile/Funnel frequentemente falha WebSocket puro
  transports: ['websocket', 'polling'],
  // Reconexão com backoff — Infinity para nunca desistir
  // (navegador em background perde conexão, precisa reconectar ao voltar)
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 200,
  reconnectionDelayMax: 5000,
  // Timeouts
  timeout: isProd ? 20000 : 30000,
});

// ─── Log de transporte: WebSocket vs Polling ───────────────────
socket.on('connect', () => {
  const transport = socket.io?.engine?.transport?.name || 'desconhecido';
  if (transport !== 'websocket') {
    console.warn('[socket] Usando polling HTTP. Latencia aumentada.');
  }
});

socket.io?.engine?.on?.('upgrade', () => {});

// Log de latencia a cada 30s
if (isProd) {
  setInterval(() => {
    if (socket.connected) {
      const start = Date.now();
      socket.emit('ping', () => { void (Date.now() - start); });
    }
  }, 30000);
}

// ─── Visibility change: reconecta ao voltar para a aba ──────────
// Quando o usuario sai da aba (mobile: troca de app, desktop: alt+tab,
// idle prolongado), o navegador throttla o socket e a conexao pode
// morrer. Ao detectar que a aba voltou a ficar visivel, forçamos
// uma reconexao limpa (disconnect + connect) para garantir que o
// socket entre nas salas novamente.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Pequeno delay para o navegador reativar timers de rede
      setTimeout(() => {
        if (!socket.connected) {
          // Força desconexao limpa e reconecta do zero.
          // O evento 'reconnect' disparado pelos hooks
          // (useSincronizacaoTokens, NuvemFOV) re-entra nas salas.
          socket.disconnect();
          socket.connect();
        }
      }, 300);
    }
  });
}

export default socket;