import { useEffect, useState } from "react";
import API from "../services/api";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/portal";

function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      try {
        const route =
          user?.role === "company"
            ? "/applications/company"
            : user?.role === "admin"
            ? "/applications"
            : "/applications/me";

        const response = await API.get(route);
        setApplications(response.data.data || []);
      } catch (error) {
        setMessage(error.response?.data?.message || "Unable to load applications");
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [user?.role]);

  if (loading) {
    return <LoadingState label="Loading applications" />;
  }

  const isCompany = user?.role === "company";

  return (
    <div className="dashboard-grid">
      <section className="hero-panel hero-panel--compact">
        <div>
          <p className="eyebrow">Applications</p>
          <h2>Track applications by status and hiring stage.</h2>
        </div>
      </section>

      {message && <div className="alert">{message}</div>}

      <section className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{isCompany ? "Candidate" : "Company"}</th>
                <th>Job</th>
                <th>Status</th>
                <th>Applied</th>
                {isCompany && <th>Notes</th>}
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={isCompany ? "5" : "4"}>No applications found.</td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application._id}>
                    <td>
                      {isCompany
                        ? application.studentId?.name || "Candidate"
                        : application.jobId?.companyId?.name || application.companyId?.name || "Company"}
                    </td>
                    <td>{application.jobId?.title || "Job"}</td>
                    <td>{application.status}</td>
                    <td>{formatDate(application.appliedDate || application.createdAt)}</td>
                    {isCompany && <td>{application.notes || "-"}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Applications;
