const router = require("express").Router();
const { protect } = require("../middleware/protect");
const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile
} = require("../controllers/userController");
const { registerRules, loginRules } = require("../middleware/validators");

router.post("/register", registerRules, registerUser);
router.post("/login", loginRules, loginUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getProfile);

module.exports = router;
