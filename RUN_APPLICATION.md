# How to Run the Application

This guide will help you set up and run both the backend and frontend of the Ornaments e-commerce application.

## Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher) - Make sure it's running
- **npm** or **yarn**

## Step 1: Database Setup

1. **Start PostgreSQL** (if not already running):
   ```bash
   # On macOS with Homebrew
   brew services start postgresql
   
   # Or check if it's running
   pg_isready
   ```

2. **Verify database connection**:
   - Database name: `jewelcraft_db`
   - User: `tejas`
   - Password: `1234`
   - Port: `5432`
   - Connection string: `postgresql://tejas:1234@localhost:5432/jewelcraft_db`

## Step 2: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment variables**:
   - The `.env` file is already configured with your credentials

4. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations** (to add OTP fields):
   ```bash
   npm run prisma:migrate
   ```
   - This will create the necessary tables and add OTP fields to User and Order models

6. **Start the backend server**:
   ```bash
   npm run dev
   ```
   
   The backend will run on: **http://localhost:5001**
   
   You should see:
   ```
   🚀 Server running on http://localhost:5001
   📊 Health check: http://localhost:5001/api/health
   ```

## Step 3: Frontend Setup

1. **Open a new terminal** and navigate to frontend directory:
   ```bash
   cd jewelcraft-ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment variables**:
   - The `.env` file is already configured with `VITE_API_URL=http://localhost:5001/api`
   - No changes needed unless you're using a different backend port

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```
   
   The frontend will run on: **http://localhost:5173** (or another port if 5173 is busy)

## Step 4: Access the Application

- **Frontend**: Open your browser and go to `http://localhost:5173` (or the port shown in terminal)
- **Backend API**: `http://localhost:5001/api`
- **Health Check**: `http://localhost:5001/api/health`

## Quick Start (All Commands)

If you want to run everything quickly, use these commands in separate terminals:

### Terminal 1 (Backend):
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Terminal 2 (Frontend):
```bash
cd jewelcraft-ui
npm install
npm run dev
```

## Troubleshooting

### Database Connection Issues

If you get database connection errors:

1. **Check if PostgreSQL is running**:
   ```bash
   pg_isready
   ```

2. **Verify database exists**:
   ```bash
   psql -U tejas -d postgres -c "\l" | grep jewelcraft_db
   ```

3. **Create database if it doesn't exist**:
   ```bash
   psql -U tejas -d postgres -c "CREATE DATABASE jewelcraft_db;"
   ```

### Port Already in Use

If port 5001 or 5173 is already in use:

1. **Backend**: Change `PORT` in `backend/.env`
2. **Frontend**: Update `VITE_API_URL` in `jewelcraft-ui/.env` to match the new backend port

### Migration Errors

If migrations fail:

1. **Reset database** (⚠️ This will delete all data):
   ```bash
   cd backend
   npx prisma migrate reset
   ```

2. **Or create a new migration**:
   ```bash
   npx prisma migrate dev --name add_otp_fields
   ```

## Features Available

Once running, you can:

1. **Register** with email, password, and optional name and phone
2. **Login** with email + password
3. **Place Orders** (select address and proceed to Razorpay payment)
4. **Browse Products**, manage cart, wishlist, etc.

## Production Build

### Backend:
```bash
cd backend
npm run build
npm start
```

### Frontend:
```bash
cd jewelcraft-ui
npm run build
npm run preview
```

## Additional Commands

### Prisma Studio (Database GUI):
```bash
cd backend
npm run prisma:studio
```
Opens a visual database editor at `http://localhost:5555`

### Check Backend Health:
```bash
curl http://localhost:5001/api/health
```

## Notes

- Backend runs on port **5001** (as per your `.env`)
- Frontend runs on port **5173** (default Vite port)
- Database runs on PostgreSQL port **5432**
