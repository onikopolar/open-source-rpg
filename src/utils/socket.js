import io from 'socket.io-client';

const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

const socket = io({
  // WebSocket primeiro, polling como fallback
  // Essencial: mobile/Funnel frequentemente falha WebSocket puro
  transports: ['websocket', 'polling'],
  // Reconexão com backoff
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  // Timeouts
  timeout: isProd ? 10000 : 20000,
});

export default socket;