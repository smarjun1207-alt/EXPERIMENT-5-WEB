const { Schema, model } = require("mongoose");

// One document in the "events" collection.
const eventSchema = new Schema(
  {
    name:     { type: String, required: [true, "Event name is required"], trim: true },
    category: { type: String, required: [true, "Category is required"], trim: true },
    fee:      { type: Number, required: true, min: [0, "Fee cannot be negative"] },
    seats:    { type: Number, required: true, min: [0, "Seats cannot be negative"] },
    date:     { type: Date, default: Date.now }
  },
  // timestamps adds createdAt and updatedAt automatically
  { timestamps: true }
);

module.exports = model("Event", eventSchema);
