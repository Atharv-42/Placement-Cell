import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingState from "./LoadingState";

const roleHome = {
  student: "/student",
  company: "/company",
  admin: "/admin"
};

function ProtectedRoute({ children, roles }) {
  const { user, loading, token } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState label="Loading portal" />;
  }

  if (!token || !user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to={roleHome[user.role] || "/jobs"} replace />;
  }

  return children;
}

export default ProtectedRoute;
