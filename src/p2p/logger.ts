// src/p2p/logger.ts
// Logger unificado para o sistema P2P.
// Todos os logs vão para o terminal (stdout/stderr), não para o console do browser.
//
// Controlado por variável de ambiente:
//   P2P_LOG_LEVEL=debug|info|warn|error|silent  (default: info)

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 99 } as const;
type Level = keyof typeof LEVELS;

function getLevel(): Level {
  const env = (typeof process !== 'undefined' && process.env?.P2P_LOG_LEVEL) || 'info';
  return LEVELS.hasOwnProperty(env) ? (env as Level) : 'info';
}

function timestamp(): string {
  return new Date().toISOString().split('T')[1].slice(0, 12);
}

function shouldLog(level: Level): boolean {
  return LEVELS[level] >= LEVELS[getLevel()];
}

export const p2pLog = {
  debug(prefix: string, msg: string, data?: unknown) {
    if (!shouldLog('debug')) return;
    const d = data !== undefined ? ` ${JSON.stringify(data)}` : '';
    console.log(`[${timestamp()}] [P2P:${prefix}] ${msg}${d}`);
  },

  info(prefix: string, msg: string, data?: unknown) {
    if (!shouldLog('info')) return;
    const d = data !== undefined ? ` ${JSON.stringify(data)}` : '';
    console.log(`[${timestamp()}] [P2P:${prefix}] ${msg}${d}`);
  },

  warn(prefix: string, msg: string, data?: unknown) {
    if (!shouldLog('warn')) return;
    const d = data !== undefined ? ` ${JSON.stringify(data)}` : '';
    console.warn(`[${timestamp()}] [P2P:${prefix}] ⚠ ${msg}${d}`);
  },

  error(prefix: string, msg: string, data?: unknown) {
    if (!shouldLog('error')) return;
    const d = data !== undefined ? ` ${JSON.stringify(data)}` : '';
    console.error(`[${timestamp()}] [P2P:${prefix}] ❌ ${msg}${d}`);
  },
};
