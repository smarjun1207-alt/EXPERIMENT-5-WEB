# TechFest 2026 Portal - Security Architecture & Vulnerability Mitigation

## Course: Web Technology Laboratory (23CSB40B) | Module 5: Security

---

## 1. Executive Security Summary
In Experiment 4, the backend exposed basic REST endpoints with JWT authorization. While functional, several vulnerabilities existed according to the OWASP Top 10 Web Application Security standard. 

In Experiment 5, we addressed these risks by implementing defense-in-depth:
1. **HTTP Security Headers**: Using `helmet` to set CSP, HSTS, X-Content-Type-Options, and X-Frame-Options.
2. **NoSQL Injection Defense**: Sanitizing query operators (`$`, `.`) in queries and bodies, enforcing strict string types.
3. **Cross-Site Scripting (XSS) Defense**: Sanitizing and escaping text inputs into safe HTML entities, eliminating raw HTML injection.
4. **Token Theft & Session Security**: Storing JWT in `httpOnly`, `secure`, `SameSite` cookies with dedicated logout route.
5. **Cross-Site Request Forgery (CSRF) Mitigation**: Enforcing `SameSite` attributes and CORS origin restrictions with credentials control.
6. **Input Validation**: Layering `express-validator` across all routes.

---

## 2. Identified Vulnerabilities and Resolutions

### Vulnerability 1: Missing HTTP Security Headers
- **Risk**: Without security headers, browsers are susceptible to clickjacking (if embedded in `<iframe>`), MIME-type confusion sniffing, and unrestricted inline script execution.
- **Remediation**: Integrated `helmet`:
  ```javascript
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: [
            "'self'",
            process.env.CLIENT_URL || "http://localhost:5173",
            "https://*.netlify.app",
            "https://*.onrender.com"
          ]
        }
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: process.env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true } : false
    })
  );
  ```
- **Verification**: Verified via Supertest test:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Content-Security-Policy` header active.

---

### Vulnerability 2: NoSQL Query Injection
- **Risk**: In MongoDB/Mongoose, if untrusted user objects are passed directly to query methods like `Event.find(filter)` or `User.findOne(query)`, attackers can pass MongoDB query operators such as `{"$ne": null}` or `{"$gt": ""}` to bypass authentication or extract unauthorized records.
  - *Example attack in login*:
    ```json
    { "email": { "$ne": null }, "password": { "$ne": null } }
    ```
  - *Example attack in event filter*:
    `GET /api/events?category[$ne]=Technical`
- **Remediation**:
  1. Built custom Express 5 compatible sanitization middleware (`middleware/mongoSanitize.js`) that recurses through `req.body`, `req.params`, and `req.query`, completely stripping any keys containing `$` or `.`.
  2. In `controllers/eventController.js`, ensured query filters enforce primitive string types:
     ```javascript
     const filter = {};
     if (req.query.category && typeof req.query.category === "string") {
       filter.category = req.query.category.trim();
     }
     ```
  3. Validated MongoDB ObjectIds before database lookups using `mongoose.Types.ObjectId.isValid()`.
- **Verification**: Tests in `tests/api.test.js` confirm:
  - Malicious query `?category[$ne]=Technical` has `$ne` stripped without throwing server errors.
  - Malicious login payload `{ email: { "$ne": null } }` is rejected with HTTP 400 Bad Request.

---

### Vulnerability 3: Cross-Site Scripting (XSS)
- **Risk**: If an attacker submits a script payload into a text field (e.g., feedback or registration form) and the frontend renders it as raw HTML (e.g. using `dangerouslySetInnerHTML`), the script runs inside the victim's browser, potentially stealing sessions.
- **Demonstration Attack**:
  - Input payload: `<script>alert('hi')</script>`
- **Remediation**:
  1. Backend sanitizes and escapes all user inputs using `express-validator` `.escape()`.
  2. HTML special characters are transformed to safe character entities:
     - `<` becomes `&lt;`
     - `>` becomes `&gt;`
     - `'` becomes `&#x27;`
     - `"` becomes `&quot;`
     - `/` becomes `&#x2F;`
  3. Frontend renders user-submitted data strictly as text inside JSX elements (`<p>{feedback.message}</p>`), never using `dangerouslySetInnerHTML`.
- **Demonstration Result**:
  - Input: `<script>alert('hi')</script>`
  - Rendered output: `&lt;script&gt;alert(&#x27;hi&#x27;)&lt;&#x2F;script&gt;`
  - Result: The text displays harmlessly on screen as plain text. No alert box pops up, and no JavaScript executes.

---

### Vulnerability 4: JWT Token Theft (Insecure Storage)
- **Risk**: Storing JWT in browser `localStorage` leaves it completely exposed to any script running on the page (XSS can execute `localStorage.getItem('token')` and exfiltrate it).
- **Remediation**:
  1. Configured backend to issue JWT in an `httpOnly` cookie:
     ```javascript
     res.cookie("token", token, {
       httpOnly: true, // Inaccessible to JavaScript document.cookie
       secure: process.env.NODE_ENV === "production", // HTTPS only
       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
       maxAge: 2 * 60 * 60 * 1000 // 2 hours
     });
     ```
  2. Created `POST /api/users/logout` endpoint that clears the auth cookie:
     ```javascript
     res.clearCookie("token", { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" : "lax" });
     ```
  3. Updated `middleware/protect.js` to support dual authentication: accepts the token from `req.cookies.token` OR `Authorization: Bearer <token>`, enabling both secure browser sessions and automated API/Postman testing.

---

## 3. Difference Between XSS and CSRF

| Security Concept | Cross-Site Scripting (XSS) | Cross-Site Request Forgery (CSRF) |
| :--- | :--- | :--- |
| **Definition** | An attacker injects malicious client-side JavaScript into a trusted web application. | An attacker tricks an authenticated user's browser into executing unwanted actions on another web application. |
| **How Attack Operates** | The malicious script executes in the victim's browser under the application's domain, reading cookies, tokens, or modifying the DOM. | An external malicious website (e.g. `evil.com`) includes an image or hidden form sending a POST to `bank.com/transfer`. The browser automatically includes cookies. |
| **Primary Target** | The client's execution environment and data (tokens, keystrokes, storage). | The server's trust in requests accompanied by the user's browser credentials. |
| **Impact** | Account takeover, credential harvesting, unauthorized actions. | Unauthorized state change (transfers, password resets, bookings). |
| **Primary Mitigations** | 1. Output escaping & context-aware encoding.<br>2. Storing tokens in `httpOnly` cookies.<br>3. Content Security Policy (CSP).<br>4. Avoiding `dangerouslySetInnerHTML`. | 1. `SameSite=Lax` or `SameSite=Strict` cookie attribute.<br>2. Anti-CSRF Double-Submit tokens or custom headers (`X-Requested-With`).<br>3. Strict CORS origin verification with credentials flag. |

---

## 4. Environment Variables & Secret Protection
- Actual secrets are stored in `.env` which is excluded from Git via `.gitignore`.
- Template file `.env.example` is committed with placeholders only:
  - `PORT=5000`
  - `NODE_ENV=development`
  - `MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/techfest?retryWrites=true&w=majority`
  - `JWT_SECRET=your_super_secret_jwt_key_here`
  - `JWT_EXPIRES=2h`
  - `CLIENT_URL=http://localhost:5173`
- Logs strictly avoid printing connection strings or token secrets.

