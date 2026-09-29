const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    points: { type: String, required: true },
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('leaderboardSchema', leaderboardSchema);