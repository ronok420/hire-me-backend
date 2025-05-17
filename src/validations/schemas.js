import { z } from 'zod';

// User schemas
export const registerJobSeekerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const createUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'employee', 'job_seeker'], {
    errorMap: () => ({ message: 'Invalid role. Must be admin, employee, or job_seeker' })
  })
});

// Job schemas
export const createJobSchema = z.object({
  job_title: z.string().min(3, 'Job title must be at least 3 characters'),
  job_description: z.string().min(10, 'Job description must be at least 10 characters'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters')
});

export const updateJobSchema = z.object({
  job_title: z.string().min(3, 'Job title must be at least 3 characters').optional(),
  job_description: z.string().min(10, 'Job description must be at least 10 characters').optional(),
  company_name: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  job_status: z.enum(['open', 'closed'], {
    errorMap: () => ({ message: 'Invalid status. Must be open or closed' })
  }).optional()
});

// Application schemas
export const updateApplicationStatusSchema = z.object({
  status: z.enum(['pending_payment', 'pending', 'accepted', 'rejected'], {
    errorMap: () => ({ message: 'Invalid status. Must be pending_payment, pending, accepted, or rejected' })
  })
}); 