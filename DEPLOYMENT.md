# Tokyo Express CMS - Deployment Guide

This project is built with a React frontend and an Express backend. For production deployment on Netlify with a Neon PostgreSQL database, follow these steps.

## 1. Database Setup (Neon)
1. Go to [Neon.tech](https://neon.tech) and create a new project.
2. In the Neon dashboard, copy your **Connection String** (PostgreSQL URL).
3. Run the following SQL in the Neon SQL Editor to initialize your tables:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'admin'
);

CREATE TABLE packages (
  id SERIAL PRIMARY KEY,
  tracking_number TEXT UNIQUE,
  sender_name TEXT,
  receiver_name TEXT,
  origin TEXT,
  destination TEXT,
  status TEXT,
  weight REAL,
  estimated_delivery TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  name TEXT,
  origin TEXT,
  destination TEXT,
  distance REAL,
  estimated_time TEXT
);

CREATE TABLE content (
  id SERIAL PRIMARY KEY,
  section TEXT UNIQUE,
  title TEXT,
  body TEXT
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Insert initial admin (password: admin123)
-- Note: In production, use a hashed password.
INSERT INTO users (username, password) VALUES ('admin', '$2a$10$7p.YvY0vQvXvXvXvXvXvXvXvXvXvXvXvXvXvXvXvXvXvXvXvXvXv');
```

## 2. Netlify Configuration
1. Connect your repository to Netlify.
2. Set the following **Environment Variables** in the Netlify UI:
   - `DATABASE_URL`: Your Neon connection string.
   - `JWT_SECRET`: A long random string for security.
   - `NODE_ENV`: `production`

## 3. Code Modifications for Production
The current `server.ts` uses `better-sqlite3`. To switch to Neon (PostgreSQL) in production:
1. Install `pg`: `npm install pg`
2. Update `server.ts` to use `pg.Pool` when `process.env.DATABASE_URL` is present.

## 4. Logo Usage
The logo is referenced in the application via the following URL:
`https://ais-pre-vgrogfqn4nt5cpncslls24-458691759309.europe-west2.run.app/logo.png`

Ensure this asset is accessible or uploaded to your production CDN.
