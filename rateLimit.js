const rateLimit = require('express-rate-limit');

/**
 * Standard API rate limiter — 100 req/15min per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

/**
 * Auth limiter — 10 attempts/15min per IP (login/register)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

/**
 * Admin key limiter — 5 attempts/hour per IP (strict)
 */
const adminKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin key attempts. Try again in 1 hour.' },
  skipSuccessfulRequests: false,
});

/**
 * Search limiter — 30 req/min per IP
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Search rate limit exceeded. Slow down.' },
});

/**
 * AI limiter — 20 req/min per user
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request rate limit exceeded.' },
  keyGenerator: (req) => req.user?.id || req.ip,
});

module.exports = { apiLimiter, authLimiter, adminKeyLimiter, searchLimiter, aiLimiter };
