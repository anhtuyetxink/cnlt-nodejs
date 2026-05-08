const socket = io({ reconnection: true, reconnectionAttempts: 5 });
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const screens = {
  waiting: document.getElementById('screen-waiting'),
  game: document.getElementById('screen-game'),
  result: document.getElementById('screen-result'),
};

const ui = {
  waitingMsg: document.getElementById('waiting-msg'),
  roundLabel: document.getElementById('round-label'),
  countdown: document.getElementById('countdown-display'),
  combo: document.getElementById('my-combo'),
  toast: document.getElementById('toast'),
};

let myId = null;
let gameState = null;
let hitEffects = [];
let roundActive = false;
let cameraShake = 0;
let lastFrame = performance.now();
let hasJoinedQueue = false;

const keys = new Set();
const pressedActions = new Set();

function getUsername() {
  return window.DuelLobby?.getUsername?.() || 'Samurai';
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove('active'));
  screens[name].classList.add('active');
}

function joinQueue() {
  hasJoinedQueue = true;
  socket.emit('join_game', { username: getUsername() });
  showScreen('waiting');
}

function resetLocalGame() {
  gameState = null;
  hitEffects = [];
  roundActive = false;
  cameraShake = 0;
  ui.countdown.textContent = '';
  ui.roundLabel.textContent = 'Round 1';
}


window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', ' ', 'j', 'k', 'z', 'x', 'a', 'd'].includes(key)) event.preventDefault();
  if (keys.has(key)) return;
  keys.add(key);
  handleKey(key, true);
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  keys.delete(key);
  handleKey(key, false);
});

function handleKey(key, pressed) {
  if (!roundActive && pressed) return;
  if (key === 'arrowleft' || key === 'a') sendMove('left', pressed);
  if (key === 'arrowright' || key === 'd') sendMove('right', pressed);
  if ((key === 'j' || key === 'z') && pressed) sendAttack();
  if (key === 'k' || key === 'x') sendBlock(pressed);
}

function sendMove(dir, pressed) {
  socket.emit('player_input', { type: 'move', value: { dir, pressed } });
}
function sendAttack() {
  socket.emit('player_input', { type: 'attack', value: true });
}
function sendBlock(pressed) {
  socket.emit('player_input', { type: 'block', value: pressed });
}

for (const button of document.querySelectorAll('.touch-controls button')) {
  const action = button.dataset.action;
  const start = (event) => {
    event.preventDefault();
    if (!roundActive) return;
    button.classList.add('pressed');
    pressedActions.add(action);
    if (action === 'left' || action === 'right') sendMove(action, true);
    if (action === 'attack') sendAttack();
    if (action === 'block') sendBlock(true);
  };
  const end = (event) => {
    event.preventDefault();
    button.classList.remove('pressed');
    if (!pressedActions.has(action)) return;
    pressedActions.delete(action);
    if (action === 'left' || action === 'right') sendMove(action, false);
    if (action === 'block') sendBlock(false);
  };
  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', end);
  button.addEventListener('pointercancel', end);
  button.addEventListener('pointerleave', end);
}


function updateHUD(players) {
  players.forEach((player) => {
    const prefix = player.side === 'left' ? 'p1' : 'p2';
    const hp = Math.max(0, Math.round(player.hp));

    document.getElementById(`${prefix}-name`).textContent = player.username;
    document.getElementById(`${prefix}-hp`).textContent = hp;

    const bar = document.getElementById(`${prefix}-hp-bar`);
    bar.style.width = `${hp}%`;
    bar.dataset.low = hp <= 25 ? 'true' : 'false';
    bar.dataset.mid = hp > 25 && hp <= 55 ? 'true' : 'false';

    const dotsEl = document.getElementById(`${prefix}-wins`);
    dotsEl.innerHTML = '';
    for (let i = 0; i < 2; i += 1) {
      const dot = document.createElement('div');
      dot.className = `win-dot${i < player.wins ? '' : ' empty'}`;
      dotsEl.appendChild(dot);
    }

    if (player.id === myId && player.combo >= 2) showCombo(player.combo);
  });
}

function showCombo(combo) {
  ui.combo.textContent = combo >= 3 ? '💥 MAX COMBO!' : `${combo}x COMBO!`;
  ui.combo.classList.remove('hidden');
  ui.combo.style.animation = 'none';
  requestAnimationFrame(() => { ui.combo.style.animation = ''; });
  clearTimeout(ui.combo._timer);
  ui.combo._timer = setTimeout(() => ui.combo.classList.add('hidden'), 1200);
}

function showToast(text, ms = 1800) {
  ui.toast.textContent = text;
  ui.toast.classList.add('show');
  clearTimeout(ui.toast._timer);
  ui.toast._timer = setTimeout(() => ui.toast.classList.remove('show'), ms);
}


const COLORS = {
  p1: '#ff4b4b',
  p2: '#47a3ff',
  gold: '#ffd166',
  ground: '#16162d',
  sword: '#f3f6ff',
  shield: '#89f7fe',
};

