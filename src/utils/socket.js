import io from 'socket.io-client';

const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

const socket = io({
  // Força WebSocket em produção (evita fallback para polling lento)
  transports: isProd ? ['websocket'] : ['websocket', 'polling'],
  // Reconexão com backoff
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  // Timeouts
  timeout: isProd ? 10000 : 20000,
});

export default socket;