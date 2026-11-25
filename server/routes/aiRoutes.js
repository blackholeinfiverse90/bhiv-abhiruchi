import express from 'express';
import {
  generateAIFeedback,
  generateQuestionsAI,
  generateAssessmentStreamAI,
  prewarmAssessmentAI,
  evaluateResponseAI,
  testAIConnection,
  getAISettings,
  updateAISettings
} from '../controllers/aiController.js';

const router = express.Router();

router.post('/feedback', generateAIFeedback);
router.post('/generate-questions', generateQuestionsAI);
router.post('/generate-assessment-stream', generateAssessmentStreamAI);
router.post('/prewarm-assessment', prewarmAssessmentAI);
router.post('/evaluate-response', evaluateResponseAI);
router.post('/test-connection', testAIConnection);
router.get('/settings', getAISettings);
router.put('/settings', updateAISettings);

export default router;
