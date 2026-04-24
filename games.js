const express = require('express');
const { body, validationResult } = require('express-validator');
const Game = require('../models/Game');
const User = require('../models/User');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');
const { createLog } = require('../utils/audit');

const router = express.Router();

// GET /api/games — list active games (public, with optional auth for favorites)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, featured, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (category && category !== 'all') query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (search) query.$text = { $search: search };

    const games = await Game.find(query)
      .sort({ isFeatured: -1, playCount: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('addedBy', 'username');

    const total = await Game.countDocuments(query);

    // Attach favorites if authenticated
    let favoriteIds = [];
    if (req.user) {
      const user = await User.findById(req.user._id).select('favoriteGames');
      favoriteIds = user.favoriteGames.map(id => id.toString());
    }

    const gamesWithFavorite = games.map(g => ({
      ...g.toObject(),
      isFavorited: favoriteIds.includes(g._id.toString()),
    }));

    res.json({ games: gamesWithFavorite, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// GET /api/games/:id — single game
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).populate('addedBy', 'username');
    if (!game || !game.isActive) return res.status(404).json({ error: 'Game not found' });
    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// POST /api/games — admin only, add game
router.post('/', requireAuth, requireAdmin, [
  body('title').trim().notEmpty().isLength({ max: 100 }),
  body('url').trim().isURL().withMessage('Valid URL required'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category').optional().isIn(['action', 'puzzle', 'strategy', 'arcade', 'rpg', 'sports', 'other']),
  body('tags').optional().isArray(),
  body('thumbnailUrl').optional().trim(),
  body('isFeatured').optional().isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, url, description, category, tags, thumbnailUrl, isFeatured } = req.body;
    const game = await Game.create({
      title, url, description, category, tags, thumbnailUrl, isFeatured,
      addedBy: req.user._id,
    });

    await createLog({ userId: req.user._id, username: req.user.username, action: 'GAME_ADDED', metadata: { title, url }, req });
    res.status(201).json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add game' });
  }
});

// PATCH /api/games/:id — admin only, update game
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allowed = ['title', 'description', 'url', 'thumbnailUrl', 'category', 'tags', 'isActive', 'isFeatured'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const game = await Game.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    await createLog({ userId: req.user._id, username: req.user.username, action: 'GAME_UPDATED', metadata: { gameId: req.params.id, updates }, req });
    res.json({ game });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// DELETE /api/games/:id — admin only, soft delete
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, { $set: { isActive: false } }, { new: true });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    await createLog({ userId: req.user._id, username: req.user.username, action: 'GAME_REMOVED', metadata: { title: game.title }, req });
    res.json({ message: 'Game removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove game' });
  }
});

// POST /api/games/:id/play — increment play count
router.post('/:id/play', optionalAuth, async (req, res) => {
  try {
    await Game.findByIdAndUpdate(req.params.id, { $inc: { playCount: 1 } });
    res.json({ message: 'Play recorded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record play' });
  }
});

// POST /api/games/:id/favorite — toggle favorite (authenticated)
router.post('/:id/favorite', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('favoriteGames');
    const gameId = req.params.id;
    const isFav = user.favoriteGames.some(id => id.toString() === gameId);

    const update = isFav
      ? { $pull: { favoriteGames: gameId } }
      : { $addToSet: { favoriteGames: gameId } };

    await User.findByIdAndUpdate(req.user._id, update);
    res.json({ favorited: !isFav });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

module.exports = router;
