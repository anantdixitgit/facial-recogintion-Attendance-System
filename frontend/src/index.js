import React from "react";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import FaceDetector from "./components/FaceDetector";
import FaceRegistration from "./components/FaceRegistration";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Navbar></Navbar>
    <Routes>
      <Route path="/" element={<FaceDetector />} />
      <Route path="/register" element={<FaceRegistration />} />
    </Routes>
  </BrowserRouter>
);

reportWebVitals();
