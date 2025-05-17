import { supabase } from './database.js';
import bcrypt from 'bcryptjs';

const createInitialAdmin = async () => {
  try {
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@hireme.com')
      .single();

    if (existingAdmin) {
      console.log('Admin user already exists');
      return true;
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('admin123', salt);

    const { data: admin, error } = await supabase
      .from('users')
      .insert([
        {
          full_name: 'Admin User',
          email: 'admin@hireme.com',
          password_hash,
          role: 'admin'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    console.log('Initial admin user created successfully:');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Please change the password after first login!');
    return true;

  } catch (error) {
    console.error('Error creating admin user:', error.message);
    return false;
  }
};

const checkTableExists = async (tableName) => {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `
  });
  
  if (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
  
  return data;
};

// Create company analytics function
const createCompanyAnalyticsFunction = async () => {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_company_analytics(company_name text)
        RETURNS json AS $$
        DECLARE
          result json;
        BEGIN
          SELECT json_build_object(
            'total_jobs', (
              SELECT COUNT(*) 
              FROM jobs 
              WHERE company_name = $1
            ),
            'active_jobs', (
              SELECT COUNT(*) 
              FROM jobs 
              WHERE company_name = $1 
              AND job_status = 'active'
            ),
            'total_applications', (
              SELECT COUNT(*) 
              FROM applications a
              JOIN jobs j ON a.job_id = j.job_id
              WHERE j.company_name = $1
            ),
            'applications_by_status', (
              SELECT json_object_agg(
                application_status,
                count
              )
              FROM (
                SELECT 
                  a.application_status,
                  COUNT(*) as count
                FROM applications a
                JOIN jobs j ON a.job_id = j.job_id
                WHERE j.company_name = $1
                GROUP BY a.application_status
              ) status_counts
            ),
            'total_users', (
              SELECT COUNT(*) 
              FROM users u
              JOIN roles r ON u.role_id = r.role_id
              WHERE r.role_name = 'company'
              AND u.company_name = $1
            )
          ) INTO result;
          
          RETURN result;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (error) throw error;
    console.log('Company analytics function created successfully');
  } catch (error) {
    console.error('Error creating company analytics function:', error);
    throw error;
  }
};

const createTables = async () => {
  try {
    // Check if tables already exist
    const tablesExist = await checkTableExists('users');
    if (tablesExist) {
      console.log('Database tables already exist, skipping creation');
      return true;
    }

    console.log('Creating database tables...');

    // Create ENUM types
    const { error: enumError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ BEGIN
          CREATE TYPE user_role_enum AS ENUM ('admin', 'employee', 'job_seeker');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          CREATE TYPE job_status_enum AS ENUM ('open', 'closed');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          CREATE TYPE application_status_enum AS ENUM ('pending_payment', 'pending', 'accepted', 'rejected');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;

        DO $$ BEGIN
          CREATE TYPE payment_status_enum AS ENUM ('success', 'failed', 'refunded');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
    });

    if (enumError) {
      console.error('Error creating ENUM types:', enumError);
      return false;
    }

    // Create roles table
    const { error: rolesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS roles (
          role_id     SERIAL PRIMARY KEY,
          role_name   TEXT UNIQUE NOT NULL
        );
      `
    });

    if (rolesError) {
      console.error('Error creating roles table:', rolesError);
      return false;
    }

    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          user_id       SERIAL PRIMARY KEY,
          full_name     TEXT           NOT NULL,
          email         TEXT UNIQUE    NOT NULL,
          password_hash TEXT           NOT NULL,
          role          user_role_enum NOT NULL,
          created_at    TIMESTAMP      NOT NULL DEFAULT NOW()
        );

        -- Create indexes for users table if they don't exist
        DO $$ BEGIN
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
    });

    if (usersError) {
      console.error('Error creating users table:', usersError);
      return false;
    }

    // Create jobs table
    const { error: jobsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS jobs (
          job_id           SERIAL         PRIMARY KEY,
          job_title        TEXT           NOT NULL,
          job_description  TEXT           NOT NULL,
          company_name     TEXT           NOT NULL,
          posted_by_user_id INT           NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          job_status       job_status_enum NOT NULL DEFAULT 'open',
          created_at       TIMESTAMP      NOT NULL DEFAULT NOW()
        );

        -- Create indexes for jobs table if they don't exist
        DO $$ BEGIN
          CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by_user_id);
          CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(job_status);
          CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
    });

    if (jobsError) {
      console.error('Error creating jobs table:', jobsError);
      return false;
    }

    // Create applications table
    const { error: applicationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS applications (
          application_id     SERIAL                  PRIMARY KEY,
          job_id             INT       NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
          user_id            INT       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          resume_file_url    TEXT      NOT NULL,
          application_status application_status_enum NOT NULL DEFAULT 'pending_payment',
          is_paid            BOOLEAN   NOT NULL DEFAULT FALSE,
          payment_intent_id  TEXT,
          created_at         TIMESTAMP NOT NULL DEFAULT NOW()
        );

        -- Create indexes for applications table if they don't exist
        DO $$ BEGIN
          CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
          CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
          CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(application_status);
          CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
    });

    if (applicationsError) {
      console.error('Error creating applications table:', applicationsError);
      return false;
    }

    // Create invoices table
    const { error: invoicesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS invoices (
          invoice_id      SERIAL                PRIMARY KEY,
          user_id         INT       NOT NULL REFERENCES users(user_id) ON DELETE SET NULL,
          application_id  INT       NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
          payment_amount  INT       NOT NULL DEFAULT 100,
          payment_status  payment_status_enum NOT NULL DEFAULT 'success',
          payment_intent_id TEXT,
          paid_at         TIMESTAMP NOT NULL DEFAULT NOW()
        );

        -- Create indexes for invoices table if they don't exist
        DO $$ BEGIN
          CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
          CREATE INDEX IF NOT EXISTS idx_invoices_application_id ON invoices(application_id);
          CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
          CREATE INDEX IF NOT EXISTS idx_invoices_paid_at ON invoices(paid_at);
          CREATE INDEX IF NOT EXISTS idx_invoices_payment_intent_id ON invoices(payment_intent_id);
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
    });

    if (invoicesError) {
      console.error('Error creating invoices table:', invoicesError);
      return false;
    }

    // Insert initial roles if they don't exist
    const { error: rolesInsertError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO roles (role_name)
        SELECT unnest(ARRAY['admin', 'employee', 'job_seeker'])
        WHERE NOT EXISTS (SELECT 1 FROM roles);
      `
    });

    if (rolesInsertError) {
      console.error('Error inserting initial roles:', rolesInsertError);
      return false;
    }

    // Create initial admin user
    const adminCreated = await createInitialAdmin();
    if (!adminCreated) {
      console.error('Failed to create initial admin user');
      return false;
    }

    // Create company analytics function
    await createCompanyAnalyticsFunction();

    console.log('Database tables and functions created successfully');
    return true;
  } catch (error) {
    console.error('Error creating database tables:', error);
    return false;
  }
};

export const initializeDatabase = async () => {
  try {
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      throw new Error('Failed to create database tables');
    }
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}; 