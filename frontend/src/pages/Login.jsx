import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Login.css";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import heroImage from "../assets/hero.png";

const roleHome = {
  student: "/student",
  company: "/company",
  admin: "/admin"
};

function Login() {
  const navigate = useNavigate();
  const { token, user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) {
      navigate(roleHome[user.role] || "/jobs", { replace: true });
    }
  }, [navigate, token, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await API.post("/auth/login", {
        email,
        password
      });

      login({
        token: response.data.token,
        user: response.data.user
      });

      navigate(roleHome[response.data.user.role] || "/jobs", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="login-hero__content">
          <p className="eyebrow">Placement Cell Portal</p>
          <h1>Recruitment operations that feel calm, current, and complete.</h1>
          <p>
            Manage placements, applications, shortlisted candidates, and reporting from one place without losing the thread.
          </p>

          <div className="hero-points">
            <span>Student profiles and resumes</span>
            <span>Job posting and applicant review</span>
            <span>Admin analytics and exports</span>
          </div>
        </div>

        <img src={heroImage} alt="Placement portal graphic" className="login-hero__image" />
      </section>

      <section className="login-panel">
        <div className="auth-card">
          <p className="eyebrow">Sign in</p>
          <h2>Welcome back</h2>
          <p className="muted">Use your role-based account to continue.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="example@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="text-button" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && <div className="alert alert--error">{error}</div>}

            <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="auth-footer">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;
