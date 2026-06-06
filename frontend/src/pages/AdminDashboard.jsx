import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import API from "../services/api";
import LoadingState from "../components/LoadingState";
import AnalyticsChart from "../components/AnalyticsChart";
import { useAuth } from "../context/AuthContext";
import { downloadFile, formatDate } from "../utils/portal";

function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});
  const [latestJobs, setLatestJobs] = useState([]);
  const [latestApplications, setLatestApplications] = useState([]);
  const [snapshot, setSnapshot] = useState({ students: [], companies: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsResponse, snapshotResponse] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/snapshot")
      ]);

      const data = statsResponse.data.data || {};
      setStats(data.stats || {});
      setCharts(data.charts || {});
      setLatestJobs(data.latestJobs || []);
      setLatestApplications(data.latestApplications || []);
      setSnapshot(snapshotResponse.data.data || { students: [], companies: [] });
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const placementChartData = useMemo(
    () =>
      (charts.monthlyApplications || []).map((item) => ({
        label: item.label,
        total: item.total
      })),
    [charts]
  );

  const companyPlacementData = useMemo(
    () =>
      (charts.placementByCompany || []).map((item) => ({
        label: item.label || "Company",
        total: item.total
      })),
    [charts]
  );

  const downloadPlacementPdf = async () => {
    try {
      const response = await API.get("/admin/reports/placement");
      const report = response.data.data;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Placement Report", 14, 18);
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 14, 28);

      const summary = report.summary;
      const summaryLines = [
        `Students: ${summary.students}`,
        `Companies: ${summary.companies}`,
        `Jobs: ${summary.jobs}`,
        `Applications: ${summary.applications}`,
        `Selected: ${summary.selected}`
      ];

      doc.text(summaryLines, 14, 40);
      doc.save("placement-report.pdf");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to download report");
    }
  };

  const downloadSnapshot = async () => {
    try {
      const response = await API.get("/admin/reports/placement");
      downloadFile(
        new Blob([JSON.stringify(response.data.data, null, 2)], { type: "application/json" }),
        "placement-report.json"
      );
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to download snapshot");
    }
  };

  if (loading) {
    return <LoadingState label="Loading admin dashboard" />;
  }

  const metricCards = [
    { label: "Students", value: stats.students || 0 },
    { label: "Companies", value: stats.companies || 0 },
    { label: "Jobs", value: stats.jobs || 0 },
    { label: "Applications", value: stats.applications || 0 },
    { label: "Active jobs", value: stats.activeJobs || 0 },
    { label: "Selected", value: stats.selected || 0 }
  ];

  return (
    <div className="dashboard-grid">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h2>Placement analytics, system oversight, and report exports.</h2>
        </div>

        <div className="stacked-actions stacked-actions--inline">
          <button type="button" className="btn btn--primary" onClick={downloadPlacementPdf}>
            Download PDF report
          </button>
          <button type="button" className="btn btn--secondary" onClick={downloadSnapshot}>
            Download JSON snapshot
          </button>
        </div>
      </section>

      {message && <div className="alert">{message}</div>}

      <section className="stats-grid">
        {metricCards.map((card) => (
          <article key={card.label} className="stat-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="content-grid content-grid--two">
        <AnalyticsChart title="Top hiring companies" type="pie" data={companyPlacementData} dataKey="total" nameKey="label" />
      </section>

      <section className="content-grid content-grid--two">
        <div className="panel">
          <div className="section-heading">
            <h3>Latest jobs</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {latestJobs.length === 0 ? (
                  <tr>
                    <td colSpan="3">No recent jobs.</td>
                  </tr>
                ) : (
                  latestJobs.map((job) => (
                    <tr key={job._id}>
                      <td>{job.title}</td>
                      <td>{job.companyName || job.companyId?.name || "Company"}</td>
                      <td>{job.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h3>Latest applications</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {latestApplications.length === 0 ? (
                  <tr>
                    <td colSpan="4">No recent applications.</td>
                  </tr>
                ) : (
                  latestApplications.map((application) => (
                    <tr key={application._id}>
                      <td>{application.studentId?.name || "Student"}</td>
                      <td>{application.jobId?.title || "Job"}</td>
                      <td>{application.status}</td>
                      <td>{formatDate(application.appliedDate || application.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="content-grid content-grid--two">
        <div className="panel">
          <div className="section-heading">
            <h3>Student management</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.students.length === 0 ? (
                  <tr>
                    <td colSpan="3">No student records found.</td>
                  </tr>
                ) : (
                  snapshot.students.slice(0, 6).map((student) => (
                    <tr key={student._id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.department || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <h3>Company management</h3>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.companies.length === 0 ? (
                  <tr>
                    <td colSpan="3">No company records found.</td>
                  </tr>
                ) : (
                  snapshot.companies.slice(0, 6).map((company) => (
                    <tr key={company._id}>
                      <td>{company.name}</td>
                      <td>{company.email}</td>
                      <td>{company.active ? "Active" : "Inactive"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
