import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerJobSeeker,
  login,
  createUser,
  getAllUsers
} from '../controllers/userController.js';
import {
  registerJobSeekerSchema,
  loginSchema,
  createUserSchema
} from '../validations/schemas.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerJobSeekerSchema), registerJobSeeker);
router.post('/login', validate(loginSchema), login);

// Protected routes
router.post('/create', 
  authenticateToken, 
  authorizeRole(['admin']), 
  validate(createUserSchema), 
  createUser
);
router.get('/all', authenticateToken, authorizeRole(['admin']), getAllUsers);

export default router; 