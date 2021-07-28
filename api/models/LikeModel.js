const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
    user_id: String,
    full_name: String,
    avatar: String,
    create_at: Date
});

const Like = mongoose.model('Like', LikeSchema);

module.exports = Like;