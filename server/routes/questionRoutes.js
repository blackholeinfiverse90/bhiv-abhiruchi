import express from 'express';
import {
  getQuestions,
  getMultiDomainQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from '../controllers/questionController.js';

const router = express.Router();

router.get('/', getQuestions);
router.post('/multi-domain', getMultiDomainQuestions);
router.post('/', createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;
