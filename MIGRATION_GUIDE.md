# Migration from Supabase to Local Backend - Complete Guide

This guide covers the complete migration from Supabase to a local Express.js backend with PostgreSQL.

## 📦 What's Been Created

### Backend Structure (✅ COMPLETE)

```
backend/
├── src/
│   ├── config/
│   │   └── index.ts                 # Environment configuration
│   ├── db/
│   │   ├── index.ts                 # PostgreSQL connection pool
│   │   └── schema.sql               # Database schema migration
│   ├── middleware/
│   │   ├── auth.ts                  # JWT authentication middleware
│   │   └── passport.ts              # Google OAuth strategy
│   ├── routes/
│   │   ├── auth.routes.ts           # Authentication endpoints
│   │   ├── profile.routes.ts        # User profile management
│   │   ├── medicine.routes.ts       # Medicine listing (public)
│   │   ├── cart.routes.ts           # Shopping cart operations
│   │   ├── order.routes.ts          # Order management
│   │   ├── doctor.routes.ts         # Doctor listing (public)
│   │   ├── appointment.routes.ts    # Appointment booking
│   │   ├── health-record.routes.ts  # Health records
│   │   ├── symptom-check.routes.ts  # Symptom analysis
│   │   └── notification.routes.ts   # User notifications
│   ├── scripts/
│   │   └── migrate.ts               # Database migration script
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   ├── utils/
│   │   ├── jwt.ts                   # JWT token utilities
│   │   └── password.ts              # Password hashing
│   └── server.ts                    # Express app entry point
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules
├── README.md                        # API documentation
├── SETUP.md                         # Quick setup guide
├── setup.bat                        # Windows setup script
└── database-setup.sql               # SQL commands for DB setup
```

## 🚀 Quick Start

### Prerequisites

1. Node.js v18+ installed
2. PostgreSQL v14+ installed and running
3. Git (optional)

### Step 1: Database Setup

```powershell
# Option A: Using psql command line
psql -U postgres
CREATE DATABASE symptom_detect;
\q

# Option B: Using pgAdmin
# 1. Open pgAdmin
# 2. Right-click on "Databases"
# 3. Create -> Database
# 4. Name: symptom_detect
```

### Step 2: Backend Configuration

```powershell
# Navigate to backend folder
cd backend

# Run setup script (Windows)
.\setup.bat

# Or manually:
copy .env.example .env
# Edit .env with your settings
```

**Required Environment Variables:**

```env
DB_PASSWORD=your_postgres_password    # Your PostgreSQL password
JWT_SECRET=your_random_secret_here    # Generate with: openssl rand -base64 32
```

**Optional (for Google OAuth):**

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Step 3: Run Migrations

```powershell
npm run db:migrate
```

**Expected Output:**

```
🔄 Running database migrations...
✅ Database migrations completed successfully!
```

This creates:

- 10 database tables
- Sample medicines (5 items)
- Sample doctors (4 doctors)
- All necessary indexes

### Step 4: Start Backend

```powershell
# Development mode (recommended)
npm run dev

# Production mode
npm run build
npm start
```

**Expected Output:**

```
✅ Database connected successfully
🚀 Server running on http://localhost:3001
📝 Environment: development
```

### Step 5: Test the API

Open browser or use curl:

```
http://localhost:3001/health
```

Should return:

```json
{ "status": "ok", "timestamp": "2026-01-22T..." }
```

## 🔄 Frontend Migration (Next Steps)

The backend is complete, but the frontend still uses Supabase. Here's what needs to be updated:

### Files That Need Changes:

1. `src/integrations/supabase/client.ts` → Replace with Axios client
2. `src/hooks/useAuth.tsx` → Update auth logic
3. `src/components/auth/GoogleAuthButton.tsx` → Update OAuth flow
4. `src/pages/Auth.tsx` → Update login/register
5. `src/pages/Dashboard.tsx` → Update API calls
6. `src/pages/SymptomChecker.tsx` → Update API calls
7. `src/pages/MedicineStore.tsx` → Update API calls
8. `src/pages/Appointments.tsx` → Update API calls
9. `src/pages/HealthRecords.tsx` → Update API calls
10. `src/pages/Profile.tsx` → Update API calls

### Migration Strategy:

1. Create new API client with Axios
2. Update authentication hook to use local backend
3. Replace Supabase queries with API calls (keeping React Query)
4. Update OAuth callback handling
5. Test each page individually

## 📊 Database Schema

### Core Tables

1. **users** - User accounts (replaces Supabase auth.users)
   - Email/password authentication
   - Google OAuth support
   - Email verification status

2. **profiles** - Extended user information
   - Phone, date of birth, gender
   - Auto-created on user registration

3. **medicines** - Pharmacy inventory
   - Name, price, stock, category
   - Public access (no auth required)

4. **cart_items** - Shopping cart
   - User-specific items
   - Unique constraint on user + medicine

5. **orders** - Purchase orders
   - Total amount, status, shipping address
   - Links to order_items

