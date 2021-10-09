const express = require('express');
const UploadPhoto = require('../controllers/UploadImg');
const middleware = require('../middlewares/verifyToken');

const router = express.Router();

router.post("/upload-photos",middleware.verifyToken, UploadPhoto.uploadPhoto);

router.get("/photo-user",middleware.verifyToken, UploadPhoto.getUserPhotos);

router.get("/photo-targetuser",middleware.verifyToken, UploadPhoto.getTargetUserPhotos);

router.get("/",middleware.verifyToken, UploadPhoto.getAllPhotos);

router.post('/upload-avatar', middleware.verifyToken, UploadPhoto.uploadAvatar);

router.delete('/delete-photo', middleware.verifyToken, UploadPhoto.deletePhoto);

module.exports = router;
