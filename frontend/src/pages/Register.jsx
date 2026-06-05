import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Register.css";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post(
        "/auth/register",
        formData
      );

      alert("Registration Successful");

      console.log(response.data);

      navigate("/");
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Registration Failed"
      );
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join Placement Portal</p>
        </div>

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >

          <div className="input-group">
            <label>Full Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Create password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Role</label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">
                Student
              </option>

              <option value="company">
                Company
              </option>
            </select>
          </div>

          <button
            type="submit"
            className="register-btn"
          >
            Create Account
          </button>

        </form>

        <div className="register-footer">
          <p>
            Already have an account?
            <Link to="/"> Login</Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;