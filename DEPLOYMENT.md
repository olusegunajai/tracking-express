# Deployment Guide: Netlify + Neon

This guide outlines the process for deploying the **Tokyo Express CMS** to production using **Netlify** for the frontend and **Neon** for the PostgreSQL database.

## 1. Database Setup (Neon)

1.  **Create a Neon Account**: Sign up at [neon.tech](https://neon.tech/).
2.  **Create a New Project**: Give it a name (e.g., `tokyo-express-cms`).
3.  **Get the Connection String**:
    -   In the Neon console, find your **Connection String**.
    -   It should look like: `postgres://user:password@host:port/database?sslmode=require`.
    -   Copy this string for the next steps.

## 2. Backend Deployment (Render / Railway)

Since the backend is an Express server, it needs a Node.js hosting environment.

### Using Render (Recommended)

1.  **Create a New Web Service**: Connect your GitHub repository.
2.  **Configure Build Settings**:
    -   **Environment**: `Node`
    -   **Build Command**: `npm install && npm run build`
    -   **Start Command**: `node server.ts` (Note: Ensure `tsx` is used or compile to JS)
3.  **Add Environment Variables**:
    -   `DATABASE_URL`: Paste your Neon connection string.
    -   `JWT_SECRET`: A strong random string.
    -   `NODE_ENV`: `production`
4.  **Deploy**: Render will automatically build and deploy your backend.

## 3. Frontend Deployment (Netlify)

1.  **Connect Repository**: Log in to Netlify and select "New site from Git".
2.  **Configure Build Settings**:
    -   **Build Command**: `npm run build`
    -   **Publish Directory**: `dist`
3.  **Add Environment Variables**:
    -   `VITE_API_URL`: The URL of your deployed backend (e.g., `https://tokyo-express-api.onrender.com`).
4.  **Deploy**: Netlify will build your React app and serve it as a static site.

## 4. Environment Variables Summary

| Variable | Location | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Backend | Neon PostgreSQL connection string. |
| `JWT_SECRET` | Backend | Secret key for signing JWT tokens. |
| `VITE_API_URL` | Frontend | The base URL of your backend API. |

## 5. Database Migration (Production)

The application is designed to automatically initialize the database schema on startup. Once the backend is connected to Neon via `DATABASE_URL`, it will create the necessary tables and seed the initial admin user.

---

**Note**: Ensure your frontend code uses `import.meta.env.VITE_API_URL` for API calls to point to the correct backend environment.
