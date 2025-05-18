# HireMe Backend API

A robust backend API for a job application platform that connects job seekers with employers, featuring role-based authentication, payment processing, and file upload capabilities.

## 🚀 Technologies Used

- **Node.js** – Runtime environment  
- **Express.js** – Web framework  
- **PostgreSQL** – Primary database (hosted on Supabase)  
- **Supabase** – Hosted PostgreSQL service  
- **JWT** – Authentication tokens  
- **Multer** – File upload handling  
- **Bcrypt** – Password hashing  
- **Stripe** – Payment processing (fake /mock for testing)  
- **Zod** – Validation schemas  
- **dotenv** – Environment variable management  

## 📁 Project Structure

```
hireme-backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   └── app.js
├── uploads/
│   └── resumes/
├── .env
├── .gitignore
├── package.json
└── server.js

```

## 🛠️ Installation

1. **Clone** the repository:  
   ```bash
   git clone https://github.com/your-username/hireme-backend.git
   cd hireme-backend
   ```
2. **Install** dependencies:  
   ```bash
   npm install
   ```
3. **Configure** environment variables by creating a `.env` file in the project root: for testing purpose  kept the  .env file 
   ```env
 
   SUPABASE_URL= supabase project url
   SUPABASE_SERVICE_ROLE_KEY= supabase service rol key
   JWT_SECRET=<your_jwt_secret>
   STRIPE_SECRET_KEY=<your_stripe_secret_key> 
   PORT=4000
   ```

## 🚀 Running the Project

- **Development**:
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```
## 🔐 API Endpoints

### Authentication
```http
# Register new user [Public]
POST http://localhost:5000/api/users/register
Content-Type: application/json

{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "job_seeker"  // Can be: "job_seeker", "employee", or "admin"
}

# Login [Public]
POST http://localhost:5000/api/users/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```

### Job Seeker Endpoints
```http
# Get all available jobs [Public]
GET http://localhost:5000/api/jobs

# Get specific job details [Public]
GET http://localhost:5000/api/jobs/:id

# Apply for a job (Step 1: Upload Resume) [Job Seeker]
POST http://localhost:5000/api/applications/:job_id/:user_id/initiate
Authorization: Bearer job_seeker_token
Content-Type: multipart/form-data

{
    "resume": [file]
}

# Process payment (Step 2) [Job Seeker]
POST http://localhost:5000/api/applications/:job_id/:user_id/payment
Authorization: Bearer job_seeker_token
Content-Type: application/json

{
    "payment_method": "card"
}

# Confirm payment (Step 3) [Job Seeker]
POST http://localhost:5000/api/applications/:job_id/:user_id/confirm-payment
Authorization: Bearer job_seeker_token
Content-Type: application/json

{
    "payment_intent_id": "pi_123456789"
}

# View application details [Job Seeker]
GET http://localhost:5000/api/applications/:application_id
Authorization: Bearer job_seeker_token
```

### Employee Endpoints
```http
# Create new job [Employee, Admin]
POST http://localhost:5000/api/jobs
Authorization: Bearer employee_token
Content-Type: application/json

{
    "job_title": "Frontend Developer",
    "job_description": "Job description here",
    "company_name": "Tech Corp"
}

# Update job [Employee, Admin]
PUT http://localhost:5000/api/jobs/:id
Authorization: Bearer employee_token
Content-Type: application/json

{
    "job_title": "Updated Title",
    "job_description": "Updated description",
    "company_name": "Updated Corp",
    "job_status": "closed"
}

# Delete job [Employee, Admin]
DELETE http://localhost:5000/api/jobs/:id
Authorization: Bearer employee_token

# Get jobs posted by employee [Employee, Admin]
GET http://localhost:5000/api/jobs/employee/jobs
Authorization: Bearer employee_token

# Get applications for a job [Employee]
GET http://localhost:5000/api/applications/job/:job_id
Authorization: Bearer employee_token

# Update application status [Employee]
PUT http://localhost:5000/api/applications/:application_id/status
Authorization: Bearer employee_token
Content-Type: application/json

{
    "status": "approved"  // Can be: "pending", "accepted", "rejected"
}

# Get all applications for posted jobs [Employee]
GET http://localhost:5000/api/applications/user/applications
Authorization: Bearer employee_token
```

### Admin Endpoints

#### User Management
```http
# Get all users [Admin]
GET http://localhost:5000/api/users/all
Authorization: Bearer admin_token

# Create new user [Admin]
POST http://localhost:5000/api/users/create
Authorization: Bearer admin_token
Content-Type: application/json

{
    "full_name": "New User",
    "email": "e4@gmail.com",
    "password": "password123",
    "role": "employee"  // Can be: "job_seeker", "employee", or "admin"
}

# Update user [Admin]
PUT http://localhost:5000/api/admin/users/:id
Authorization: Bearer admin_token
Content-Type: application/json

{
    "full_name": "Updated Name",
    "email": "updated@example.com",
    "role": "employee"  // Can be: "job_seeker", "employee", or "admin"
}

# Delete user [Admin]
DELETE http://localhost:5000/api/admin/users/:id
Authorization: Bearer admin_token
```

