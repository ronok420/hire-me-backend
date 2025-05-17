import { supabase } from '../config/database.js';

// Get all jobs posted by the employee's company
export const getCompanyJobs = async (req, res) => {
  try {
    const { company_name } = req.user; // From auth middleware
    const { status } = req.query;

    let query = supabase
      .from('jobs')
      .select(`
        *,
        applications:applications!job_id (
          application_id,
          application_status,
          applicant:users!applicant_user_id (
            full_name,
            email
          )
        )
      `)
      .eq('company_name', company_name);

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

// Create a new job for the employee's company
export const createJob = async (req, res) => {
  try {
    const { company_name } = req.user;
    const { job_title, job_description } = req.body;

    const { data: job, error } = await supabase
      .from('jobs')
      .insert([
        {
          job_title,
          job_description,
          company_name,
          posted_by_user_id: req.user.userId,
          job_status: 'active'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a job (only if it belongs to the employee's company)
export const updateJob = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { company_name } = req.user;
    const { job_title, job_description, job_status } = req.body;

    // First check if the job belongs to the company
    const { data: existingJob, error: checkError } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('company_name', company_name)
      .single();

    if (checkError || !existingJob) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    // Update the job
    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        job_title,
        job_description,
        job_status
      })
      .eq('job_id', job_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a job (only if it belongs to the employee's company)
export const deleteJob = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { company_name } = req.user;

    // First check if the job belongs to the company
    const { data: existingJob, error: checkError } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('company_name', company_name)
      .single();

    if (checkError || !existingJob) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    // Delete the job
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('job_id', job_id);

    if (error) throw error;

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get applications for a specific job (only if it belongs to the employee's company)
export const getJobApplications = async (req, res) => {
  try {
    const { job_id } = req.params;
    const { company_name } = req.user;
    const { status } = req.query;

    // First check if the job belongs to the company
    const { data: existingJob, error: checkError } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('company_name', company_name)
      .single();

    if (checkError || !existingJob) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    // Get applications
    let query = supabase
      .from('applications')
      .select(`
        *,
        applicant:users!applicant_user_id (
          full_name,
          email
        )
      `)
      .eq('job_id', job_id);

    if (status) {
      query = query.eq('application_status', status);
    }

    const { data: applications, error } = await query;

    if (error) throw error;

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update application status (accept/reject)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { company_name } = req.user;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // First check if the application's job belongs to the company
    const { data: application, error: checkError } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs!job_id (
          company_name
        )
      `)
      .eq('application_id', application_id)
      .single();

    if (checkError || !application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.job.company_name !== company_name) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update application status
    const { data: updatedApplication, error } = await supabase
      .from('applications')
      .update({ application_status: status })
      .eq('application_id', application_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};