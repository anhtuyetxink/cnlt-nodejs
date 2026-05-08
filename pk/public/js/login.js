document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const usernameInput = document.getElementById('username-input');

  usernameInput.value = localStorage.getItem('sword_duel_username') || '';
  usernameInput.focus();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = usernameInput.value.trim() || 'Samurai';
    localStorage.setItem('sword_duel_username', username);
    window.location.href = '/game';
  });
});
