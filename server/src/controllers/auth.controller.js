import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import AIConfig from '../models/AIConfig.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  
  const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
  
  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email',
    });
  }
  
  // Create user
  const user = await User.create({
    email,
    password,
    name,
    role: 'admin',
  });
  
  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }
  
  // Check for user
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    await logAuditEvent({
      type: 'LOGIN_FAILED',
      message: `Failed login attempt (email not found): ${email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      performedBy: email,
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }
  
  // Check if account is locked
  if (user.isLocked) {
    return res.status(429).json({
      success: false,
      message: 'Account temporarily locked due to failed login attempts. Try again later.',
    });
  }
  
  // Check password
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incrementLoginAttempts();
    await logAuditEvent({
      type: 'LOGIN_FAILED',
      message: `Failed login attempt (incorrect password) for email: ${email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      performedBy: email,
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }
  
  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  await logAuditEvent({
    type: 'LOGIN',
    message: `User logged in: ${user.email}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    performedBy: user.email,
  });
  
  sendTokenResponse(user, 200, res);
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
    },
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };
  
  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(
    key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );
  
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });
  
  res.status(200).json({
    success: true,
    user,
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');
  
  // Check current password
  const isMatch = await user.comparePassword(req.body.currentPassword);
  
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }
  
  user.password = req.body.newPassword;
  await user.save();

  await logAuditEvent({
    type: 'PASSWORD_CHANGE',
    message: `User changed password: ${user.email}`,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    performedBy: user.email,
  });
  
  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No user found with that email',
    });
  }
  
  // Generate reset token (in production, use crypto.randomBytes)
  const resetToken = jwt.sign(
    { id: user._id, type: 'password-reset' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  
  // In production, send email with reset token
  // For now, return token in response (development only)
  res.status(200).json({
    success: true,
    message: 'Password reset token generated',
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.resettoken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token',
      });
    }
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    user.password = req.body.password;
    await user.save();
    
    sendTokenResponse(user, 200, res);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token',
    });
  }
});

// @desc    Get admin route path for frontend routing
// @route   GET /api/auth/admin-path
// @access  Public
export const getAdminPath = asyncHandler(async (req, res) => {
  const config = await AIConfig.findOne().select('security.adminPath');
  const adminPath = (
    config?.security?.adminPath ||
    process.env.ADMIN_SECRET_PATH ||
    'manage-9f2k8x1p'
  ).trim();

  res.status(200).json({
    success: true,
    data: { adminPath },
  });
});