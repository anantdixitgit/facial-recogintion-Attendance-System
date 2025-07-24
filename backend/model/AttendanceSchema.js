const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollno: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Attendance = mongoose.model("Attendance", AttendanceSchema);

module.exports = Attendance;
