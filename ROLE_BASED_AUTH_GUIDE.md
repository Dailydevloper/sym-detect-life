# Role-Based Authentication Setup Guide

This guide explains the new role-based authentication system that separates
doctors and patients with different login pages and dashboards.

## Features Implemented

### 1. Separate Authentication Pages

- **Patient Login**: `/auth` - For regular users/patients
- **Doctor Login**: `/doctor-auth` - For healthcare professionals with
  specialty and license number fields

### 2. Role-Based Routing

- Patients are redirected to `/dashboard` after login
- Doctors are redirected to `/doctor-dashboard` after login
- Routes are protected based on user roles

### 3. Database Changes

- Added `role` column to `users` table with values: 'patient', 'doctor', 'admin'
- Doctors table now links to users via `user_id` foreign key
- Added `specialty` and `license_number` fields to doctors table

### 4. Backend Updates

- Registration endpoint accepts `role`, `specialty`, and `licenseNumber` parameters
- Login endpoint validates role and provides appropriate error messages
- JWT tokens now include role information
- Doctor portal routes protected with `requireRole('doctor')` middleware

### 5. Frontend Updates

- Separate `DoctorAuth` page with doctor-specific fields
- Updated `useAuth` hook to handle role-based authentication
- `ProtectedRoute` component now supports role-based access control
- Navbar shows different menu items based on user role

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

### Doctor Registration

```typescript
await signUp(email, password, fullName, "doctor", {
  specialty: "Cardiology",
  licenseNumber: "MD12345",
});
```

## Login Flow

### Patient Login

```typescript
await signIn(email, password, "patient");
// Redirects to /dashboard
```

### Doctor Login

```typescript
await signIn(email, password, "doctor");
// Redirects to /doctor-dashboard
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user (patient or doctor)
  - Body: `{ email, password, fullName, role, specialty?, licenseNumber? }`
- `POST /api/auth/login` - Login user
  - Body: `{ email, password, role? }`
  - Returns user object with role and appropriate tokens

### Doctor Portal (Protected)

All doctor portal routes require authentication and 'doctor' role:

- `GET /api/doctor-portal/stats` - Dashboard statistics
- `GET /api/doctor-portal/appointments/today` - Today's appointments
- `GET /api/doctor-portal/appointments/upcoming` - Upcoming appointments
- `PATCH /api/doctor-portal/appointments/:id/status` - Update appointment status
- `GET /api/doctor-portal/patients/:patientId` - Patient details

## Frontend Routes

### Public Routes

- `/auth` - Patient authentication
- `/doctor-auth` - Doctor authentication

### Patient Routes (role: 'patient')

- `/dashboard` - Patient dashboard
- `/symptom-checker` - AI symptom checker
- `/medicine-store` - Browse and order medicines
- `/appointments` - View and book appointments
- `/health-records` - Medical history
- `/profile` - User profile

### Doctor Routes (role: 'doctor')

- `/doctor-dashboard` - Doctor dashboard with appointments and statistics

### Common Protected Routes

- `/video-call/:appointmentId` - Video consultation (both roles)
- `/profile` - User profile (both roles)

## Role Validation

### Frontend

The `ProtectedRoute` component checks user roles:

```tsx
<Route
  path="/doctor-dashboard"
  element={
    <ProtectedRoute requiredRole="doctor">
      <DoctorDashboard />
    </ProtectedRoute>
  }
/>
```

### Backend

The `requireRole` middleware protects API routes:

```typescript
router.use(authenticate);
router.use(requireRole("doctor"));
```

## Navbar Behavior

The navigation menu adapts based on user role:

**Patients see:**

- Dashboard
- Symptom Checker
- Medicine Store
- Appointments
- Records

**Doctors see:**

- Doctor Dashboard (only)

## Error Handling

### Wrong Role Login

If a user tries to login with the wrong role page:

```
Response: "This email is registered as a patient. Please use the patient login page."
```

### Unauthorized Access

If a patient tries to access `/doctor-dashboard`:

- Shows "Access Denied" toast
- Redirects to `/dashboard`

If a doctor tries to access `/dashboard`:

- Shows "Access Denied" toast
- Redirects to `/doctor-dashboard`

## Testing the System

### 1. Register a Patient

1. Go to http://localhost:5173/auth
2. Click "Sign Up"
3. Fill in email, password, full name
4. Click "Sign Up"
5. Should redirect to patient dashboard

### 2. Register a Doctor

1. Go to http://localhost:5173/doctor-auth
2. Click "Sign Up"
3. Fill in email, password, full name, specialty, license number
4. Click "Sign Up"
5. Should redirect to doctor dashboard

### 3. Test Role Protection

1. Login as a patient
2. Try to access http://localhost:5173/doctor-dashboard
3. Should show error and redirect to patient dashboard

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

### "Doctor profile not found" error

This means the user has role='doctor' but no entry in the doctors table.
This happens if:

- Database migration wasn't run
- Doctor registration failed to create doctor profile

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
