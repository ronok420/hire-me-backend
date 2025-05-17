import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  initiateJobApplication,
  processPayment,
  confirmApplicationPayment,
  getJobApplications,
  updateApplicationStatus,
  getUserApplications,
  getApplicationDetails
} from '../controllers/applicationController.js';
import { updateApplicationStatusSchema } from '../validations/schemas.js';

const router = express.Router();

// Step 1: Initiate job application (creates pending application)
router.post('/:job_id/:user_id/initiate',
  authenticateToken,
  authorizeRole(['job_seeker']),
  upload.single('resume'),
  initiateJobApplication
);

// Step 2: Process payment for the initiated application
router.post('/:job_id/:user_id/payment',
  authenticateToken,
  authorizeRole(['job_seeker']),
  processPayment
);

// Step 3: Confirm payment and finalize application
router.post('/:job_id/:user_id/confirm-payment',
  authenticateToken,
  authorizeRole(['job_seeker']),
  confirmApplicationPayment
);

// Get applications for a job (Employee only)
router.get('/job/:job_id',
  authenticateToken,
  authorizeRole(['employee']),
  getJobApplications
);

// Update application status (Employee only)
router.put('/:application_id/status',
  authenticateToken,
  authorizeRole(['employee']),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus
);

// Get all applications (Employee only)
router.get('/user/applications',
  authenticateToken,
  authorizeRole(['employee']),
  getUserApplications
);

// Get application details (accessible to both job seekers and employees)
router.get('/:application_id',
  authenticateToken,
  authorizeRole(['job_seeker', 'employee']),
  getApplicationDetails
);

export default router; 