import { supabase } from '../config/database.js';
import { createPaymentIntent, confirmPayment } from '../config/payment.js';

// Step 1: Initiate job application
export const initiateJobApplication = async (req, res) => {
  try {
    const { job_id, user_id } = req.params;
    const resume_file_url = req.file.path;

    
    if (req.user.user_id !== parseInt(user_id)) {
      return res.status(403).json({ error: 'Unauthorized: User ID mismatch' });
    }

    
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('job_status', 'open')
      .single();

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not open for applications' });
    }


    const { data: existingApplication } = await supabase
      .from('applications')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', user_id)
      .single();

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

   
    const { data: application, error } = await supabase
      .from('applications')
      .insert([
        {
          job_id,
          user_id,
          resume_file_url,
          application_status: 'pending_payment',
          is_paid: false
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Application initiated. Please complete the payment to finalize your application.',
      application,
      payment_required: true,
      payment_amount: 100
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Step 2: Process payment
export const processPayment = async (req, res) => {
  try {
    const { job_id, user_id } = req.params;

   
    if (req.user.user_id !== parseInt(user_id)) {
      return res.status(403).json({ error: 'Unauthorized: User ID mismatch' });
    }

 
    const { data: application } = await supabase
      .from('applications')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', user_id)
      .eq('application_status', 'pending_payment')
      .single();

    if (!application) {
      return res.status(404).json({ error: 'No pending application found for this job' });
    }

    if (application.is_paid) {
      return res.status(400).json({ error: 'Payment already processed for this application' });
    }

  
    const { clientSecret, paymentIntentId } = await createPaymentIntent(100);

   
    const { error: updateError } = await supabase
      .from('applications')
      .update({ payment_intent_id: paymentIntentId })
      .eq('application_id', application.application_id);

    if (updateError) throw updateError;

    res.json({
      clientSecret,
      paymentIntentId,
      amount: 100,
      message: 'Payment intent created. Use the client secret to complete the payment.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Step 3: Confirm payment and finalize application
export const confirmApplicationPayment = async (req, res) => {
  try {
    const { job_id, user_id } = req.params;
    const { paymentIntentId } = req.body;

    
    if (req.user.user_id !== parseInt(user_id)) {
      return res.status(403).json({ error: 'Unauthorized: User ID mismatch' });
    }

  
    const { data: application } = await supabase
      .from('applications')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', user_id)
      .eq('application_status', 'pending_payment')
      .single();

    if (!application) {
      return res.status(404).json({ error: 'No pending application found for this job' });
    }

    if (application.is_paid) {
      return res.status(400).json({ error: 'Payment already processed for this application' });
    }

    const paymentSuccessful = await confirmPayment(paymentIntentId);

    if (!paymentSuccessful) {
      return res.status(400).json({ error: 'Payment confirmation failed. Please try again.' });
    }

  
    const { error: updateError } = await supabase
      .from('applications')
      .update({ 
        is_paid: true,
        application_status: 'pending',
        payment_intent_id: paymentIntentId
      })
      .eq('application_id', application.application_id);

    if (updateError) {
      console.error('Error updating application:', updateError);
      throw updateError;
    }

    // Create invoice
    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert([
        {
          user_id,
          application_id: application.application_id,
          payment_amount: 100,
          payment_status: 'success',
          payment_intent_id: paymentIntentId
        }
      ]);

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw invoiceError;
    }

    res.json({
      message: 'Payment processed successfully. Your application is now complete and pending review.',
      application_id: application.application_id,
      amount: 100
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
};


export const getJobApplications = async (req, res) => {
  try {
    const { job_id } = req.params;

    
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('posted_by_user_id', req.user.user_id)
      .single();

    if (!job) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:users(full_name, email)
      `)
      .eq('job_id', job_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const updateApplicationStatus = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { status } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

  
    const { data: application } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(*)
      `)
      .eq('application_id', application_id)
      .single();

    if (!application || application.job.posted_by_user_id !== req.user.user_id) {
      return res.status(404).json({ error: 'Application not found or unauthorized' });
    }

    const { data: updatedApplication, error } = await supabase
      .from('applications')
      .update({ application_status: status })
      .eq('application_id', application_id)
      .select()
      .single();

    if (error) throw error;

    res.json(updatedApplication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getUserApplications = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Get all jobs posted by this employee
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('job_id')
      .eq('posted_by_user_id', user_id);

    if (jobsError) throw jobsError;

    const jobIds = jobs.map(job => job.job_id);
    if (jobIds.length === 0) {
      return res.json([]);
    }

    // Get all applications for these jobs
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(*),
        applicant:users(full_name, email)
      `)
      .in('job_id', jobIds)
      .order('created_at', { ascending: false });

    if (applicationsError) throw applicationsError;

  
    const applicationIds = applications.map(app => app.application_id);
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .in('application_id', applicationIds);

    if (invoicesError) throw invoicesError;

    
    const invoiceMap = invoices.reduce((map, invoice) => {
      map[invoice.application_id] = invoice;
      return map;
    }, {});

    
    const formattedApplications = applications.map(app => ({
      ...app,
      payment_status: app.is_paid ? 'paid' : 'pending',
      payment_amount: 100,
      invoice: invoiceMap[app.application_id] || null
    }));

    res.json(formattedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: error.message });
  }
};


export const getApplicationDetails = async (req, res) => {
  try {
    const { application_id } = req.params;
    const user_id = req.user.user_id;

 
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(*)
      `)
      .eq('application_id', application_id)
      .eq('user_id', user_id)
      .single();

    if (applicationError) throw applicationError;
    if (!application) {
      return res.status(404).json({ error: 'Application not found or unauthorized' });
    }

    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('application_id', application_id)
      .single();

    if (invoiceError && invoiceError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw invoiceError;
    }

   
    const response = {
      ...application,
      invoice: invoice || null,
      payment_status: application.is_paid ? 'paid' : 'pending',
      payment_amount: 100
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({ error: error.message });
  }
};