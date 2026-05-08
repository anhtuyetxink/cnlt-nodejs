function showLobby(req, res) {
  res.render('lobby', {
    title: 'Sword Duel Arena - Lobby',
    page: 'lobby',
  });
}

function showGame(req, res) {
  res.render('game', {
    title: 'Sword Duel Arena - Game',
    page: 'game',
  });
}

module.exports = {
  showLobby,
  showGame,
};
