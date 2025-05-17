import bcrypt from 'bcryptjs';
import { generateToken } from '../config/jwt.js';
import { supabase } from '../config/database.js';

// Register a new job seeker
export const registerJobSeeker = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create new user
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          full_name,
          email,
          password_hash,
          role: 'job_seeker'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Generate JWT
    const token = generateToken({ userId: user.user_id, role: user.role });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateToken({ userId: user.user_id, role: user.role });

    res.json({
      token,
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new user (Admin only)
export const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    // Validate role
    if (!['admin', 'employee', 'job_seeker'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          full_name,
          email,
          password_hash,
          role
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all users with filtering (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { company, role, status } = req.query;
    let query = supabase
      .from('users')
      .select(`
        user_id,
        full_name,
        email,
        role,
        created_at,
        jobs:jobs!posted_by_user_id (
          job_id,
          job_title,
          company_name
        )
      `);

    // Apply filters
    if (company) {
      query = query.eq('jobs.company_name', company);
    }
    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user (Admin only)
export const updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { full_name, email, role, password } = req.body;

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare update data
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    // Update user
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', user_id);

    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get company analytics (Admin only)
export const getCompanyAnalytics = async (req, res) => {
  try {
    const { company } = req.query;

    // Get company statistics
    const { data: stats, error } = await supabase.rpc('get_company_analytics', {
      company_name: company
    });

    if (error) throw error;

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 