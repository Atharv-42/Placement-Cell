import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <h2>Placement Portal</h2>

      <Link to="/">Login</Link>
      <Link to="/register">Register</Link>
      <Link to="/student">Student</Link>
      <Link to="/company">Company</Link>
      <Link to="/admin">Admin</Link>
      <Link to="/jobs">Jobs</Link>
    </nav>
  );
}

export default Navbar;