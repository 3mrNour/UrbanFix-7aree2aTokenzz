import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./features/auth/Login";
import CitizenDashboard from "./features/citizen/CitizenDashboard";
import GovernorDashboard from "./features/governor/GovernorDashboard";

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
          element={<ProtectedRoute allowedRoles={["TECHNICIAN"]}><div className="p-6">Technician dashboard coming next.</div></ProtectedRoute>}
        />
        <Route
          path="/manager/dashboard"
          element={<ProtectedRoute allowedRoles={["MANAGER"]}><div className="p-6">Manager dashboard coming next.</div></ProtectedRoute>}
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