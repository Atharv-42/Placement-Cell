import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const routeTitles = {
  "/student": "Student Dashboard",
  "/company": "Company Dashboard",
  "/admin": "Admin Dashboard",
  "/jobs": "Jobs Board",
  "/applications": "Applications",
  "/profile": "Profile",
  "/settings": "Settings"
};

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const title = useMemo(() => {
    return routeTitles[location.pathname] || `${user?.role || "Portal"} workspace`;
  }, [location.pathname, user?.role]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-shell__content">
        <Navbar title={title} onMenuToggle={() => setSidebarOpen((current) => !current)} />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
