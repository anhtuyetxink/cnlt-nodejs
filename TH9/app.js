const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');

const logger = require('./middleware/logger');
const authMiddleware = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(logger);

app.use(
  session({
    secret: 'th9-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 30 * 60 * 1000
    }
  })
);

app.get('/', (req, res) => {
  return res.json({
    message: 'Server API quản lý sinh viên đang chạy',
    port: PORT
  });
});

app.use('/', authRoutes);
app.use('/students', studentRoutes);

let heavyRequestId = 0;

function blockingWait(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // chặn event loop
  }
}

app.get('/heavy-sync', authMiddleware, (req, res) => {
  heavyRequestId++;
  const requestId = heavyRequestId;
  const start = Date.now();

  console.log(`[SYNC] Request #${requestId} bắt đầu`);
  blockingWait(3000);
  const durationMs = Date.now() - start;
  console.log(`[SYNC] Request #${requestId} kết thúc sau ${durationMs}ms`);

  return res.json({
    mode: 'sync',
    requestId,
    durationMs,
    message: 'Xử lý đồng bộ hoàn tất'
  });
});

app.get('/heavy-async', authMiddleware, (req, res) => {
  heavyRequestId++;
  const requestId = heavyRequestId;
  const start = Date.now();

  console.log(`[ASYNC] Request #${requestId} bắt đầu`);

  setTimeout(() => {
    const durationMs = Date.now() - start;
    console.log(`[ASYNC] Request #${requestId} kết thúc sau ${durationMs}ms`);

    return res.json({
      mode: 'async',
      requestId,
      durationMs,
      message: 'Xử lý bất đồng bộ hoàn tất'
    });
  }, 3000);
});

app.use((req, res) => {
  return res.status(404).json({
    message: 'Không tìm thấy API'
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});