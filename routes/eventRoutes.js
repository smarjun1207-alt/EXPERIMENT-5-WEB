const router = require("express").Router();
const { protect, allowRoles } = require("../middleware/protect");
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  removeEvent
} = require("../controllers/eventController");
const {
  createEventRules,
  updateEventRules,
  mongoIdRule
} = require("../middleware/validators");

router
  .route("/")
  .get(listEvents)                                                   // public
  .post(protect, allowRoles("admin"), createEventRules, createEvent); // admin only

router
  .route("/:id")
  .get(mongoIdRule, getEvent)                                        // public
  .put(protect, allowRoles("admin"), updateEventRules, updateEvent)   // admin only
  .delete(protect, allowRoles("admin"), mongoIdRule, removeEvent);   // admin only

module.exports = router;
