import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import StudentDashboard from "./pages/StudentDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Jobs from "./pages/Jobs";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes with Navbar */}
        <Route element={<Layout />}>
        <Route
          path="/student"
          element={
            <ProtectedRoute>
            <StudentDashboard />
            </ProtectedRoute>
          }
          />
          <Route
            path="/company"
            element={
              <ProtectedRoute>
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;