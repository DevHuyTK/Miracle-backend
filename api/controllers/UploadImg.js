const User = require("../models/UserModel");
const Post = require("../models/PostModel");
const moment = require("moment");

//UPLOAD IMAGES INTO SERVER
module.exports.uploadPhoto = async (req, res) => {
  try {
    const photos = req.files.photos;
    const title = req.body.title;
    if (!title) {
      return res.json({
        status: 0,
        message: "Thiếu tiêu đề",
      });
    }
    if (!photos) {
      return res.json({
        status: 0,
        message: "Thiếu ảnh",
      });
    }
    let resImages = [];

    if (photos.length > 1) {
      for (let i = 0; i < photos.length; i++) {
        let photos_name = `${Date.now()}_` + photos[i].name.replace(/\s/g, "");
        let path = "./public/images/" + photos_name;

        photos[i].mv(path, (err) => {
          if (err) {
            return res.json(err);
          }
        });
        resImages.push(photos_name);
      }
    } else {
      let photo_name = `${Date.now()}_` + photos.name.replace(/\s/g, "");
      let path = "./public/images/" + photo_name;

      photos.mv(path, (err) => {
        if (err) {
          return res.json(err);
        }
      });

      resImages.push(photo_name);
    }

    const user = await User.findById(req.user._id);
    delete user.password;
    const postData = new Post({
      title,
      user_id: user._id.toString(),
      username: user.username,
      full_name: user.full_name,
      avatar: user.avatar,
      photos: resImages,
      created_at: new Date(),
    });
    await postData.save();

    res.json({
      status: 1,
      message: "Đăng tải bài viết thành công",
      data: {
        ...postData._doc,
      },
    });
  } catch (err) {
    res.json({
      status: 0,
      message: "Tải ảnh thất bại",
    });
  }
};


module.exports.getUserPhotos = (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit);
  const page = parseInt(req.query.page);
  const skip = (page - 1) * limit;
  
  try {
    Post.find({ user_id: userId, active: true }, { __v: 0 }).skip(skip).limit(limit).sort({created_at: 'desc'}).exec(
      (err, data) => {
        if (err) res.send(err);
        const returnedData = { data };
        const result = { ...returnedData };
        res.json({
          status: 1,
          message: "Lấy dữ liệu user thành công",
          ...result,
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.json({
      status: 0,
      message: "Lấy dữ liệu user thất bại",
    });
  }
};

module.exports.getTargetUserPhotos = (req, res) => {
  const userId = req.query.userId;
  const limit = parseInt(req.query.limit);
  const page = parseInt(req.query.page);
  const skip = (page - 1) * limit;
  try {
    Post.find({ user_id: userId, active: true }, { __v: 0 }).skip(skip).limit(limit).sort({created_at: 'desc'}).exec(
      (err, data) => {
        if (err) res.send(err);
        const returnedData = { data };
        const result = { ...returnedData };
        res.json({
          status: 1,
          message: "Lấy dữ liệu user thành công",
          ...result,
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.json({
      status: 0,
      message: "Lấy dữ liệu user thất bại",
    });
  }
};

module.exports.getAllPhotos = async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit);
  const page = parseInt(req.query.page);
  const skip = (page - 1) * limit;
  try {
    const followID = [];
    const userData = await User.findById({ _id: userId }, { __v: 0 });

    const follower = userData.following_list;
    follower.map((element) => {
      followID.push(element.user_id.toString());
    });
    followID.push(userId);

    Post.find({ user_id: followID, active: true }, { __v: 0 }).skip(skip).limit(limit).sort({created_at: 'desc'}).exec(
      (err, data) => {
        if (err) res.json(err);
        const returnData = { data };
        const result = { ...returnData };
        res.json({
          status: 1,
          message: "Lấy dữ liệu bài viết thành công",
          ...result,
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.json({
      status: 0,
      message: "Lấy dữ liệu bài viết thất bại",
    });
  }
};

module.exports.deletePhoto = async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo) {
      res.json({
        status: 0,
        message: "Thiếu dữ liệu",
      });
      return;
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      res.json({
        status: 0,
        message: "Không tìm thấy người dùng",
      });
      return;
    }
    const urls = [...user.photos];
    const index = urls.findIndex((url) => url === photo);
    if (index !== -1) {
      urls.splice(index, 1);
      const postData = {
        photos: urls,
      };
      const result = await User.findByIdAndUpdate(req.user._id, postData, {
        new: true,
      });
      const returnedUser = { ...result._doc };
      delete returnedUser.password;
      return res.json({
        status: 1,
        message: "Xóa ảnh thành công",
        data: returnedUser,
      });
    }
    return res.json({
      status: 0,
      message: "Không tìm thấy ảnh",
    });
  } catch (error) {
    res.json({
      status: 0,
      message: "Xóa ảnh thất bại",
    });
  }
};
