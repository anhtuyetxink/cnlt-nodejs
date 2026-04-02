const BlogPost = require('../models/BlogPost');

// LIST + SEARCH
exports.getAllPosts = async (req, res) => {
    const keyword = req.query.search || '';

    const posts = await BlogPost.find({
        title: { $regex: keyword, $options: 'i' }
    });

    res.render('index', { posts, keyword });
};

exports.getCreate = (req, res) => res.render('create');

exports.createPost = async (req, res) => {
    await BlogPost.create(req.body);
    res.redirect('/');
};

exports.getDetail = async (req, res) => {
    const post = await BlogPost.findById(req.params.id);
    res.render('detail', { post });
};

exports.getEdit = async (req, res) => {
    const post = await BlogPost.findById(req.params.id);
    res.render('edit', { post });
};

exports.updatePost = async (req, res) => {
    await BlogPost.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/');
};

exports.deletePost = async (req, res) => {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.redirect('/');
};