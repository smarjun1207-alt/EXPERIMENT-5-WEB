const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    // This field holds the bcrypt hash, never the typed password.
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, enum: ["user", "admin"], default: "user" }
  },
  { timestamps: true }
);

// PRE-SAVE HOOK: runs automatically every time a user document is saved.
// Hashing lives here rather than in the controller, so a password can never
// be stored in plain text by mistake from somewhere else in the code.
userSchema.pre("save", async function (next) {
  // isModified stops the hash being hashed again when, say, only the name changes
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// An instance method: user.matchPassword("typed") -> true / false
userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = model("User", userSchema);
