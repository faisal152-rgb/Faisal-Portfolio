import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  getAdminPath,
} from '../controllers/auth.controller.js';
import {
  registerValidator,
  loginValidator,
  validate,
} from '../middleware/validation.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/admin-path', getAdminPath);

// Protected routes
router.use(authMiddleware);
router.get('/me', getMe);
router.post('/logout', logout);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);

export default router;