const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
  title: String,
  body: String
});

module.exports = mongoose.model('BlogPost', BlogPostSchema);