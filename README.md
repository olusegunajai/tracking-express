# Tokyo Express CMS

A comprehensive Content Management System for logistics and package tracking.

## Features

- **Package Management**: Create, update, and track packages with status history.
- **Route Management**: Define shipping routes and assign packages to them.
- **Bulk Actions**: Perform operations on multiple packages at once.
- **Content Management**: Edit website sections and settings directly from the admin panel.
- **Authentication**: Secure admin login with JWT.

## Localhost Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd tokyo-express-cms
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   JWT_SECRET=your_super_secret_key
   # For local SQLite (default)
   # DATABASE_URL=sqlite://tokyo_express.db
   # For PostgreSQL (Neon)
   # DATABASE_URL=postgres://user:password@host:port/database?sslmode=require
   ```

4. **Run the application**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

5. **Login Credentials**:
   - **Username**: `admin`
   - **Password**: `admin123`

## Scripts

- `npm run dev`: Starts the development server (Express + Vite).
- `npm run build`: Builds the frontend for production.
- `npm run lint`: Runs TypeScript type checking.
- `npm run clean`: Removes the `dist` folder.

## 🚀 Deploying to Netlify

This project is optimized for deployment on **Netlify** using **Netlify Functions** for backend logic (Email notifications, settings, etc.).

### 1. Setup Steps
1. Connect your GitHub repository to Netlify.
2. **Configure Build Settings**:
   - **Base directory**: (Leave empty if `package.json` is at the root. If your project is in a folder like `tokyo-express`, enter `tokyo-express`).
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. **Add Environment Variables**:
   - Go to Site settings > Build & deploy > Environment variables.
   - Add all variables from `.env.example`.

### 2. Common Errors
- **"missing package.json"**: This usually means the **Base directory** in Netlify settings is wrong. Ensure it points to the folder containing your `package.json`.
- **"Firebase configuration error"**: Ensure you have pushed your `firebase-applet-config.json` or provided the equivalent environment variables.
