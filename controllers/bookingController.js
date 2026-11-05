const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { requireFields } = require("../utils/validate");

// POST /api/bookings       (logged in)
const bookEvent = asyncHandler(async (req, res) => {
  requireFields(req.body, ["eventId"]);

  const { eventId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, "Invalid eventId format");
  }

  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");
  if (event.seats < 1) throw new ApiError(400, "No seats left for this event");

  // req.user was filled in by the protect middleware, from the token
  const duplicate = await Registration.findOne({
    user: req.user.id,
    event: event._id
  });
  if (duplicate) throw new ApiError(409, "You are already registered for this event");

  const booking = await Registration.create({ user: req.user.id, event: event._id });

  // Reduce seat count in the database
  event.seats -= 1;
  await event.save();

  res.status(201).json({
    success: true,
    message: "Seat booked for " + event.name,
    data: booking
  });
});

// GET /api/bookings/mine   (logged in)
const myBookings = asyncHandler(async (req, res) => {
  const bookings = await Registration.find({ user: req.user.id })
    .populate("event", "name category fee date")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

// DELETE /api/bookings/:id (logged in - only your own or admin)
const cancelBooking = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, "Invalid booking ID format");
  }

  const booking = await Registration.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found");

  const owner = booking.user.toString() === req.user.id;
  if (!owner && req.user.role !== "admin") {
    throw new ApiError(403, "You cannot cancel someone else's booking");
  }

  await booking.deleteOne();

  // Put the seat back
  await Event.findByIdAndUpdate(booking.event, { $inc: { seats: 1 } });

  res.status(200).json({ success: true, message: "Booking cancelled" });
});

// GET /api/bookings        (admin) - every booking in the system
const allBookings = asyncHandler(async (req, res) => {
  const bookings = await Registration.find()
    .populate("user", "name email")
    .populate("event", "name category");

  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

module.exports = { bookEvent, myBookings, cancelBooking, allBookings };
