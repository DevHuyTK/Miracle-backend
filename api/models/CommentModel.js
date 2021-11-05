const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    user_id: String,
    username: String,
    full_name: String,
    comment: String,
    avatar: String,
    create_at: Date
});

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;