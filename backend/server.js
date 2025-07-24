const express = require("express");
const app = express();
const bodyparser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./model/UserSchema");
const Attendance = require("./model/AttendanceSchema");

app.use(cors());
app.use(bodyparser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dotenv.config();

const PORT = process.env.PORT || 5000;
const url = process.env.MONGO_URI;

// Register new user with face data
app.post("/api/register", async (req, res) => {
  try {
    console.log(req.body);
    const { name, rollno, faceDescriptor } = req.body;
    const newUser = new User({
      name,
      rollno,
      faceDescriptor,
    });
    await newUser.save();
    console.log("New user registered");
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/attendance", async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find();
    res.json(attendanceRecords);
  } catch (err) {
    res.status(500).json({ error: "Error fetching attendance" });
  }
});
// Recognize face and mark attendance
app.post("/api/recognize", async (req, res) => {
  try {
    console.log("recognisze post called ");
    const { descriptor } = req.body;
    console.log("Received descriptor:", descriptor);
    const users = await User.find();
    console.log("Loaded users:", users);

    // Simple Euclidean distance comparison
    function compareDescriptors(desc1, desc2, threshold = 0.6) {
      if (!desc1 || !desc2 || desc1.length !== desc2.length) {
        console.log("Descriptor length mismatch or missing", desc1, desc2);
        return false;
      }
      let sum = 0;
      for (let i = 0; i < desc1.length; i++) {
        sum += Math.pow(desc1[i] - desc2[i], 2);
      }
      const distance = Math.sqrt(sum);
      console.log(`Distance for user: ${distance}`);
      return distance < threshold;
    }

    const matchedUser = users.find((user) => {
      try {
        return compareDescriptors(user.faceDescriptor, descriptor);
      } catch (e) {
        console.log("Error comparing descriptors for user", user, e);
        return false;
      }
    });

    console.log("Matched user ?:", matchedUser);

    if (matchedUser) {
      // Mark attendance
      const newAttendance = new Attendance({
        name: matchedUser.name,
        rollno: matchedUser.rollno,
      });
      await newAttendance.save();
      res.json({ match: true, user: matchedUser });
    } else {
      res.json({ match: false });
    }
  } catch (err) {
    console.log("Error in /api/recognize:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/attendance", async (req, res) => {
  try {
    await Attendance.deleteMany({});
    res.status(200).json({ message: "All attendance records deleted" });
  } catch (err) {
    console.error("Error deleting attendance records:", err);
    res.status(500).json({ error: err.message });
  }
});

const connectDB = async () => {
  try {
    if (!url) {
      console.log("MongoDB URI is not defined in environment variables.");
      process.exit(1);
    } else {
      mongoose.connect(url);
      console.log("MongoDB connected successfully");
    }
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Sever is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error starting the server:", err.message);
    process.exit(1);
  }
};

startServer();
