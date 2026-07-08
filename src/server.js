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

console.log('[Server] ========== INICIANDO SERVIDOR ==========');
console.log('[Server] NODE_ENV:', process.env.NODE_ENV);
console.log('[Server] PORT:', port);
console.log('[Server] dev mode:', dev);
console.log('[Server] __dirname:', __dirname);
console.log('[Server] process.cwd():', process.cwd());

// Configuração de arquivos estáticos
const uploadsPathDev = path.join(__dirname, 'public/uploads');
const uploadsPathProd = path.join(process.cwd(), 'public/uploads');
console.log('[Server] Caminho uploads (__dirname):', uploadsPathDev);
console.log('[Server] Caminho uploads (process.cwd()):', uploadsPathProd);
console.log('[Server] uploads existe (__dirname)?', fs.existsSync(uploadsPathDev));
console.log('[Server] uploads existe (process.cwd())?', fs.existsSync(uploadsPathProd));

// Usar process.cwd() para garantir caminho correto em produção
const uploadsPath = uploadsPathProd;
console.log('[Server] Usando caminho uploads:', uploadsPath);

if (fs.existsSync(uploadsPath)) {
  try {
    const files = fs.readdirSync(uploadsPath);
    console.log('[Server] Arquivos encontrados em uploads:', files.length, files.slice(0, 10));
  } catch (err) {
    console.error('[Server] Erro ao listar arquivos:', err.message);
  }
} else {
  console.log('[Server] Pasta uploads NÃO existe. Criando...');
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('[Server] Pasta uploads criada:', uploadsPath);
  } catch (err) {
    console.error('[Server] Erro ao criar pasta uploads:', err.message);
  }
}

app.use('/uploads', express.static(uploadsPath));
console.log('[Server] Middleware estático configurado para /uploads ->', uploadsPath);

io.on('connection', (socket) => {
  log('[Socket] Cliente conectado:', socket.id);

  socket.on('room:join', (roomName) => {
    socket.join(roomName);
    log('[Socket] Cliente', socket.id, 'entrou na sala:', roomName);
  });

  socket.on('update_hit_points', (data) => {
    log('[Socket] update_hit_points:', data);
    io.to(`portrait_character_${data.character_id}`).emit('update_hit_points', data);
  });

  socket.on('dice_roll', (data) => {
    log('[Socket] dice_roll:', data);
    io.to(`dice_character_${data.character_id}`).emit('dice_roll', data);
  });

  socket.on('characterUpdated', (data) => {
    log('[Socket] characterUpdated:', data.id);
    io.emit('characterUpdated', data);
  });

  socket.on('tabletop:join', (data) => {
    const roomName = `tabletop_${data.tabletopId}`;
    socket.join(roomName);
    log('[Socket] Cliente', socket.id, 'entrou no tabletop:', roomName);
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
    log('[Socket] tokenCreated:', data.id, data.nome);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenCreated', data);
  });

  socket.on('tabletop:tokenDeleted', (data) => {
    log('[Socket] tokenDeleted:', data.id);
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
      log('[Socket] nevoaCreated:', data.id, data.nome || 'Sem nome');
      const room = `tabletop_${data.tabletopId}`;
      io.to(room).emit('tabletop:nevoaCreated', data);
    });

    socket.on('tabletop:nevoaUpdated', (data) => {
      const room = `tabletop_${data.tabletopId}`;
      io.to(room).emit('tabletop:nevoaUpdated', data);
    });

    socket.on('tabletop:nevoaDeleted', (data) => {
      const room = `tabletop_${data.tabletopId}`;
      io.to(room).emit('tabletop:nevoaDeleted', data);
    });

    socket.on('tabletop:nevoaMoved', (data) => {
      const room = `tabletop_${data.tabletopId}`;
      io.to(room).emit('tabletop:nevoaMoved', data);
    });

  socket.on('disconnect', () => {
    log('[Socket] Cliente desconectado:', socket.id);
  });
});

nextApp.prepare().then(() => {
  console.log('[Server] Next.js preparado, registrando rota catch-all');
  
  app.all('*', (req, res) => {
    console.log('[Server] Request:', req.method, req.url);
    return nextHandler(req, res);
  });

  server.listen(port, (err) => {
    if (err) {
      console.error('[Server] Erro ao iniciar servidor:', err);
      throw err;
    }

    console.log(`[Server] Servidor rodando em http://localhost:${port}`);
    console.log(`[Server] Modo: ${dev ? 'desenvolvimento' : 'producao'}`);
    console.log('[Server] ========== SERVIDOR INICIADO ==========');
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