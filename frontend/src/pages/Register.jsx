import { Link } from "react-router-dom";
import "../css/Register.css";

function Register() {
  return (
    <div className="register-page">

      <div className="register-card">

        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join Placement Portal</p>
        </div>

        <form className="register-form">

          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create password"
            />
          </div>

          <div className="input-group">
            <label>Role</label>

            <select>
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