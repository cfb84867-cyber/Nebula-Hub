/**
 * Seed script — populates the database with initial data:
 * - Default admin key (plaintext printed to console)
 * - Sample games
 *
 * Run: node utils/seed.js
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const AdminKey = require('../models/AdminKey');
const Game = require('../models/Game');
const User = require('../models/User');
const logger = require('./logger');

const SAMPLE_GAMES = [
  {
    title: '2048',
    description: 'Combine tiles to reach 2048. A classic number puzzle game.',
    url: 'https://play2048.co/',
    thumbnailUrl: 'https://play2048.co/favicon.ico',
    category: 'puzzle',
    tags: ['numbers', 'casual', 'classic'],
    isFeatured: true,
  },
  {
    title: 'Wordle',
    description: 'Guess the hidden word in 6 tries. A daily word puzzle.',
    url: 'https://www.nytimes.com/games/wordle/index.html',
    thumbnailUrl: 'https://www.nytimes.com/games/wordle/favicon.ico',
    category: 'puzzle',
    tags: ['words', 'daily', 'classic'],
    isFeatured: true,
  },
  {
    title: 'Chess.com',
    description: 'Play chess against the computer or other players online.',
    url: 'https://www.chess.com/play/computer',
    thumbnailUrl: 'https://www.chess.com/favicon.ico',
    category: 'strategy',
    tags: ['chess', 'strategy', 'multiplayer'],
    isFeatured: true,
  },
  {
    title: 'Tetris',
    description: 'The original block-stacking game. Clear lines to survive!',
    url: 'https://tetris.com/play-tetris',
    thumbnailUrl: 'https://tetris.com/favicon.ico',
    category: 'arcade',
    tags: ['classic', 'arcade', 'blocks'],
  },
  {
    title: 'Slither.io',
    description: 'Grow your snake by eating dots. Avoid other players!',
    url: 'https://slither.io/',
    thumbnailUrl: 'https://slither.io/favicon.ico',
    category: 'action',
    tags: ['snake', 'multiplayer', 'io'],
  },
  {
    title: 'Agar.io',
    description: 'Eat smaller cells and grow. A massive multiplayer game.',
    url: 'https://agar.io/',
    thumbnailUrl: 'https://agar.io/favicon.ico',
    category: 'action',
    tags: ['multiplayer', 'io', 'casual'],
  },
  {
    title: 'Sudoku',
    description: 'Classic number placement puzzle. Multiple difficulty levels.',
    url: 'https://sudoku.com/',
    thumbnailUrl: 'https://sudoku.com/favicon.ico',
    category: 'puzzle',
    tags: ['numbers', 'logic', 'classic'],
  },
  {
    title: 'Geoguessr',
    description: 'Guess where in the world you are from Street View imagery.',
    url: 'https://www.geoguessr.com/',
    thumbnailUrl: 'https://www.geoguessr.com/favicon.ico',
    category: 'strategy',
    tags: ['geography', 'maps', 'knowledge'],
    isFeatured: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nebulahub');
    logger.info('Connected to MongoDB for seeding...');

    // --- Admin Key ---
    const existingKeys = await AdminKey.countDocuments();
    if (existingKeys === 0) {
      const plainKey = 'NEBULA-ADMIN-51DAD8DCC6BFA1104EDBB405';
      const keyHash = await AdminKey.hashKey(plainKey);

      await AdminKey.create({
        keyHash,
        label: 'Master Admin Key (seeded)',
        role: 'admin',
        isOneTime: false,
      });

      // Log it to the file immediately
      await AdminKey.logToFile(plainKey, 'Master Admin Key (seeded)', 'admin');

      console.log('\n╔═══════════════════════════════════════════════════════════╗');
      console.log('║              🔑 ADMIN KEY SEEDED                         ║');
      console.log('╠═══════════════════════════════════════════════════════════╣');
      console.log(`║  ${plainKey.padEnd(57)}║`);
      console.log('╠═══════════════════════════════════════════════════════════╣');
      console.log('║  ✅ This key has been saved to server/Keys/keys_log.txt  ║');
      console.log('║  Use this key as your "Login Key" on the login page.    ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');
    }
 else {
      logger.info('Admin keys already exist — skipping key seed');
    }

    // --- Games ---
    const existingGames = await Game.countDocuments();
    if (existingGames === 0) {
      // Create a system user for seeded games
      let systemUser = await User.findOne({ username: 'system' });
      if (!systemUser) {
        systemUser = new User({ username: 'system', email: 'system@nebulahub.local', role: 'admin' });
        await systemUser.setPassword(`SysPass_${Date.now()}`);
        await systemUser.save();
      }

      const gamesWithUser = SAMPLE_GAMES.map(g => ({ ...g, addedBy: systemUser._id }));
      await Game.insertMany(gamesWithUser);
      logger.info(`✅ Seeded ${SAMPLE_GAMES.length} games`);
    } else {
      logger.info(`Games already exist (${existingGames}) — skipping game seed`);
    }

    logger.info('✅ Seed complete!');
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
