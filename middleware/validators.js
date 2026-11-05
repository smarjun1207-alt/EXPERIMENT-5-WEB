const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");

// Middleware to evaluate validation rules and return errors formatted as JSON
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((e) => e.msg).join(", ");
    return next(new ApiError(400, message));
  }
  next();
}

// User registration rules
const registerRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters")
    .escape(),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),
  validate
];

// User login rules
const loginRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .isString()
    .withMessage("Password must be a string")
    .notEmpty()
    .withMessage("Password is required"),
  validate
];

// Mongo ObjectId parameter validation
const mongoIdRule = [
  param("id")
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage("Value is not a valid id"),
  validate
];

// Event creation rules
const createEventRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Event name is required")
    .escape(),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .escape(),
  body("fee")
    .isFloat({ min: 0 })
    .withMessage("Fee must be a number that is 0 or more"),
  body("seats")
    .isInt({ min: 0 })
    .withMessage("Seats must be a non-negative integer"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO8601 date"),
  validate
];

// Event update rules
const updateEventRules = [
  param("id")
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage("Invalid MongoDB ID format"),
  body("name").optional().trim().notEmpty().withMessage("Event name cannot be blank").escape(),
  body("category").optional().trim().notEmpty().withMessage("Category cannot be blank").escape(),
  body("fee").optional().isFloat({ min: 0 }).withMessage("Fee must be a number that is 0 or more"),
  body("seats").optional().isInt({ min: 0 }).withMessage("Seats must be a non-negative integer"),
  body("date").optional().isISO8601().withMessage("Date must be a valid ISO8601 date"),
  validate
];

// Event booking rules
const bookEventRules = [
  body("eventId")
    .trim()
    .notEmpty()
    .withMessage("Missing required field(s): eventId")
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage("Invalid eventId format"),
  validate
];

// Feedback submission rules (demonstrating safe XSS escaping)
const feedbackRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .escape(),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .escape(),
  validate
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  mongoIdRule,
  createEventRules,
  updateEventRules,
  bookEventRules,
  feedbackRules
};
