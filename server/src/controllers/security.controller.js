import User from '../models/User.js';
import Message from '../models/Message.js';
import Lead from '../models/Lead.js';
import AIConfig from '../models/AIConfig.js';
import AuditLog from '../models/AuditLog.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { forceRefreshSecurityCache } from '../utils/securityCache.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { io } from '../index.js';

const emitUpdate = (type, data) => {
  io.emit('security:update', { type, data, timestamp: new Date().toISOString() });
};

// @desc    Get security dashboard data
// @route   GET /api/security/dashboard
// @access  Private/Admin
export const getSecurityDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    lockedUsers,
    recentLogins,
    failedLogins,
    messageStats,
    leadStats,
    aiConfig,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ lockUntil: { $gt: new Date() } }),
    User.find({ lastLogin: { $exists: true } })
      .sort({ lastLogin: -1 })
      .limit(10)
      .select('name email lastLogin'),
    User.aggregate([
      { $match: { loginAttempts: { $gt: 0 } } },
      { $project: { email: 1, loginAttempts: 1, lockUntil: 1, lastLogin: 1 } },
      { $sort: { loginAttempts: -1 } },
      { $limit: 10 },
    ]),
    Message.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    AIConfig.findOne().select('security'),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      users: { total: totalUsers, active: activeUsers, locked: lockedUsers },
      recentLogins,
      failedLogins,
      messages: messageStats,
      leads: leadStats,
      securitySettings: aiConfig?.security || {},
    },
  });
});

// @desc    Get all users with security info
// @route   GET /api/security/users
// @access  Private/Admin
export const getSecurityUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search;
  const status = req.query.status; // active, locked, all
  
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (status === 'active') query.isActive = true;
  if (status === 'locked') query.lockUntil = { $gt: new Date() };
  if (status === 'inactive') query.isActive = false;
  
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  const total = await User.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Get user security details
// @route   GET /api/security/users/:id
// @access  Private/Admin
export const getUserSecurity = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password +loginAttempts +lockUntil');
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  // Don't send password hash
  const userData = user.toObject();
  delete userData.password;
  
  res.status(200).json({ success: true, data: userData });
});

// @desc    Unlock user account
// @route   POST /api/security/users/:id/unlock
// @access  Private/Admin
export const unlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();
  
  emitUpdate('user-unlock', { userId: user._id });

  await logAuditEvent({
    type: 'USER_UNLOCK',
    message: `Unlocked user account: ${user.email}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    performedBy: req.user?.email || 'System'
  });

  res.status(200).json({ success: true, message: 'User account unlocked' });
});

// @desc    Deactivate user
// @route   POST /api/security/users/:id/deactivate
// @access  Private/Admin
export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  if (user._id.toString() === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
  }
  
  user.isActive = false;
  await user.save();
  
  emitUpdate('user-deactivate', { userId: user._id });

  await logAuditEvent({
    type: 'USER_DEACTIVATE',
    message: `Deactivated user account: ${user.email}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    performedBy: req.user?.email || 'System'
  });

  res.status(200).json({ success: true, message: 'User deactivated' });
});

// @desc    Activate user
// @route   POST /api/security/users/:id/activate
// @access  Private/Admin
export const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  user.isActive = true;
  await user.save();
  
  emitUpdate('user-activate', { userId: user._id });

  await logAuditEvent({
    type: 'USER_ACTIVATE',
    message: `Activated user account: ${user.email}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    performedBy: req.user?.email || 'System'
  });

  res.status(200).json({ success: true, message: 'User activated' });
});

// @desc    Reset user password (admin)
// @route   POST /api/security/users/:id/reset-password
// @access  Private/Admin
export const adminResetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  user.password = req.body.newPassword;
  await user.save();
  
  emitUpdate('password-reset', { userId: user._id });

  await logAuditEvent({
    type: 'PASSWORD_CHANGE',
    message: `Admin reset password for user: ${user.email}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    performedBy: req.user?.email || 'System'
  });

  res.status(200).json({ success: true, message: 'Password reset successfully' });
});

// @desc    Get security audit log
// @route   GET /api/security/audit-log
// @access  Private/Admin
export const getAuditLog = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
  
  let events = logs.map(log => ({
    type: log.type,
    message: log.message,
    timestamp: log.createdAt,
    ipAddress: log.ipAddress,
    performedBy: log.performedBy
  }));

  // Fallback: If DB is empty, return a few default mock events so it is never completely blank
  if (events.length === 0) {
    events = [
      { type: 'SETTINGS_CHANGE', message: 'System initiated with Audit Log integrity protection', timestamp: new Date() },
    ];
  }
  
  res.status(200).json({ success: true, data: events });
});

