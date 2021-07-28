const express = require('express');
const UserController = require('../controllers/userController');
const middleware = require('../middlewares/verifyToken');

const router = express.Router();

router.get('/', UserController.index);

router.get('/get-users', UserController.getUsers);

router.post('/signup', UserController.createUser);

router.post('/login', UserController.login);

router.put('/update', middleware.verifyToken, UserController.updateUser)

router.post('/change-password', middleware.verifyToken, UserController.changePassword)

module.exports = router;