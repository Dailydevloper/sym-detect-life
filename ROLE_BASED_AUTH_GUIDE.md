# Role-Based Authentication Setup Guide

This guide explains the role-based authentication system and protected routing.

## Features Implemented

### 1. Authentication Page

- **Login**: `/auth` - For regular users/patients

### 2. Role-Based Routing

- Users are redirected to `/dashboard` after login
- Routes are protected based on user roles

### 3. Database Changes

- Added `role` column to `users` table with values: 'patient', 'doctor', 'admin'

### 4. Backend Updates

- Registration endpoint accepts patient fields
- Login endpoint validates credentials
- JWT tokens now include role information
  -- Role-protected routes handled with `requireRole(...)` middleware

### 5. Frontend Updates

- Updated `useAuth` hook to handle role-based authentication
- `ProtectedRoute` component now supports role-based access control
- Navbar shows shared menu items

## Database Migration

### Option 1: Fresh Installation

If setting up a new database, the schema already includes the role column.
Just run:

```bash
cd backend
npm run db:migrate
```

### Option 2: Existing Database

If you have an existing database with users, run the migration script:

```bash
# Using psql
psql -U your_username -d your_database -f backend/src/db/add-role-migration.sql

# Or using the migrate script (update it to include the migration file)
npm run db:migrate
```

The migration script will:

- Add `role` column to users table (default: 'patient')
- Add role validation constraint
- Update existing users to have 'patient' role
- Add required columns to doctors table

## Registration Flow

### Patient Registration

```typescript
await signUp(email, password, fullName, "patient");
```

## Login Flow

### Patient Login

```typescript
await signIn(email, password, "patient");
// Redirects to /dashboard
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
  - Body: `{ email, password, fullName }`
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns user object with role and appropriate tokens

## Frontend Routes

### Public Routes

- `/auth` - Patient authentication

### Patient Routes (role: 'patient')

- `/dashboard` - Patient dashboard
- `/symptom-checker` - AI symptom checker
- `/medicine-store` - Browse and order medicines
- `/appointments` - View and book appointments
- `/health-records` - Medical history
- `/profile` - User profile

### Common Protected Routes

- `/video-call/:appointmentId` - Video consultation
- `/profile` - User profile

## Role Validation

### Frontend

The `ProtectedRoute` component checks user roles for restricted pages.

### Backend

The `requireRole` middleware protects API routes as needed.

## Navbar Behavior

The navigation menu adapts based on user role:

**Patients see:**

- Dashboard
- Symptom Checker
- Medicine Store
- Appointments
- Records

All users use the shared navigation menu.

## Error Handling

### Unauthorized Access

Access-denied cases redirect users to `/dashboard`.

## Testing the System

### 1. Register a Patient

1. Go to http://localhost:5173/auth
2. Click "Sign Up"
3. Fill in email, password, full name
4. Click "Sign Up"
5. Should redirect to patient dashboard

### 2. Test Role Protection

1. Login as a patient
2. Try to access a patient-only route
3. Should show error and redirect to dashboard

## Environment Variables

Ensure your `.env` file in the backend directory has:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=healthcare_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

## Troubleshooting

### Role assignment issues

If roles are incorrect, rerun migrations and verify the `users.role` values.

Solution: Re-register the doctor or manually link the user to a doctor record.

### Role mismatch errors

Make sure the `role` column exists in the users table:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';
```

If not found, run the migration script.

## Next Steps

Consider implementing:

1. Admin role for system management
2. Doctor verification system (approve licenses before activation)
3. Multi-role support (user can be both patient and doctor)
4. Role-based permissions for specific features
5. Doctor profile completion workflow
6. License number validation against medical board APIs
