const mongoose = require('mongoose');

// First, define the schema and assign it to a variable
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  status: { type: String, required: true },
  can_post: { type: String, enum: ['yes', 'no'], default: 'no' },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Export the Mongoose model
module.exports = mongoose.model('Post', postSchema);
