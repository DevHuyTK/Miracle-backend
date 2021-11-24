const express = require('express');
const PostController = require('../controllers/PostController');
const middleware = require('../middlewares/verifyToken');

const router = express.Router();


router.get('/get-comments/:postId', PostController.getPostComments );


module.exports = router;