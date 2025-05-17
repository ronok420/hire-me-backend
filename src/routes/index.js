import express from 'express';
import userRoutes from './userRoutes.js';
import jobRoutes from './jobRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/admin', adminRoutes);

export default router; 