const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const webRoutes = require('./routes/webRoutes');
const { initSocket } = require('./controllers/socketController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingInterval: 10000,
  pingTimeout: 5000,
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', webRoutes);

initSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🗡️  Sword Duel server running → http://localhost:${PORT}`);
});
