const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    user_id: String,
    full_name: String,
    text: String,
    avatar: String,
    create_at: Date
});

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;