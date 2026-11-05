const { Schema, model } = require("mongoose");

// Links one user to one event.
const registrationSchema = new Schema(
  {
    user:  { type: Schema.Types.ObjectId, ref: "User",  required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true }
  },
  { timestamps: true }
);

// A COMPOUND UNIQUE INDEX: the database itself refuses a second row with the
// same user+event pair, so one person cannot register twice for one event.
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = model("Registration", registrationSchema);
