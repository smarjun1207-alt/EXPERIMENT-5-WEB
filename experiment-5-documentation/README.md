# TechFest 2026 Portal - Experiment 5: Security, Version Control, CI/CD & Cloud Deployment

## Course: Web Technology Laboratory (23CSB40B) | Semester 7
**Mar Baselios College of Engineering and Technology (Autonomous), Thiruvananthapuram**  
**Theme:** TechFest 2026 Portal (MERN Stack Full-Stack Integration & Production Hardening)

---

## 1. Project Overview
This repository contains the backend and deployment configuration for the **TechFest 2026 Portal**, extended from Experiment 4 to complete **Experiment 5** according to the college laboratory manual.

Experiment 5 focuses on transforming the local MERN stack prototype into a production-ready, secured, version-controlled, tested, and cloud-deployable full-stack application.

### Key Objectives Achieved:
1. **Application Security Hardening (OWASP Top 10 Defenses)**:
   - Helmet HTTP security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options).
   - In-depth NoSQL injection sanitization and schema-level type enforcement.
   - XSS defense with HTML output entity encoding and CSP script policies.
   - Hardened JWT authentication with `httpOnly`, `secure`, and `SameSite` cookies, plus dedicated logout endpoint.
   - Comprehensive request validation using `express-validator`.
2. **Git & GitHub Version Control**:
   - Clean `.gitignore` and `.env.example` templates ensuring zero secret leakage.
   - Systematic feature branching workflow (`feature/security`).
   - Controlled merge conflict generation and resolution demonstration.
3. **Automated Testing & CI/CD**:
   - 23 comprehensive Jest + Supertest unit and integration test cases covering health checks, event CRUD, user auth, role access control, NoSQL injection defense, and XSS sanitization.
   - GitHub Actions automated CI workflow (`.github/workflows/ci.yml`).
4. **Cloud Deployment Architecture**:
   - Database: MongoDB Atlas (M0 Free Tier).
   - Backend API: Render Web Service (Express Node.js runtime).
   - Frontend: Netlify / Vercel (React Single Page Application).
5. **Performance Auditing & Optimization**:
   - Guidance on Lighthouse metrics (Performance, Accessibility, Best Practices, SEO).
   - Lazy loading, image optimization, Gzip/Brotli compression, and caching strategies.

---

## 2. Project Architecture

```
+-------------------------------------------------------------+
|                     CLIENT TIER                             |
|        React Single Page Application (Vite / React 18)      |
|               Hosted on Netlify / Vercel                    |
|             (https://techfest2026.netlify.app)              |
+-------------------------------------------------------------+
                              |
                     HTTPS Requests / CORS
                      (credentials: true)
                              |
                              v
+-------------------------------------------------------------+
|                     BACKEND API TIER                        |
|            Node.js & Express 5 REST API Engine              |
|                     Hosted on Render                        |
|          (https://techfest-api-xxxx.onrender.com)           |
|                                                             |
|  [Security Middleware]                                      |
|    - Helmet (CSP, X-Frame-Options, HSTS)                    |
|    - MongoSanitize (NoSQL Operator Stripping)               |
|    - Express-Validator (Type & Schema Validation)           |
|    - Cookie-Parser & JWT Auth Middleware                    |
+-------------------------------------------------------------+
                              |
                      TLS / Mongoose Driver
                              |
                              v
+-------------------------------------------------------------+
|                     DATABASE TIER                           |
|              MongoDB Atlas Cloud Database                   |
|                   Cluster0 (AWS / GCP)                      |
|      Collections: users, events, registrations              |
+-------------------------------------------------------------+
```

---

## 3. Directory Structure

```
API_techfest_arjun/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI automated pipeline
├── config/
│   └── db.js                    # MongoDB Atlas & local Mongoose connection handler
├── controllers/
│   ├── bookingController.js     # Event seat booking, myBookings, cancelBooking
│   ├── eventController.js       # Event CRUD operations with NoSQL filtering
│   ├── feedbackController.js    # Safe feedback demonstration for XSS defense
│   └── userController.js        # Auth, register, login, logout, profile
├── middleware/
│   ├── errors.js                # Centralized error handler & 404 routeNotFound
│   ├── mongoSanitize.js         # Express 5 in-place NoSQL injection sanitizer
│   ├── protect.js               # Dual JWT verification (Bearer header & httpOnly cookie)
│   ├── requestLogger.js         # HTTP request method, URL, status & latency logger
│   └── validators.js            # express-validator rules for all endpoints
├── models/
│   ├── Event.js                 # Event schema (name, category, fee, seats, date)
│   ├── Registration.js          # User-Event registration schema with compound unique index
│   └── User.js                  # User schema with pre-save bcrypt hashing hook
├── routes/
│   ├── bookingRoutes.js         # /api/bookings endpoints
│   ├── eventRoutes.js           # /api/events endpoints
│   ├── feedbackRoutes.js        # /api/feedback demonstration endpoint
│   └── userRoutes.js            # /api/users endpoints
├── tests/
│   └── api.test.js              # Comprehensive Jest + Supertest test suite (23 tests)
├── utils/
│   ├── ApiError.js              # Custom Error class with HTTP status code
│   ├── asyncHandler.js          # Async route wrapper replacing try/catch boilerplate
│   └── validate.js              # Core field validation utilities
├── experiment-5-documentation/  # Complete Lab Manual submission reports
│   ├── README.md                # Project setup & architecture overview
│   ├── SECURITY.md              # Vulnerabilities, demonstrations & mitigations
│   ├── DEPLOYMENT.md            # Step-by-step Atlas, Render & Netlify deployment
│   ├── CI-CD.md                 # GitHub Actions pipeline guide & viva tips
│   └── PERFORMANCE.md           # Lighthouse optimization strategy & checklist
├── .env.example                 # Sanitized environment variable template
├── .gitignore                   # Excludes .env, node_modules, build artifacts
├── package.json                 # Project dependencies and npm scripts
└── server.js                    # Express app initialization, Helmet & CORS setup
```

---

## 4. Local Installation and Setup

### Prerequisites
- Node.js LTS (v20+ or v26+)
- npm (v10+ or v11+)
- Git

### Steps
1. Clone or extract the project:
   ```bash
   cd API_techfest_arjun
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/techfest
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES=2h
   CLIENT_URL=http://localhost:5173
   ```

4. Run automated tests:
   ```bash
   npm test
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   The API will be available at `http://localhost:5000/api/health`.

