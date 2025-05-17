import { supabase } from '../config/database.js';
import bcrypt from 'bcryptjs';

// Get all applications with filtering (Admin only)
export const getAllApplications = async (req, res) => {
  try {
    const { company, status, job_id } = req.query;
    let query = supabase
      .from('applications')
      .select(`
        *,
        job:jobs!job_id (
          job_title,
          company_name
        ),
        applicant:users!user_id (
          full_name,
          email
        )
      `);

    // Apply filters
    if (company) {
      query = query.eq('job.company_name', company);
    }
    if (status) {
      query = query.eq('application_status', status);
    }
    if (job_id) {
      query = query.eq('job_id', job_id);
    }

    const { data: applications, error } = await query;

    if (error) throw error;

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all jobs with filtering (Admin only)
export const getAllJobs = async (req, res) => {
  try {
    const { company, status } = req.query;
    let query = supabase
      .from('jobs')
      .select(`
        *,
        posted_by:users!posted_by_user_id (
          full_name,
          email
        ),
        applications:applications!job_id (
          application_id,
          application_status
        )
      `);

    // Apply filters
    if (company) {
      query = query.eq('company_name', company);
    }
    if (status) {
      query = query.eq('job_status', status);
    }

    const { data: jobs, error } = await query;

    if (error) throw error;

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get company analytics (Admin only)
export const getCompanyAnalytics = async (req, res) => {
  try {
    const { company } = req.query;

    if (!company) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Get company's jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('job_id, job_title, job_status, created_at')
      .eq('company_name', company);

    if (jobsError) throw jobsError;

    const jobIds = jobs.map(job => job.job_id);

    // Get applications for these jobs
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select(`
        application_id,
        job_id,
        application_status,
        is_paid,
        created_at
      `)
      .in('job_id', jobIds);

    if (applicationsError) throw applicationsError;

    // Get invoices separately
    const applicationIds = applications.map(app => app.application_id);
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .in('application_id', applicationIds);

    if (invoicesError) throw invoicesError;

    // Create a map of application_id to invoice
    const invoiceMap = invoices.reduce((map, invoice) => {
      map[invoice.application_id] = invoice;
      return map;
    }, {});

    // Calculate analytics
    const analytics = {
      company_name: company,
      total_jobs: jobs.length,
      active_jobs: jobs.filter(job => job.job_status === 'open').length,
      closed_jobs: jobs.filter(job => job.job_status === 'closed').length,
      total_applications: applications.length,
      applications_by_status: {
        pending: applications.filter(app => app.application_status === 'pending').length,
        accepted: applications.filter(app => app.application_status === 'accepted').length,
        rejected: applications.filter(app => app.application_status === 'rejected').length
      },
      payment_analytics: {
        total_revenue: applications.reduce((sum, app) => {
          const invoice = invoiceMap[app.application_id];
          return sum + (invoice?.payment_amount || 0);
        }, 0),
        successful_payments: applications.filter(app => {
          const invoice = invoiceMap[app.application_id];
          return invoice?.payment_status === 'success';
        }).length,
        pending_payments: applications.filter(app => !app.is_paid).length
      },
      job_analytics: jobs.map(job => ({
        job_id: job.job_id,
        job_title: job.job_title,
        status: job.job_status,
        total_applications: applications.filter(app => app.job_id === job.job_id).length,
        created_at: job.created_at
      })),
      recent_applications: applications
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(app => ({
          application_id: app.application_id,
          job_id: app.job_id,
          status: app.application_status,
          is_paid: app.is_paid,
          created_at: app.created_at,
          invoice: invoiceMap[app.application_id] || null
        }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching company analytics:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user (Admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, password } = req.body;

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', id)
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
      .eq('user_id', id)
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
    const { id } = req.params;

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin
    if (existingUser.role === 'admin') {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('role', 'admin');

      if (count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', id);

    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 