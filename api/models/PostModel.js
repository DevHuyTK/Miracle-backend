const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
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
    default: true,
  },
});

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
