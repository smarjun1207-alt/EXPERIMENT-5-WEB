const router = require("express").Router();
const { submitFeedback, getFeedbacks } = require("../controllers/feedbackController");
const { feedbackRules } = require("../middleware/validators");

router.route("/")
  .post(feedbackRules, submitFeedback)
  .get(getFeedbacks);

module.exports = router;

