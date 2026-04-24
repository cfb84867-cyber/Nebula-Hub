const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Command patterns — parsed before sending to AI
const COMMAND_PATTERNS = [
  { pattern: /open\s+(?:a\s+)?new\s+tab/i, action: 'OPEN_TAB', params: {} },
  { pattern: /close\s+(?:this\s+)?tab/i, action: 'CLOSE_TAB', params: {} },
  { pattern: /search\s+(?:for\s+)?(.+)/i, action: 'SEARCH', paramKey: 'query' },
  { pattern: /launch\s+(?:game\s+)?(.+)/i, action: 'LAUNCH_GAME', paramKey: 'gameName' },
  { pattern: /open\s+(.+)\s+app/i, action: 'OPEN_APP', paramKey: 'appName' },
  { pattern: /go\s+to\s+(?:the\s+)?(.+)/i, action: 'NAVIGATE', paramKey: 'destination' },
  { pattern: /open\s+(?:the\s+)?(?:admin|admin panel)/i, action: 'NAVIGATE', params: { destination: 'admin' } },
  { pattern: /(?:toggle|switch)\s+(?:dark|light)\s+mode/i, action: 'TOGGLE_THEME', params: {} },
  { pattern: /open\s+(?:the\s+)?notes/i, action: 'OPEN_APP', params: { appName: 'notes' } },
  { pattern: /open\s+(?:the\s+)?calculator/i, action: 'OPEN_APP', params: { appName: 'calculator' } },
  { pattern: /open\s+(?:the\s+)?(?:todo|to-do)/i, action: 'OPEN_APP', params: { appName: 'todo' } },
];

const parseCommand = (message) => {
  for (const { pattern, action, paramKey, params } of COMMAND_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const result = { action, params: { ...params } };
      if (paramKey && match[1]) result.params[paramKey] = match[1].trim();
      return result;
    }
  }
  return null;
};

// POST /api/ai/chat
router.post('/chat', requireAuth, aiLimiter, [
  body('message').trim().notEmpty().isLength({ max: 2000 }).withMessage('Message required (max 2000 chars)'),
  body('context').optional().isObject(),
  body('history').optional().isArray({ max: 20 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { message, context = {}, history = [] } = req.body;

  // Parse command first (no API needed)
  const command = parseCommand(message);

  // System prompt with context awareness
  const systemPrompt = `You are Nova, the AI assistant for Nebula Hub — a browser-based productivity and entertainment platform.
You help users navigate the app, search the web, launch games, manage tabs, and use built-in tools.

Current context:
- Active tab: ${context.activeTabType || 'home'}
- User: ${req.user.username} (role: ${req.user.role})
- Time: ${new Date().toLocaleString()}

Available apps: Notes, Calculator, Todo List
Available actions you can trigger: open tab, close tab, search for [query], launch game [name], open [app] app, navigate to [section], toggle dark/light mode.

When users ask you to perform an action, confirm you're doing it and be concise. Keep responses under 150 words unless detail is needed.`;

  try {
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      // Fallback: rule-based responses if no API key
      const fallbackResponse = generateFallbackResponse(message, command, req.user);
      return res.json({ message: fallbackResponse, command, provider: 'fallback' });
    }

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenAI API error');

    const aiMessage = data.choices[0]?.message?.content || 'I could not process that request.';
    res.json({ message: aiMessage, command, provider: 'openai' });
  } catch (err) {
    // Graceful fallback
    const fallbackResponse = generateFallbackResponse(message, command, req.user);
    res.json({ message: fallbackResponse, command, provider: 'fallback', error: err.message });
  }
});

// Rule-based fallback when no OpenAI key is configured
function generateFallbackResponse(message, command, user) {
  if (command) {
    switch (command.action) {
      case 'OPEN_TAB': return "Opening a new tab for you! 🚀";
      case 'CLOSE_TAB': return "Closing the current tab.";
      case 'SEARCH': return `Searching for "${command.params.query}"...`;
      case 'LAUNCH_GAME': return `Launching ${command.params.gameName || 'the game'}! 🎮`;
      case 'OPEN_APP': return `Opening ${command.params.appName || 'the app'}! 📱`;
      case 'NAVIGATE': return `Navigating to ${command.params.destination}...`;
      case 'TOGGLE_THEME': return "Toggling theme! 🌙";
      default: return `Executing ${command.action}...`;
    }
  }

  const lower = message.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi')) {
    return `Hey ${user.username}! 👋 I'm Nova, your Nebula Hub assistant. I can help you open tabs, search the web, launch games, or use apps. What would you like to do?`;
  }
  if (lower.includes('help')) {
    return `Here's what I can do:\n• **Open/close tabs** — "open a new tab"\n• **Search** — "search for cats"\n• **Games** — "launch Snake"\n• **Apps** — "open calculator"\n• **Navigate** — "go to admin panel"\n\nJust ask!`;
  }
  if (lower.includes('games')) {
    return "Head to the Game Hub to browse all available games! You can also say 'launch [game name]' to open one directly.";
  }
  return "I'm Nova, your Nebula Hub assistant. I can help you navigate the app, search, launch games, and more. Try saying 'open a new tab' or 'search for JavaScript tutorials'!";
}

module.exports = router;
