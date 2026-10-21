import express from 'express';
import { getAllStudents, saveStudentIntake, getStudentProfile, saveAssessmentResult, getAllAttempts, deleteStudent, cleanupDummyStudents } from '../controllers/studentController.js';

const router = express.Router();

router.get('/', getAllStudents);
router.get('/attempts', getAllAttempts);
router.post('/intake', saveStudentIntake);
router.get('/profile/:userId', getStudentProfile);
router.post('/assessment-result', saveAssessmentResult);
router.delete('/:id', deleteStudent);
router.post('/cleanup-dummy', cleanupDummyStudents);

export default router;