#### Applications Management
```http
# Get all applications [Admin]
GET http://localhost:5000/api/admin/applications
Authorization: Bearer admin_token

# Filter applications by status [Admin]
GET http://localhost:5000/api/admin/applications?status=accepted
Authorization: Bearer admin_token

# Filter applications by company and status [Admin]
GET http://localhost:5000/api/admin/applications?company=Scale up adds&status=accepted
Authorization: Bearer admin_token
```

#### Analytics
```http
# Get company analytics [Admin]
GET http://localhost:5000/api/admin/analytics?company=Scale up adds
Authorization: Bearer admin_token
```

### Shared Endpoints
```http
# Get all jobs [Public]
GET http://localhost:5000/api/jobs

# Get job by ID [Public]
GET http://localhost:5000/api/jobs/:id

# Create new job [Employee, Admin]
POST http://localhost:5000/api/jobs
Authorization: Bearer token
Content-Type: application/json

{
    "job_title": "Frontend Developer",
    "job_description": "Job description here",
    "company_name": "Tech Corp"
}

# Update job [Employee, Admin]
PUT http://localhost:5000/api/jobs/:id
Authorization: Bearer token
Content-Type: application/json

{
    "job_title": "Updated Title",
    "job_description": "Updated description",
    "company_name": "Updated Corp",
    "job_status": "closed"
}

# Delete job [Employee, Admin]
DELETE http://localhost:5000/api/jobs/:id
Authorization: Bearer token
```

Note: 
- Replace `:id`, `:job_id`, `:user_id`, and `:application_id` with actual IDs
- All endpoints except register and login require Authorization header
- Application fee is 100 Taka
- Resume must be uploaded as a file
- Status values: "pending", "accepted", "rejected"
- Job status values: "open", "closed"

## 👥 User Roles

### Job Seeker
- Can view all available jobs
- Can apply for jobs
- Can upload resume
- Can make payment for applications
- Can view their own applications

### Employee
- Can post new jobs
- Can update their posted jobs
- Can delete their posted jobs
- Can view applications for their jobs
- Can update application status
- Can view analytics for their posted jobs

### Admin
- Can manage all users (create, update, delete)
- Can view all applications filter by company 
- Can filter applications by status and company by filtering
- Can view company analytics by filtering
- Can manage all jobs

## 💰 Payment Flow

### Application Fee
- Fixed fee: 100 Taka per application
- Required for each job application
- Non-refundable

### Payment Process
1. **Initiate Application**
```http
POST http://localhost:5000/api/applications/:job_id/:user_id/initiate
Authorization: Bearer job_seeker_token
Content-Type: multipart/form-data

{
    "resume": [file]
}
```
- Uploads resume
- Creates pending application
- Application status: "pending_payment"

2. **Process Payment**
```http
POST http://localhost:5000/api/applications/:job_id/:user_id/payment
Authorization: Bearer job_seeker_token
Content-Type: application/json


```
- Creates payment intent
- Returns client secret for payment
- Application status: "pending_payment"

3. **Confirm Payment**
```http
POST http://localhost:5000/api/applications/:job_id/:user_id/confirm-payment
Authorization: Bearer job_seeker_token
Content-Type: application/json

{
    "payment_intent_id": "pi_123456789"
}
```
- Confirms payment
- Updates application status to "pending"
- Creates invoice record
- Application status: "pending"

### Payment Status Flow
1. pending_payment → Initial state after resume upload
2. pending → After successful payment
3. accepted → After employee/admin approval
4. rejected → After employee/admin rejection

### Invoice Generation
- Generated automatically after successful payment
- Contains:
  - Application ID
  - Amount (100 Taka)
  - Payment status
  - Payment intent ID
  - Timestamp

### Payment Security
- Uses fake payment system for development
- No real money transactions
- Payment status is automatically approved
- For production: Integrate with real payment gateway

### Error Handling
- Payment failed: Application remains in "pending_payment" state
- Invalid payment: Returns error message
- Duplicate payment: Prevents double charging
- Network issues: Retry mechanism available

## 📄 File Upload

- Supported formats: **PDF**, **DOCX**  
- Max size: **5MB**  
- Stored under `uploads/resumes/`

## 🔒 Security Features

- **JWT-based** authentication  
- **Role-based** access control  
- Password hashing with **Bcrypt**  
- Request validation using **Zod**  
- **CORS** enabled  

