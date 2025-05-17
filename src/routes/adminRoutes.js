import express from 'express';
import { authorizeRole, authenticateToken } from '../middleware/auth.js';
import { 
  getAllApplications,
  getAllJobs,
  getCompanyAnalytics,
  updateUser,
  deleteUser
} from '../controllers/adminController.js';

const router = express.Router();

// Get all applications with filtering
router.get('/applications', authenticateToken, authorizeRole(['admin']), getAllApplications);

// Get all jobs with filtering
router.get('/jobs', authenticateToken, authorizeRole(['admin']), getAllJobs);

// Get company analytics
router.get('/analytics', authenticateToken, authorizeRole(['admin']), getCompanyAnalytics);

// Update user (Admin only)
router.put('/users/:id', authenticateToken, authorizeRole(['admin']), updateUser);

// Delete user (Admin only)
router.delete('/users/:id', authenticateToken, authorizeRole(['admin']), deleteUser);

export default router; 