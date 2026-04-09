const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const querystring = require("querystring");

const AppEmitter = require("./events/AppEmitter");
const TextTransform = require("./streams/TextTransform");
const EchoDuplex = require("./streams/EchoDuplex");

const PORT = 3000;
const appEmitter = new AppEmitter();

const questionsPath = path.join(__dirname, "data", "questions.json");
const storyPath = path.join(__dirname, "data", "story.txt");
const notesPath = path.join(__dirname, "data", "notes.txt");
const logPath = path.join(__dirname, "data", "log.txt");
const bannerPath = path.join(__dirname, "public", "images", "banner.jpg");
const stylePath = path.join(__dirname, "public", "style.css");

function ensureFile(filePath, defaultContent = "") {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContent, "utf8");
  }
}

ensureFile(notesPath, "=== GHI CHÚ HỌC TẬP ===\n");
ensureFile(logPath, "=== LOG HỆ THỐNG HỌC TRẮC NGHIỆM QNU ===\n");

function writeLog(message) {
  const logStream = fs.createWriteStream(logPath, {
    flags: "a",
    encoding: "utf8"
  });
  logStream.write(`[${new Date().toLocaleString("vi-VN")}] ${message}\n`);
  logStream.end();
}

function sendText(res, content, statusCode = 200) {
  res.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
  res.end(content);
}

function sendJson(res, data, statusCode = 200) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data, null, 2));
}

function serveStatic(req, res) {
  if (req.url === "/style.css") {
    fs.readFile(stylePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Không tìm thấy file CSS");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
      res.end(data);
    });
    return true;
  }
  return false;
}

