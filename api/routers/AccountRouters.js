const express = require('express');
const UserController = require('../controllers/userController');
const middleware = require('../middlewares/verifyToken');

const router = express.Router();

router.get('/matching_list', middleware.verifyToken, UserController.matching_list);

router.get('/get-users', UserController.getUsers);

router.get('/get-user', middleware.verifyToken, UserController.getOneUser);

router.post('/signup', UserController.createUser);

router.post('/login', UserController.login);

router.put('/update', middleware.verifyToken, UserController.updateUser)

router.post('/change-password', middleware.verifyToken, UserController.changePassword)

router.post('/upload-avatar', middleware.verifyToken, UserController.uploadAvatar);


module.exports = router;