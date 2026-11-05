// Express 5 compatible NoSQL injection sanitizer.
// In Express 5, req.query is a getter, so reassigning req.query causes a TypeError.
// This middleware strips keys starting with '$' or containing '.' in-place
// across req.body, req.params, and req.query.

function cleanObject(obj) {
  if (!obj || typeof obj !== "object") return;

  for (const key of Object.keys(obj)) {
    // If the key starts with '$' (MongoDB operator) or contains a dot (path injection)
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }

    const val = obj[key];
    if (val && typeof val === "object") {
      cleanObject(val);
    }
  }
}

function mongoSanitize(req, res, next) {
  if (req.body) cleanObject(req.body);
  if (req.params) cleanObject(req.params);
  if (req.query) cleanObject(req.query);
  next();
}

module.exports = mongoSanitize;

