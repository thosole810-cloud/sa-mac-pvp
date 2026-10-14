const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return rooms[id] ? generateRoomId() : id;
}

io.on('connection', (socket) => {
  console.log('Ket noi moi:', socket.id);

  socket.on('create_room', (data) => {
    const roomId = generateRoomId();
    rooms[roomId] = {
      id: roomId,
      hostId: socket.id,
      players: [{
        id: socket.id,
        name: data.name || 'HOST',
        charIndex: data.charIndex,
        isHost: true
      }],
      state: 'lobby'
    };
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit('room_created', { roomId, players: rooms[roomId].players });
    console.log('Phong ' + roomId + ' tao boi ' + socket.id);
  });

  socket.on('join_room', (data) => {
    const { roomId, name, charIndex } = data;
    const room = rooms[roomId];
    if (!room) { socket.emit('join_error', { message: 'Khong tim thay phong!' }); return; }
    if (room.players.length >= 5) { socket.emit('join_error', { message: 'Phong da day (5/5)!' }); return; }
    if (room.state !== 'lobby') { socket.emit('join_error', { message: 'Tran dau da bat dau!' }); return; }
    room.players.push({
      id: socket.id,
      name: name || 'PLAYER',
      charIndex,
      isHost: false
    });
    socket.join(roomId);
    socket.roomId = roomId;
    io.to(roomId).emit('lobby_update', { players: room.players });
    console.log(socket.id + ' vao phong ' + roomId);
  });

  socket.on('start_match', () => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < 2) { socket.emit('start_error', { message: 'Can it nhat 2 nguoi!' }); return; }
    room.state = 'playing';
    io.to(roomId).emit('match_start', { players: room.players });
    console.log('Phong ' + roomId + ' bat dau!');
  });

  socket.on('state_update', (state) => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room || room.hostId !== socket.id) return;
    socket.to(roomId).emit('state_sync', state);
  });

  socket.on('player_action', (action) => {
    const roomId = socket.roomId;
    const room = rooms[roomId];
    if (!room) return;
    io.to(room.hostId).emit('remote_action', {
      playerId: socket.id,
      action
    });
  });

  socket.on('game_over', (data) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    io.to(roomId).emit('game_over_sync', data);
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(roomId);
    if (room.players.length === 0) {
      delete rooms[roomId];
      console.log('Xoa phong ' + roomId);
    } else {
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
        io.to(roomId).emit('host_changed', { newHostId: room.players[0].id });
      }
      io.to(roomId).emit('lobby_update', { players: room.players });
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log('===========================================');
  console.log('  SA MAC CHIEN KY - SERVER DANG CHAY');
  console.log('===========================================');
  console.log('  Local:   http://localhost:' + PORT);
  console.log('  Network: http://<IP-may-ban>:' + PORT);
  console.log('  Nhan Ctrl+C de tat server');
  console.log('===========================================');
});