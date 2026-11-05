const mongoose = require("mongoose");
const Event = require("../models/Event");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { requireFields, toNonNegativeNumber } = require("../utils/validate");

// GET /api/events          (public)
// Supports an optional ?category=Technical filter.
const listEvents = asyncHandler(async (req, res) => {
  const filter = {};
  // Prevent NoSQL injection: ensure category is strictly a non-empty string, not an object or operator
  if (req.query.category && typeof req.query.category === "string") {
    filter.category = req.query.category.trim();
  }

  const events = await Event.find(filter).sort({ date: 1 });
  res.status(200).json({ success: true, count: events.length, data: events });
});

// GET /api/events/:id      (public)
const getEvent = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, `'${req.params.id}' is not a valid id`);
  }

  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, "Event not found");
  res.status(200).json({ success: true, data: event });
});

// POST /api/events         (admin)
const createEvent = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "category", "fee", "seats"]);

  const event = await Event.create({
    name: String(req.body.name).trim(),
    category: String(req.body.category).trim(),
    fee: toNonNegativeNumber(req.body.fee, "Fee"),
    seats: toNonNegativeNumber(req.body.seats, "Seats"),
    date: req.body.date ? new Date(req.body.date) : Date.now()
  });

  res.status(201).json({ success: true, data: event });
});

// PUT /api/events/:id      (admin)
const updateEvent = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, `'${req.params.id}' is not a valid id`);
  }

  const changes = {};
  if (req.body.name !== undefined) changes.name = String(req.body.name).trim();
  if (req.body.category !== undefined) changes.category = String(req.body.category).trim();
  if (req.body.fee !== undefined) changes.fee = toNonNegativeNumber(req.body.fee, "Fee");
  if (req.body.seats !== undefined) changes.seats = toNonNegativeNumber(req.body.seats, "Seats");
  if (req.body.date !== undefined) changes.date = new Date(req.body.date);

  if (Object.keys(changes).length === 0) {
    throw new ApiError(400, "No fields supplied to update");
  }

  const event = await Event.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true
  });

  if (!event) throw new ApiError(404, "Event not found");
  res.status(200).json({ success: true, data: event });
});

// DELETE /api/events/:id   (admin)
const removeEvent = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, `'${req.params.id}' is not a valid id`);
  }

  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) throw new ApiError(404, "Event not found");
  res.status(200).json({ success: true, message: "Event removed" });
});

module.exports = { listEvents, getEvent, createEvent, updateEvent, removeEvent };
