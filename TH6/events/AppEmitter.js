const EventEmitter = require("events");
const fs = require("fs");
const path = require("path");

class AppEmitter extends EventEmitter {
  constructor() {
    super();
    this.eventCount = 0;
    this.logPath = path.join(__dirname, "..", "data", "log.txt");

    this.on("startQuiz", (data) => {
      this.eventCount++;
      this.writeLog(
        `[EVENT] startQuiz | Sinh viên: ${data.student} | Môn: ${data.subject} | Thời gian: ${data.time}`
      );
    });

    this.on("submitQuiz", (data) => {
      this.eventCount++;
      this.writeLog(
        `[EVENT] submitQuiz | Sinh viên: ${data.student} | Môn: ${data.subject} | Thời gian: ${data.time}`
      );
    });

    this.on("viewResult", (data, callback) => {
      this.eventCount++;
      this.writeLog(
        `[EVENT] viewResult | Sinh viên: ${data.student} | Môn: ${data.subject} | Thời gian: ${data.time}`
      );

      if (typeof callback === "function") {
        callback(`Đã xem kết quả môn ${data.subject}`);
      }
    });

    this.once("firstAccess", (data) => {
      this.eventCount++;
      this.writeLog(
        `[EVENT-ONCE] firstAccess | Sinh viên đầu tiên: ${data.student} | Thời gian: ${data.time}`
      );
    });

    this.on("error", (err) => {
      this.writeLog(`[ERROR EVENT] ${err.message}`);
    });
  }

  writeLog(message) {
    const logStream = fs.createWriteStream(this.logPath, {
      flags: "a",
      encoding: "utf8"
    });
    logStream.write(message + "\n");
    logStream.end();
  }

  triggerEvent(type, data) {
    try {
      this.emit("firstAccess", data);

      if (type === "viewResult") {
        this.emit(type, data, (message) => {
          this.writeLog(`[CALLBACK] ${message}`);
        });
      } else {
        this.emit(type, data);
      }
    } catch (error) {
      this.emit("error", error);
    }
  }
}

module.exports = AppEmitter;