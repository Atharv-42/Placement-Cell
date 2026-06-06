import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const homeByRole = {
  student: "/student",
  company: "/company",
  admin: "/admin"
};

function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        type="button"
        className="profile-menu__trigger"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="profile-menu__avatar" aria-hidden="true">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </span>
        <span className="profile-menu__meta">
          <strong>{user?.name || "User"}</strong>
          <small>{user?.role || "member"}</small>
        </span>
      </button>

      {open && (
        <div className="profile-menu__dropdown">
          <button type="button" onClick={() => handleNavigate("/settings")}>
            Settings
          </button>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
