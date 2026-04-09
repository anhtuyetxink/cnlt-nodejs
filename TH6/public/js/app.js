document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || '';

  if (page === 'quiz') {
    initQuizPage();
  }

  if (page === 'streams') {
    initStreamsPage();
  }

  if (page === 'events') {
    initEventsPage();
  }
});

function initQuizPage() {
  const dataElement = document.getElementById('quiz-data');
  const form = document.getElementById('quiz-form');
  const nav = document.getElementById('question-nav');
  const timerElement = document.getElementById('timer');
  const answeredElement = document.getElementById('answered-count');
  const submitButton = document.getElementById('submit-quiz');

  if (!dataElement || !form || !nav || !timerElement || !answeredElement || !submitButton) {
    return;
  }

  const quiz = JSON.parse(dataElement.textContent);
  let remaining = Number(quiz.time) || 600;
  let submitted = false;

  form.innerHTML = quiz.questions.map((item, index) => {
    const optionsHtml = item.options.map((option, optionIndex) => {
      const inputId = `q${item.id}_${optionIndex}`;
      const letter = String.fromCharCode(65 + optionIndex);
      return `
        <label class="option-item" for="${inputId}">
          <input type="radio" id="${inputId}" name="question_${item.id}" value="${optionIndex}">
          <span class="option-letter">${letter}</span>
          <span class="option-text">${escapeHtml(option)}</span>
        </label>
      `;
    }).join('');

    return `
      <article class="question-card" id="question-card-${index + 1}">
        <div class="question-card-top">
          <span class="question-number">Câu ${index + 1}</span>
          <span class="question-tag">${escapeHtml(quiz.subjectName)}</span>
        </div>
        <h3 class="question-title">${escapeHtml(item.question)}</h3>
        <div class="option-list">${optionsHtml}</div>
      </article>
    `;
  }).join('');

  nav.innerHTML = quiz.questions.map((item, index) => {
    return `<a class="nav-number" href="#question-card-${index + 1}" data-target="${index + 1}">${index + 1}</a>`;
  }).join('');

  updateTimer();
  updateAnswered();
  highlightQuestionNav();

  const timer = setInterval(() => {
    remaining -= 1;
    updateTimer();

    if (remaining <= 0) {
      clearInterval(timer);
      if (!submitted) {
        submitQuiz(true);
      }
    }
  }, 1000);

  form.addEventListener('change', () => {
    updateAnswered();
  });

  document.querySelectorAll('.question-nav .nav-number').forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(highlightQuestionNav, 100);
    });
  });

  window.addEventListener('scroll', highlightQuestionNav);

  submitButton.addEventListener('click', () => {
    if (!submitted) {
      clearInterval(timer);
      submitQuiz(false);
    }
  });

  async function submitQuiz(autoSubmit) {
    submitted = true;
    submitButton.disabled = true;
    submitButton.textContent = autoSubmit ? 'Đang tự động nộp bài...' : 'Đang nộp bài...';

    const answers = {};
    quiz.questions.forEach(item => {
      const checked = form.querySelector(`input[name="question_${item.id}"]:checked`);
      if (checked) {
        answers[item.id] = Number(checked.value);
      }
    });

    const payload = {
      subject: quiz.subjectKey,
      questionIds: quiz.questions.map(item => item.id),
      answers,
      autoSubmit
    };

    try {
      const response = await fetch('/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const html = await response.text();
      document.open();
      document.write(html);
      document.close();
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = 'Nộp bài';
      alert('Có lỗi xảy ra khi nộp bài. Em vui lòng thử lại.');
      submitted = false;
    }
  }

  function updateTimer() {
    const safeTime = remaining > 0 ? remaining : 0;
    const minutes = String(Math.floor(safeTime / 60)).padStart(2, '0');
    const seconds = String(safeTime % 60).padStart(2, '0');
    timerElement.textContent = `${minutes}:${seconds}`;
    timerElement.parentElement.classList.toggle('danger', safeTime <= 60);
  }

  function updateAnswered() {
    const answered = quiz.questions.filter(item => {
      return form.querySelector(`input[name="question_${item.id}"]:checked`);
    }).length;

    answeredElement.textContent = `${answered}/${quiz.questions.length}`;

    quiz.questions.forEach((item, index) => {
      const navItem = nav.querySelector(`[data-target="${index + 1}"]`);
      const checked = form.querySelector(`input[name="question_${item.id}"]:checked`);
      if (navItem) {
        navItem.classList.toggle('done', Boolean(checked));
      }
    });
  }

  function highlightQuestionNav() {
    const cards = Array.from(document.querySelectorAll('.question-card'));
    let currentIndex = 0;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      if (rect.top <= 180) {
        currentIndex = index;
      }
    });

    nav.querySelectorAll('.nav-number').forEach((item, index) => {
      item.classList.toggle('active', index === currentIndex);
    });
  }
}

