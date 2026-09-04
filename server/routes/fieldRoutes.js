import express from 'express';
import { getFields, getFieldById, createField, updateField } from '../controllers/fieldController.js';

const router = express.Router();

router.get('/', getFields);
router.get('/:id', getFieldById);
router.post('/', createField);
router.put('/:id', updateField);

export default router;
