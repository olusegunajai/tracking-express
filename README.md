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

## Deployment

For detailed deployment instructions (Netlify + Neon), see [DEPLOYMENT.md](./DEPLOYMENT.md).
