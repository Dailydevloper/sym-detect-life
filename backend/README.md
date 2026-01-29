# Symptom Detection Backend

Local Express.js backend with PostgreSQL for the Symptom Detection application.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Setup Instructions

### 1. Install PostgreSQL

Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE symptom_detect;

# Exit psql
\q
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Configure Environment Variables

```bash
# Copy the example environment file
copy .env.example .env
```

Edit `.env` and update the following:

- `DB_PASSWORD`: Your PostgreSQL password
- `JWT_SECRET`: Generate a secure random string
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (optional)
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret (optional)

### 5. Run Database Migrations

```bash
npm run db:migrate
```

This will create all tables and insert sample data for medicines and doctors.

### 6. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### Profile

- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Medicines

- `GET /api/medicines` - Get all medicines (public)
- `GET /api/medicines/:id` - Get single medicine (public)

### Cart

- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:medicineId` - Update cart item quantity
- `DELETE /api/cart/:medicineId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders

- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order with items
- `POST /api/orders` - Create order from cart

### Doctors

- `GET /api/doctors` - Get all doctors (public)
- `GET /api/doctors/:id` - Get single doctor (public)

### Appointments

- `GET /api/appointments` - Get user's appointments
- `GET /api/appointments/:id` - Get single appointment
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Health Records

- `GET /api/health-records` - Get user's health records
- `GET /api/health-records/:id` - Get single health record
- `POST /api/health-records` - Create health record
- `DELETE /api/health-records/:id` - Delete health record

### Symptom Checks

- `GET /api/symptom-checks` - Get user's symptom checks
- `GET /api/symptom-checks/:id` - Get single symptom check
- `POST /api/symptom-checks` - Create symptom check

### Notifications

- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Database Schema

The database includes the following tables:

- `users` - User accounts
- `profiles` - Extended user profile information
- `medicines` - Pharmacy inventory
- `cart_items` - Shopping cart
- `orders` - Purchase orders
- `order_items` - Order line items
- `doctors` - Healthcare providers
- `appointments` - Doctor appointments
- `health_records` - Medical documents and records
- `symptom_checks` - AI symptom analysis results
- `notifications` - User notifications

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run migrations
npm run db:migrate
```

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- CORS protection
- Input validation with express-validator
- SQL injection protection with parameterized queries
- Environment-based configuration

## Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env` file

## Troubleshooting

### Database Connection Error

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `symptom_detect` exists

### Port Already in Use

- Change `PORT` in `.env` file
- Or stop the process using port 3001

### Migration Errors

- Ensure PostgreSQL is running
- Check database credentials
- Verify user has CREATE TABLE permissions
