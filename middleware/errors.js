// Runs when no route matched the address.
function routeNotFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
}

// CENTRAL ERROR HANDLER.
// Express recognises it as an error handler because it takes FOUR arguments.
// Every throw and every next(err) in the app ends up here, so the server
// answers with JSON instead of crashing.
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Mongoose: a required field missing, min value broken, etc.
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  // Mongoose: an id that is not a valid ObjectId, e.g. /api/events/hello
  if (err.name === "CastError") {
    status = 400;
    message = `'${err.value}' is not a valid id`;
  }

  // MongoDB: a unique index was broken (duplicate email, duplicate booking)
  if (err.code === 11000) {
    status = 409;
    message = "That record already exists";
  }

  if (status >= 500) console.error("SERVER ERROR:", err);

  res.status(status).json({ success: false, message });
}

module.exports = { routeNotFound, errorHandler };
