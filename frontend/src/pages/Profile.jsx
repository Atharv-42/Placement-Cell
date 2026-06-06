import { useEffect, useState } from "react";
import API from "../services/api";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        if (user?.role === "student") {
          const response = await API.get("/students/me");
          setProfile(response.data.data);
        } else if (user?.role === "company") {
          const response = await API.get("/companies/me");
          setProfile(response.data.data);
        } else {
          const response = await API.get("/auth/me");
          setProfile(response.data.user);
        }
      } catch (error) {
        setMessage(error.response?.data?.message || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      if (user?.role === "student") {
        const response = await API.put("/students/me", profile);
        setProfile(response.data.data);
        setUser((current) => ({ ...current, name: response.data.data.name, email: response.data.data.email }));
      } else if (user?.role === "company") {
        const response = await API.put("/companies/me", profile);
        setProfile(response.data.data);
        setUser((current) => ({ ...current, name: response.data.data.name, email: response.data.data.email }));
      } else {
        setMessage("Admin profile updates are managed through system settings.");
      }
      setMessage("Profile saved successfully");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save profile");
    }
  };

  if (loading) {
    return <LoadingState label="Loading profile" />;
  }

  return (
    <div className="dashboard-grid">
      <section className="hero-panel hero-panel--compact">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>Account details and contact information.</h2>
        </div>
      </section>

      {message && <div className="alert">{message}</div>}

      <form className="panel" onSubmit={handleSave}>
        <div className="form-grid">
          {profile &&
            Object.entries({
              name: "Name",
              email: "Email",
              website: "Website",
              sector: "Sector",
              contactEmail: "Contact email",
              phone: "Phone",
              location: "Location",
              description: "Description"
            }).map(([key, label]) => {
              if (profile[key] === undefined) {
                return null;
              }

              return (
                <label key={key} className="field">
                  <span>{label}</span>
                  <input name={key} value={profile[key] || ""} onChange={handleChange} />
                </label>
              );
            })}
        </div>

        <button type="submit" className="btn btn--primary">
          Save changes
        </button>
      </form>
    </div>
  );
}

export default Profile;
