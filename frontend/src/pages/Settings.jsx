import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";

function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    statusUpdates: true,
    darkSummary: false
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setPreferences((current) => ({
      ...current,
      [name]: checked
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    window.localStorage.setItem("placement-preferences", JSON.stringify(preferences));
    setMessage("Preferences saved locally");
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) {
    return <LoadingState label="Loading settings" />;
  }

  return (
    <div className="dashboard-grid">
      <section className="hero-panel hero-panel--compact">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Notification and account preferences.</h2>
        </div>
      </section>

      {message && <div className="alert">{message}</div>}

      <form className="panel" onSubmit={handleSave}>
        <div className="toggle-list">
          {[
            ["statusUpdates", "Application status updates"],
            ["darkSummary", "Compact dashboard summary"]
          ].map(([name, label]) => (
            <label key={name} className="toggle-row">
              <div>
                <strong>{label}</strong>
                <span>Keep your workspace focused on the actions that matter most.</span>
              </div>
              <input type="checkbox" name={name} checked={preferences[name]} onChange={handleChange} />
            </label>
          ))}
        </div>

        <div className="stacked-actions stacked-actions--inline">
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </button>
          <button type="button" className="btn btn--danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
