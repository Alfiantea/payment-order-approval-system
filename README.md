# Payment Order Approval System

This project is a web application for managing payment order approvals. The backend is built with Express.js and TypeScript, and the frontend is a React application built with Vite.

## Deployment

This guide explains how to deploy the application on a local machine for development and on a VPS for production.

### Localhost Deployment (Development)

**Prerequisites:**
- Node.js (v18 or later)
- bun (https://bun.sh/)
- PostgreSQL database running locally

**1. Backend Setup:**

- **Navigate to the backend directory:**
  ```bash
  cd backend
  ```
- **Install dependencies:**
  ```bash
  bun install
  ```
- **Set up environment variables:**
  - Copy the `.env.example` file to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```
  - Edit the `.env` file and set the `DATABASE_URL` to your local PostgreSQL connection string.
- **Run database migrations:**
  - Make sure your PostgreSQL server is running and the database specified in `DATABASE_URL` exists.
  - Run the migration script:
    ```bash
    bun run db:migrate
    ```
- **Start the backend server:**
  ```bash
  bun run dev
  ```
- The backend server will be running on `http://localhost:4000`.

**2. Frontend Setup:**

- **Navigate to the frontend directory:**
  ```bash
  cd ../frontend
  ```
- **Install dependencies:**
  ```bash
  bun install
  ```
- **Start the frontend development server:**
  ```bash
  bun run dev
  ```
- The frontend will be available at `http://localhost:5173`.

### VPS Deployment (Production)

**Prerequisites:**
- A VPS with Node.js, bun, and PostgreSQL installed.
- A process manager like `pm2` (`npm install -g pm2`).
- A web server like Nginx.

**1. Clone the Repository:**
```bash
git clone <repository_url>
cd <repository_directory>
```

**2. Backend Setup:**

- **Navigate to the backend directory and install dependencies:**
  ```bash
  cd backend
  bun install --production
  ```
- **Set up environment variables:**
  - Create a `.env` file and set the `DATABASE_URL` for your production database.
  - Also set `NODE_ENV=production`.
- **Run database migrations:**
  ```bash
  bun run db:migrate
  ```
- **Build the backend:**
  - The backend is a TypeScript application, so it needs to be compiled to JavaScript.
  - Run the TypeScript compiler:
    ```bash
    bunx tsc
    ```
- **Start the server with `pm2`:**
  ```bash
  pm2 start dist/index.js --name "payment-api"
  ```

**3. Frontend Setup:**

- **Navigate to the frontend directory and install dependencies:**
  ```bash
  cd ../frontend
  bun install --production
  ```
- **Build the frontend for production:**
  - The build command will generate static files in the `dist` directory.
  - You will need to add a `build` script to `frontend/package.json`:
    `"build": "vite build"`
  - Then run the build:
    ```bash
    bun run build
    ```

**4. Configure Nginx:**

- Set up an Nginx server block to:
  - Serve the static frontend files from `frontend/dist`.
  - Reverse proxy API requests to the backend server running on `localhost:4000`.

- **Example Nginx Configuration:**
  ```nginx
  server {
      listen 80;
      server_name your_domain.com;

      root /path/to/your/project/frontend/dist;
      index index.html;

      location / {
          try_files $uri /index.html;
      }

      location /api/ {
          proxy_pass http://localhost:4000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
      }
  }
  ```

- **Note:** You will need to adjust the API paths in the frontend code to be relative (e.g., `/api/auth/login`) or configure the `baseURL` in `frontend/src/services/api.ts` to point to your domain. For this setup, you should adjust the backend routes to be prefixed with `/api`. For example, in `backend/src/index.ts`, change `app.use('/auth', authRoutes)` to `app.use('/api/auth', authRoutes)`.
