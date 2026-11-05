// Route protection: checks JWT from Authorization header OR httpOnly cookie before running controllers.
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

function protect(req, res, next) {
  let token = null;
  const header = req.headers.authorization || "";

  // 1. Check Authorization: Bearer <token>
  if (header.startsWith("Bearer ")) {
    token = header.slice(7).trim();
  }
  // 2. Fall back to secure httpOnly cookie if present
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ApiError(401, "Not authorised - no token supplied"));
  }

  try {
    // verify() checks the signature AND that the token has not expired
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const reason =
      err.name === "TokenExpiredError" ? "token has expired" : "token is not valid";
    next(new ApiError(401, "Not authorised - " + reason));
  }
}

// Used after protect, e.g. router.post("/", protect, allowRoles("admin"), ...)
function allowRoles(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "This action requires one of: " + roles.join(", ")));
    }
    next();
  };
}

module.exports = { protect, allowRoles };