function drawBackground(time) {
  const grd = ctx.createLinearGradient(0, 0, 0, 400);
  grd.addColorStop(0, '#080817');
  grd.addColorStop(0.55, '#11132b');
  grd.addColorStop(1, '#090914');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 800, 400);

  ctx.save();
  ctx.shadowBlur = 28;
  ctx.shadowColor = '#ffe6a7';
  ctx.fillStyle = '#ffe6a7';
  ctx.beginPath();
  ctx.arc(650, 72, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ffffff20';
  for (let i = 0; i < 28; i += 1) {
    const x = (i * 89 + time * 0.015) % 840 - 20;
    const y = 28 + ((i * 53) % 190);
    ctx.beginPath();
    ctx.arc(x, y, i % 3 === 0 ? 1.6 : 1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#151936';
  ctx.beginPath();
  ctx.moveTo(0, 260);
  ctx.lineTo(110, 168);
  ctx.lineTo(230, 260);
  ctx.lineTo(370, 155);
  ctx.lineTo(540, 260);
  ctx.lineTo(690, 175);
  ctx.lineTo(800, 252);
  ctx.lineTo(800, 400);
  ctx.lineTo(0, 400);
  ctx.closePath();
  ctx.fill();

  const floor = ctx.createLinearGradient(0, 285, 0, 400);
  floor.addColorStop(0, '#222447');
  floor.addColorStop(1, '#10101f');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 286, 800, 114);

  ctx.strokeStyle = '#ffffff14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 286);
  ctx.lineTo(800, 286);
  ctx.stroke();

  ctx.strokeStyle = '#ffd16622';
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(400, 252);
  ctx.lineTo(400, 330);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPlayer(player, time) {
  const color = player.side === 'left' ? COLORS.p1 : COLORS.p2;
  const facing = player.facing || 1;
  const moving = player.moving?.left || player.moving?.right;
  const walk = moving ? Math.sin(time / 80) : 0;
  const groundY = 292;

  ctx.save();
  ctx.translate(player.x, groundY);

  if (player.stunned) ctx.globalAlpha = 0.58 + 0.42 * Math.sin(time / 45);

  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(0, 7, 28, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `${color}44`;
  ctx.beginPath();
  ctx.moveTo(-facing * 10, -66);
  ctx.lineTo(-facing * 42, -22 + walk * 3);
  ctx.lineTo(-facing * 8, -20);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#2b2030';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -26);
  ctx.lineTo(-13 - walk * 4, 0);
  ctx.moveTo(8, -26);
  ctx.lineTo(13 + walk * 4, 0);
  ctx.stroke();

  const armor = ctx.createLinearGradient(-18, -72, 18, -18);
  armor.addColorStop(0, color);
  armor.addColorStop(1, '#141421');
  ctx.fillStyle = player.blocking ? '#7f8cff' : armor;
  roundedRect(-18, -74, 36, 52, 9);
  ctx.fill();

  ctx.fillStyle = '#ffffff20';
  roundedRect(-10, -68, 10, 38, 5);
  ctx.fill();

  ctx.fillStyle = '#f2c9a5';
  ctx.beginPath();
  ctx.arc(0, -88, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  roundedRect(-15, -94, 30, 8, 4);
  ctx.fill();

  ctx.fillStyle = '#151515';
  ctx.beginPath();
  ctx.arc(facing * 5, -88, 2.4, 0, Math.PI * 2);
  ctx.fill();

  drawWeapon(player, facing, time);
  if (player.blocking) drawShield(facing);

  if (player.id !== myId) {
    ctx.font = '600 11px Inter, Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffffaa';
    ctx.fillText(player.username, 0, -115);
  }

  ctx.restore();
}

function drawWeapon(player, facing, time) {
  ctx.lineCap = 'round';
  if (player.attacking) {
    const pulse = Math.sin(time / 30) * 4;
    const endX = facing * (70 + pulse);
    const endY = -48 + pulse * 0.35;

    ctx.strokeStyle = '#ffe06644';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(facing * 14, -52);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.strokeStyle = COLORS.sword;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(facing * 14, -52);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(endX, endY, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = COLORS.sword;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(facing * 15, -58);
    ctx.lineTo(facing * 26, -18);
    ctx.stroke();

    ctx.strokeStyle = '#a0a0ad';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(facing * 9, -39);
    ctx.lineTo(facing * 26, -43);
    ctx.stroke();
  }
}

function drawShield(facing) {
  ctx.save();
  ctx.translate(facing * 27, -54);
  ctx.shadowBlur = 18;
  ctx.shadowColor = COLORS.shield;
  ctx.fillStyle = '#89f7fe55';
  ctx.strokeStyle = '#b8ffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawHitEffects() {
  const now = Date.now();
  hitEffects = hitEffects.filter((effect) => {
    const age = now - effect.born;
    const life = effect.life || 620;
    if (age >= life) return false;

    const t = age / life;
    ctx.save();
    ctx.globalAlpha = 1 - t;

    if (effect.type === 'hit') {
      for (let i = 0; i < 12; i += 1) {
        const angle = (Math.PI * 2 * i) / 12 + t * 1.8;
        const dist = t * 44;
        ctx.fillStyle = i % 2 ? '#ff4b4b' : '#ffd166';
        ctx.beginPath();
        ctx.arc(effect.x + Math.cos(angle) * dist, effect.y + Math.sin(angle) * dist * 0.6, 4 * (1 - t), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = `900 ${20 + (effect.combo || 1) * 4}px Inter, Segoe UI, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 4;
      ctx.strokeText(`-${effect.dmg}`, effect.x, effect.y - t * 40);
      ctx.fillText(`-${effect.dmg}`, effect.x, effect.y - t * 40);
    }

    if (effect.type === 'block') {
      ctx.strokeStyle = COLORS.shield;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 10 + t * 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '900 16px Inter, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.shield;
      ctx.fillText('BLOCK!', effect.x, effect.y - t * 28);
    }

    ctx.restore();
    return true;
  });
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function render(now = performance.now()) {
  const dt = now - lastFrame;
  lastFrame = now;

  ctx.save();
  ctx.clearRect(0, 0, 800, 400);
  if (cameraShake > 0) {
    cameraShake = Math.max(0, cameraShake - dt * 0.045);
    ctx.translate((Math.random() - 0.5) * cameraShake, (Math.random() - 0.5) * cameraShake);
  }

  drawBackground(now);
  if (gameState?.players) {
    gameState.players.forEach((player) => drawPlayer(player, now));
    drawHitEffects();
  }
  ctx.restore();
  requestAnimationFrame(render);
}


socket.on('connect', () => {
  myId = socket.id;
  if (!hasJoinedQueue) joinQueue();
});

socket.on('waiting', ({ message } = {}) => {
  ui.waitingMsg.textContent = message || 'Vui lòng chờ';
  showScreen('waiting');
});

socket.on('left_queue', () => {
  window.DuelLobby?.backToLobby?.();
});

socket.on('match_found', ({ players }) => {
  Object.entries(players).forEach(([, player]) => {
    const prefix = player.side === 'left' ? 'p1' : 'p2';
    document.getElementById(`${prefix}-name`).textContent = player.username;
  });
  ui.roundLabel.textContent = 'Round 1';
  ui.countdown.textContent = '';
  showScreen('game');
  showToast('Đã tìm thấy đối thủ!', 1400);
});

socket.on('countdown', ({ count }) => {
  roundActive = false;
  ui.countdown.textContent = count > 0 ? count : 'FIGHT!';
  ui.countdown.classList.remove('pop');
  void ui.countdown.offsetWidth;
  ui.countdown.classList.add('pop');
  if (count <= 0) setTimeout(() => { ui.countdown.textContent = ''; }, 650);
});

socket.on('round_start', ({ round }) => {
  roundActive = true;
  ui.roundLabel.textContent = `Round ${round}`;
  showToast('Tấn công: J/Z · Đỡ: K/X', 1200);
});

socket.on('game_state', ({ players, hits, round }) => {
  gameState = { players };
  ui.roundLabel.textContent = `Round ${round}`;
  updateHUD(players);

  if (hits?.length) {
    hits.forEach((hit) => {
      hitEffects.push({ ...hit, born: Date.now(), life: hit.type === 'block' ? 520 : 680 });
      if (hit.type === 'hit') cameraShake = Math.max(cameraShake, 7 + (hit.combo || 1) * 1.4);
    });
  }
});

socket.on('round_end', ({ winnerName }) => {
  roundActive = false;
  ui.countdown.textContent = `🏆 ${winnerName} thắng hiệp!`;
  ui.countdown.classList.add('pop');
  setTimeout(() => { ui.countdown.textContent = ''; }, 2200);
});

socket.on('game_over', ({ winnerName, winnerId }) => {
  roundActive = false;
  const isWinner = winnerId === myId;
  document.getElementById('result-crown').textContent = isWinner ? '👑' : '💀';
  document.getElementById('result-title').textContent = isWinner ? 'Chiến Thắng!' : 'Thất Bại!';
  document.getElementById('result-name').textContent = `${winnerName} đã giành chiến thắng chung cuộc.`;
  showScreen('result');
});

socket.on('player_disconnected', ({ username }) => {
  roundActive = false;
  document.getElementById('result-crown').textContent = '🏆';
  document.getElementById('result-title').textContent = 'Đối thủ thoát game!';
  document.getElementById('result-name').textContent = `${username || 'Đối thủ'} đã ngắt kết nối.`;
  showScreen('result');
});

socket.on('disconnect', () => {
  roundActive = false;
});


document.getElementById('btn-cancel').addEventListener('click', () => {
  socket.emit('leave_queue');
});

document.getElementById('btn-rematch').addEventListener('click', () => {
  resetLocalGame();
  joinQueue();
});

document.getElementById('btn-lobby').addEventListener('click', () => {
  resetLocalGame();
  window.DuelLobby?.backToLobby?.();
});

showScreen('waiting');
render();
