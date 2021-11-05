const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  message: String,
  created_at: String,
  user_post: Object,
  user_id: String,
  room_id: String,
  is_seen: Boolean
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;