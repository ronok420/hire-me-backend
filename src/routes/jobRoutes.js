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

// Protected routes (Employee and Admin)
router.post('/', 
  authenticateToken, 
  authorizeRole(['employee', 'admin']), 
  validate(createJobSchema), 
  createJob
);

router.put('/:id', 
  authenticateToken, 
  authorizeRole(['employee', 'admin']), 
  validate(updateJobSchema), 
  updateJob
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRole(['employee', 'admin']), 
  deleteJob
);

// Get jobs posted by employee or admin
router.get('/employee/jobs', 
  authenticateToken, 
  authorizeRole(['employee', 'admin']), 
  getEmployeeJobs
);

export default router; 