import { supabase } from '../config/database.js';

// Create a new job (Employee or Admin)
export const createJob = async (req, res) => {
  try {
    const { job_title, job_description, company_name } = req.body;
    const posted_by_user_id = req.user.user_id;

    const { data: job, error } = await supabase
      .from('jobs')
      .insert([
        {
          job_title,
          job_description,
          company_name,
          posted_by_user_id,
          job_status: 'open'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all jobs
export const getAllJobs = async (req, res) => {
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        posted_by:users(full_name, email)
      `)
      .eq('job_status', 'open')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get job by ID
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        posted_by:users(full_name, email)
      `)
      .eq('job_id', id)
      .single();

    if (error) throw error;
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update job (Employee or Admin)
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { job_title, job_description, company_name, job_status } = req.body;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    // Check if job exists
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', id)
      .single();

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check authorization
    if (user_role !== 'admin' && existingJob.posted_by_user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized to update this job' });
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        job_title,
        job_description,
        company_name,
        job_status
      })
      .eq('job_id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete job (Employee or Admin)
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    // Check if job exists
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', id)
      .single();

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check authorization
    if (user_role !== 'admin' && existingJob.posted_by_user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized to delete this job' });
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('job_id', id);

    if (error) throw error;

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get jobs posted by employee or admin
export const getEmployeeJobs = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    // If admin, get all jobs. If employee, get only their jobs
    if (user_role !== 'admin') {
      query = query.eq('posted_by_user_id', user_id);
    }

    const { data: jobs, error } = await query;

    if (error) throw error;

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 