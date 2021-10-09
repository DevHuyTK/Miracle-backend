const User = require("../models/UserModel");
const Chat = require("../models/ChatModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports.index = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({
        status: 0,
        message: "Không tìm thấy người dùng",
      });
    }
    const returnedMatchingList = await Promise.all(
      [...user.matching_list].map(async (item) => {
        const unique = [user._id.toString(), item._id.toString()].sort((a, b) =>
          a < b ? -1 : 1
        );
        const roomId = `${unique[0]}-${unique[1]}`;
        const message = await Chat.findOne(
          { room_id: roomId },
          {},
          { sort: { created_at: -1 } }
        );

        if (message) {
          return {
            ...item,
            had_message: true,
            message,
          };
        } else {
          return {
            ...item,
            had_message: false,
          };
        }
      })
    );
    const returnedUser = { ...user._doc };
    delete returnedUser.password;
    res.json({
      status: 1,
      message: "Thành công",
      data: {
        ...returnedUser,
        matching_list: returnedMatchingList,
      },
    });
  } catch (error) {
    return res.json({
      status: 0,
      message: "Không tìm thấy người dùng",
    });
  }
};

module.exports.createUser = async (req, res) => {
  const { username, password, full_name, confirmPassword, gender } = req.body;
  if (
    !username ||
    !password ||
    !full_name ||
    !confirmPassword ||
    gender === null
  ) {
    return res.json({
      status: 0,
      message: "Thiếu thông tin",
    });
  }
  if (
    gender !== null &&
    gender !== undefined &&
    parseInt(gender) !== 1 &&
    parseInt(gender) !== 0
  ) {
    res.json({
      status: 0,
      message: "Giới tính không hợp lệ",
    });
    return;
  }
  const usernameExist = await User.findOne({ username, username });
  if (username.length < 6 || password.length < 6) {
    return res.json({
      status: 0,
      message: "Tài Khoản và Mật Khẩu phải có ít nhất 6 ký tự",
    });
  }
  if (usernameExist) {
    return res.json({
      status: 0,
      message: "Tài khoản đã có người đăng ký",
    });
  }
  if (password !== confirmPassword) {
    return res.json({
      status: 0,
      message: "Mật Khẩu và Xác Nhận Mật Khẩu không trùng khớp",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  //Create new User
  const user = new User({
    username,
    full_name,
    gender,
    password: hashPassword,
  });
  try {
    await user.save();
    res.json({
      status: 1,
      message: "Đăng ký thành công",
    });
  } catch {
    res.json({
      status: 0,
      message: "Lỗi không xác định",
    });
  }
};

//LOGIN
module.exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({
        status: 0,
        message: "Thiếu thông tin",
      });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({
        status: 0,
        message: "Không tìm thấy tài khoản",
      });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.json({
        status: 0,
        message: "Mật khẩu không chính xác",
      });
    }
    const token = jwt.sign(
      { _id: user._id },
      process.env.TOKEN_SECRET || "super_cool_secret",
      {
        expiresIn: "1d",
      }
    );
    const returnedUser = { ...user._doc };
    delete returnedUser.password;

    return res.json({
      status: 1,
      token,
      user: {
        ...returnedUser,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({
      status: 0,
      message: "Lỗi không xác định",
    });
  }
};

//GET ALL USER
module.exports.getUsers = async (req, res) => {
  try {
    User.find({ active: true }, { __v: 0, password: 0 }).exec((err, data) => {
      if (err) res.send(err);
      const returnedData = { data };
      const result = { ...returnedData };
      res.json({
        status: 1,
        message: "Lấy dữ liệu thành công",
        ...result,
      });
    });
  } catch (error) {
    console.log(error);
    res.json({
      status: 0,
      message: "Lấy dữ liệu thất bại",
    });
  }
};

//GET ONE USER 
module.exports.getOneUser = async (req, res) => {
  const userId = req.query.userId;
  try {
    User.findById({ _id: userId, active: true }, { __v: 0 }).exec(
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

//UPDATE USER
module.exports.updateUser = async (req, res) => {
  try {
    const data = req.body;
    const { email, phone, full_name, age, address, gender, description } = data;
    if (
      gender !== null &&
      gender !== undefined &&
      parseInt(gender) !== 1 &&
      parseInt(gender) !== 0
    ) {
      res.json({
        status: 0,
        message: "Giới tính không hợp lệ",
      });
      return;
    }
    const user = await User.findById(req.user._id);
    const postData = {
      email: email || user.email,
      phone: phone || user.phone,
      age: age || user.age,
      address: address || user.address,
      full_name: full_name || user.full_name,
      description: description || user.description,
      gender:
        gender !== undefined && gender !== null
          ? parseInt(gender)
          : user.gender,
    };
    const result = await User.findByIdAndUpdate(req.user._id, postData);
    const returnedUser = { ...result._doc };
    delete returnedUser.password;
    res.json({
      status: 1,
      message: "Cập nhật tài khoản thành công",
      data: {
        ...returnedUser,
        ...postData,
      },
    });
  } catch (err) {
    console.log(err);
    res.json({
      status: 0,
      message: "Cập nhật tài khoản thất bại",
    });
  }
};


//CHANGE PASSWORD
module.exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password, confirm_password } = req.body;
    if (!old_password || !new_password || !confirm_password) {
      return res.json({
        status: 0,
        message: "Thiếu thông tin",
      });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({
        status: 0,
        message: "Không tìm thấy tài khoản",
      });
    }
    const validPassword = await bcrypt.compare(old_password, user.password);
    if (!validPassword) {
      return res.json({
        status: 0,
        message: "Mật khẩu cũ không chính xác",
      });
    }
    if (new_password !== confirm_password) {
      return res.json({
        status: 0,
        message: "Mật Khẩu Mới và Xác Nhận Mật Khẩu Mới không trùng khớp",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(new_password, salt);
    const postData = {
      password: hashPassword,
    };
    await User.findByIdAndUpdate(req.user._id, postData);
    return res.json({
      status: 1,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    res.json({
      status: 0,
      message: "Đổi mật khẩu thất bại",
    });
  }
};

//DELETE USER(ROLE: MEMBER)
module.exports.deleteUser = async (req, res) => {
  const info = await User.findOneAndUpdate(req.params.id, { active: false });
  res.json({ message: "Delete User Success", info });
};

//DELETE USER(ROLE: ADMIN)
module.exports.deleteUserAdmin = async (req, res) => {
  const info = await User.findOneAndDelete(req.params.id);
  res.json({ message: "ADMIN Delete User Success" });
};
