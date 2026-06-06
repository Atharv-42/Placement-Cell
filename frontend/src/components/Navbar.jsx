import ProfileDropdown from "./ProfileDropdown";

function Navbar({ title, onMenuToggle }) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <button type="button" className="icon-button" onClick={onMenuToggle} aria-label="Toggle navigation">
          <span aria-hidden="true">○</span>
        </button>
        <div>
          <p className="topbar__eyebrow">Placement Cell Portal</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="topbar__actions">
        <ProfileDropdown />
      </div>
    </header>
  );
}

export default Navbar;
