const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: String,
	full_name: String,
	password: String,
	age: String,
	date: {
		type: Date,
		default: Date.now,
	},
	active: {
		type: Boolean,
		default: true,
	},
	avatar: String,
	create_at: Date,
	role: {
		type: String,
		default: "member",
	},
	follower_list: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Follower",
		},
	],
	following_list: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Following",
		},
	],
	address: String,
	gender: Number,
	email: String,
	phone: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
