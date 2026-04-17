const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    if (pathname === '/') {
        pathname = '/index.html';
    }

    
    if (pathname === '/public/style.css') {
        const cssPath = path.join(__dirname, 'public', 'style.css');

        fs.readFile(cssPath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('Không tìm thấy file CSS');
            }

            res.writeHead(200, { 'Content-Type': 'text/css' });
            return res.end(data);
        });
        return;
    }

   
    if (pathname === '/files/cat.png') {
        const imagePath = path.join(__dirname, 'files', 'cat.png');

        fs.readFile(imagePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('Không tìm thấy ảnh');
            }

            res.writeHead(200, { 'Content-Type': 'image/png' });
            return res.end(data);
        });
        return;
    }

    
    const filePath = path.join(__dirname, 'views', pathname);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            return res.end(`
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>404</title>
                    <link rel="stylesheet" href="/public/style.css">
                </head>
                <body>
                    <div class="page-center">
                        <div class="card error-card">
                            <h1>404</h1>
                            <a href="/" class="btn btn-primary">Về trang chủ</a>
                        </div>
                    </div>
                </body>
                </html>
            `);
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(data);
    });
});

server.listen(8017, 'localhost', () => {
    console.log('Server đang chạy tại: http://localhost:8017');
});