# Sword Duel Arena MVC

Game đối kháng 1v1 realtime sử dụng Node.js, Express, Socket.IO, EJS, HTML/CSS/JavaScript.

## Chạy dự án

```bash
npm install
npm start
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

Để test 2 người chơi, mở 2 tab trình duyệt, nhập 2 tên khác nhau và bấm tìm trận.

## Cấu trúc MVC

```text
pk/
├── controllers/
│   ├── gameController.js       # Controller render trang lobby/game
│   └── socketController.js     # Controller xử lý realtime Socket.IO và logic trận đấu
├── models/
│   ├── PlayerModel.js          # Model người chơi
│   └── RoomModel.js            # Model phòng đấu
├── routes/
│   └── webRoutes.js            # Route web: / và /game
├── utils/
│   ├── constants.js            # Hằng số game
│   └── helpers.js              # Hàm tiện ích
├── views/
│   ├── partials/
│   │   ├── head.ejs
│   │   └── footer.ejs
│   ├── lobby.ejs               # View màn hình nhập tên/tìm trận
│   └── game.ejs                # View màn hình chờ, đấu, kết quả
├── public/
│   ├── css/
│   │   ├── base.css
│   │   ├── lobby.css
│   │   ├── board.css
│   │   ├── game.css
│   │   └── modal.css
│   └── js/
│       ├── login.js
│       ├── lobby.js
│       └── game.js
├── server.js                   # File chạy chính: node server.js
├── package.json
└── package-lock.json
```

## Công nghệ sử dụng

- Node.js
- Express
- Socket.IO
- EJS
- HTML/CSS/JavaScript
- CSS tùy chỉnh


## Lưu ý khi chạy

Nếu gặp lỗi `Cannot find module 'ejs'`, hãy cài lại thư viện bằng lệnh:

```bash
npm install
node server.js
```

Nếu máy vẫn báo lỗi do còn `node_modules` cũ, xoá thư mục `node_modules` rồi chạy lại `npm install`.