function parseBody(req, callback) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
    if (body.length > 1e6) {
      req.connection.destroy();
    }
  });

  req.on("end", () => {
    callback(querystring.parse(body));
  });
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getQuestionsData() {
  try {
    const raw = fs.readFileSync(questionsPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function getSubjectTitle(key) {
  const map = {
    tu_tuong_ho_chi_minh: "Tư tưởng Hồ Chí Minh",
    lich_su_dang: "Lịch sử Đảng",
    phap_luat_dai_cuong: "Pháp luật đại cương",
    chu_nghia_xa_hoi_khoa_hoc: "Chủ nghĩa xã hội khoa học"
  };
  return map[key] || key;
}

function renderLayout(title, content) {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
      <link rel="stylesheet" href="/style.css" />
    </head>
    <body>
      <div class="page-shell">
        <div class="container">
          ${content}
        </div>
      </div>
    </body>
    </html>
  `;
}

function renderIndexPage() {
  return renderLayout(
    "QNU Quiz System",
    `
    <header class="hero">
      <nav class="navbar">
        <div class="logo">QNU Quiz System</div>
        <div class="nav-links">
          <a href="/">Trang chủ</a>
          <a href="/quiz">Làm trắc nghiệm</a>
          <a href="/events">Events</a>
          <a href="/request?subject=PhapLuat&user=SinhVienQNU">Request</a>
          <a href="/streams">Streams</a>
        </div>
      </nav>

      <div class="hero-grid">
        <div class="hero-content">
          <p class="eyebrow">NỀN TẢNG ÔN TẬP TRẮC NGHIỆM</p>
          <h1>Hệ thống học trắc nghiệm cho sinh viên QNU</h1>
          <p class="hero-text">
            Ứng dụng NodeJS tích hợp EventEmitter, HTTP Server, Request/Header,
            JSON, stream ảnh, file log và chức năng làm bài trắc nghiệm có chấm điểm.
          </p>

          <div class="hero-actions">
            <a class="btn btn-primary" href="/quiz">Bắt đầu làm bài</a>
            <a class="btn btn-outline" href="/json">Xem dữ liệu JSON</a>
          </div>
        </div>

        <div class="hero-card">
          <h3>Tính năng nổi bật</h3>
          <ul class="feature-list">
            <li>Chọn môn học và làm bài trắc nghiệm thật</li>
            <li>Nộp bài, chấm điểm tự động</li>
            <li>Trang kết quả riêng sau khi nộp bài</li>
            <li>Minh họa Event-driven trong NodeJS</li>
            <li>Đủ 4 loại stream theo yêu cầu thực hành</li>
          </ul>
        </div>
      </div>
    </header>

    <section class="section">
      <div class="section-head">
        <p class="eyebrow">MÔN HỌC</p>
        <h2>Chọn môn để ôn tập</h2>
      </div>

      <div class="card-grid">
        <a class="subject-card" href="/quiz?subject=tu_tuong_ho_chi_minh">
          <h3>Tư tưởng Hồ Chí Minh</h3>
          <p>Làm bài ôn tập theo bộ câu hỏi đã lưu trong hệ thống.</p>
        </a>

        <a class="subject-card" href="/quiz?subject=lich_su_dang">
          <h3>Lịch sử Đảng</h3>
          <p>Thử sức với bộ câu hỏi trắc nghiệm nền tảng.</p>
        </a>

        <a class="subject-card" href="/quiz?subject=phap_luat_dai_cuong">
          <h3>Pháp luật đại cương</h3>
          <p>Làm bài, nộp bài và nhận kết quả ngay trên web.</p>
        </a>

        <a class="subject-card" href="/quiz?subject=chu_nghia_xa_hoi_khoa_hoc">
          <h3>Chủ nghĩa xã hội khoa học</h3>
          <p>Hệ thống chấm điểm tự động và lưu log hoạt động.</p>
        </a>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <p class="eyebrow">ĐIỀU HƯỚNG NHANH</p>
        <h2>Các chức năng kỹ thuật</h2>
      </div>

      <div class="quick-grid">
        <a class="quick-link" href="/quiz">Trang trắc nghiệm</a>
        <a class="quick-link" href="/events">Trang EventEmitter</a>
        <a class="quick-link" href="/request?subject=TuTuongHCM&user=AnhTuyet">Trang Request / Header</a>
        <a class="quick-link" href="/streams">Trang Stream tổng hợp</a>
        <a class="quick-link" href="/event?type=startQuiz&subject=PhapLuat&student=SinhVienQNU">Trigger Event</a>
        <a class="quick-link" href="/json">Endpoint JSON</a>
        <a class="quick-link" href="/image">Xem ảnh banner</a>
        <a class="quick-link" href="/download-log">Tải file log</a>
      </div>
    </section>
    `
  );
}

function renderEventsPage() {
  return renderLayout(
    "Events - QNU Quiz",
    `
    <div class="topbar">
      <div>
        <p class="eyebrow">EVENT-DRIVEN NODEJS</p>
        <h1>Minh họa EventEmitter</h1>
      </div>
      <a class="btn btn-outline" href="/">Về trang chủ</a>
    </div>

    <div class="card-grid">
      <div class="action-card">
        <h3>Bắt đầu làm bài</h3>
        <p>Kích hoạt sự kiện <strong>startQuiz</strong> bằng <code>emit()</code>.</p>
        <a class="btn btn-primary" href="/event?type=startQuiz&subject=TuTuongHCM&student=SinhVienQNU">Trigger Start</a>
      </div>

      <div class="action-card">
        <h3>Nộp bài</h3>
        <p>Kích hoạt sự kiện <strong>submitQuiz</strong> và ghi log hệ thống.</p>
        <a class="btn btn-primary" href="/event?type=submitQuiz&subject=LichSuDang&student=SinhVienQNU">Trigger Submit</a>
      </div>

      <div class="action-card">
        <h3>Xem kết quả</h3>
        <p>Minh họa event có truyền dữ liệu và callback xử lý.</p>
        <a class="btn btn-primary" href="/event?type=viewResult&subject=PhapLuat&student=SinhVienQNU">Trigger Result</a>
      </div>
    </div>

    <div class="card">
      <h2>Giải thích ngắn</h2>
      <ul class="feature-list">
        <li><code>on()</code>: đăng ký listener để lắng nghe sự kiện.</li>
        <li><code>emit()</code>: phát sự kiện.</li>
        <li><code>once()</code>: sự kiện chỉ chạy 1 lần.</li>
        <li>Event có thể truyền dữ liệu như tên sinh viên, môn học, thời gian.</li>
        <li>Có callback và có ghi log khi sự kiện được kích hoạt.</li>
      </ul>
    </div>
    `
  );
}

function renderRequestPage(req, pathname, query) {
  const requestInfo = `
    <div class="request-box">
      <h2>Thông tin Request hiện tại</h2>
      <p><strong>URL:</strong> ${escapeHtml(req.url)}</p>
      <p><strong>Method:</strong> ${escapeHtml(req.method)}</p>
      <p><strong>Pathname:</strong> ${escapeHtml(pathname)}</p>
      <p><strong>Query subject:</strong> ${escapeHtml(query.subject || "Không có")}</p>
      <p><strong>Query user:</strong> ${escapeHtml(query.user || "Không có")}</p>
    </div>

    <div class="request-box">
      <h2>Request Headers</h2>
      <pre>${escapeHtml(JSON.stringify(req.headers, null, 2))}</pre>
    </div>
  `;

  return renderLayout(
    "Request - QNU Quiz",
    `
    <div class="topbar">
      <div>
        <p class="eyebrow">REQUEST & HEADER</p>
        <h1>Thông tin Request từ client</h1>
      </div>
      <a class="btn btn-outline" href="/">Về trang chủ</a>
    </div>

    <div class="card">
      <p>
        Gợi ý test:
        <a href="/request?subject=PhapLuat&user=AnhTuyet">/request?subject=PhapLuat&user=AnhTuyet</a>
      </p>
    </div>

    ${requestInfo}
    `
  );
}

function renderQuizSelectionPage() {
  const data = getQuestionsData();
  const subjects = Object.keys(data);

  const subjectCards = subjects
    .map(
      (key) => `
      <a class="subject-card" href="/quiz?subject=${key}">
        <h3>${getSubjectTitle(key)}</h3>
        <p>Số câu hiện có: ${Array.isArray(data[key]) ? data[key].length : 0}</p>
      </a>
    `
    )
    .join("");

  return renderLayout(
    "Chọn môn trắc nghiệm",
    `
    <div class="topbar">
      <div>
        <p class="eyebrow">QUIZ SYSTEM</p>
        <h1>Chọn môn để làm bài</h1>
      </div>
      <a class="btn btn-outline" href="/">Về trang chủ</a>
    </div>

    <div class="card">
      <p>Chọn 1 môn học bên dưới để mở đề trắc nghiệm.</p>
    </div>

    <div class="card-grid">
      ${subjectCards}
    </div>
    `
  );
}

function renderQuizPage(subjectKey) {
  const data = getQuestionsData();
  const questions = data[subjectKey];

  if (!Array.isArray(questions) || questions.length === 0) {
    return renderLayout(
      "Không tìm thấy môn học",
      `
      <div class="error-box">
        <h1>Không tìm thấy đề trắc nghiệm</h1>
        <p>Môn học bạn chọn hiện chưa có câu hỏi.</p>
        <a class="btn btn-primary" href="/quiz">Quay lại chọn môn</a>
      </div>
      `
    );
  }

  const subjectTitle = getSubjectTitle(subjectKey);

  const questionHtml = questions
    .map((q, index) => {
      const optionsHtml = q.options
        .map(
          (opt) => `
          <label class="option-item">
            <input type="radio" name="q${index}" value="${escapeHtml(opt)}" required />
            <span>${escapeHtml(opt)}</span>
          </label>
        `
        )
        .join("");

      return `
        <div class="quiz-question">
          <h3>Câu ${index + 1}: ${escapeHtml(q.question)}</h3>
          <div class="option-list">
            ${optionsHtml}
          </div>
        </div>
      `;
    })
    .join("");

  return renderLayout(
    "Làm bài trắc nghiệm",
    `
    <div class="topbar">
      <div>
        <p class="eyebrow">QUIZ PAGE</p>
        <h1>${escapeHtml(subjectTitle)}</h1>
      </div>
      <a class="btn btn-outline" href="/quiz">Đổi môn</a>
    </div>

    <div class="card">
      <p><strong>Môn học:</strong> ${escapeHtml(subjectTitle)}</p>
      <p><strong>Số câu hỏi:</strong> ${questions.length}</p>
      <p>Chọn đáp án rồi bấm nộp bài để hệ thống chấm điểm tự động.</p>
    </div>

    <form class="quiz-form" method="POST" action="/submit-quiz">
      <input type="hidden" name="subject" value="${escapeHtml(subjectKey)}" />
      ${questionHtml}
      <div class="quiz-submit">
        <button class="btn btn-primary" type="submit">Nộp bài và chấm điểm</button>
      </div>
    </form>
    `
  );
}

function renderResultPage(subjectKey, userAnswers) {
  const data = getQuestionsData();
  const questions = data[subjectKey];

  if (!Array.isArray(questions) || questions.length === 0) {
    return renderLayout(
      "Kết quả",
      `
      <div class="error-box">
        <h1>Không thể chấm điểm</h1>
        <p>Không tìm thấy bộ câu hỏi tương ứng.</p>
        <a class="btn btn-primary" href="/quiz">Quay lại</a>
      </div>
      `
    );
  }

  let correctCount = 0;

  const detailHtml = questions
    .map((q, index) => {
      const userAnswer = userAnswers[`q${index}`] || "Chưa chọn";
      const isCorrect = userAnswer === q.answer;
      if (isCorrect) correctCount++;

      return `
        <div class="result-item ${isCorrect ? "correct" : "wrong"}">
          <h3>Câu ${index + 1}: ${escapeHtml(q.question)}</h3>
          <p><strong>Đáp án bạn chọn:</strong> ${escapeHtml(userAnswer)}</p>
          <p><strong>Đáp án đúng:</strong> ${escapeHtml(q.answer)}</p>
          <p><strong>Kết quả:</strong> ${isCorrect ? "Đúng" : "Sai"}</p>
        </div>
      `;
    })
    .join("");

  const total = questions.length;
  const score10 = ((correctCount / total) * 10).toFixed(2);
  const subjectTitle = getSubjectTitle(subjectKey);

  appEmitter.triggerEvent("submitQuiz", {
    subject: subjectTitle,
    student: "Sinh viên QNU",
    time: new Date().toLocaleString("vi-VN")
  });

  appEmitter.triggerEvent("viewResult", {
    subject: subjectTitle,
    student: "Sinh viên QNU",
    time: new Date().toLocaleString("vi-VN")
  });

  writeLog(`Chấm điểm môn ${subjectTitle} | Đúng ${correctCount}/${total} | Điểm ${score10}`);

  return renderLayout(
    "Kết quả bài làm",
    `
    <div class="topbar">
      <div>
        <p class="eyebrow">RESULT PAGE</p>
        <h1>Kết quả bài trắc nghiệm</h1>
      </div>
      <a class="btn btn-outline" href="/quiz">Làm bài khác</a>
    </div>

    <div class="score-card">
      <h2>${escapeHtml(subjectTitle)}</h2>
      <p><strong>Số câu đúng:</strong> ${correctCount}/${total}</p>
      <p><strong>Điểm:</strong> ${score10}/10</p>
    </div>

    <div class="result-list">
      ${detailHtml}
    </div>
    `
  );
}

const server = http.createServer((req, res) => {
  if (serveStatic(req, res)) return;

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  if (pathname === "/" && req.method === "GET") {
    writeLog("Truy cập trang chủ");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.write(renderIndexPage());
    res.end();
    return;
  }

  if (pathname === "/quiz" && req.method === "GET") {
    writeLog(`Truy cập trang quiz | subject=${query.subject || "none"}`);

    appEmitter.triggerEvent("startQuiz", {
      subject: getSubjectTitle(query.subject || "Chưa chọn môn"),
      student: "Sinh viên QNU",
      time: new Date().toLocaleString("vi-VN")
    });

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    if (!query.subject) {
      res.write(renderQuizSelectionPage());
    } else {
      res.write(renderQuizPage(query.subject));
    }
    res.end();
    return;
  }

  if (pathname === "/submit-quiz" && req.method === "POST") {
    parseBody(req, (body) => {
      const subject = body.subject;
      const resultHtml = renderResultPage(subject, body);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.write(resultHtml);
      res.end();
    });
    return;
  }

  if (pathname === "/events" && req.method === "GET") {
    writeLog("Truy cập trang events");
    sendText(res, renderEventsPage());
    return;
  }

  if (pathname === "/event" && req.method === "GET") {
    const type = query.type || "startQuiz";
    const subject = query.subject || "Tư tưởng Hồ Chí Minh";
    const student = query.student || "Sinh viên QNU";

    appEmitter.triggerEvent(type, {
      subject,
      student,
      time: new Date().toLocaleString("vi-VN")
    });

    sendText(
      res,
      renderLayout(
        "Kích hoạt sự kiện",
        `
        <div class="topbar">
          <div>
            <p class="eyebrow">EVENT TRIGGER</p>
            <h1>Đã kích hoạt sự kiện thành công</h1>
          </div>
          <a class="btn btn-outline" href="/events">Quay lại Events</a>
        </div>

        <div class="card">
          <p><strong>Loại sự kiện:</strong> ${escapeHtml(type)}</p>
          <p><strong>Môn học:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Sinh viên:</strong> ${escapeHtml(student)}</p>
        </div>
        `
      )
    );
    return;
  }

  if (pathname === "/request" && req.method === "GET") {
    writeLog(`Truy cập trang request | URL: ${req.url}`);

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "X-App-Name": "QNU Quiz System",
      "X-Powered-By": "NodeJS HTTP Module"
    });

    res.write(renderRequestPage(req, pathname, query));
    res.end();
    return;
  }

  if (pathname === "/streams" && req.method === "GET") {
    writeLog("Truy cập trang streams");

    const storyStream = fs.createReadStream(storyPath, { encoding: "utf8" });
    let readableContent = "";

    storyStream.on("data", (chunk) => {
      readableContent += chunk;
    });

    storyStream.on("end", () => {
      let notesContent = "Chưa có ghi chú nào";
      if (fs.existsSync(notesPath)) {
        notesContent = fs.readFileSync(notesPath, "utf8");
      }

      const html = renderLayout(
        "Streams - QNU Quiz",
        `
        <div class="topbar">
          <div>
            <p class="eyebrow">NODEJS STREAMS</p>
            <h1>Trang tổng hợp 4 loại Stream</h1>
          </div>
          <a class="btn btn-outline" href="/">Về trang chủ</a>
        </div>

        <div class="stream-layout">
          <div class="card">
            <h2>1. Readable Stream</h2>
            <p>Đọc nội dung file <code>story.txt</code> bằng <code>fs.createReadStream()</code>.</p>
            <pre>${escapeHtml(readableContent)}</pre>
          </div>

          <div class="card">
            <h2>2. Writable Stream</h2>
            <p>Nhập ghi chú học tập để ghi vào file <code>notes.txt</code>.</p>
            <form class="form-box" action="/write-note" method="POST">
              <input type="text" name="studentName" placeholder="Nhập tên sinh viên" required />
              <textarea name="noteContent" rows="5" placeholder="Nhập ghi chú ôn tập..." required></textarea>
              <button class="btn btn-primary" type="submit">Lưu ghi chú</button>
            </form>
          </div>

          <div class="card">
            <h2>3. Transform Stream</h2>
            <p>Biến đổi nội dung text thành chữ in hoa và thay thế một số từ khóa.</p>
            <form class="form-box" action="/transform" method="POST">
              <textarea name="inputText" rows="5" placeholder="Nhập nội dung để transform..." required></textarea>
              <button class="btn btn-primary" type="submit">Transform ngay</button>
            </form>
          </div>

          <div class="card">
            <h2>4. Duplex Stream</h2>
            <p>Nhập dữ liệu và hệ thống sẽ echo trả lại nội dung đó.</p>
            <form class="form-box" action="/duplex" method="POST">
              <input type="text" name="echoInput" placeholder="Nhập dữ liệu bất kỳ..." required />
              <button class="btn btn-primary" type="submit">Gửi Echo</button>
            </form>
          </div>

          <div class="card full">
            <h2>Ghi chú đã lưu</h2>
            <pre>${escapeHtml(notesContent)}</pre>
          </div>
        </div>
        `
      );

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.write(html);
      res.end();
    });

    storyStream.on("error", () => {
      sendText(res, "<h1>Lỗi đọc story.txt</h1>", 500);
    });

    return;
  }

  if (pathname === "/write-note" && req.method === "POST") {
    parseBody(req, (body) => {
      const studentName = body.studentName || "Ẩn danh";
      const noteContent = body.noteContent || "";

      const writableStream = fs.createWriteStream(notesPath, {
        flags: "a",
        encoding: "utf8"
      });

      const noteText = `Sinh viên: ${studentName}\nGhi chú: ${noteContent}\n--------------------------\n`;
      writableStream.write(noteText);
      writableStream.end();

      writableStream.on("finish", () => {
        writeLog(`Đã ghi note của ${studentName}`);
        res.writeHead(302, { Location: "/streams" });
        res.end();
      });
    });
    return;
  }

  if (pathname === "/transform" && req.method === "POST") {
    parseBody(req, (body) => {
      const inputText = body.inputText || "";
      const transformer = new TextTransform();
      let output = "";

      transformer.on("data", (chunk) => {
        output += chunk.toString();
      });

      transformer.on("end", () => {
        writeLog("Đã transform dữ liệu text");

        sendText(
          res,
          renderLayout(
            "Kết quả Transform",
            `
            <div class="topbar">
              <div>
                <p class="eyebrow">TRANSFORM STREAM</p>
                <h1>Kết quả Transform</h1>
              </div>
              <a class="btn btn-outline" href="/streams">Quay lại</a>
            </div>

            <div class="card">
              <h2>Input</h2>
              <pre>${escapeHtml(inputText)}</pre>
            </div>

            <div class="card">
              <h2>Output</h2>
              <pre>${escapeHtml(output)}</pre>
            </div>
            `
          )
        );
      });

      transformer.write(inputText);
      transformer.end();
    });
    return;
  }

  if (pathname === "/duplex" && req.method === "POST") {
    parseBody(req, (body) => {
      const echoInput = body.echoInput || "";
      const echoDuplex = new EchoDuplex();
      let echoedResult = "";

      echoDuplex.on("data", (chunk) => {
        echoedResult += chunk.toString();
      });

      echoDuplex.on("end", () => {
        writeLog("Đã xử lý duplex stream");

        sendText(
          res,
          renderLayout(
            "Kết quả Duplex",
            `
            <div class="topbar">
              <div>
                <p class="eyebrow">DUPLEX STREAM</p>
                <h1>Kết quả Duplex</h1>
              </div>
              <a class="btn btn-outline" href="/streams">Quay lại</a>
            </div>

            <div class="card">
              <h2>Dữ liệu gửi vào</h2>
              <pre>${escapeHtml(echoInput)}</pre>
            </div>

            <div class="card">
              <h2>Dữ liệu echo trả về</h2>
              <pre>${escapeHtml(echoedResult)}</pre>
            </div>
            `
          )
        );
      });

      echoDuplex.write(echoInput);
      echoDuplex.end();
    });
    return;
  }

  if (pathname === "/json" && req.method === "GET") {
    fs.readFile(questionsPath, "utf8", (err, data) => {
      if (err) {
        sendJson(res, { error: "Không đọc được file questions.json" }, 500);
        return;
      }

      writeLog("Truy cập endpoint /json");
      sendJson(res, JSON.parse(data));
    });
    return;
  }

  if (pathname === "/image" && req.method === "GET") {
    const imageStream = fs.createReadStream(bannerPath);

    imageStream.on("error", () => {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Không tìm thấy ảnh banner");
    });

    res.writeHead(200, { "Content-Type": "image/jpeg" });
    imageStream.pipe(res);
    writeLog("Truy cập endpoint /image");
    return;
  }

  if (pathname === "/download-log" && req.method === "GET") {
    const logStream = fs.createReadStream(logPath);

    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="log.txt"'
    });

    logStream.on("error", () => {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Không tìm thấy file log");
    });

    logStream.pipe(res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  res.write(
    renderLayout(
      "404 Not Found",
      `
      <div class="error-box">
        <h1>404 - Không tìm thấy trang</h1>
        <p>Đường dẫn bạn truy cập hiện không tồn tại trong hệ thống học trắc nghiệm QNU.</p>
        <a class="btn btn-primary" href="/">Về trang chủ</a>
      </div>
      `
    )
  );
  res.end();
});

server.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
  writeLog(`Server khởi động tại cổng ${PORT}`);
});