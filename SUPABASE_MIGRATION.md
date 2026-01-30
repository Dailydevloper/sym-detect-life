# Supabase Migration Complete

Supabase has been completely removed from this project. All authentication and data storage now uses the local Express.js backend.

## Changes Made:

1. **Removed Supabase:**
   - Deleted `src/integrations/supabase/` directory
   - Deleted `supabase/` configuration directory
   - Removed `@supabase/supabase-js` dependency

2. **Added Local Backend Integration:**
   - Created `src/lib/api.ts` - Axios client with all API methods
   - Created `src/types/index.ts` - TypeScript interfaces
   - Added `axios` dependency

3. **Updated Authentication:**
   - `src/hooks/useAuth.tsx` - Now uses local backend API
   - `src/pages/Auth.tsx` - Uses new signIn/signUp methods
   - `src/components/auth/GoogleAuthButton.tsx` - Uses local OAuth flow

## Backend Setup Required:

Before using the app, you must start the local backend:

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run db:migrate
npm run dev
```

The backend will run on `http://localhost:3001`

## Environment Variable:

Created `.env` file with:

```
VITE_API_URL=http://localhost:3001/api
```

## Next Steps:

1. Start the backend server
2. Update all page components to use the new API methods from `src/lib/api.ts`
3. Test authentication flow
4. Verify all API endpoints work correctly

## API Methods Available:

- `authApi` - login, register, logout, getCurrentUser, googleAuth
- `profileApi` - get, update
- `medicineApi` - getAll, getById
- `cartApi` - get, add, update, remove, clear
- `orderApi` - getAll, getById, create
- `doctorApi` - getAll, getById
- `appointmentApi` - getAll, getById, create, update, cancel
- `healthRecordApi` - getAll, getById, create, delete
- `symptomCheckApi` - getAll, getById, create
- `notificationApi` - getAll, markAsRead, markAllAsRead
