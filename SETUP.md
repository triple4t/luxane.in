# Project Setup Guide

Complete instructions to set up and run this project on a new machine.

---

## Prerequisites

Install the following before starting:

| Requirement | Version / Notes |
|-------------|-----------------|
| **Node.js** | v18 or higher (LTS recommended) |
| **npm**     | Comes with Node.js (v9+)        |
| **PostgreSQL** | v12 or higher                |
| **Git**     | For cloning the repository     |

- **Node.js**: [https://nodejs.org](https://nodejs.org)  
- **PostgreSQL**: [https://www.postgresql.org/download](https://www.postgresql.org/download)  
  - On macOS: `brew install postgresql` then `brew services start postgresql`  
  - On Windows: use the official installer or WSL.

---

## 1. Clone the repository

```bash
git clone <repository-url>
cd Ornaments
```

*(Replace `<repository-url>` with the actual Git URL.)*

---

## 2. Database

1. **Start PostgreSQL** (if not already running).

2. **Create a database** for the project (e.g. `jewelcraft_db` or any name you use in your backend config).

3. Ensure the backend can connect to this database (connection string is configured in the backend environment; no changes needed in code).

---

## 3. Backend setup

1. **Go to the backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the backend**  
   Ensure the backend has the required environment configuration (see `backend/` for any `.env.example` or README). No code changes are needed for a standard setup.

4. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```
   When prompted, choose a name for the migration if this is the first run (e.g. `init`). This creates/updates all tables.

6. **Start the backend (development):**
   ```bash
   npm run dev
   ```
   The API will run at **http://localhost:5001** (or the port set in your backend config).  
   You should see something like: `Server running on http://localhost:5001`.

Leave this terminal open.

---

## 4. Frontend setup

Use a **new terminal** (backend keeps running in the first one).

1. **Go to the frontend folder** (from the project root):
   ```bash
   cd jewelcraft-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the frontend**  
   Ensure the frontend is configured to talk to your backend (e.g. API base URL). Check `jewelcraft-ui/` for any env or README.

4. **Start the frontend (development):**
   ```bash
   npm run dev
   ```
   The app will run at **http://localhost:5173** (or the port Vite prints). Open this URL in the browser.

---

## 5. Verify

- **Frontend:** Open `http://localhost:5173` (or the port shown) in the browser.  
- **Backend health:** Visit `http://localhost:5001/api/health` (or your backend URL + `/api/health`).  
- You can register, log in, and use the app.

---

## Quick reference (two terminals)

**Terminal 1 – Backend**
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

**Terminal 2 – Frontend**
```bash
cd jewelcraft-ui
npm install
npm run dev
```

---

## Optional commands

### Prisma Studio (database UI)

```bash
cd backend
npm run prisma:studio
```
Opens at **http://localhost:5555** by default.

### Production build

**Backend**
```bash
cd backend
npm run build
npm start
```

**Frontend**
```bash
cd jewelcraft-ui
npm run build
npm run preview
```

---

## Troubleshooting

### “Database connection” or “Can’t reach database”

- Confirm PostgreSQL is running (e.g. `pg_isready` or your OS service manager).
- Confirm the database exists and the connection string in the backend config is correct (correct host, port, user, password, database name).

### “Port already in use”

- Backend: Change the port in the backend configuration and restart.
- Frontend: If 5173 is busy, Vite will offer another port; ensure the frontend API URL still points to your backend port.

### Migrations fail or schema is out of sync

- From `backend/` run:
  ```bash
  npx prisma migrate dev
  ```
- If you need a clean database (all data will be lost):
  ```bash
  npx prisma migrate reset
  ```

### Module or dependency errors

- Delete `node_modules` and lockfile, then reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
  Do this in both `backend/` and `jewelcraft-ui/` if needed.

---

## Project structure

| Path            | Description                |
|-----------------|----------------------------|
| `backend/`      | Node.js + Express API      |
| `backend/prisma/` | Schema and migrations   |
| `jewelcraft-ui/`  | React + Vite frontend    |

Backend default port: **5001**.  
Frontend default port: **5173**.
