const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollno: { type: String, required: true },
  faceDescriptor: { type: Array, required: true }, // Stores facial features
  // registeredAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
