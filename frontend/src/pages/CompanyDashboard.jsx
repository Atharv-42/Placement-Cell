function CompanyDashboard() {
  return (
    <div className="dashboard">

      <h1>Company Dashboard</h1>

      <div className="stats-grid">

        <div className="stat-card">
          <h3>Total Jobs</h3>
          <p>8</p>
        </div>

        <div className="stat-card">
          <h3>Applications</h3>
          <p>145</p>
        </div>

        <div className="stat-card">
          <h3>Shortlisted</h3>
          <p>28</p>
        </div>

        <div className="stat-card">
          <h3>Selected</h3>
          <p>12</p>
        </div>

      </div>

      <div className="profile-card">

        <h2>Company Profile</h2>

        <p>
          <strong>Name:</strong>
          Infosys
        </p>

        <p>
          <strong>Industry:</strong>
          Information Technology
        </p>

        <button>
          Post New Job
        </button>

      </div>

      <div className="table-card">

        <h2>Active Jobs</h2>

        <table>
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Applications</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            <tr>
              <td>React Developer</td>
              <td>50</td>
              <td>Active</td>
            </tr>

            <tr>
              <td>Backend Developer</td>
              <td>38</td>
              <td>Active</td>
            </tr>

          </tbody>
        </table>

      </div>

    </div>
  );
}

export default CompanyDashboard;