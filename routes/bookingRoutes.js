const router = require("express").Router();
const { protect, allowRoles } = require("../middleware/protect");
const {
  bookEvent,
  myBookings,
  cancelBooking,
  allBookings
} = require("../controllers/bookingController");
const { bookEventRules, mongoIdRule } = require("../middleware/validators");

// Every booking route needs authentication
router.use(protect);

router
  .route("/")
  .post(bookEventRules, bookEvent)
  .get(allowRoles("admin"), allBookings);

router.get("/mine", myBookings);
router.delete("/:id", mongoIdRule, cancelBooking);

module.exports = router;
