const mongoose = require('mongoose');

const FollowerSchema = new mongoose.Schema({
    user_id: String,
    full_name: String,
    avatar: String,
    create_at: Date
});

const Comment = mongoose.model('Follower', FollowerSchema);

module.exports = Comment;