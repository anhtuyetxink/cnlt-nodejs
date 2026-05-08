const { GAME_WIDTH, GAME_HEIGHT, MAX_HP } = require('../utils/constants');

class PlayerModel {
  constructor(socket, side) {
    this.id = socket.id;
    this.username = socket.username;
    this.side = side;
    this.wins = 0;
    this.resetForNewRound();
  }

  resetForNewRound() {
    this.x = this.side === 'left' ? 128 : GAME_WIDTH - 128;
    this.y = GAME_HEIGHT / 2;
    this.hp = MAX_HP;
    this.facing = this.side === 'left' ? 1 : -1;
    this.moving = { left: false, right: false };
    this.attacking = false;
    this.blocking = false;
    this.lastAttack = 0;
    this.lastBlock = 0;
    this.combo = 0;
    this.comboExpireAt = 0;
    this.stunned = false;
    this.stunEnd = 0;
  }

  serialize() {
    return {
      id: this.id,
      username: this.username,
      side: this.side,
      x: this.x,
      y: this.y,
      hp: this.hp,
      facing: this.facing,
      attacking: this.attacking,
      blocking: this.blocking,
      moving: this.moving,
      combo: this.combo,
      wins: this.wins,
      stunned: this.stunned,
    };
  }
}

module.exports = PlayerModel;
