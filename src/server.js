require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

const nextApp = next({ dev, turbo: false });
const nextHandler = nextApp.getRequestHandler();

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
  console.log('[Socket] Cliente conectado:', socket.id);

  socket.on('room:join', (roomName) => {
    socket.join(roomName);
    console.log('[Socket] Cliente', socket.id, 'entrou na sala:', roomName);
  });

  socket.on('update_hit_points', (data) => {
    console.log('[Socket] update_hit_points:', data);
    io.to(`portrait_character_${data.character_id}`).emit('update_hit_points', data);
  });

  socket.on('dice_roll', (data) => {
    console.log('[Socket] dice_roll:', data);
    io.to(`dice_character_${data.character_id}`).emit('dice_roll', data);
  });

  socket.on('characterUpdated', (data) => {
    console.log('[Socket] characterUpdated:', data.id);
    io.emit('characterUpdated', data);
  });

  socket.on('tabletop:join', (data) => {
    const roomName = `tabletop_${data.tabletopId}`;
    socket.join(roomName);
    console.log('[Socket] Cliente', socket.id, 'entrou no tabletop:', roomName);
  });

  socket.on('tabletop:tokenMoved', (data) => {
    console.log('[Socket] tokenMoved:', data.id);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenUpdated', (data) => {
    console.log('[Socket] tokenUpdated:', data.id);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenCreated', (data) => {
    console.log('[Socket] tokenCreated:', data.id, data.nome);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenCreated', data);
  });

  socket.on('tabletop:tokenDeleted', (data) => {
    console.log('[Socket] tokenDeleted:', data.id);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDeleted', data);
  });

  socket.on('tabletop:tokenInverted', (data) => {
    console.log('[Socket] tokenInverted:', data.id);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenVisibilityChanged', (data) => {
    console.log('[Socket] tokenVisibilityChanged:', data.id, 'oculto:', data.oculto);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenLockChanged', (data) => {
    console.log('[Socket] tokenLockChanged:', data.id, 'bloqueado:', data.bloqueado);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenSelected', (data) => {
    console.log('[Socket] tokenSelected:', data.tokenId, 'por', data.nome);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenSelected', data);
  });

  socket.on('tabletop:tokenDeselected', (data) => {
    console.log('[Socket] tokenDeselected:', data.tokenId);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDeselected', data);
  });

  socket.on('tabletop:tokenDragStart', (data) => {
    console.log('[Socket] tokenDragStart:', data.tokenId);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDragStart', data);
  });

  socket.on('tabletop:tokenDragEnd', (data) => {
    console.log('[Socket] tokenDragEnd:', data.tokenId);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDragEnd', data);
  });

    socket.on('tabletop:nevoaCreated', (data) => {
      console.log('[Socket] nevoaCreated:', data.id, data.nome || 'Sem nome', 'tabletopId:', data.tabletopId);
      const room = `tabletop_${data.tabletopId}`;
      console.log('[Socket] Enviando para sala:', room);
      io.to(room).emit('tabletop:nevoaCreated', data);
    });

    socket.on('tabletop:nevoaUpdated', (data) => {
      console.log('[Socket] nevoaUpdated:', data.id, 'tabletopId:', data.tabletopId);
      const room = `tabletop_${data.tabletopId}`;
      io.to(room).emit('tabletop:nevoaUpdated', data);
    });

    socket.on('tabletop:nevoaDeleted', (data) => {
      console.log('[Socket] nevoaDeleted:', data.id, 'tabletopId:', data.tabletopId);
      const room = `tabletop_${data.tabletopId}`;
      io.to(room).emit('tabletop:nevoaDeleted', data);
    });

    socket.on('tabletop:nevoaMoved', (data) => {
      console.log('[Socket] nevoaMoved:', data.id, 'tabletopId:', data.tabletopId);
      const room = `tabletop_${data.tabletopId}`;
      io.to(room).emit('tabletop:nevoaMoved', data);
    });

  socket.on('disconnect', () => {
    console.log('[Socket] Cliente desconectado:', socket.id);
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