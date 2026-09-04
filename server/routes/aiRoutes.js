import express from 'express';
import { generateAIFeedback, getAISettings, updateAISettings } from '../controllers/aiController.js';

const router = express.Router();

router.post('/feedback', generateAIFeedback);
router.get('/settings', getAISettings);
router.put('/settings', updateAISettings);

export default router;
