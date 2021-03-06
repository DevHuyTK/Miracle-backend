const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
	title: String,
	created_at: String,
	user_id: String,
	username: String,
	full_name: String,
	avatar: String,
	photos: Array,
	like_count: Array,
	comments: Array,
	active: {
		type: Boolean,
		default: true,
	},
});

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
