import express from 'express';
import {
  getMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  getMessageStats,
} from '../controllers/message.controller.js';
import { messageValidator, idValidator, validate, paginationValidator } from '../middleware/validation.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route - create message from contact form
router.post('/', messageValidator, validate, createMessage);

// Protected admin routes
router.use(authMiddleware);
router.get('/stats', getMessageStats);
router.get('/', paginationValidator, validate, getMessages);
router.get('/:id', idValidator, validate, getMessage);
router.put('/:id', idValidator, validate, updateMessage);
router.delete('/:id', idValidator, validate, deleteMessage);

export default router;