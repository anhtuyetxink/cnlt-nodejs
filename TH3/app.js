const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));


const items = [
  { id: 1, name: 'Đồng hồ Classic', description: 'Phong cách sang trọng', price: 520000, hot: true, image: 'dongho.jpg' },
  { id: 2, name: 'Kính râm UV400', description: 'Bảo vệ mắt tối đa', price: 220000, hot: false, image: 'kinh.jpg' },
  { id: 3, name: 'Balo Mini', description: 'Nhỏ gọn tiện lợi', price: 340000, hot: true, image: 'balomini.jpg' },
  { id: 4, name: 'Mũ thời trang', description: 'Phong cách trẻ trung', price: 130000, hot: false, image: 'non.jpg' },
  { id: 5, name: 'Tai nghe Bluetooth', description: 'Âm thanh sống động', price: 480000, hot: true, image: 'tainghe.jpg' }
];


app.get('/', (req, res) => {
  res.render('index', { title: 'Accessory Shop' });
});

app.get('/list', (req, res) => {
  res.render('list', { title: 'Sản phẩm', items: items });
});

app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Liên hệ' });
});

app.get('/detail/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = items.find(x => x.id === id);

  if (!item) return res.send('Không tìm thấy');

  res.render('detail', { title: item.name, item: item });
});

app.listen(3000, () => console.log('http://localhost:3000'));