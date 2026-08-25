import express from 'express';
import {
  getLeads,
  getLead,
  createLead,
  getPublicLead,
  updatePublicLead,
  renewPublicLead,
  updateLead,
  deleteLead,
  getLeadStats,
} from '../controllers/lead.controller.js';
import { leadValidator, publicLeadUpdateValidator, idValidator, validate, paginationValidator } from '../middleware/validation.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route - create lead from website
router.post('/', leadValidator, validate, createLead);
router.get('/public/:reference', getPublicLead);
router.patch('/public/:reference', publicLeadUpdateValidator, validate, updatePublicLead);
router.post('/public/:reference/renew', renewPublicLead);

// Protected admin routes
router.use(authMiddleware);
router.get('/stats', getLeadStats);
router.get('/', paginationValidator, validate, getLeads);
router.get('/:id', idValidator, validate, getLead);
router.put('/:id', idValidator, validate, updateLead);
router.delete('/:id', idValidator, validate, deleteLead);

export default router;