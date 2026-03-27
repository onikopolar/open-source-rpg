require('dotenv').config();

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

const nextApp = next({ dev, turbo: false });
const nextHandler = nextApp.getRequestHandler();

io.on('connection', (socket) => {
  console.log('[Socket] Cliente conectado:', socket.id);

  socket.on('room:join', (roomName) => {
    socket.join(roomName);
    console.log(`[Socket] ${socket.id} entrou na sala: ${roomName}`);
  });

  socket.on('update_hit_points', (data) => {
    console.log('[Socket] Atualizando pontos de vida:', data);
    io.to(`portrait_character_${data.character_id}`).emit('update_hit_points', data);
  });

  socket.on('dice_roll', (data) => {
    console.log('[Socket] Rolagem de dados:', data);
    io.to(`dice_character_${data.character_id}`).emit('dice_roll', data);
  });

  socket.on('characterUpdated', (data) => {
    console.log('[Socket] Personagem atualizado:', data.id);
    io.emit('characterUpdated', data);
  });

  socket.on('tabletop:join', (data) => {
    const roomName = `tabletop_${data.tabletopId}`;
    socket.join(roomName);
    console.log(`[Socket] ${socket.id} entrou no tabletop: ${roomName}`);
  });

  socket.on('tabletop:tokenMoved', (data) => {
    console.log('[Socket] Token movido:', data.id, 'x:', data.x, 'y:', data.y);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenCreated', (data) => {
    console.log('[Socket] Token criado:', data.id, '-', data.nome);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenCreated', data);
  });

  socket.on('tabletop:tokenDeleted', (data) => {
    console.log('[Socket] Token deletado:', data.id);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDeleted', data);
  });

  socket.on('tabletop:tokenInverted', (data) => {
    console.log('[Socket] Token invertido:', data.id);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenVisibilityChanged', (data) => {
    console.log('[Socket] Visibilidade do token', data.id, 'alterada para:', data.oculto);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenLockChanged', (data) => {
    console.log('[Socket] Bloqueio do token', data.id, 'alterado para:', data.bloqueado);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenUpdated', data);
  });

  socket.on('tabletop:tokenSelected', (data) => {
    console.log('[Socket] Token selecionado:', data.tokenId, 'por', data.nome);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenSelected', data);
  });

  socket.on('tabletop:tokenDeselected', (data) => {
    console.log('[Socket] Token deselecionado:', data.tokenId);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDeselected', data);
  });

  socket.on('tabletop:tokenDragStart', (data) => {
    console.log('[Socket] Início de arrasto:', data.tokenId, 'por', data.userId);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDragStart', data);
  });

  socket.on('tabletop:tokenDragEnd', (data) => {
    console.log('[Socket] Fim de arrasto:', data.tokenId, 'por', data.userId);
    io.to(`tabletop_${data.tabletopId}`).emit('tabletop:tokenDragEnd', data);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Cliente desconectado:', socket.id);
  });
});

nextApp.prepare().then(() => {
  app.all('*', (req, res) => {
    return nextHandler(req, res);
  });

  server.listen(port, (err) => {
    if (err) {
      console.error('Erro no servidor:', err);
      throw err;
    }

    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Modo: ${dev ? 'desenvolvimento' : 'producao'}`);
  });
}).catch((err) => {
  console.error('Falha na preparacao do Next.js:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, desligando graciosamente');
  server.close(() => {
    console.log('Processo terminado');
  });
});