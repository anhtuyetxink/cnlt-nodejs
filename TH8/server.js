const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();


app.use(express.static(path.join(__dirname, "public")));


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});


const uploadManyFiles = multer({ storage: storage }).array("many-files", 17);


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "master.html"));
});


app.post("/upload", (req, res) => {
  uploadManyFiles(req, res, (err) => {
    if (err) {
      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lỗi upload</title>
          <link rel="stylesheet" href="/style.css">
        </head>
        <body class="result-page">
          <div class="result-box error">
            <h2>Upload thất bại</h2>
            <p>Đã xảy ra lỗi khi tải nhiều file lên hệ thống.</p>
            <a href="/" class="btn-back">Quay lại</a>
          </div>
        </body>
        </html>
      `);
    }

    return res.send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kết quả upload</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body class="result-page">
        <div class="result-box success">
          <h2>Upload nhiều file thành công</h2>
          <p>Các file đã được lưu vào thư mục <b>uploads</b>.</p>
          <a href="/" class="btn-back">Tiếp tục upload</a>
        </div>
      </body>
      </html>
    `);
  });
});

app.listen(8017, () => {
  console.log("Server chạy tại http://localhost:8017");
});