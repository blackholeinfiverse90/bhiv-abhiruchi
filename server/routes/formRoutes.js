import express from 'express';
import { getFormConfig, updateFormConfig } from '../controllers/formController.js';

const router = express.Router();

router.get('/', getFormConfig);
router.put('/', updateFormConfig);

export default router;
