import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./features/auth/Login";
import CitizenDashboard from "./features/citizen/CitizenDashboard";
import GovernorDashboard from "./features/governor/GovernorDashboard";
import TechnicianDashboard from "./features/technician/TechnicianDashboard";
import DispatcherDashboard from "./features/dispatcher/DispatcherDashboard";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/citizen/dashboard"
          element={
            <ProtectedRoute allowedRoles={["CITIZEN"]}>
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/technician/dashboard"
          element={
            <ProtectedRoute allowedRoles={["TECHNICIAN"]}>
              <TechnicianDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]}>
              <DispatcherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dispatcher/dashboard"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]}>
              <DispatcherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/governor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["GOVERNOR"]}>
              <GovernorDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;