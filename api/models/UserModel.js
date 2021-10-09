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
	create_at: String,
	role: {
		type: String,
		default: "member",
	},
	follower_list: Array,
	following_list: Array,
	matching_list: Array,
	address: String,
	gender: Number,
	email: String,
	phone: String,
	description: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
