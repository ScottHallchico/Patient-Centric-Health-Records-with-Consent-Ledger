import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PatientPage from "./pages/PatientPage";
import DoctorPage from "./pages/DoctorPage";

export default function App() {
  return (
    <BrowserRouter>
      {/* Animated background mesh — visible on all pages */}
      <div className="bg-mesh" aria-hidden="true" />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient" element={<PatientPage />} />
        <Route path="/doctor" element={<DoctorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
