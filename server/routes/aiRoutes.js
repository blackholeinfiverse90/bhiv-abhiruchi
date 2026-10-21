import express from 'express';
import { generateAIFeedback, getAISettings, updateAISettings, generateQuestionsAI, testAIConnection } from '../controllers/aiController.js';

const router = express.Router();

router.post('/feedback', generateAIFeedback);
router.post('/generate-questions', generateQuestionsAI);
router.post('/test-connection', testAIConnection);
router.get('/settings', getAISettings);
router.put('/settings', updateAISettings);

export default router;
