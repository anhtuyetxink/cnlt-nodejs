const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const connectDB = require('./config/db');
const postRoutes = require('./routes/postRoutes');

const app = express();
connectDB();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', postRoutes);

app.listen(3000, () => {
    console.log('http://localhost:3000');
});