const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/favorites — get current user's favorite games
router.get('/favorites', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favoriteGames');
    res.json({ favorites: user.favoriteGames });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// GET /api/users/profile — get own profile
router.get('/profile', requireAuth, (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

// PATCH /api/users/avatar — update avatar URL
router.patch('/avatar', requireAuth, async (req, res) => {
  try {
    const { avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar } },
      { new: true }
    );
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

module.exports = router;
