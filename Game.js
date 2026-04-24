const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Game title is required'],
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  url: {
    type: String,
    required: [true, 'Game URL is required'],
    trim: true,
  },
  thumbnailUrl: {
    type: String,
    trim: true,
    default: null,
  },
  category: {
    type: String,
    enum: ['action', 'puzzle', 'strategy', 'arcade', 'rpg', 'sports', 'other'],
    default: 'other',
  },
  tags: [{ type: String, lowercase: true, trim: true }],
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  playCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
}, {
  timestamps: true,
});

gameSchema.index({ title: 'text', description: 'text', tags: 'text' });
gameSchema.index({ category: 1, isActive: 1 });
gameSchema.index({ isFeatured: 1, isActive: 1 });

module.exports = mongoose.model('Game', gameSchema);
