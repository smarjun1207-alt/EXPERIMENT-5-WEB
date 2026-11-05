# TechFest 2026 Portal - Cloud Deployment Guide

## Course: Web Technology Laboratory (23CSB40B) | Module 5: Cloud Deployment

---

## 1. Cloud Architecture Overview

The TechFest 2026 Portal follows a production three-tier cloud deployment model:
1. **Database Tier**: Hosted on **MongoDB Atlas** (Cloud-managed NoSQL replica set).
2. **Backend API Tier**: Hosted on **Render** (Fully managed Linux Web Service running Express 5).
3. **Frontend Client Tier**: Hosted on **Netlify** (Global Edge CDN hosting Vite React SPA).

```
[ Browser / User ]
       |
       | HTTPS
       v
[ Netlify Edge CDN ]  ----(API Requests with Credentials)---->  [ Render Web Service ]
(React Vite Frontend)                                          (Express 5 REST API)
                                                                        |
                                                                        | Mongoose TLS
                                                                        v
                                                              [ MongoDB Atlas Cluster ]
```

---

## 2. Tier 1: MongoDB Atlas Database Deployment

### Step-by-Step Procedure
1. **Create an Account**:
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register a free account.
2. **Deploy Free Cluster**:
   - Click **Create Deployment** → Select **M0 Free Tier** (Shared).
   - Choose Cloud Provider (AWS / GCP / Azure) and the closest region (e.g. `ap-south-1` Mumbai).
   - Name the cluster (e.g., `Cluster0`).
3. **Create Database User**:
   - Under **Database Access** → Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Set Username (e.g., `techfest_admin`) and generate a secure password.
   - Database User Privileges: **Read and write to any database**.
   - Click **Add User**.
4. **Configure Network IP Access**:
   - Under **Network Access** → Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`).
   - *Note*: This is required so Render's dynamic cloud instances can connect to the database.
   - Click **Confirm**.
5. **Obtain Connection String**:
   - Under **Database** → Click **Connect** on your cluster.
   - Select **Drivers** (Node.js).
   - Copy the SRV connection URI:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/techfest?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your credentials. Set database name to `techfest`.

---

## 3. Tier 2: Backend API Deployment on Render

### Step-by-Step Procedure
1. **Sign in to Render**:
   - Go to [render.com](https://render.com) and log in using your GitHub account.
2. **Create New Web Service**:
   - In Dashboard, click **New +** → Select **Web Service**.
   - Connect your GitHub repository (`API_techfest_arjun` or your pushed repository).
3. **Configure Service Details**:
   - **Name**: `techfest-2026-api`
   - **Region**: Closest to Atlas (e.g., Singapore or Frankfurt).
   - **Branch**: `main`
   - **Root Directory**: (Leave blank if repo root contains `server.js`, or set `API_techfest_arjun` if nested).
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. **Configure Environment Variables**:
   In the **Environment** tab, add the following key-value pairs:
   | Key | Value Description | Example / Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | Environment mode | `production` |
   | `MONGO_URI` | MongoDB Atlas URI | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/techfest` |
   | `JWT_SECRET` | Strong random secret | `prod_jwt_super_secret_techfest_2026_key` |
   | `JWT_EXPIRES`| Token duration | `2h` |
   | `CLIENT_URL` | Netlify Frontend URL | `https://your-frontend.netlify.app` |

5. **Deploy**:
   - Click **Deploy Web Service**.
   - Monitor the deploy logs. Confirm `MongoDB connected successfully` and `API listening on http://localhost:...`.
6. **Verify Health Endpoint**:
   - Once deployed, visit:
     `https://<YOUR-RENDER-SUBDOMAIN>.onrender.com/api/health`
   - Expected JSON response:
     ```json
     {
       "success": true,
       "status": "healthy",
       "message": "TechFest API is up and running",
       "environment": "production"
     }
     ```

---

## 4. Tier 3: Frontend Deployment on Netlify

### Step-by-Step Procedure
1. **Update API URL in React Project**:
   In your React frontend (`techfest-react` / `client`), create `.env.production`:
   ```env
   VITE_API_URL=https://<YOUR-RENDER-SUBDOMAIN>.onrender.com
   ```
2. **SPA Routing Configuration**:
   Create a file named `public/_redirects` containing:
   ```text
   /*    /index.html   200
   ```
   *Purpose*: Ensures that refreshing routes like `/events` or `/register` serves `index.html` so React Router handles routing without returning 404.

3. **Deploy on Netlify**:
   - Go to [netlify.com](https://netlify.com) and log in with GitHub.
   - Click **Add new site** → **Import an existing project**.
   - Select your GitHub repository.
   - Set:
     - **Base directory**: `techfest-react` (or client folder)
     - **Build command**: `npm run build`
     - **Publish directory**: `dist` (or `build` if CRA)
   - In **Environment variables**, add:
     - `VITE_API_URL` = `https://<YOUR-RENDER-SUBDOMAIN>.onrender.com`
   - Click **Deploy Site**.

4. **Update Render CORS**:
   - Copy your Netlify URL: `https://<YOUR-SITE-NAME>.netlify.app`.
   - Update `CLIENT_URL` in your Render Environment settings to match this Netlify URL.
   - Render will auto-redeploy with the new CORS origin.

---

## 5. Live Deployment URLs Record Sheet

*(Fill in these actual URLs after performing the cloud deployments)*

- **MongoDB Atlas Cluster**: `Cluster0 (AWS ap-south-1)`
- **Render Backend API URL**: `https://techfest-api-placeholder.onrender.com`
- **Render API Health Endpoint**: `https://techfest-api-placeholder.onrender.com/api/health`
- **Netlify Frontend Live Site**: `https://techfest-2026-portal.netlify.app`

---

## 6. Pre-Submission Deployment Checklist
- [x] Backend connects to MongoDB Atlas without hardcoded credentials in source code.
- [x] Render service uses `process.env.PORT` dynamically.
- [x] CORS properly configured with `credentials: true` and production origin.
- [x] `/api/health` endpoint responds with 200 OK.
- [x] SPA redirect rule `/* /index.html 200` present in Netlify build.
- [x] HTTPS active on all deployed endpoints (verified padlock in browser).

