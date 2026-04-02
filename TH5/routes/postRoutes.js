const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/postController');


router.get('/', ctrl.getAllPosts);


router.get('/create', ctrl.getCreate);
router.post('/create', ctrl.createPost);


router.get('/post/:id', ctrl.getDetail);


router.get('/edit/:id', ctrl.getEdit);
router.post('/edit/:id', ctrl.updatePost); 


router.get('/delete/:id', ctrl.deletePost);

module.exports = router;