function initStreamsPage() {
  const readButton = document.getElementById('read-story-btn');
  const readOutput = document.getElementById('read-output');
  const writeForm = document.getElementById('write-form');
  const writeStatus = document.getElementById('write-status');
  const transformForm = document.getElementById('transform-form');
  const transformOutput = document.getElementById('transform-output');
  const echoForm = document.getElementById('echo-form');
  const echoOutput = document.getElementById('echo-output');

  if (readButton && readOutput) {
    readButton.addEventListener('click', async () => {
      readButton.disabled = true;
      readButton.textContent = 'Đang đọc dữ liệu...';

      try {
        const response = await fetch('/streams/read');
        const text = await response.text();
        readOutput.textContent = text;
      } catch (error) {
        readOutput.textContent = 'Không thể đọc file story.txt.';
      }

      readButton.disabled = false;
      readButton.textContent = 'Đọc story.txt';
    });
  }

  if (writeForm && writeStatus) {
    writeForm.addEventListener('submit', async event => {
      event.preventDefault();

      const formData = new FormData(writeForm);
      const params = new URLSearchParams(formData);

      try {
        const response = await fetch('/streams/write', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
          },
          body: params.toString()
        });

        const data = await response.json();
        writeStatus.textContent = data.message || 'Đã xử lý xong.';
        writeStatus.classList.add('success');
        writeForm.reset();
      } catch (error) {
        writeStatus.textContent = 'Không thể ghi dữ liệu vào file log.';
        writeStatus.classList.remove('success');
      }
    });
  }

  if (transformForm && transformOutput) {
    transformForm.addEventListener('submit', async event => {
      event.preventDefault();

      const formData = new FormData(transformForm);
      const params = new URLSearchParams(formData);

      try {
        const response = await fetch('/streams/transform', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
          },
          body: params.toString()
        });

        const data = await response.json();
        transformOutput.textContent = data.result || '';
      } catch (error) {
        transformOutput.textContent = 'Không thể transform dữ liệu.';
      }
    });
  }

  if (echoForm && echoOutput) {
    echoForm.addEventListener('submit', async event => {
      event.preventDefault();

      const formData = new FormData(echoForm);
      const params = new URLSearchParams(formData);

      try {
        const response = await fetch('/streams/echo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
          },
          body: params.toString()
        });

        const data = await response.json();
        echoOutput.textContent = data.result || '';
      } catch (error) {
        echoOutput.textContent = 'Không thể nhận echo từ server.';
      }
    });
  }
}

function initEventsPage() {
  const buttons = document.querySelectorAll('.event-trigger');
  const statsBox = document.getElementById('event-stats');
  const logsBox = document.getElementById('event-logs');
  const statusBox = document.getElementById('event-status');

  if (!buttons.length || !statsBox || !logsBox || !statusBox) {
    return;
  }

  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const action = button.dataset.action || '';
      statusBox.textContent = 'Đang kích hoạt sự kiện...';

      try {
        const response = await fetch(`/event?action=${encodeURIComponent(action)}`);
        const data = await response.json();

        statsBox.innerHTML = `
          <div class="mini-stat"><span>system:welcome</span><strong>${data.stats.welcomeCount}</strong></div>
          <div class="mini-stat"><span>quiz:start</span><strong>${data.stats.quizStartCount}</strong></div>
          <div class="mini-stat"><span>quiz:submit</span><strong>${data.stats.quizSubmitCount}</strong></div>
          <div class="mini-stat"><span>Sự kiện cuối</span><strong>${escapeHtml(data.stats.lastEvent)}</strong></div>
        `;

        logsBox.innerHTML = Array.isArray(data.logs) && data.logs.length
          ? data.logs.map(line => `<div class="log-item">${escapeHtml(line)}</div>`).join('')
          : '<div class="log-item">Chưa có log nào.</div>';

        statusBox.textContent = data.message || 'Đã trigger sự kiện thành công.';
      } catch (error) {
        statusBox.textContent = 'Không thể kích hoạt sự kiện.';
      }
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}