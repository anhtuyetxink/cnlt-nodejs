function sanitizeName(name) {
  return String(name || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 16);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getOpponent(room, playerId) {
  return Object.values(room.players).find((player) => player.id !== playerId);
}

module.exports = {
  sanitizeName,
  clamp,
  getOpponent,
};
