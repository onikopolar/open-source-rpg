/**
 * scripts/dev.js
 * Inicia o Cloudflare Tunnel + servidor de desenvolvimento.
 * Domínio: https://open-source-rpg.oniko.org
 *
 * Configuração no .env:
 *   CLOUDFLARE_TUNNEL_NAME=nome-do-tunel   (opcional — auto-detecta)
 *   CLOUDFLARE_TUNNEL_TOKEN=eyJ...          (obrigatório para túnel nomeado)
 *
 * Ctrl+C mata todos os processos corretamente.
 */
require('dotenv').config();
const { execSync, spawn } = require('child_process');
const path = require('path');
const os = require('os');

const TUNNEL_PORT = 3000;
const SERVER_SCRIPT = path.join(__dirname, '..', 'src', 'server.js');
const DOMAIN = 'open-source-rpg.oniko.org';
const DEFAULT_TUNNEL_NAME = 'Brasil RD Oficial';

// Processos filhos que precisam ser mortos no cleanup
const children = [];

function cleanup() {
  console.log('\n[dev] Encerrando processos...');
  for (const child of children) {
    try { child.kill('SIGTERM'); } catch (_) { /* já morreu */ }
  }
  // Dá um tempo e força SIGKILL se ainda estiver vivo
  setTimeout(() => {
    for (const child of children) {
      try { child.kill('SIGKILL'); } catch (_) { /* já morreu */ }
    }
    process.exit(0);
  }, 2000);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  for (const child of children) {
    try { child.kill('SIGKILL'); } catch (_) {}
  }
});

// ─── Helpers ─────────────────────────────────────────────────────

function isWindows() {
  return os.platform() === 'win32';
}

function isCloudflaredInstalled() {
  try {
    execSync('cloudflared --version', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Tenta detectar automaticamente o nome do túnel Cloudflare.
 * 1. Verifica CLOUDFLARE_TUNNEL_NAME no ambiente
 * 2. Tenta `cloudflared tunnel list` e pega o primeiro túnel ativo
 * 3. Fallback: usa quick tunnel (--url)
 */
function detectTunnelName() {
  // Prioridade: variável de ambiente
  if (process.env.CLOUDFLARE_TUNNEL_NAME) {
    return process.env.CLOUDFLARE_TUNNEL_NAME;
  }

  // Tenta detectar via `cloudflared tunnel list`
  try {
    const output = execSync('cloudflared tunnel list', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    });

    // Saída típica (colunas fixas):
    // ID                                    NAME              CREATED              CONNECTIONS
    // f3e07e51-...-f8fd4536d26f           Brasil RD Oficial 2024-01-01T00:00:00Z 1xAMS
    const lines = output.trim().split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Procura: UUID (36 chars) + espaços + nome + espaços + data ISO
      const match = line.match(/^([a-f0-9-]{36})\s+(.+?)\s+(\d{4}-\d{2}-\d{2}T)/);
      if (match) {
        return match[2].trim();
      }
    }
  } catch {
    // `cloudflared tunnel list` falhou — provavelmente sem cert
  }

  // Fallback: usa o túnel padrão do projeto
  return DEFAULT_TUNNEL_NAME;
}

function isTunnelRunning() {
  try {
    // Verifica se há processo cloudflared rodando
    const cmd = isWindows()
      ? 'tasklist /FI "IMAGENAME eq cloudflared.exe" 2>NUL'
      : 'pgrep -f cloudflared';
    const output = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 3000,
    });
    return isWindows()
      ? output.includes('cloudflared.exe')
      : output.trim().length > 0;
  } catch {
    return false;
  }
}

// ─── Processos ───────────────────────────────────────────────────

function startServer() {
  console.log('[dev]  Iniciando servidor na porta', TUNNEL_PORT, '...');
  const server = spawn('node', [SERVER_SCRIPT], {
    stdio: 'inherit',
    env: { ...process.env },
  });
  children.push(server);

  server.on('error', (err) => {
    console.error('[dev] Erro ao iniciar servidor:', err.message);
    cleanup();
  });

  server.on('exit', (code) => {
    console.log(`[dev] Servidor encerrado (code ${code})`);
    cleanup();
  });
}

function startTunnel(tunnelName, token) {
  let args;
  if (token) {
    // Túnel nomeado com token
    args = ['tunnel', 'run', '--token', token];
  } else if (tunnelName) {
    // Túnel nomeado (precisa de credentials file em ~/.cloudflared/)
    args = ['tunnel', 'run', tunnelName];
  } else {
    // Quick tunnel (temporário, URL trycloudflare.com)
    args = ['tunnel', '--url', `http://localhost:${TUNNEL_PORT}`];
  }

  console.log('[dev]   Iniciando Cloudflare Tunnel...');
  console.log(`[dev]  Acesse: https://${DOMAIN}`);

  const tunnel = spawn('cloudflared', args, {
    stdio: 'inherit',
    env: { ...process.env },
  });
  children.push(tunnel);

  tunnel.on('error', (err) => {
    console.error('[dev]  Erro ao iniciar Cloudflare Tunnel:', err.message);
    if (err.message && err.message.includes('cert')) {
      console.error('[dev]  Você precisa fazer login no cloudflared primeiro:');
      console.error('[dev]    cloudflared login');
    }
    cleanup();
  });

  tunnel.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[dev] Tunnel encerrado com erro (code ${code})`);
      cleanup();
      return;
    }
    console.log('[dev] Tunnel encerrado.');
  });
}

// ─── Main ────────────────────────────────────────────────────────

if (!isCloudflaredInstalled()) {
  console.error('[dev]  cloudflared não encontrado!');
  console.error('[dev] Instale rapidamente com:');
  if (isWindows()) {
    console.error('[dev]   winget install Cloudflare.cloudflared');
  } else {
    console.error('[dev]   brew install cloudflared   (macOS)');
    console.error('[dev]   ou baixe de: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/');
  }
  process.exit(1);
}

console.log('[dev]  cloudflared detectado.');

const tunnelToken = process.env.CLOUDFLARE_TUNNEL_TOKEN || null;
const tunnelName = detectTunnelName();

if (tunnelToken) {
  console.log('[dev]  Túnel com token detectado (via CLOUDFLARE_TUNNEL_TOKEN).');
} else if (tunnelName) {
  console.log(`[dev]  Túnel detectado: "${tunnelName}"`);
} else {
  console.log('[dev]   Nenhum túnel nomeado encontrado. Usando quick tunnel (URL temporária).');
  console.log('[dev]    Para usar um túnel permanente, configure CLOUDFLARE_TUNNEL_TOKEN no .env');
}

console.log('[dev] Verificando Cloudflare Tunnel...');

if (isTunnelRunning()) {
  console.log('[dev]  Tunnel já está ativo. Pulando inicialização.');
  startServer();
} else {
  console.log('[dev]  Tunnel não ativo. Iniciando túnel + servidor...');
  startTunnel(tunnelName, tunnelToken);
  // Espera o túnel estabelecer conexão antes de subir o servidor
  setTimeout(() => {
    startServer();
  }, 2000);
}
