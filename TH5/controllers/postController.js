const Post = require('../models/BlogPost');


exports.getAllPosts = (req, res) => {
    const keyword = req.query.search || '';  
    Post.find({ title: { $regex: keyword, $options: 'i' } }) 
        .then(posts => {
            res.render('index', { posts, keyword });  
        })
        .catch(err => res.status(500).send("Không thể lấy dữ liệu"));
};


exports.getCreate = (req, res) => {
    res.render('create');
};


exports.createPost = (req, res) => {
    const { title, content } = req.body;
    const newPost = new Post({ title, content });
    newPost.save()
        .then(() => res.redirect('/'))
        .catch(err => res.status(500).send('Lỗi khi tạo bài viết'));
};


exports.getDetail = (req, res) => {
    const postId = req.params.id;
    Post.findById(postId)
        .then(post => {
            res.render('detail', { post });
        })
        .catch(err => res.status(500).send('Không tìm thấy bài viết'));
};


exports.getEdit = (req, res) => {
    const postId = req.params.id;
    Post.findById(postId)
        .then(post => {
            res.render('edit', { post });
        })
        .catch(err => res.status(500).send('Không tìm thấy bài viết để sửa'));
};


exports.updatePost = (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;
    Post.findByIdAndUpdate(postId, { title, content }, { new: true })
        .then(() => res.redirect(`/post/${postId}`))
        .catch(err => res.status(500).send('Lỗi khi cập nhật bài viết'));
};


exports.deletePost = (req, res) => {
    const postId = req.params.id;
    Post.findByIdAndDelete(postId)
        .then(() => res.redirect('/'))
        .catch(err => res.status(500).send('Không thể xóa bài viết'));
};