const express = require('express');
const fetch = require('node-fetch');
const { searchLimiter } = require('../middleware/rateLimit');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Unified result format
const formatDDGResult = (r) => ({
  title: r.Text || r.FirstURL,
  url: r.FirstURL,
  snippet: r.Text,
  source: 'ddg',
});

const formatGoogleResult = (r) => ({
  title: r.title,
  url: r.link,
  snippet: r.snippet,
  thumbnail: r.pagemap?.cse_thumbnail?.[0]?.src || null,
  source: 'google',
});

// GET /api/search?q=...&provider=ddg|google
router.get('/', optionalAuth, searchLimiter, async (req, res) => {
  const { q, provider = 'ddg', page = 1 } = req.query;
  if (!q || q.trim().length === 0) return res.status(400).json({ error: 'Search query required' });

  try {
    if (provider === 'google') {
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

      if (!apiKey || !engineId) {
        return res.status(503).json({ error: 'Google Search not configured. Use DuckDuckGo instead.' });
      }

      const start = (Number(page) - 1) * 10 + 1;
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(q)}&start=${start}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) return res.status(502).json({ error: data.error.message });

      const results = (data.items || []).map(formatGoogleResult);
      res.json({
        results,
        total: data.searchInformation?.totalResults || results.length,
        provider: 'google',
        query: q,
      });
    } else {
      // DuckDuckGo Instant Answer API (no key needed)
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
      const response = await fetch(url, { headers: { 'User-Agent': 'NebulaHub/1.0' } });
      const data = await response.json();

      const results = [];

      // Abstract (main result)
      if (data.AbstractText) {
        results.push({
          title: data.Heading,
          url: data.AbstractURL,
          snippet: data.AbstractText,
          thumbnail: data.Image ? `https://duckduckgo.com${data.Image}` : null,
          source: 'ddg',
          type: 'abstract',
        });
      }

      // Related topics
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, 8)) {
          if (topic.Text && topic.FirstURL) {
            results.push(formatDDGResult(topic));
          }
        }
      }

      // Answer box
      if (data.Answer) {
        results.unshift({
          title: 'Quick Answer',
          url: null,
          snippet: data.Answer,
          source: 'ddg',
          type: 'answer',
        });
      }

      // If no DDG results, return search URL for fallback
      if (results.length === 0) {
        return res.json({
          results: [],
          fallbackUrl: `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
          provider: 'ddg',
          query: q,
          noResults: true,
        });
      }

      res.json({ results, provider: 'ddg', query: q, total: results.length });
    }
  } catch (err) {
    res.status(502).json({ error: 'Search service unavailable', details: err.message });
  }
});

// GET /api/search/suggestions?q=... — autocomplete
router.get('/suggestions', searchLimiter, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ suggestions: [] });

  try {
    const url = `https://ac.duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`;
    const response = await fetch(url, { headers: { 'User-Agent': 'NebulaHub/1.0' } });
    const data = await response.json();
    const suggestions = Array.isArray(data[1]) ? data[1].slice(0, 8) : [];
    res.json({ suggestions });
  } catch (err) {
    res.json({ suggestions: [] });
  }
});

module.exports = router;
