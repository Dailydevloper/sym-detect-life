# 🚀 Quick Start - Test Your Local Backend

## Step 1: Start Backend (Terminal 1)

```bash
cd backend
npm install
```

Create `.env` file:

```bash
# backend/.env
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/symptom_detect
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (optional - comment out if not using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
FRONTEND_URL=http://localhost:8080
```

Setup database:

```bash
# Create PostgreSQL database (if not exists)
createdb symptom_detect

# Run migrations
npm run db:migrate

# Start backend
npm run dev
```

✅ Backend running at http://localhost:3001

## Step 2: Start Frontend (Terminal 2)

```bash
# In project root
npm run dev
```

✅ Frontend running at http://localhost:8080

## Step 3: Test Authentication

1. Open http://localhost:8080
2. Click "Sign In / Sign Up"
3. Create an account:
   - Email: `test@example.com`
   - Password: `password123`
   - Full Name: `Test User`
4. Click "Create Account"

✅ You should be logged in and redirected to dashboard!

## 🧪 Test API Endpoints

### Using Browser DevTools

Open DevTools Console and test:

```javascript
// Get current user
const response = await fetch("http://localhost:3001/api/auth/me", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});
console.log(await response.json());

// Get medicines
const medicines = await fetch("http://localhost:3001/api/medicines");
console.log(await medicines.json());

// Get profile
const profile = await fetch("http://localhost:3001/api/profile", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});
console.log(await profile.json());
```

### Using curl

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get medicines (public)
curl http://localhost:3001/api/medicines

# Get profile (authenticated)
curl http://localhost:3001/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📊 Database Check

Check if data exists:

```bash
psql symptom_detect

SELECT * FROM users;
SELECT * FROM profiles;
SELECT * FROM medicines;
SELECT * FROM doctors;
```

## 🐛 Troubleshooting

### Backend won't start

**Error**: "Database connection failed"

- Check PostgreSQL is running: `pg_isready`
- Check credentials in `backend/.env`
- Create database: `createdb symptom_detect`

**Error**: "Port 3001 already in use"

- Kill existing process: `lsof -ti:3001 | xargs kill` (Mac/Linux)
- Or change port in `backend/.env`: `PORT=3002`

### Frontend can't connect

**Error**: "Network Error" in browser console

- Check backend is running: http://localhost:3001/api/health
- Check `.env` has correct API URL: `VITE_API_URL=http://localhost:3001/api`
- Restart frontend: `npm run dev`

### Login not working

**Error**: "Invalid credentials"

- Check user exists in database
- Try registering a new account first

**Error**: Token expired

- Tokens expire after 15 minutes
- Just login again (auto-refresh should handle this)

### CORS errors

**Error**: "CORS policy blocked"

- Backend has CORS enabled for http://localhost:8080
- If using different port, update `backend/src/server.ts`

## ✅ Success Checklist

- [ ] Backend starts without errors
- [ ] Database connection works
- [ ] Sample medicines visible in database
- [ ] Frontend loads at http://localhost:8080
- [ ] Can create new account
- [ ] Can login with credentials
- [ ] Can see dashboard after login
- [ ] Access token stored in localStorage
- [ ] API requests include Authorization header
- [ ] Can logout successfully

## 🎉 All Working?

Congratulations! Your local backend is fully operational.

Now you can:

1. Test all features (medicines, appointments, health records)
2. Update page components to use new API
3. Customize the backend for your needs
4. Deploy when ready

Need help? Check [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) for API usage examples.
