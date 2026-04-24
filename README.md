# Nebula Hub (Proxy Nebula)
A browser-based productivity and entertainment platform.

## Deployment Guide (Free & Permanent)

To host Nebula Hub online for free, follow these steps:

### 1. Database (MongoDB Atlas)
1. Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/).
2. Create a new "Shared" cluster.
3. In "Network Access", add `0.0.0.0/0` (Allow access from anywhere).
4. In "Database Access", create a user with a password.
5. Click "Connect" -> "Drivers" and copy your `MONGODB_URI`. It should look like:
   `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`

### 2. Backend (Render)
1. Create a free account at [Render.com](https://render.com).
2. Create a new **Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - **Name**: `nebula-hub-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Environment Variables**:
   - `MONGODB_URI`: (Your connection string from Step 1)
   - `JWT_SECRET`: (A random string, e.g., `nebula_secret_123`)
   - `NODE_ENV`: `production`
6. Once deployed, copy your backend URL (e.g., `https://nebula-hub-backend.onrender.com`).

### 3. Frontend (Vercel)
1. Create a free account at [Vercel.com](https://vercel.com).
2. Create a new **Project**.
3. Connect your GitHub repository.
4. Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `client`
5. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: (Your backend URL from Step 2, e.g., `https://nebula-hub-backend.onrender.com`)
6. Click **Deploy**.

## Local Development
1. Clone the repo.
2. Install dependencies in both `server` and `client` folders using `npm install`.
3. Set up `.env` files based on the `.env.example` files provided.
4. Run `npm run dev` in both folders.
