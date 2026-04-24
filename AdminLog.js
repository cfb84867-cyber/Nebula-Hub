const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  username: { type: String, default: 'anonymous' },
  action: {
    type: String,
    required: true,
    enum: [
      'ADMIN_KEY_ATTEMPT',
      'ADMIN_KEY_SUCCESS',
      'ADMIN_KEY_FAIL',
      'ADMIN_KEY_REVOKED',
      'USER_BANNED',
      'USER_UNBANNED',
      'USER_ROLE_CHANGED',
      'GAME_ADDED',
      'GAME_REMOVED',
      'GAME_UPDATED',
      'APP_TOGGLED',
      'LOGIN',
      'LOGOUT',
      'REGISTER',
      'ADMIN_PANEL_VIEW',
      'STATS_VIEW',
    ],
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ip: { type: String, default: null },
  userAgent: { type: String, default: null },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
  },
}, {
  timestamps: true,
});

// Index for fast querying by user and action
adminLogSchema.index({ userId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);