6. **order_items** - Order line items
   - Medicine details snapshot
   - Price at time of order

7. **doctors** - Healthcare provider directory
   - Specialty, experience, rating
   - Availability schedule
   - Public access

8. **appointments** - Doctor bookings
   - Date, time, status, notes
   - User and doctor references

9. **health_records** - Medical documents
   - Record type, title, description
   - JSONB data field for flexibility
   - File URL support

10. **symptom_checks** - AI symptom analysis
    - Symptoms array
    - AI diagnosis and recommendations
    - Severity level

11. **notifications** - User notifications
    - Title, message, type
    - Read status

### Authorization

- Row Level Security replaced with middleware checks
- User can only access their own data
- Medicines and doctors are public

## 🔐 Authentication

### Registration

```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "email_verified": false
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### Login

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Using Protected Endpoints

```http
GET http://localhost:3001/api/profile
Authorization: Bearer eyJhbG...
```

### Google OAuth Flow

**Frontend initiates:**

```javascript
window.location.href = "http://localhost:3001/api/auth/google";
```

**Backend redirects to:**

```
http://localhost:5173/auth/callback?accessToken=...&refreshToken=...
```

**Frontend extracts tokens and stores them.**

## 📝 API Examples

### Get Medicines (Public)

```http
GET http://localhost:3001/api/medicines
```

### Add to Cart (Protected)

```http
POST http://localhost:3001/api/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "medicine_id": "uuid",
  "quantity": 2
}
```

### Book Appointment (Protected)

```http
POST http://localhost:3001/api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctor_id": "uuid",
  "appointment_date": "2026-01-25",
  "appointment_time": "14:30",
  "notes": "Regular checkup"
}
```

### Create Symptom Check (Protected)

```http
POST http://localhost:3001/api/symptom-checks
Authorization: Bearer <token>
Content-Type: application/json

{
  "symptoms": ["headache", "fever", "cough"],
  "ai_diagnosis": "Possible viral infection",
  "recommendations": "Rest and hydration recommended",
  "severity_level": "medium"
}
```

## 🛠️ Development

### Project Structure

- **Config** - Environment and settings
- **DB** - Database connection and queries
- **Middleware** - Authentication and request processing
- **Routes** - API endpoint handlers
- **Utils** - Helper functions (JWT, password hashing)
- **Types** - TypeScript interfaces

### Adding New Endpoints

1. Create route file in `src/routes/`
2. Import and use in `src/server.ts`
3. Add authentication middleware if needed
4. Implement CRUD operations
5. Add input validation

### Database Queries

Use the `query` function for safe, parameterized queries:

```typescript
import { query } from "../db";

const result = await query("SELECT * FROM users WHERE email = $1", [email]);
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT tokens with expiration
- ✅ SQL injection protection (parameterized queries)
- ✅ CORS configuration
- ✅ Input validation with express-validator
- ✅ Environment-based secrets
- ✅ User-specific data isolation

## 🐛 Troubleshooting

### "Database connection failed"

- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Check database exists: `psql -U postgres -l`

### "Port 3001 already in use"

- Change PORT in `.env`
- Or find and kill process: `netstat -ano | findstr :3001`

### "Migration failed"

- Check database exists
- Verify user has CREATE permissions
- Check for syntax errors in schema.sql

### "Invalid token"

- Token expired (default: 7 days)
- User was deleted
- JWT_SECRET changed

### Google OAuth not working

- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `.env`
- Check callback URL matches Google Console: `http://localhost:3001/api/auth/google/callback`
- Ensure Google+ API is enabled

## 📈 Performance Optimization

- Connection pooling (max 20 connections)
- Database indexes on foreign keys
- Parameterized query caching
- JWT stateless authentication (no DB lookup per request)

## 🚀 Deployment Considerations

### Environment Variables

- Use strong JWT_SECRET (32+ characters)
- Enable HTTPS in production
- Set NODE_ENV=production
- Use environment-specific database

### Database

- Enable connection pooling
- Set up regular backups
- Monitor query performance
- Consider read replicas for scaling

### Security

- Enable rate limiting
- Add request logging
- Implement refresh token rotation
- Set secure cookie flags

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Passport.js Guide](http://www.passportjs.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## ✅ Completion Checklist

Backend:

- [x] Express.js server setup
- [x] PostgreSQL connection
- [x] Database schema migration
- [x] JWT authentication
- [x] Google OAuth integration
- [x] All API endpoints (10 resources)
- [x] Input validation
- [x] Error handling
- [x] CORS configuration
- [x] Documentation

Frontend (To Do):

- [ ] Replace Supabase client with Axios
- [ ] Update useAuth hook
- [ ] Update all page components
- [ ] Test authentication flow
- [ ] Test all CRUD operations
- [ ] Update OAuth callback handling

## 🎉 Summary

You now have a fully functional local backend that:

- Replaces all Supabase functionality
- Maintains the same data structure
- Provides RESTful API endpoints
- Supports both email/password and Google OAuth
- Includes comprehensive documentation

**Ready to proceed with frontend migration?**
