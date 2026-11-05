// Wraps an async controller so we do not need try/catch inside every one.
// If the promise rejects, the error is handed to Express with next(err).
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
