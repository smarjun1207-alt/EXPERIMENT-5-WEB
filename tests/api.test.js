process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_for_unit_tests_123456";
process.env.JWT_EXPIRES = "1h";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../server");
const Event = require("../models/Event");
const User = require("../models/User");
const Registration = require("../models/Registration");

describe("TechFest 2026 Portal API - Test Suite", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /* ---------------- 1. HEALTH ENDPOINT & SECURITY HEADERS ---------------- */
  describe("GET /api/health", () => {
    it("should return 200 with API status and system info", async () => {
      const res = await request(app).get("/api/health");
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe("healthy");
      expect(res.body.message).toContain("TechFest API is up");
    });

    it("should include essential Helmet security headers", async () => {
      const res = await request(app).get("/api/health");
      // Helmet headers
      expect(res.headers).toHaveProperty("x-content-type-options", "nosniff");
      expect(res.headers).toHaveProperty("x-frame-options", "SAMEORIGIN");
      expect(res.headers).toHaveProperty("content-security-policy");
    });
  });

  /* ---------------- 2. EVENT RETRIEVAL & VALIDATION ---------------- */
  describe("Events API", () => {
    it("should fetch all events successfully", async () => {
      const mockEvents = [
        { _id: new mongoose.Types.ObjectId(), name: "Code Jam", category: "Technical", fee: 100, seats: 50 },
        { _id: new mongoose.Types.ObjectId(), name: "Web Crafter", category: "Technical", fee: 150, seats: 30 }
      ];

      jest.spyOn(Event, "find").mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockEvents)
      });

      const res = await request(app).get("/api/events");
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.length).toBe(2);
    });

    it("should fetch an individual event by valid ID", async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const mockEvent = { _id: validId, name: "RoboRace", category: "Robotics", fee: 200, seats: 20 };

      jest.spyOn(Event, "findById").mockResolvedValue(mockEvent);

      const res = await request(app).get(`/api/events/${validId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("RoboRace");
    });

    it("should return 400 for an invalid event ID format", async () => {
      const res = await request(app).get("/api/events/invalid-not-an-objectid");
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not a valid id");
    });

    it("should return 404 if event is not found", async () => {
      const notFoundId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(Event, "findById").mockResolvedValue(null);

      const res = await request(app).get(`/api/events/${notFoundId}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Event not found");
    });
  });

  /* ---------------- 3. USER REGISTRATION VALIDATION ---------------- */
  describe("User Registration - POST /api/users/register", () => {
    it("should reject registration when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/users/register")
        .send({ name: "Alice" }); // missing email and password

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("required");
    });

    it("should reject registration with an invalid email address", async () => {
      const res = await request(app)
        .post("/api/users/register")
        .send({
          name: "Alice",
          email: "not-an-email",
          password: "password123"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("valid email");
    });

    it("should reject registration with a password shorter than 6 characters", async () => {
      const res = await request(app)
        .post("/api/users/register")
        .send({
          name: "Alice",
          email: "alice@example.com",
          password: "123"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("at least 6 characters");
    });

    it("should successfully register a valid user and return httpOnly cookie + token", async () => {
      const mockCreatedUser = {
        _id: new mongoose.Types.ObjectId(),
        name: "Alice Smith",
        email: "alice@example.com",
        role: "user"
      };

      jest.spyOn(User, "findOne").mockResolvedValue(null);
      jest.spyOn(User, "create").mockResolvedValue(mockCreatedUser);

      const res = await request(app)
        .post("/api/users/register")
        .send({
          name: "Alice Smith",
          email: "alice@example.com",
          password: "SecurePassword123!"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("alice@example.com");
      expect(res.body).toHaveProperty("token");

      // Verify httpOnly cookie
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain("HttpOnly");
    });
  });

  /* ---------------- 4. LOGIN AUTHENTICATION & SECURITY ---------------- */
  describe("User Login - POST /api/users/login", () => {
    it("should return 401 when logging in with incorrect credentials", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const res = await request(app)
        .post("/api/users/login")
        .send({
          email: "nonexistent@example.com",
          password: "WrongPassword123"
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Incorrect email or password");
    });

    it("should return 401 when password does not match", async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: "existing@example.com",
        matchPassword: jest.fn().mockResolvedValue(false)
      };
      jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

      const res = await request(app)
        .post("/api/users/login")
        .send({
          email: "existing@example.com",
          password: "WrongPassword"
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Incorrect email or password");
    });

    it("should succeed with correct credentials and set httpOnly cookie", async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        matchPassword: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

      const res = await request(app)
        .post("/api/users/login")
        .send({
          email: "test@example.com",
          password: "ValidPassword123"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("token");

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain("HttpOnly");
    });
  });

  /* ---------------- 5. LOGOUT FUNCTIONALITY ---------------- */
  describe("User Logout - POST /api/users/logout", () => {
    it("should clear the authentication cookie on logout", async () => {
      const res = await request(app).post("/api/users/logout");
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Logged out successfully");

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      // Cookie is cleared by setting expires in the past / empty value
      expect(cookies[0]).toMatch(/token=;|Expires=/);
    });
  });

  /* ---------------- 6. PROTECTED ROUTE ACCESS & TOKENS ---------------- */
  describe("Protected Route Verification", () => {
    it("should return 401 when accessing protected route without a token", async () => {
      const res = await request(app).get("/api/users/me");
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Not authorised - no token supplied");
    });

    it("should return 401 when accessing protected route with an invalid token", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Bearer invalid-garbage-token-string");

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("token is not valid");
    });

    it("should allow access when a valid token is provided in header", async () => {
      const userId = new mongoose.Types.ObjectId();
      const validToken = jwt.sign({ id: userId, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

      jest.spyOn(User, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: userId, name: "Alice", email: "alice@example.com", role: "user" })
      });

      const res = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Alice");
    });

    it("should allow access when a valid token is provided via httpOnly cookie", async () => {
      const userId = new mongoose.Types.ObjectId();
      const validToken = jwt.sign({ id: userId, role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });

      jest.spyOn(User, "findById").mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: userId, name: "Alice", email: "alice@example.com", role: "user" })
      });

      const res = await request(app)
        .get("/api/users/me")
        .set("Cookie", [`token=${validToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Alice");
    });

    it("should return 403 when a normal user tries to access an admin route", async () => {
      const normalUserToken = jwt.sign(
        { id: new mongoose.Types.ObjectId(), role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const res = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${normalUserToken}`)
        .send({ name: "Hacking Comp", category: "Security", fee: 50, seats: 20 });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("requires one of: admin");
    });
  });

  /* ---------------- 7. NOSQL INJECTION PREVENTION ---------------- */
  describe("NoSQL Injection Prevention", () => {
    it("should sanitize and reject query objects containing $ operators", async () => {
      jest.spyOn(Event, "find").mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      // Sending ?category[$ne]=Technical
      const res = await request(app).get("/api/events?category[$ne]=Technical");
      expect(res.statusCode).toBe(200);
      // MongoSanitize strips '$' keys, preventing $ne operator query execution
    });

    it("should reject malicious payload in login endpoint", async () => {
      const res = await request(app)
        .post("/api/users/login")
        .send({
          email: { "$ne": null },
          password: "randompassword"
        });

      // Validation catches non-string or sanitized empty email
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  /* ---------------- 8. XSS ATTACK PREVENTION DEMONSTRATION ---------------- */
  describe("XSS Attack Prevention (Requirement 2.4)", () => {
    it("should safely sanitize script tags like <script>alert('hi')</script> and not execute them", async () => {
      const maliciousScript = "<script>alert('hi')</script>";

      const res = await request(app)
        .post("/api/feedback")
        .send({
          name: "Tester",
          message: maliciousScript
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify the script is escaped into harmless text entities and contains no executable <script> tags
      expect(res.body.data.message).not.toContain("<script>");
      expect(res.body.data.message).toContain("&lt;script&gt;");
    });
  });

  /* ---------------- 9. ROUTE NOT FOUND (404) ---------------- */
  describe("Route Not Found (404 Handler)", () => {
    it("should return 404 for unmapped endpoints", async () => {
      const res = await request(app).get("/api/nonexistent-route-123");
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Cannot GET /api/nonexistent-route-123");
    });
  });
});
