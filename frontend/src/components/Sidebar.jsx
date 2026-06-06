import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleLinks = {
  student: [
    { to: "/student", label: "Dashboard" },
    { to: "/jobs", label: "Jobs" },
    { to: "/applications", label: "Applications" },
    { to: "/profile", label: "Profile" },
    { to: "/settings", label: "Settings" }
  ],
  company: [
    { to: "/company", label: "Company Dashboard" },
    { to: "/jobs", label: "Jobs" },
    { to: "/applications", label: "Applicants" },
    { to: "/profile", label: "Profile" },
    { to: "/settings", label: "Settings" }
  ],
  admin: [
    { to: "/admin", label: "Admin Dashboard" },
    { to: "/jobs", label: "Jobs" },
    { to: "/applications", label: "Applications" },
    { to: "/profile", label: "Profile" },
    { to: "/settings", label: "Settings" }
  ]
};

function Sidebar({ open = true, onClose }) {
  const { user } = useAuth();
  const links = roleLinks[user?.role] || roleLinks.student;

  return (
    <>
      <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
        <div className="sidebar__brand">
          <div className="sidebar__logo">PCP</div>
          <div>
            <strong>Placement Portal</strong>
            <span>{user?.role || "Student"} workspace</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar__link ${isActive ? "is-active" : ""}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {open && <button type="button" className="sidebar__backdrop" onClick={onClose} aria-label="Close navigation" />}
    </>
  );
}

export default Sidebar;
