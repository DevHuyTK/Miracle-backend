const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema({
	title: String,
	created_at: Date,
	user_id: String,
	photos: Array,
	like_count: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Like",
		},
	],
	comment: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment",
		},
	],
  active: {
    type: Boolean,
    default: true
  }
});

const Content = mongoose.model("Content", ContentSchema);

module.exports = Content;
