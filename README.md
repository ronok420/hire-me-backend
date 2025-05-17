# HireMe Backend API Documentation

## Job Seeker Endpoints

### Authentication
First, you need to get a JWT token by logging in:

```http
POST http://localhost:50001/api/users/login
Content-Type: application/json

{
    "email": "jobseeker@example.com",
    "password": "yourpassword"
}
```

Response:
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "user_id": 123,
        "full_name": "John Doe",
        "email": "jobseeker@example.com",
        "role": "job_seeker"
    }
}
```

Add this token to all subsequent requests in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1. View Available Jobs
```http
GET http://localhost:50001/api/jobs
Authorization: Bearer your_jwt_token
```

Response:
```json
[
    {
        "job_id": 2,
        "job_title": "Senior Developer",
        "job_description": "Looking for an experienced developer...",
        "company_name": "Tech Corp",
        "job_status": "open",
        "created_at": "2024-03-20T10:00:00Z"
    }
]
```

### 2. Apply for a Job (Step 1: Initiate Application)
```http
POST http://localhost:50001/api/applications/2/123/initiate
Authorization: Bearer your_jwt_token
Content-Type: multipart/form-data

Form Data:
- resume: [Your Resume File]
```

Response:
```json
{
    "message": "Application initiated. Please complete the payment to finalize your application.",
    "application": {
        "application_id": 456,
        "job_id": 2,
        "user_id": 123,
        "resume_file_url": "uploads/resumes/resume123.pdf",
        "application_status": "pending_payment",
        "is_paid": false,
        "created_at": "2024-03-20T11:00:00Z"
    },
    "payment_required": true,
    "payment_amount": 100
}
```

### 3. Process Payment (Step 2)
```http
POST http://localhost:50001/api/applications/2/123/payment
Authorization: Bearer your_jwt_token
Content-Type: application/json
```

Response:
```json
{
    "clientSecret": "pi_fake_secret_1234567890",
    "paymentIntentId": "pi_fake_1234567890",
    "amount": 100,
    "message": "Payment intent created. Use the client secret to complete the payment."
}
```

### 4. Confirm Payment (Step 3)
```http
POST http://localhost:50001/api/applications/2/123/confirm-payment
Authorization: Bearer your_jwt_token
Content-Type: application/json

{
    "paymentIntentId": "pi_fake_1234567890"
}
```

Response:
```json
{
    "message": "Payment processed successfully. Your application is now complete and pending review.",
    "application_id": 456,
    "amount": 100
}
```

### 5. View Your Applications
```http
GET http://localhost:50001/api/applications/user/applications
Authorization: Bearer your_jwt_token
```

Response:
```json
[
    {
        "application_id": 456,
        "job_id": 2,
        "user_id": 123,
        "resume_file_url": "uploads/resumes/resume123.pdf",
        "application_status": "pending",
        "is_paid": true,
        "payment_intent_id": "pi_fake_1234567890",
        "created_at": "2024-03-20T11:00:00Z",
        "job": {
            "job_id": 2,
            "job_title": "Senior Developer",
            "company_name": "Tech Corp",
            "job_status": "open"
        },
        "invoice": {
            "invoice_id": 789,
            "payment_amount": 100,
            "payment_status": "success",
            "payment_intent_id": "pi_fake_1234567890",
            "paid_at": "2024-03-20T11:05:00Z"
        }
    }
]
```

### 6. View Specific Application Details
```http
GET http://localhost:50001/api/applications/456
Authorization: Bearer your_jwt_token
```

Response:
```json
{
    "application_id": 456,
    "job_id": 2,
    "user_id": 123,
    "resume_file_url": "uploads/resumes/resume123.pdf",
    "application_status": "pending",
    "is_paid": true,
    "payment_intent_id": "pi_fake_1234567890",
    "created_at": "2024-03-20T11:00:00Z",
    "job": {
        "job_id": 2,
        "job_title": "Senior Developer",
        "job_description": "Looking for an experienced developer...",
        "company_name": "Tech Corp",
        "job_status": "open"
    },
    "invoice": {
        "invoice_id": 789,
        "payment_amount": 100,
        "payment_status": "success",
        "payment_intent_id": "pi_fake_1234567890",
        "paid_at": "2024-03-20T11:05:00Z"
    }
}
```

## Important Notes

1. All endpoints require authentication with a valid JWT token
2. The user_id in the URL must match the authenticated user's ID
3. Resume file must be in PDF format
4. Application fee is fixed at 100 Taka
5. Payment process uses a fake payment system for testing
6. Application status flow: pending_payment → pending → accepted/rejected

## Error Responses

Common error responses you might receive:

```json
{
    "error": "Unauthorized: User ID mismatch"
}
```

```json
{
    "error": "No pending application found for this job"
}
```

```json
{
    "error": "Payment already processed for this application"
}
```

```json
{
    "error": "You have already applied for this job"
}
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
PORT=5000
```

3. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication

#### Register Job Seeker
- **POST** `/api/users/register`
- **Body:**
  ```json
  {
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Login
- **POST** `/api/users/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### User Management

#### Get All Users (Admin Only)
- **GET** `/api/admin/users`
- **Headers:**
  - `Authorization: Bearer <admin_token>`

#### Create User (Admin Only)
- **POST** `/api/users/create`
- **Headers:**
  - `Authorization: Bearer <admin_token>`
- **Body:**
  ```json
  {
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123",
    "role": "employee"
  }
  ```

#### Update User (Admin Only)
- **PUT** `/api/admin/users/:id`
- **Headers:**
  - `Authorization: Bearer <admin_token>`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "full_name": "John Updated",
    "email": "john.updated@example.com",
    "role": "employee"
  }
  ```

#### Delete User (Admin Only)
- **DELETE** `/api/admin/users/:id`
- **Headers:**
  - `Authorization: Bearer <admin_token>`

### Job Management

#### Get All Jobs
- **GET** `/api/jobs`
- **Query Parameters:**
  - `company` (optional)
  - `status` (optional)

#### Get All Jobs (Admin Only)
- **GET** `/api/admin/jobs`
- **Headers:**
  - `Authorization: Bearer <admin_token>`
- **Query Parameters:**
  - `company` (optional)
  - `status` (optional)

#### Create Job  employee
- **POST** `/api/jobs`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "job_title": "Software Engineer",
    "job_description": "Looking for a skilled developer...",
    "company_name": "Tech Corp"
  }
  ```

### Application Management

#### Get All Applications (Admin Only)
- **GET** `/api/admin/applications`
- **Headers:**
  - `Authorization: Bearer <admin_token>`
- **Query Parameters:**
  - `company` (optional)
  - `status` (optional)
  - `job_id` (optional)

#### Submit Application
- **POST** `/api/applications`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`
- **Body:**
  - `job_id`: Job ID
  - `resume`: Resume file

