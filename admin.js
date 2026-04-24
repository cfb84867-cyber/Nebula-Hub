const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { adminKeyLimiter } = require('../middleware/rateLimit');
const AdminKey = require('../models/AdminKey');
const User = require('../models/User');
const AdminLog = require('../models/AdminLog');
const Game = require('../models/Game');
const { createLog } = require('../utils/audit');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/admin/claim-key — validate admin key & promote user
router.post('/claim-key', requireAuth, adminKeyLimiter, [
  body('key').notEmpty().withMessage('Admin key is required').isLength({ max: 200 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { key } = req.body;
  const user = req.user;

  // Already admin?
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'You already have admin privileges' });
  }

  try {
    await createLog({ userId: user._id, username: user.username, action: 'ADMIN_KEY_ATTEMPT', req, severity: 'warning' });

    const adminKey = await AdminKey.validateKey(key);

    if (!adminKey) {
      await createLog({ userId: user._id, username: user.username, action: 'ADMIN_KEY_FAIL', req, severity: 'critical' });
      logger.warn(`Failed admin key attempt by ${user.username} from ${req.ip}`);
      return res.status(401).json({ error: 'Invalid admin key' });
    }

    // Check if one-time and already used
    if (adminKey.isOneTime && adminKey.usedBy.length > 0) {
      return res.status(400).json({ error: 'This key has already been used' });
    }

    // Promote user to admin
    await User.findByIdAndUpdate(user._id, { $set: { role: 'admin' } });

    // Record usage
    await AdminKey.findByIdAndUpdate(adminKey._id, {
      $push: { usedBy: { userId: user._id, ip: req.ip } },
    });

    // Auto-revoke if one-time
    if (adminKey.isOneTime) {
      await AdminKey.findByIdAndUpdate(adminKey._id, { $set: { isRevoked: true, revokedAt: new Date() } });
    }

    await createLog({
      userId: user._id, username: user.username, action: 'ADMIN_KEY_SUCCESS',
      metadata: { keyLabel: adminKey.label }, req, severity: 'critical',
    });

    logger.info(`User ${user.username} successfully claimed admin via key "${adminKey.label}"`);
    res.json({ message: 'Admin privileges granted successfully', role: 'admin' });
  } catch (err) {
    logger.error('Admin key claim error:', err);
    res.status(500).json({ error: 'Failed to process admin key' });
  }
});

// GET /api/admin/users — list all users
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const query = {};
    if (search) query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (role) query.role = role;

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);
    await createLog({ userId: req.user._id, username: req.user.username, action: 'ADMIN_PANEL_VIEW', metadata: { section: 'users' }, req });
    res.json({ users: users.map(u => u.toSafeObject()), total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id/role — change user role
router.patch('/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ error: 'Cannot change your own role' });

    const user = await User.findByIdAndUpdate(req.params.id, { $set: { role } }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await createLog({ userId: req.user._id, username: req.user.username, action: 'USER_ROLE_CHANGED', metadata: { targetUser: user.username, newRole: role }, req });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// PATCH /api/admin/users/:id/ban — ban or unban user
router.patch('/users/:id/ban', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { banned, reason = '' } = req.body;
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ error: 'Cannot ban yourself' });

    const user = await User.findByIdAndUpdate(req.params.id, {
      $set: { isBanned: banned, banReason: banned ? reason : null },
    }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const action = banned ? 'USER_BANNED' : 'USER_UNBANNED';
    await createLog({ userId: req.user._id, username: req.user.username, action, metadata: { targetUser: user.username, reason }, req, severity: 'warning' });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ban status' });
  }
});

// GET /api/admin/keys — list admin keys (without hashes)
router.get('/keys', requireAuth, requireAdmin, async (req, res) => {
  try {
    const keys = await AdminKey.find().populate('usedBy.userId', 'username').populate('revokedBy', 'username');
    res.json({ keys });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch keys' });
  }
});

// POST /api/admin/keys — create new admin key (hash stored, plaintext returned ONCE)
router.post('/keys', requireAuth, requireAdmin, [
  body('label').notEmpty().isLength({ max: 100 }),
  body('role').optional().isIn(['user', 'admin']),
  body('isOneTime').optional().isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { label, role = 'user', isOneTime = false } = req.body;
    // Generate a secure random key
    const crypto = require('crypto');
    const plainKey = `NEBULA-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
    const keyHash = await AdminKey.hashKey(plainKey);

    const adminKey = await AdminKey.create({ keyHash, label, role, isOneTime });
    
    // LOG TO FILE
    await AdminKey.logToFile(plainKey, label, role);

    await createLog({ userId: req.user._id, username: req.user.username, action: 'ADMIN_KEY_SUCCESS', metadata: { label, role, isOneTime }, req, severity: 'critical' });

    res.status(201).json({
      message: 'Access key created and saved to Keys folder.',
      plainKey, 
      key: { id: adminKey._id, label, role, isOneTime, createdAt: adminKey.createdAt },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create key' });
  }
});

// DELETE /api/admin/keys/:id — revoke a key
router.delete('/keys/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const key = await AdminKey.findByIdAndUpdate(req.params.id, {
      $set: { isRevoked: true, revokedAt: new Date(), revokedBy: req.user._id },
    }, { new: true });
    if (!key) return res.status(404).json({ error: 'Key not found' });

    await createLog({ userId: req.user._id, username: req.user.username, action: 'ADMIN_KEY_REVOKED', metadata: { keyLabel: key.label }, req, severity: 'critical' });
    res.json({ message: 'Key revoked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke key' });
  }
});

// GET /api/admin/logs — paginated audit logs
router.get('/logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action = '', severity = '' } = req.query;
    const query = {};
    if (action) query.action = action;
    if (severity) query.severity = severity;

    const logs = await AdminLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('userId', 'username');

    const total = await AdminLog.countDocuments(query);
    await createLog({ userId: req.user._id, username: req.user.username, action: 'ADMIN_PANEL_VIEW', metadata: { section: 'logs' }, req });
    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /api/admin/stats — system stats
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, adminUsers, totalGames, activeGames, totalLogs, recentLogs] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Game.countDocuments(),
      Game.countDocuments({ isActive: true }),
      AdminLog.countDocuments(),
      AdminLog.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'username'),
    ]);

    const topGames = await Game.find({ isActive: true }).sort({ playCount: -1 }).limit(5).select('title playCount category');

    await createLog({ userId: req.user._id, username: req.user.username, action: 'STATS_VIEW', req });
    res.json({ totalUsers, adminUsers, totalGames, activeGames, totalLogs, recentLogs, topGames });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
