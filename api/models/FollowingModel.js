const mongoose = require('mongoose');

const FollowingSchema = new mongoose.Schema({
    user_id: String,
    full_name: String,
    avatar: String,
    create_at: Date
});

const Following = mongoose.model('Following', FollowingSchema);

module.exports = Following;