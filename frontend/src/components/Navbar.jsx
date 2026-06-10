import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "../context/AuthContext";

function Navbar({ title, onMenuToggle }) {
  const { theme, toggleTheme } = useAuth();
  const isDark = theme === "dark";

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button type="button" className="icon-button" onClick={onMenuToggle} aria-label="Toggle navigation">
          <span className="menu-glyph" aria-hidden="true" />
        </button>
        <div>
          <p className="topbar__eyebrow">Placement Cell Portal</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="topbar__actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          aria-pressed={isDark}
        >
          <span className="theme-toggle__track" aria-hidden="true">
            <span className="theme-toggle__thumb" />
          </span>
          <span>{isDark ? "Dark" : "Light"}</span>
        </button>
        <ProfileDropdown />
      </div>
    </header>
  );
}

export default Navbar;
