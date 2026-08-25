import express from 'express';
import {
  getSecurityDashboard,
  getSecurityUsers,
  getUserSecurity,
  unlockUser,
  deactivateUser,
  activateUser,
  adminResetPassword,
  getAuditLog,
  updateSecuritySettings,
  getSecuritySettings,
  blockIP,
  unblockIP,
  getRateLimits,
  updateRateLimits,
} from '../controllers/security.controller.js';
import { idValidator, validate } from '../middleware/validation.middleware.js';
import { authMiddleware, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All security routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getSecurityDashboard);

// User management
router.get('/users', getSecurityUsers);
router.get('/users/:id', idValidator, validate, getUserSecurity);
router.post('/users/:id/unlock', idValidator, validate, unlockUser);
router.post('/users/:id/deactivate', idValidator, validate, deactivateUser);
router.post('/users/:id/activate', idValidator, validate, activateUser);
router.post('/users/:id/reset-password', idValidator, validate, adminResetPassword);

// Audit log
router.get('/audit-log', getAuditLog);

// Security settings
router.get('/settings', getSecuritySettings);
router.put('/settings', updateSecuritySettings);

// IP blocking
router.get('/blocked-ips', getRateLimits); // Reuse for getting blocked IPs
router.post('/block-ip', blockIP);
router.delete('/block-ip/:ip', unblockIP);

// Rate limits
router.get('/rate-limits', getRateLimits);
router.put('/rate-limits', updateRateLimits);

export default router;