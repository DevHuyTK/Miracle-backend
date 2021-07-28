const express = require('express');
const UploadPhoto = require('../controllers/UploadImg');
const middleware = require('../middlewares/verifyToken');

const router = express.Router();

router.post("/upload-photos",middleware.verifyToken, UploadPhoto.uploadPhoto);

router.post('/upload-avatar', middleware.verifyToken, UploadPhoto.uploadAvatar);

router.delete('/delete-photo', middleware.verifyToken, UploadPhoto.deletePhoto);

module.exports = router;
