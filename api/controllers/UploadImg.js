const User = require("../models/UserModel");
const Post = require("../models/PostModel");
const moment = require("moment");

//UPLOAD IMAGES INTO SERVER
module.exports.uploadPhoto = async (req, res) => {
	try {
		const photos = req.files.photo;
		const title = req.body.title;
		res.json({
			photos: photos,
			title: title,
		});
		if(!title){
			return res.json({
				status: 0,
				message: "Thiếu tiêu đề"
			})
		}
		let resImages = [];

		let photos_name = `_${Date.now()}_` + photos[i].name.replace(/\s/g, "");
		for (let i = 0; i < photos.length; i++) {
			let path = "./public/images/" + photo_name;

			photos[i].mv(path, (err) => {
				if (err) {
					return res.json(err);
				}
			});
			resImages.push(photos_name);
		}
		
		const postData = new Post({
			title,
			user_id: req.user._id.toString(),
			photos: resImages,
		});

		const result = await Post.findByIdAndUpdate(req.user._id, postData);
		const returnedUser = { ...result._doc };
		delete returnedUser.photos;
		res.json({
			status: 1,
			message: "Tải ảnh thành công",
			data: {
				...returnedUser,
				...postData,
			},
		});
		// if (images.length > 1) {
		// 	let photos_name =
		// 		`_${Date.now()}_` + images[i].name.replace(/\s/g, "");
		// 	for (let i = 0; i < images.length; i++) {
		// 		let path = "./public/images/" + photo_name;

		// 		images[i].mv(path, (err) => {
		// 			if (err) {
		// 				return res.json(err);
		// 			}
		// 		});
		// 		resImages.push(photos_name);
		// 	}
		// 	const postData = {
		// 		photos: resImages,
		// 	};

		// 	const result = await User.findByIdAndUpdate(req.user._id, postData);
		// 	const returnedUser = { ...result._doc };
		// 	delete returnedUser.password;
		// 	delete returnedUser.photos;
		// 	res.json({
		// 		status: 1,
		// 		message: "Tải ảnh thành công",
		// 		data: {
		// 			...returnedUser,
		// 			...postData,
		// 		},
		// 	});
		// } else {
		// 	let photo_name = `${Date.now()}_` + images.name.replace(/\s/g, "");
		// 	let path = "./public/images/" + photo_name;

		// 	images.mv(path, (err) => {
		// 		if (err) {
		// 			return res.json(err);
		// 		}
		// 	});
		// 	resImages.push(photo_name);
		// 	const postData = {
		// 		photos: resImages,
		// 	};

		// 	const result = await User.findByIdAndUpdate(req.user._id, postData);
		// 	const returnedUser = { ...result._doc };
		// 	delete returnedUser.password;
		// 	delete returnedUser.photos;
		// 	res.json({
		// 		status: 1,
		// 		message: "Tải ảnh thành công",
		// 		data: {
		// 			...returnedUser,
		// 			...postData,
		// 		},
		// 	});
		// }
	} catch (err) {
		res.json({
			status: 0,
			message: "Tải ảnh thất bại",
		});
	}
};

//UPLOAD AVATAR
module.exports.uploadAvatar = async (req, res) => {
	try {
		const images = req.files.avatar;
		let avatar = `${Date.now()}_` + images.name.replace(/\s/g, "");

		let path = "./public/images/" + avatar;
		var currentDate = moment().format("DD-MM-YYYY");
		if (images) {
			const postData = {
				avatar: avatar,
				create_at: Date.now(),
			};
			const result = await User.findByIdAndUpdate(
				req.user._id,
				postData,
				{ new: true }
			);
			const returnedUser = { ...result._doc };
			delete returnedUser.password;
			res.json({
				status: 1,
				message: "Cập nhật ảnh đại diện thành công",
				data: {
					...returnedUser,
					...postData,
				},
			});
			images.mv(path, (err) => {
				if (err) {
					return res.json(err);
				}
			});
		} else {
			res.json({
				status: 0,
				message: "Cập nhật ảnh đại diện thất bại",
			});
		}
	} catch (err) {
		res.json({
			status: 0,
			message: "Cập nhật ảnh đại diện thất bại",
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
			const result = await User.findByIdAndUpdate(
				req.user._id,
				postData,
				{ new: true }
			);
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
