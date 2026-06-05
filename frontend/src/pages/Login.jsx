import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Login.css";
import API from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const response = await API.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("userRole", response.data.role);

      if (response.data.role === "student") {
        navigate("/student");
      } else if (response.data.role === "company") {
        navigate("/company");
      } else if (response.data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/jobs");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Login failed"
      );
    }
  };

  return (
    <div className="login-container">

      {/* Left Side */}
      <div className="login-left">
        <h1>Placement Cell Portal</h1>

        <p>
          Connect Students, Companies and Administrators
          through one unified placement platform.
        </p>

        <ul>
          <li>Student Profile Management</li>
          <li>Job Applications</li>
          <li>Company Recruitment Portal</li>
          <li>Placement Analytics Dashboard</li>
        </ul>
      </div>

      {/* Right Side */}
      <div className="login-right">

        <div className="login-card">

          <h2>Welcome Back</h2>
          <p>Login to continue</p>

          <form onSubmit={handleSubmit}>

            <div className="input-box">
              <label>Email</label>

              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </div>

            <div className="input-box">
              <label>Password</label>

              <div className="password-wrapper">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <span
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </span>

              </div>
            </div>

            {error && (
              <div className="error">
                {error}
              </div>
            )}

            <div className="options">

              <Link to="#">
                Forgot Password?
              </Link>
            </div>

            <button className="login-btn" type="submit">
              Login
            </button>

          </form>

          <div className="register-link">
            Don't have an account?

            <Link to="/register">
              Register
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;