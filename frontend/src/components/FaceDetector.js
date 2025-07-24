import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./FaceDetector.css";

const FaceDetector = () => {
  const webcamRef = useRef(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [detectionActive, setDetectionActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [recognitionMessage, setRecognitionMessage] = useState("");

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        alert("model is loading please wait");
        console.log("Starting model loading...");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(
            "https://justadudewhohacks.github.io/face-api.js/models"
          ),
          faceapi.nets.faceLandmark68Net.loadFromUri(
            "https://justadudewhohacks.github.io/face-api.js/models"
          ),
          faceapi.nets.faceRecognitionNet.loadFromUri(
            "https://justadudewhohacks.github.io/face-api.js/models"
          ),
        ]);

        const response = await axios.delete(
          "http://localhost:5000/api/attendance"
        );
        console.log("here");
        if (response.status === 200) {
          console.log("Attendance records cleared successfully");
        } else {
          console.log("Failed to clear attendance records");
        }

        alert("model loaded successfully");
        setModelsLoaded(true);
      } catch (err) {
        console.error("Model loading failed:", err);
        setError(`Model loading failed: ${err.message}`);
      }
    };
    loadModels();
  }, []);

  const getFaceDescriptor = async (videoElement) => {
    try {
      if (!modelsLoaded) {
        throw new Error("Face models are still loading");
      }
      if (!videoElement) {
        throw new Error("Webcam not accessible");
      }
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      console.log("detections result:", detections);
      if (!detections || detections.length === 0) {
        alert("No face detected. Please ensure your face is clearly visible.");
        throw new Error(
          "No face detected. Please ensure your face is clearly visible."
        );
      }
      console.log("Descriptor:", detections[0].descriptor);
      return Array.from(detections[0].descriptor);
    } catch (err) {
      console.error("Face detection failed (catch):", err);
      setError(err.message);
      return null;
    }
  };

  const recognizeAndMarkAttendance = async () => {
    setDetectionActive(true);
    setRecognitionMessage("Detecting face...");

    try {
      const video = webcamRef.current.video;
      console.log("Webcam video element:", video);
      const descriptor = await getFaceDescriptor(video);

      if (!descriptor) {
        console.error("Descriptor not found");
        return;
      }

      console.log("detection successful");

      const response = await axios.post("http://localhost:5000/api/recognize", {
        descriptor,
      });
      console.log("Recognition response:", response.data);

      if (response.data.match) {
        console.log("face matched finally");
        const { name, rollno } = response.data.user;
        setRecognitionMessage(`Attendance marked for ${name} (${rollno})`);
        fetchAttendance();
      } else {
        setRecognitionMessage("No matching face found. Please register first.");
      }
    } catch (err) {
      console.error("Recognition error:", err);
      setRecognitionMessage("Error recognizing face");
    } finally {
      setDetectionActive(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/attendance");
      setAttendanceList(res.data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  return (
    <div className="attendance-container">
      <h1 className="attendance-title">Face Recognition Attendance System</h1>

      <div className="main-content">
        <div className="webcam-container">
          <Webcam
            ref={webcamRef}
            width={640}
            height={480}
            screenshotFormat="image/jpeg"
            className="webcam"
          />
        </div>

        <div className="records-container">
          <h2>Today's Attendance Records</h2>
          <table className="records-table">
            <thead>
              <tr className="table-header">
                <th>Name</th>
                <th>Roll No</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.map((record) => (
                <tr key={record._id} className="table-row">
                  <td>{record.name}</td>
                  <td>{record.rollno}</td>
                  <td>{new Date(record.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="input-group">
        <button
          onClick={recognizeAndMarkAttendance}
          disabled={detectionActive}
          className="submit-btn"
        >
          {detectionActive ? "Processing..." : "Mark My Attendance"}
        </button>
        {recognitionMessage && (
          <p className="recognition-message">{recognitionMessage}</p>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default FaceDetector;
