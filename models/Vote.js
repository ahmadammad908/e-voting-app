const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidate: {
    type: String,
    required: true,
    enum: ['Ahmad Ammad', 'Saad Jawad']
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one vote per user
voteSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);