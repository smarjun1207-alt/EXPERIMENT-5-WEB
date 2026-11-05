// A custom error class that carries an HTTP status code with it.
// Anywhere in a controller we can write:  throw new ApiError(404, "Not found")
// and the central error handler turns it into the right response.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
