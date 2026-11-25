import express from 'express';
import {
  getAllStudents,
  saveStudentIntake,
  getStudentProfile,
  saveAssessmentResult,
  getAllAttempts,
  deleteStudent,
  getDummyCandidates,
  cleanupDummyStudents,
  exportStudentsData,
  backfillCandidateIds
} from '../controllers/studentController.js';

const router = express.Router();

router.get('/', getAllStudents);
router.get('/export', exportStudentsData);
router.get('/attempts', getAllAttempts);
router.get('/dummy-candidates', getDummyCandidates);
router.post('/intake', saveStudentIntake);
router.post('/backfill-candidate-ids', backfillCandidateIds);
router.get('/profile/:userId', getStudentProfile);
router.post('/assessment-result', saveAssessmentResult);
router.delete('/:id', deleteStudent);
router.post('/cleanup-dummy', cleanupDummyStudents);

export default router;
