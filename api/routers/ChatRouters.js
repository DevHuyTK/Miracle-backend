const express = require('express');
const ChatControll = require('../controllers/chatController');
const middleware = require('../middlewares/verifyToken');

const router = express.Router();

router.get("/", middleware.verifyToken, ChatControll.index);

router.delete("/delete-all", middleware.verifyToken, ChatControll.deleteAll);

module.exports = router;
