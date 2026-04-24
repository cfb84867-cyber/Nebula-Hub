const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminKeySchema = new mongoose.Schema({
  keyHash: {
    type: String,
    required: true,
    unique: true,
    select: false, // Never returned in queries by default
  },
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
  isOneTime: {
    type: Boolean,
    default: false,
  },
  usedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now },
    ip: String,
  }],
  revokedAt: { type: Date, default: null },
  revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  expiresAt: { type: Date, default: null },
}, {
  timestamps: true,
});

// Static: hash a plaintext key
adminKeySchema.statics.hashKey = async function (plaintext) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plaintext, salt);
};

// Static: validate a plaintext key against all active keys
adminKeySchema.statics.validateKey = async function (plaintext) {
  // Fetch all non-revoked, non-expired keys (with hash)
  const keys = await this.find({
    isRevoked: false,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).select('+keyHash');

  for (const key of keys) {
    const match = await bcrypt.compare(plaintext, key.keyHash);
    if (match) return key;
  }
  return null;
};

// Static: Log key to physical file
adminKeySchema.statics.logToFile = async function (plainKey, label, role) {
  const fs = require('fs');
  const path = require('path');
  const logPath = path.join(__dirname, '../Keys/keys_log.txt');
  const entry = `[${new Date().toISOString()}] KEY: ${plainKey} | ROLE: ${role} | LABEL: ${label}\n`;
  
  try {
    fs.appendFileSync(logPath, entry);
  } catch (err) {
    console.error('Failed to log key to file:', err);
  }
};

module.exports = mongoose.model('AdminKey', adminKeySchema);
