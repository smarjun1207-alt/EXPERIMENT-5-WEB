// Small hand-written validation helpers used by the controllers.
const ApiError = require("./ApiError");

// Throws unless every named field is present and not blank.
function requireFields(body, fields) {
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === ""
  );
  if (missing.length > 0) {
    throw new ApiError(400, "Missing required field(s): " + missing.join(", "));
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

// Converts a value to a number and checks it is not negative.
function toNonNegativeNumber(value, label) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) {
    throw new ApiError(400, label + " must be a number that is 0 or more");
  }
  return n;
}

module.exports = { requireFields, isEmail, toNonNegativeNumber };
