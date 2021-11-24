const Post = require("../models/PostModel");

//GET ALL COMMENTS IN POST
module.exports.getPostComments = async (req, res) => {
	const postId = req.params.postId;
	try {
		Post.findById({ _id: postId, active: true }, { __v: 0 }).exec(
			(err, data) => {
				if (err) res.send(err);
				const returnedData = { data };
				const result = { ...returnedData };
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
