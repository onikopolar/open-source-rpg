require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const isProd = !dev;

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  // Força WebSocket em produção (evita polling lento)
  transports: isProd ? ['websocket'] : ['websocket', 'polling'],
  // Timeouts generosos: navegador em background (mobile/desktop)
  // pode ficar minutos sem responder a pings. O cliente tem
  // visibilitychange para forçar reconexão ao voltar.
  pingTimeout: isProd ? 120000 : 60000,   // 2 min em prod, 1 min em dev
  pingInterval: isProd ? 30000 : 25000,   // 30s em prod, 25s em dev
  // Limite de payload (base64 de token deve ir por HTTP, não socket)
  maxHttpBufferSize: 1e6, // 1MB
  // Evita reconexões em cascata
  connectTimeout: isProd ? 10000 : 45000,
  // Compressão per-message (reduz tráfego)
  perMessageDeflate: isProd ? {
    threshold: 1024, // só comprime > 1KB
  } : false,
  // Limita listeners por socket
  maxListeners: 30,
});
const next = require('next');

const port = process.env.PORT || 3000;

const nextApp = next({ dev, turbo: false });
const nextHandler = nextApp.getRequestHandler();

const log = (...args) => { if (dev) console.log(...args); };
const logError = (...args) => { console.error(...args); };

console.log(`[Server] Iniciando na porta ${port} (${dev ? 'dev' : 'prod'})`);

// Configuração de arquivos estáticos
const uploadsPath = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// ─── Filtro anti-scanner ────────────────────────────────────────
// Silencia requisições de bots que escaneiam por arquivos sensíveis
// Retorna 404 sem poluir o log — são inofensivos mas barulhentos
const SCANNER_PATTERNS = [
  /\.env/i,                     // .env, .env.docker, .env.live, etc.
  /\.runtimeconfig\.json/i,     // Firebase/GCP
  /\.git/i,                     // .git, .git/config, .git/HEAD
  /wp-admin/i,                  // WordPress
  /wp-login/i,                  // WordPress
  /\.aws/i,                     // AWS credentials
  /\.dockerenv/i,               // Docker
  /\.htaccess/i,                // Apache
  /\.bash/i,                    // .bash_history, .bashrc
  /phpmyadmin/i,                // phpMyAdmin
  /config\.json/i,              // config.json
  /adminer/i,                   // Adminer
  /actuator/i,                  // Spring Boot Actuator
  /\.DS_Store/i,                // macOS
  /cgi-bin/i,                   // CGI exploits
  /\.vscode/i,                  // VS Code
  /vendor/i,                    // PHP composer
  /node_modules/i,              // Node modules
  /composer\.(json|lock)/i,     // PHP composer
  /package-lock\.json/i,        // npm
  /yarn\.lock/i,                // Yarn
  /Gemfile/i,                   // Ruby
  /\.ssh/i,                     // SSH keys
  /id_rsa/i,                    // SSH keys
  /\.config/i,                  // Config files
  /sendgrid/i,                  // SendGrid
];

function isScannerRequest(url) {
  return SCANNER_PATTERNS.some((p) => p.test(url));
}

app.use((req, res, next) => {
  if (isScannerRequest(req.url)) {
    // Responde silenciosamente — sem log, sem barulho
    return res.status(404).end();
  }
  next();
});

// ─── Deixa o Socket.io processar as próprias requisições ────────
// Sem este middleware, o app.all('*') do Next.js captura as
// requisições HTTP de polling do socket.io e retorna 404.
// No mobile via Funnel, o WebSocket frequentemente falha e o
// cliente depende do polling como fallback.
app.use((req, res, next) => {
  if (req.url.startsWith('/socket.io/')) {
    // NÃO chama next() nem res.end() — deixa o socket.io
    // (que escuta no server HTTP diretamente) processar a requisição
    return;
  }
  next();
});

io.on('connection', (socket) => {
  socket.on('room:join', (roomName) => socket.join(roomName));

  socket.on('update_hit_points', (data) => {
    io.to(`portrait_character_${data.character_id}`).emit('update_hit_points', data);
  });

  socket.on('dice_roll', (data) => {
    io.to(`dice_character_${data.character_id}`).emit('dice_roll', data);
  });

  socket.on('characterUpdated', (data) => {
    io.emit('characterUpdated', data);
  });

  socket.on('tabletop:join', (data) => {
    socket.join(`tabletop_${data.tabletopId}`);
  });

  socket.on('tabletop:tokenMoved', (data) => {
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokensMoved', (data) => {
    // Batch: atualiza vários tokens de uma vez (arrasto em grupo)
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokensMoved', data);
  });

  socket.on('tabletop:tokenUpdated', (data) => {
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenCreated', (data) => {
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenCreated', data);
  });

  socket.on('tabletop:tokenDeleted', (data) => {
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDeleted', data);
  });

  socket.on('tabletop:tokenInverted', (data) => {
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenVisibilityChanged', (data) => {
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenLockChanged', (data) => {
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenSelected', (data) => {
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenSelected', data);
  });

  socket.on('tabletop:tokenDeselected', (data) => {
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDeselected', data);
  });

  socket.on('tabletop:tokenDragStart', (data) => {
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDragStart', data);
  });

  socket.on('tabletop:tokenDragEnd', (data) => {
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDragEnd', data);
  });

    socket.on('tabletop:nevoaCreated', (data) => {
      io.to(`tabletop_${data.tabletopId}`).emit('tabletop:nevoaCreated', data);
    });

    socket.on('tabletop:nevoaUpdated', (data) => {
      io.to(`tabletop_${data.tabletopId}`).emit('tabletop:nevoaUpdated', data);
    });

    socket.on('tabletop:nevoaDeleted', (data) => {
      io.to(`tabletop_${data.tabletopId}`).emit('tabletop:nevoaDeleted', data);
    });

    socket.on('tabletop:nevoaMoved', (data) => {
      io.to(`tabletop_${data.tabletopId}`).emit('tabletop:nevoaMoved', data);
    });

  socket.on('disconnect', () => {});
});

nextApp.prepare().then(() => {
  app.all('*', (req, res) => nextHandler(req, res));

  server.listen(port, (err) => {
    if (err) { console.error('[Server] Erro:', err); throw err; }
    console.log(`[Server] Rodando em http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('[Server] Falha na preparacao do Next.js:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM recebido, desligando graciosamente');
  server.close(() => {
    console.log('[Server] Processo terminado');
  });
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});