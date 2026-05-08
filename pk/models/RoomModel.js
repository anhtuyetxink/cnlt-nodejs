const PlayerModel = require('./PlayerModel');

class RoomModel {
  constructor(roomId, playerOneSocket, playerTwoSocket) {
    this.id = roomId;
    this.players = {
      [playerOneSocket.id]: new PlayerModel(playerOneSocket, 'left'),
      [playerTwoSocket.id]: new PlayerModel(playerTwoSocket, 'right'),
    };
    this.state = 'idle';
    this.round = 1;
    this.loop = null;
    this.countdownTimer = null;
    this.hits = [];
  }

  getPlayerList() {
    return Object.values(this.players);
  }

  resetPlayers() {
    this.getPlayerList().forEach((player) => player.resetForNewRound());
    this.hits = [];
  }

  getWinsMap() {
    return this.getPlayerList().reduce((acc, player) => {
      acc[player.id] = player.wins;
      return acc;
    }, {});
  }

  serializeState() {
    return {
      players: this.getPlayerList().map((player) => player.serialize()),
      hits: this.hits,
      round: this.round,
    };
  }
}

module.exports = RoomModel;
