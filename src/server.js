require('dotenv').config();

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

const nextApp = next({ 
  dev,
  turbo: false
});

const nextHandler = nextApp.getRequestHandler();

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('room:join', (roomName) => {
    socket.join(roomName);
    console.log(`Socket ${socket.id} entrou na sala: ${roomName}`);
  });

  socket.on('update_hit_points', (data) => {
    console.log('Atualizando pontos de vida:', data);
    io.to(`portrait_character_${data.character_id}`).emit('update_hit_points', data);
  });

  socket.on('dice_roll', (data) => {
    console.log('Rolagem de dados:', data);
    io.to(`dice_character_${data.character_id}`).emit('dice_roll', data);
  });

  socket.on('characterUpdated', (data) => {
    console.log('Personagem atualizado:', data);
    io.emit('characterUpdated', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
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