### Analytics (Admin Only)

#### Get Company Analytics
- **GET** `/api/admin/analytics`
- **Headers:**
  - `Authorization: Bearer <admin_token>`
- **Query Parameters:**
  - `company` (required)

## Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Role-Based Access Control

- **Admin**: Full access to all endpoints
- **Employee**: Can create jobs and view applications
- **Job Seeker**: Can view jobs and submit applications

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Features

- Role-based authentication (Admin, Employee, Job Seeker)
- JWT-based authentication
- File upload for resumes (PDF, DOCX)
- Payment processing for job applications
- Job posting and management
- Application tracking and management

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project

## File Upload

- Supported formats: PDF, DOCX
- Maximum file size: 5MB
- Files are stored in the `uploads` directory

## Payment

- Application fee: 100 Taka
- Currently using a mock payment system
- Payment status is tracked in the database

## Error Handling

The API uses standard HTTP status codes and returns error messages in the following format:
```json
{
  "error": "Error message",
  "message": "Detailed error message (if available)"
}
```

## Security

- JWT-based authentication
- Role-based access control
- Password hashing using bcrypt
- File upload validation
- CORS enabled

### Job Seeker Workflow

1. **View Jobs**
   - **GET** `/api/jobs`
   - No authentication required
   - Returns list of all open jobs

2. **Apply for a Job**
   - **POST** `/api/applications/:job_id/apply`
   - **Headers:**
     - `Authorization: Bearer <token>`
     - `Content-Type: multipart/form-data`
   - **Body:**
     - `resume`: Resume file (PDF or DOCX, max 5MB)
   - **Response:**
     ```json
     {
       "message": "Application submitted successfully. Please complete the payment to finalize your application.",
       "application": {
         "application_id": "123",
         "job_id": "456",
         "status": "pending",
         "is_paid": false
       },
       "payment_required": true,
       "payment_amount": 100
     }
     ```

3. **Complete Payment**
   - **POST** `/api/applications/:application_id/payment`
   - **Headers:**
     - `Authorization: Bearer <token>`
   - **Response:**
     ```json
     {
       "message": "Payment processed successfully. Your application is now complete.",
       "application_id": "123",
       "amount": 100
     }
     ```

4. **View Application History**
   - **GET** `/api/applications/user/applications`
   - **Headers:**
     - `Authorization: Bearer <token>`
   - **Response:**
     ```json
     [
       {
         "application_id": "123",
         "job": {
           "job_id": "456",
           "job_title": "Software Engineer",
           "company_name": "Tech Corp"
         },
         "status": "pending",
         "payment_status": "paid",
         "payment_amount": 100,
         "created_at": "2024-03-20T10:00:00Z"
       }
     ]
     ```

### File Upload Requirements

- **Supported Formats:** PDF, DOCX
- **Maximum Size:** 5MB
- **Storage:** Local disk storage in `uploads` directory
- **Validation:**
  - File type check
  - File size check
  - Required field validation

### Payment Requirements

- **Amount:** 100 Taka per application
- **Status Tracking:**
  - Payment status stored in database
  - Invoice generation after successful payment
  - Application status updated after payment 