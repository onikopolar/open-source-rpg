import io from 'socket.io-client';

const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

const socket = io({
  // WebSocket primeiro, polling como fallback
  // Essencial: mobile/Funnel frequentemente falha WebSocket puro
  transports: ['websocket', 'polling'],
  // Reconexão com backoff — Infinity para nunca desistir
  // (navegador em background perde conexão, precisa reconectar ao voltar)
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  // Timeouts
  timeout: isProd ? 10000 : 20000,
});

// ─── Visibility change: reconecta ao voltar para a aba ──────────
// Quando o usuário sai da aba (mobile: troca de app, desktop: alt+tab,
// idle prolongado), o navegador throttla o socket e o servidor
// desconecta por pingTimeout. Ao detectar que a aba voltou a ficar
// visível, forçamos a reconexão se o socket estiver desconectado.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (!socket.connected && !socket.active) {
        // socket.active === false significa que as tentativas de
        // reconexão automática se esgotaram (não acontece mais com
        // Infinity, mas por segurança) ou o socket foi desconectado
        // manualmente. Força uma nova conexão.
        socket.connect();
      } else if (!socket.connected && socket.active) {
        // O socket está tentando reconectar ativamente, mas podemos
        // acelerar forçando uma tentativa imediata.
        socket.connect();
      }
    }
  });
}

export default socket;