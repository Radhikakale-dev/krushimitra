/**
 * routes/aiRoutes.js
 * KrushiMitra AI — AI Assistant Routes
 */
import express from 'express';
import { chatWithAI, getAIContext } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// AI is rate-limited — 30 messages per minute per user
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many AI requests. Please wait a moment.' },
});

router.use(protect);

router.post('/chat',    aiLimiter, chatWithAI);
router.get('/context',  authorize('admin'), getAIContext);

export default router;
