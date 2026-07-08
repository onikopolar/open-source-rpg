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
  // Timeouts otimizados
  pingTimeout: isProd ? 20000 : 60000,
  pingInterval: isProd ? 10000 : 25000,
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