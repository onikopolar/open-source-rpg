require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const isProd = !dev;

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  // WebSocket primeiro, polling como fallback seguro.
  // Em producao, Cloudflare Tunnel pode bloquear WebSocket —
  // ter polling evita que o cliente fique reconectando.
  transports: ['websocket', 'polling'],
  // Timeouts bem generosos: navegador em background (mobile/desktop)
  // pode ficar varios minutos sem responder a pings. O cliente tem
  // visibilitychange para forcar reconexao ao voltar.
  pingTimeout: isProd ? 600000 : 120000,   // 10 min em prod, 2 min em dev
  pingInterval: isProd ? 60000 : 30000,    // 60s em prod, 30s em dev
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

// Remove trailing slash de URLs de arquivos estáticos.
// Com trailingSlash: true no Next.js, algumas requisições podem vir com
// barra no final (ex: /uploads/tokens/img.png/), e o express.static
// interpreta como diretório, retornando 404 para o arquivo.
app.use('/uploads', (req, res, next) => {
  if (req.path.endsWith('/') && req.path.length > 1) {
    // Redireciona /uploads/tokens/img.png/ → /uploads/tokens/img.png
    const cleanPath = req.path.replace(/\/+$/, '');
    return res.redirect(301, cleanPath + (req.url.slice(req.path.length) || ''));
  }
  next();
});

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

// ⏱️ DIAGNÓSTICO DE LATÊNCIA: intercepta pacotes ANTES dos handlers
// Mede: (1) latência de rede/fila, (2) tempo de processamento interno
io.use((socket, next) => {
  const originalOnevent = socket.onevent;
  socket.onevent = (packet) => {
    const tArrivalNs = process.hrtime.bigint();
    const eventName = Array.isArray(packet.data) ? packet.data[0] : packet.type;
    const data = Array.isArray(packet.data) ? packet.data[1] : packet.data;

    if (data && typeof data === 'object' && data._traceId) {
      const nowMs = Date.now();
      const clientEmitMs = data._tsEmit || 0;
      const networkDiffMs = clientEmitMs ? nowMs - clientEmitMs : -1;
      console.log(
        `[⏱️ DIAG] traceId=${data._traceId} evento=${eventName} RAW-CHEGOU arrivalNs=${tArrivalNs} ` +
        `serverNow=${nowMs} clientEmit=${clientEmitMs} redeOuFila=${networkDiffMs}ms`
      );
    }

    // Executa o handler original do socket.io
    originalOnevent.call(socket, packet);

    if (data && typeof data === 'object' && data._traceId) {
      const elapsedUs = Number(process.hrtime.bigint() - tArrivalNs) / 1000;
      console.log(
        `[⏱️ DIAG] traceId=${data._traceId} evento=${eventName} HANDLER-FIM elapsedUs=${elapsedUs.toFixed(1)}µs (${(elapsedUs/1000).toFixed(3)}ms)`
      );
    }
  };
  next();
});

io.on('connection', (socket) => {
  // Ping para medicao de latencia (cliente envia, servidor responde)
  socket.on('ping', (cb) => { if (typeof cb === 'function') cb(); });

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
    const room = `tabletop_${data.tabletopId}`;
    socket.join(room);
    console.log(`[server] [P2P] user ${socket.id.slice(0, 8)} joined tabletop_${data.tabletopId}`);

    // Notifica peers na sala sobre novo usuário (para WebRTC)
    socket.to(room).emit('webrtc:user-joined', { userId: socket.id });

    // Responde com lista de usuários na sala (para WebRTC)
    const roomSockets = io.sockets.adapter.rooms.get(room);
    if (roomSockets) {
      const users = Array.from(roomSockets);
      console.log(`[server] [P2P] room tabletop_${data.tabletopId}: ${users.length} users`);
      socket.emit('webrtc:room-users', { userIds: users });
    }
  });

  // WebRTC: solicita lista de usuários na sala
  socket.on('webrtc:get-users', (data) => {
    const room = `tabletop_${data.tabletopId}`;
    const roomSockets = io.sockets.adapter.rooms.get(room);
    if (roomSockets) {
      socket.emit('webrtc:room-users', {
        userIds: Array.from(roomSockets),
      });
    }
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

  socket.on('tabletop:tokenInverted', (data, ack) => {
    // ⏱️ TRACING: nanosegundo no servidor + ack callback
    if (data._traceId) {
      const tServidorNs = process.hrtime.bigint();
      console.log(
        `[⏱️ INVERT] traceId=${data._traceId} etapa=SERVIDOR-RECEBE ns=${tServidorNs} tokenId=${data.id} temAck=${typeof ack === 'function'}`
      );
      // Confirma recebimento para o cliente (ack → mede roundtrip)
      if (typeof ack === 'function') {
        ack();
        console.log(
          `[⏱️ INVERT] traceId=${data._traceId} etapa=SERVIDOR-ACK-ENVIADO`
        );
      } else {
        console.log(
          `[⏱️ INVERT] traceId=${data._traceId} etapa=SERVIDOR-ACK-PULADO motivo=ack-nao-eh-funcao tipo=${typeof ack}`
        );
      }
      // Broadcast com medição precisa
      io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
      const diffUs = Number(process.hrtime.bigint() - tServidorNs) / 1000;
      console.log(
        `[⏱️ INVERT] traceId=${data._traceId} etapa=SERVIDOR-BROADCAST diffUs=${diffUs.toFixed(1)}µs (${(diffUs / 1000).toFixed(3)}ms)`
      );
      return;
    }
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

  // ─── WebRTC Signaling Relay ──────────────────────────────
  // Roteia mensagens de sinalização WebRTC entre peers.
  // O servidor NÃO processa os dados — apenas encaminha
  // para o peer destinatário usando o socket ID.
  // Os assets (imagens) vão direto via P2P depois que
  // a conexão WebRTC é estabelecida.

  socket.on('webrtc:offer', (data) => {
    if (data.targetUserId) {
      console.log(`[server] [P2P:SIG] offer ${socket.id.slice(0, 8)} → ${data.targetUserId.slice(0, 8)}`);
      io.to(data.targetUserId).emit('webrtc:offer', {
        fromUserId: socket.id,
        offer: data.offer,
      });
    }
  });

  socket.on('webrtc:answer', (data) => {
    if (data.targetUserId) {
      console.log(`[server] [P2P:SIG] answer ${socket.id.slice(0, 8)} → ${data.targetUserId.slice(0, 8)}`);
      io.to(data.targetUserId).emit('webrtc:answer', {
        fromUserId: socket.id,
        answer: data.answer,
      });
    }
  });

  socket.on('webrtc:ice-candidate', (data) => {
    if (data.targetUserId) {
      console.log(`[server] [P2P:SIG] ICE ${socket.id.slice(0, 8)} → ${data.targetUserId.slice(0, 8)}`);
      io.to(data.targetUserId).emit('webrtc:ice-candidate', {
        fromUserId: socket.id,
        candidate: data.candidate,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[server] [P2P] user ${socket.id.slice(0, 8)} disconnected`);
  });
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