const crypto = require('crypto');
const RoomModel = require('../models/RoomModel');
const {
  GAME_WIDTH,
  TICK_RATE,
  ATTACK_COOLDOWN,
  BLOCK_COOLDOWN,
  MOVE_SPEED,
  PLAYER_RADIUS,
  ATTACK_RANGE,
  ATTACK_DAMAGE_BASE,
  COMBO_MULTIPLIER,
  ROUND_WIN,
  ROUND_RESET_DELAY,
} = require('../utils/constants');
const { sanitizeName, clamp, getOpponent } = require('../utils/helpers');

let waitingPlayer = null;
const rooms = new Map();
let ioServer = null;

function initSocket(io) {
  ioServer = io;

  io.on('connection', (socket) => {
    console.log(`[+] Connected: ${socket.id}`);

    socket.on('join_game', ({ username } = {}) => {
      socket.username = sanitizeName(username) || `Samurai_${socket.id.slice(0, 4)}`;

      const currentRoom = findRoom(socket.id);
      if (currentRoom) return;

      if (waitingPlayer && waitingPlayer.connected && waitingPlayer.id !== socket.id) {
        createMatch(waitingPlayer, socket);
        return;
      }

      waitingPlayer = socket;
      socket.emit('waiting', { message: 'Đang tìm đối thủ xứng tầm...' });
    });

    socket.on('leave_queue', () => {
      if (waitingPlayer?.id === socket.id) waitingPlayer = null;
      socket.emit('left_queue');
    });

    socket.on('player_input', ({ type, value } = {}) => {
      const room = findRoom(socket.id);
      if (!room || room.state !== 'playing') return;

      const player = room.players[socket.id];
      if (!player || player.hp <= 0) return;

      handleInput(room, player, type, value);
    });

    socket.on('disconnect', () => {
      console.log(`[-] Disconnected: ${socket.id}`);
      if (waitingPlayer?.id === socket.id) waitingPlayer = null;

      const room = findRoom(socket.id);
      if (room) {
        ioServer.to(room.id).emit('player_disconnected', { username: socket.username || 'Đối thủ' });
        cleanupRoom(room.id);
      }
    });
  });
}

function createMatch(playerOneSocket, playerTwoSocket) {
  const roomId = `room_${crypto.randomUUID()}`;
  waitingPlayer = null;

  playerOneSocket.join(roomId);
  playerTwoSocket.join(roomId);

  const room = new RoomModel(roomId, playerOneSocket, playerTwoSocket);
  rooms.set(roomId, room);

  ioServer.to(roomId).emit('match_found', {
    roomId,
    players: {
      [playerOneSocket.id]: { username: playerOneSocket.username, side: 'left' },
      [playerTwoSocket.id]: { username: playerTwoSocket.username, side: 'right' },
    },
  });

  startCountdown(roomId);
}

function handleInput(room, player, type, value) {
  const now = Date.now();
  if (player.stunned && now < player.stunEnd) return;
  player.stunned = false;

  if (type === 'move' && value && ['left', 'right'].includes(value.dir)) {
    player.moving[value.dir] = Boolean(value.pressed);
    return;
  }

  if (type === 'attack' && value) {
    attack(room, player, now);
    return;
  }

  if (type === 'block') {
    block(player, Boolean(value), now);
  }
}

function attack(room, player, now) {
  if (player.attacking || player.blocking) return;
  if (now - player.lastAttack < ATTACK_COOLDOWN) return;

  player.attacking = true;
  player.lastAttack = now;

  const opponent = getOpponent(room, player.id);
  if (opponent?.hp > 0) {
    const distance = Math.abs(player.x - opponent.x);
    const correctDirection = player.facing === 1 ? opponent.x >= player.x : opponent.x <= player.x;

    if (distance <= ATTACK_RANGE && correctDirection) {
      if (opponent.blocking) {
        player.stunned = true;
        player.stunEnd = now + 260;
        player.combo = 0;
        room.hits.push({ type: 'block', x: opponent.x, y: 228 });
      } else {
        if (now > player.comboExpireAt) player.combo = 0;
        player.combo = Math.min(player.combo + 1, 3);
        player.comboExpireAt = now + 1700;

        const damage = Math.round(ATTACK_DAMAGE_BASE * COMBO_MULTIPLIER[player.combo]);
        opponent.hp = Math.max(0, opponent.hp - damage);
        opponent.stunned = true;
        opponent.stunEnd = now + 120;

        const knockback = player.facing * (10 + player.combo * 3);
        opponent.x = clamp(opponent.x + knockback, 48, GAME_WIDTH - 48);

        room.hits.push({ type: 'hit', x: opponent.x, y: 222, dmg: damage, combo: player.combo });
        if (opponent.hp <= 0) endRound(room, player);
      }
    }
  }

  setTimeout(() => {
    const latestRoom = findRoom(player.id);
    const latestPlayer = latestRoom?.players[player.id];
    if (latestPlayer) latestPlayer.attacking = false;
  }, 250);
}

