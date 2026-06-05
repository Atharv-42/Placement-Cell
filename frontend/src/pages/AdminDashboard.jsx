function AdminDashboard() {
  return (
    <div className="dashboard">

      <h1>Admin Dashboard</h1>

      <div className="stats-grid">

        <div className="stat-card">
          <h3>Students</h3>
          <p>500</p>
        </div>

        <div className="stat-card">
          <h3>Companies</h3>
          <p>40</p>
        </div>

        <div className="stat-card">
          <h3>Jobs</h3>
          <p>85</p>
        </div>

        <div className="stat-card">
          <h3>Placement %</h3>
          <p>82%</p>
        </div>

      </div>

      <div className="table-card">

        <h2>Recent Activities</h2>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Activity</th>
            </tr>
          </thead>

          <tbody>

            <tr>
              <td>10 June</td>
              <td>
                Infosys posted new job
              </td>
            </tr>

            <tr>
              <td>11 June</td>
              <td>
                15 students applied
              </td>
            </tr>

          </tbody>

        </table>

      </div>

      <div className="profile-card">

        <h2>System Summary</h2>

        <p>
          Active Recruiters: 35
        </p>

        <p>
          Upcoming Drives: 7
        </p>

        <p>
          Total Applications: 1200
        </p>

      </div>

    </div>
  );
}

export default AdminDashboard;