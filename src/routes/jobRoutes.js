import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getEmployeeJobs
} from '../controllers/jobController.js';
import {
  createJobSchema,
  updateJobSchema
} from '../validations/schemas.js';

const router = express.Router();

// Public routes
router.get('/', getAllJobs);
router.get('/:id', getJobById);

// Protected routes
router.post('/', 
  authenticateToken, 
  authorizeRole(['employee']), 
  validate(createJobSchema), 
  createJob
);

router.put('/:id', 
  authenticateToken, 
  authorizeRole(['employee']), 
  validate(updateJobSchema), 
  updateJob
);

router.delete('/:id', authenticateToken, authorizeRole(['employee']), deleteJob);
router.get('/employee/jobs', authenticateToken, authorizeRole(['employee']), getEmployeeJobs);

export default router; 