function block(player, pressed, now) {
  if (pressed) {
    if (player.attacking || now - player.lastBlock < BLOCK_COOLDOWN) return;
    player.blocking = true;
    player.lastBlock = now;
    setTimeout(() => {
      player.blocking = false;
    }, 520);
  } else {
    player.blocking = false;
  }
}

function gameTick(room) {
  if (room.state !== 'playing') return;

  const now = Date.now();
  const playerList = room.getPlayerList();

  for (const player of playerList) {
    if (player.stunned && now >= player.stunEnd) player.stunned = false;
    if (now > player.comboExpireAt) player.combo = 0;

    if (!player.stunned && !player.blocking) {
      if (player.moving.left) player.x -= MOVE_SPEED;
      if (player.moving.right) player.x += MOVE_SPEED;
    }

    player.x = clamp(player.x, 44, GAME_WIDTH - 44);
    const opponent = getOpponent(room, player.id);
    if (opponent) player.facing = opponent.x > player.x ? 1 : -1;
  }

  preventOverlap(playerList[0], playerList[1]);

  ioServer.to(room.id).emit('game_state', room.serializeState());
  room.hits = [];
}

function startCountdown(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  clearInterval(room.loop);
  clearInterval(room.countdownTimer);
  room.loop = null;
  room.state = 'countdown';

  let count = 3;
  ioServer.to(roomId).emit('countdown', { count });

  room.countdownTimer = setInterval(() => {
    count -= 1;
    ioServer.to(roomId).emit('countdown', { count });

    if (count <= 0) {
      clearInterval(room.countdownTimer);
      room.countdownTimer = null;
      room.state = 'playing';
      ioServer.to(roomId).emit('round_start', { round: room.round });
      room.loop = setInterval(() => gameTick(room), TICK_RATE);
    }
  }, 1000);
}

function endRound(room, winner) {
  if (room.state !== 'playing') return;
  clearInterval(room.loop);
  room.loop = null;
  room.state = 'round_end';
  winner.wins += 1;

  ioServer.to(room.id).emit('round_end', {
    winnerId: winner.id,
    winnerName: winner.username,
    wins: room.getWinsMap(),
  });

  if (winner.wins >= ROUND_WIN) {
    ioServer.to(room.id).emit('game_over', {
      winnerId: winner.id,
      winnerName: winner.username,
    });
    cleanupRoom(room.id);
    return;
  }

  setTimeout(() => {
    if (!rooms.has(room.id)) return;
    room.round += 1;
    room.resetPlayers();
    startCountdown(room.id);
  }, ROUND_RESET_DELAY);
}

function cleanupRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  clearInterval(room.loop);
  clearInterval(room.countdownTimer);
  rooms.delete(roomId);
}

function preventOverlap(playerA, playerB) {
  if (!playerA || !playerB) return;
  const gap = Math.abs(playerA.x - playerB.x);
  const minGap = PLAYER_RADIUS * 2;
  if (gap >= minGap) return;

  const mid = (playerA.x + playerB.x) / 2;
  playerA.x = clamp(mid - minGap / 2, 44, GAME_WIDTH - 44);
  playerB.x = clamp(mid + minGap / 2, 44, GAME_WIDTH - 44);
}

function findRoom(socketId) {
  for (const room of rooms.values()) {
    if (room.players[socketId]) return room;
  }
  return null;
}

module.exports = {
  initSocket,
};
