window.DuelLobby = {
  getUsername() {
    return localStorage.getItem('sword_duel_username') || 'Samurai';
  },

  backToLobby() {
    window.location.href = '/';
  },

  restartGame() {
    window.location.href = '/game';
  },
};
