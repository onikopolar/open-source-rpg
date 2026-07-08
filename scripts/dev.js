/**
 * scripts/dev.js
 * Verifica se o Tailscale Funnel já está ativo antes de iniciar.
 * Se já estiver, só sobe o servidor. Se não, sobe o túnel + servidor.
 * Ctrl+C mata ambos os processos corretamente.
 */
const { execSync, spawn } = require('child_process');
const path = require('path');

const FUNNEL_PORT = 3000;
const SERVER_SCRIPT = path.join(__dirname, '..', 'src', 'server.js');

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

function isFunnelActive() {
  try {
    const output = execSync('tailscale funnel status', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    });
    // Procura por indicação de Funnel ativo
    return output.includes('Funnel on') || output.includes('(Funnel on)');
  } catch {
    return false;
  }
}

function startServer() {
  console.log('[dev] Iniciando servidor...');
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

function startFunnelAndServer() {
  console.log('[dev] Iniciando Tailscale Funnel...');
  const funnel = spawn('tailscale', ['funnel', String(FUNNEL_PORT)], {
    stdio: 'inherit',
    env: { ...process.env },
  });
  children.push(funnel);

  funnel.on('error', (err) => {
    console.error('[dev] Erro ao iniciar Funnel:', err.message);
    cleanup();
  });

  funnel.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[dev] Funnel encerrou com erro (code ${code})`);
      cleanup();
      return;
    }
    console.log('[dev] Funnel encerrado.');
  });

  // Espera o túnel estar pronto antes de subir o servidor
  // O `tailscale funnel` já imprime a URL quando está pronto,
  // então esperamos um pouco pela inicialização
  setTimeout(() => {
    startServer();
  }, 1500);
}

// ─── Main ────────────────────────────────────────────────────────
console.log('[dev] Verificando Tailscale Funnel...');

if (isFunnelActive()) {
  console.log('[dev] ✅ Funnel já está ativo. Pulando inicialização do túnel.');
  startServer();
} else {
  console.log('[dev] 🔄 Funnel não ativo. Iniciando túnel + servidor...');
  startFunnelAndServer();
}