// @desc    Update security settings
// @route   PUT /api/security/settings
// @access  Private/Admin
export const updateSecuritySettings = asyncHandler(async (req, res) => {
  const config = await AIConfig.findOne();
  
  if (!config) {
    return res.status(404).json({ success: false, message: 'AI config not found' });
  }
  
  config.security = { ...config.security.toObject(), ...req.body };
  config.updatedBy = req.user.id;
  await config.save();
  await forceRefreshSecurityCache();
  
  emitUpdate('security-settings', config.security);

  await logAuditEvent({
    type: 'SETTINGS_CHANGE',
    message: `Updated security settings`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    performedBy: req.user?.email || 'System'
  });

  res.status(200).json({ success: true, data: config.security });
});

// @desc    Block IP address
// @route   POST /api/security/block-ip
// @access  Private/Admin
export const blockIP = asyncHandler(async (req, res) => {
  const config = await AIConfig.findOne();
  
  if (!config) {
    return res.status(404).json({ success: false, message: 'AI config not found' });
  }
  
  const { ip, reason } = req.body;
  
  if (!config.security.blockedIps.includes(ip)) {
    config.security.blockedIps.push(ip);
    config.updatedBy = req.user.id;
    await config.save();
    await forceRefreshSecurityCache();
  }
  
  emitUpdate('ip-blocked', { ip, reason });

  await logAuditEvent({
    type: 'IP_BLOCKED',
    message: `Blocked IP: ${ip}${reason ? ` (Reason: ${reason})` : ''}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    performedBy: req.user?.email || 'System'
  });

  res.status(200).json({ success: true, message: 'IP blocked', blockedIps: config.security.blockedIps });
});

// @desc    Unblock IP address
// @route   DELETE /api/security/block-ip/:ip
// @access  Private/Admin
export const unblockIP = asyncHandler(async (req, res) => {
  const config = await AIConfig.findOne();
  
  if (!config) {
    return res.status(404).json({ success: false, message: 'AI config not found' });
  }
  
  config.security.blockedIps = config.security.blockedIps.filter(ip => ip !== req.params.ip);
  config.updatedBy = req.user.id;
  await config.save();
  await forceRefreshSecurityCache();
  
  emitUpdate('ip-unblocked', { ip: req.params.ip });

  await logAuditEvent({
    type: 'IP_UNBLOCKED',
    message: `Unblocked IP: ${req.params.ip}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    performedBy: req.user?.email || 'System'
  });

  res.status(200).json({ success: true, message: 'IP unblocked', blockedIps: config.security.blockedIps });
});

// @desc    Get rate limit status
// @route   GET /api/security/rate-limits
// @access  Private/Admin
export const getRateLimits = asyncHandler(async (req, res) => {
  const config = await AIConfig.findOne();
  
  if (!config) {
    return res.status(404).json({ success: false, message: 'AI config not found' });
  }
  
  res.status(200).json({ success: true, data: config.security.rateLimit });
});

// @desc    Update rate limits
// @route   PUT /api/security/rate-limits
// @access  Private/Admin
export const updateRateLimits = asyncHandler(async (req, res) => {
  const config = await AIConfig.findOne();
  
  if (!config) {
    return res.status(404).json({ success: false, message: 'AI config not found' });
  }
  
  config.security.rateLimit = { ...config.security.rateLimit.toObject(), ...req.body };
  config.updatedBy = req.user.id;
  await config.save();
  await forceRefreshSecurityCache();
  
  emitUpdate('rate-limits', config.security.rateLimit);

  await logAuditEvent({
    type: 'RATE_LIMITS_CHANGE',
    message: `Updated rate limit configuration`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    performedBy: req.user?.email || 'System'
  });

  res.status(200).json({ success: true, data: config.security.rateLimit });
});

// @desc    Get security settings
// @route   GET /api/security/settings
// @access  Private/Admin
export const getSecuritySettings = asyncHandler(async (req, res) => {
  const config = await AIConfig.findOne();
  
  if (!config) {
    return res.status(404).json({ success: false, message: 'AI config not found' });
  }
  
  res.status(200).json({ success: true, data: config.security });
});