import mongoose from 'mongoose';

let cache = {
  blockedIps: [],
  rateLimit: {
    requestsPerMinute: 30,
    requestsPerHour: 200,
    requestsPerDay: 1000,
  },
  lastUpdated: 0
};

const CACHE_TTL = 10 * 1000; // 10 seconds TTL

export const getSecurityCache = async () => {
  const now = Date.now();
  if (now - cache.lastUpdated > CACHE_TTL) {
    if (mongoose.connection.readyState !== 1) {
      return cache;
    }
    try {
      const AIConfig = mongoose.model('AIConfig');
      const config = await AIConfig.findOne().select('security');
      if (config?.security) {
        cache.blockedIps = config.security.blockedIps || [];
        if (config.security.rateLimit) {
          cache.rateLimit = {
            requestsPerMinute: config.security.rateLimit.requestsPerMinute || 30,
            requestsPerHour: config.security.rateLimit.requestsPerHour || 200,
            requestsPerDay: config.security.rateLimit.requestsPerDay || 1000,
          };
        }
      }
      cache.lastUpdated = now;
    } catch (err) {
      console.error('[SecurityCache] Failed to load config:', err.message);
    }
  }
  return cache;
};

export const forceRefreshSecurityCache = async () => {
  cache.lastUpdated = 0;
  return getSecurityCache();
};
