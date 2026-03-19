const express = require('express');
const app = express();

const PORT = 4000;


app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Trang chủ NodeJS Express');
});

app.listen(PORT, () => {
    console.log(`Server chạy tại http://localhost:${PORT}`);
});