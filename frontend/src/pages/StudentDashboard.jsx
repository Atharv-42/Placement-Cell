function StudentDashboard() {
  return (
    <div className="dashboard">

      <h1>Student Dashboard</h1>

      <div className="stats-grid">

        <div className="stat-card">
          <h3>Applied Jobs</h3>
          <p>12</p>
        </div>

        <div className="stat-card">
          <h3>Shortlisted</h3>
          <p>5</p>
        </div>

        <div className="stat-card">
          <h3>Interviews</h3>
          <p>3</p>
        </div>

        <div className="stat-card">
          <h3>Offers</h3>
          <p>1</p>
        </div>

      </div>

      <div className="profile-card">
        <h2>Profile Information</h2>

        <p><strong>Name:</strong> Atharv</p>
        <p><strong>Email:</strong> atharv@gmail.com</p>
        <p><strong>CGPA:</strong> 8.7</p>
        <p><strong>Skills:</strong> React, Node.js, MongoDB</p>

        <button>
          Upload Resume
        </button>
      </div>

      <div className="table-card">

        <h2>Applied Jobs</h2>

        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Infosys</td>
              <td>Full Stack Developer</td>
              <td>Shortlisted</td>
            </tr>

            <tr>
              <td>TCS</td>
              <td>Frontend Developer</td>
              <td>Applied</td>
            </tr>
          </tbody>
        </table>

      </div>

    </div>
  );
}

export default StudentDashboard;