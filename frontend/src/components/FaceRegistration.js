import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./FaceRegistration.css";

const FaceRegistration = () => {
  const [name, setName] = useState("");
  const [rollno, setRollno] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const webcamRef = useRef(null);

  // Load face-api.js models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Remove any global tfjs import, let face-api.js handle tfjs
        // This avoids multiple tfjs versions in the bundle
        const MODEL_URL = "/models";
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

        console.log("Models loaded successfully!");
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
      console.log("getFaceDescriptor called");
      if (!modelsLoaded) {
        console.error("Face models are still loading");
        throw new Error("Face models are still loading");
      }
      if (!videoElement) {
        console.error("Webcam not accessible");
        throw new Error("Webcam not accessible");
      }
      console.log("Calling detectAllFaces...");
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      console.log("detections result:", detections);
      if (!detections || detections.length === 0) {
        console.error(
          "No face detected. Please ensure your face is clearly visible."
        );
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

  const registerUser = async () => {
    console.log("registerUser called");
    if (!name.trim() || !rollno.trim()) {
      setError("Please enter both name and roll number");
      console.error("Missing name or rollno");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const video = webcamRef.current.video;
      console.log("Webcam video element:", video);
      const descriptor = await getFaceDescriptor(video);

      if (!descriptor) {
        console.error("Descriptor not found");
        return;
      }
      console.log("Face descriptor:", descriptor);
      console.log("Face descriptor length:", descriptor.length);

      const response = await axios.post("https://facial-recogintion-attendance-system.onrender.com/api/register", {
        name: name.trim(),
        rollno: rollno.trim(),
        faceDescriptor: descriptor,
      });

      console.log("API response:", response);
      if (response.status === 201) {
        alert("Registration successful!");
        setName("");
        setRollno("");
      }
    } catch (err) {
      console.error("Registration failed (catch):", err);
      let errorMsg = "Registration failed. Please try again.";
      if (err.response) {
        errorMsg = err.response.data.error || errorMsg;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-container mt-5">
      <h2>Face Registration</h2>
      <p>Register your face for attendance</p>

      <Webcam
        ref={webcamRef}
        className="registration-webcam"
        width={640}
        height={480}
        videoConstraints={{ facingMode: "user" }}
      />

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full Name"
        disabled={isLoading || !modelsLoaded}
      />

      <input
        value={rollno}
        onChange={(e) => setRollno(e.target.value)}
        placeholder="Roll Number"
        disabled={isLoading || !modelsLoaded}
      />

      <button onClick={registerUser} disabled={isLoading || !modelsLoaded}>
        {isLoading ? "Processing..." : "Register Face"}
      </button>

      {!modelsLoaded && (
        <p className="loading-message">Loading face detection models...</p>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default FaceRegistration;
