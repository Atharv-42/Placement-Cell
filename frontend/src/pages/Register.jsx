import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Register.css";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const initialState = {
  name: "",
  email: "",
  password: "",
  role: "student"
};

const gmailRegex = /^[a-z0-9](?:[a-z0-9.+_-]*[a-z0-9])?@gmail\.com$/;

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!gmailRegex.test(normalizedEmail)) {
      setError("Please use a valid Gmail address");
      setLoading(false);
      return;
    }

    try {
      const response = await API.post("/auth/register", {
        ...formData,
        email: normalizedEmail
      });
      login({
        token: response.data.token,
        user: response.data.user
      });
      navigate(response.data.user.role === "company" ? "/company" : response.data.user.role === "admin" ? "/admin" : "/student", {
        replace: true
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <p className="eyebrow">Create account</p>
          <h1>Join the portal</h1>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="name@gmail.com"
              value={formData.email}
              onChange={handleChange}
              pattern="[a-zA-Z0-9]([a-zA-Z0-9.+_-]*[a-zA-Z0-9])?@gmail\.com"
              title="Enter a valid Gmail address ending in @gmail.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              placeholder="Create password"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </label>

          <label className="field">
            <span>Role</span>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="student">Student</option>
              <option value="company">Company</option>
            </select>
          </label>

          {error && <div className="alert alert--error">{error}</div>}

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
