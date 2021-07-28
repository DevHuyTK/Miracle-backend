const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
    photos: Array,
    create_at: Date
});

const Photo = mongoose.model('Photo', PhotoSchema);

module.exports = Photo;