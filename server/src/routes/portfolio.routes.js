import express from 'express';
import {
  getHero,
  getPortfolio,
} from '../controllers/portfolio.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes with optional auth for personalization
router.use(optionalAuth);
router.get('/hero', getHero);
router.get('/', getPortfolio);

export default router;