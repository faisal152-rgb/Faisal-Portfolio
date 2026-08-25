import express from 'express';
import { getSystemStatus } from '../controllers/system.controller.js';

const router = express.Router();

router.get('/status', getSystemStatus);

export default router;
