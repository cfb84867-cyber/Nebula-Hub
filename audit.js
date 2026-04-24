const AdminLog = require('../models/AdminLog');
const logger = require('./logger');

/**
 * createLog — writes an admin/auth event to the database
 * @param {object} opts
 */
const createLog = async ({ userId = null, username = 'anonymous', action, metadata = {}, req, severity = 'info' }) => {
  try {
    const ip = req?.headers['x-forwarded-for']?.split(',')[0] || req?.ip || null;
    const userAgent = req?.headers['user-agent'] || null;

    await AdminLog.create({ userId, username, action, metadata, ip, userAgent, severity });
  } catch (err) {
    logger.error(`Failed to write admin log [${action}]: ${err.message}`);
  }
};

module.exports = { createLog };
