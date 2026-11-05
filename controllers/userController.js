const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { requireFields, isEmail } = require("../utils/validate");

// Helper: cookie options for secure authentication
function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true, // Prevents client-side scripts from reading the cookie (mitigates XSS token theft)
    secure: isProduction, // Transmitted only over HTTPS in production
    sameSite: isProduction ? "none" : "lax", // Protects against CSRF in cross-site contexts
    maxAge: 2 * 60 * 60 * 1000 // 2 hours in milliseconds
  };
}

// Builds a signed token. The payload holds only the id and role - never the password.
function issueToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "2h" }
  );
}

// POST /api/users/register
const registerUser = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "email", "password"]);

  const { name, email, password, role } = req.body;

  if (typeof email !== "string" || !isEmail(email)) {
    throw new ApiError(400, "Please enter a valid email address");
  }
  if (typeof password !== "string" || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const taken = await User.findOne({ email: normalizedEmail });
  if (taken) throw new ApiError(409, "An account with this email already exists");

  // The pre-save hook in User.js hashes the password automatically using bcrypt
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
    role: role === "admin" ? "admin" : "user"
  });

  const token = issueToken(user);
  res.cookie("token", token, getCookieOptions());

  res.status(201).json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, role: user.role },
    token
  });
});

// POST /api/users/login
const loginUser = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);

  const { email, password } = req.body;

  // Protect against non-string input / NoSQL operator payloads
  if (typeof email !== "string" || typeof password !== "string") {
    throw new ApiError(400, "Invalid email or password format");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  // Deliberately identical generic error message to prevent account enumeration
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Incorrect email or password");
  }

  const token = issueToken(user);
  res.cookie("token", token, getCookieOptions());

  res.status(200).json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, role: user.role },
    token
  });
});

// POST /api/users/logout
const logoutUser = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// GET /api/users/me        (logged in)
const getProfile = asyncHandler(async (req, res) => {
  // .select("-password") leaves the hash out of the response
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json({ success: true, data: user });
});

module.exports = { registerUser, loginUser, logoutUser, getProfile, issueToken };
