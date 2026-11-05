const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// In-memory feedback store for demonstration and testing purposes
const feedbackStore = [];

// POST /api/feedback
// Receives text input, validated and escaped by express-validator, ensuring safe rendering.
const submitFeedback = asyncHandler(async (req, res) => {
  const { name, message } = req.body;

  if (!name || !message) {
    throw new ApiError(400, "Name and message are required");
  }

  // The fields have already been escaped by express-validator into HTML entities
  const entry = {
    id: feedbackStore.length + 1,
    name: String(name),
    message: String(message),
    submittedAt: new Date().toISOString()
  };

  feedbackStore.push(entry);

  res.status(201).json({
    success: true,
    message: "Feedback received safely",
    data: entry
  });
});

// GET /api/feedback
const getFeedbacks = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    count: feedbackStore.length,
    data: feedbackStore
  });
});

module.exports = { submitFeedback, getFeedbacks };
