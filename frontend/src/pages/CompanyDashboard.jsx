import { useEffect, useMemo, useRef, useState } from "react";
import API from "../services/api";
import LoadingState from "../components/LoadingState";
import JobCard from "../components/JobCard";
import AnalyticsChart from "../components/AnalyticsChart";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/portal";

const emptyJob = {
  title: "",
  role: "",
  description: "",
  location: "",
  package: "",
  packageText: "",
  eligibility: "",
  skills: "",
  deadline: "",
  status: "active"
};

function CompanyDashboard() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState({ counts: {}, byMonth: {}, jobs: [] });
  const [editingJob, setEditingJob] = useState(null);
  const [reviewJob, setReviewJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const jobFormRef = useRef(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [companyResponse, jobsResponse, analyticsResponse, applicationsResponse] = await Promise.all([
        API.get("/companies/me"),
        API.get("/jobs/my/jobs"),
        API.get("/jobs/my/analytics"),
        API.get("/applications/company")
      ]);

      setCompany(companyResponse.data.data);
      setJobs(jobsResponse.data.data || []);
      setAnalytics(analyticsResponse.data.data || { counts: {}, byMonth: {}, jobs: [] });
      setApplications(applicationsResponse.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load company dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const counts = analytics.counts || {};
    return [
      { label: "Jobs", value: counts.totalJobs || jobs.length },
      { label: "Active", value: counts.activeJobs || jobs.filter((job) => job.status === "active").length },
      { label: "Applications", value: counts.applications || applications.length },
      { label: "Shortlisted", value: counts.shortlisted || applications.filter((item) => item.status === "Shortlisted").length }
    ];
  }, [analytics, jobs, applications]);

  const applicantChartData = useMemo(() => {
    const grouped = applications.reduce((accumulator, application) => {
      const status = application.status || "Applied";
      accumulator[status] = (accumulator[status] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(grouped).map(([label, total]) => ({ label, total }));
  }, [applications]);

  const visibleApplicants = reviewJob ? applicants : applications;

  const handleJobChange = (event) => {
    const { name, value } = event.target;
    setJobForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const resetForm = () => {
    setEditingJob(null);
    setJobForm(emptyJob);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || "",
      role: job.role || "",
      description: job.description || "",
      location: job.location || "",
      package: job.package || "",
      packageText: job.packageText || "",
      eligibility: job.eligibility || "",
      skills: Array.isArray(job.skills) ? job.skills.join(", ") : "",
      deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 10) : "",
      status: job.status || "active"
    });
    setMessage(`Editing ${job.title}. Update the details in the form above.`);

    window.requestAnimationFrame(() => {
      jobFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      jobFormRef.current?.querySelector("input[name='title']")?.focus();
    });
  };

  const handleSubmitJob = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      ...jobForm,
      skills: jobForm.skills
    };

    try {
      if (editingJob) {
        await API.put(`/jobs/${editingJob._id}`, payload);
        setMessage("Job updated successfully");
      } else {
        await API.post("/jobs", payload);
        setMessage("Job posted successfully");
      }

      resetForm();
      await loadDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save job");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (job) => {
    try {
      await API.patch(`/jobs/${job._id}/toggle`);
      await loadDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update job status");
    }
  };

  const handleDelete = async (job) => {
    const confirmed = window.confirm(`Delete ${job.title}?`);
    if (!confirmed) {
      return;
    }

    try {
      await API.delete(`/jobs/${job._id}`);
      await loadDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete job");
    }
  };

  const handleApplicants = async (job) => {
    setReviewJob(job);
    try {
      const response = await API.get(`/jobs/${job._id}/applicants`);
      setApplicants(response.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load applicants");
    }
  };

  const handleShortlist = async (application, nextStatus = "Shortlisted") => {
    try {
      await API.put(`/applications/${application._id}`, {
        status: nextStatus
      });
      if (reviewJob) {
        await handleApplicants(reviewJob);
      }
      await loadDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update applicant");
    }
  };

  if (loading) {
    return <LoadingState label="Loading company dashboard" />;
  }

  return (
    <div className="dashboard-grid">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Company workspace</p>
          <h2>{company?.name || user?.name || "Company"} recruitment console</h2>
          <p className="muted">
            Post jobs, manage visibility, review applicants, and keep recruitment activity organized from one place.
          </p>
        </div>

        <div className="hero-panel__stats">
          {stats.map((item) => (
            <article key={item.label} className="stat-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      {message && <div className="alert">{message}</div>}

      <section className="content-grid content-grid--two">
        <form className="panel job-editor-panel" ref={jobFormRef} onSubmit={handleSubmitJob}>
          <div className="section-heading">
            <h3>{editingJob ? "Edit job" : "Post a new job"}</h3>
            <p>
              {editingJob
                ? `Updating ${editingJob.title}. Save changes when you are done.`
                : "Manage role details and activation status."}
            </p>
          </div>

          <div className="form-grid">
            {[
              ["title", "Title", "text"],
              ["role", "Role", "text"],
              ["location", "Location", "text"],
              ["package", "Package", "number"],
              ["packageText", "Package text", "text"],
              ["eligibility", "Eligibility", "text"]
            ].map(([name, label, type]) => (
              <label className="field" key={name}>
                <span>{label}</span>
                <input name={name} type={type} value={jobForm[name]} onChange={handleJobChange} />
              </label>
            ))}

            <label className="field field--full">
              <span>Description</span>
              <textarea name="description" rows="4" value={jobForm.description} onChange={handleJobChange} />
            </label>

            <label className="field field--full">
              <span>Skills</span>
              <input
                name="skills"
                value={jobForm.skills}
                onChange={handleJobChange}
                placeholder="React, Node, MongoDB"
              />
            </label>

            <label className="field">
              <span>Deadline</span>
              <input type="date" name="deadline" value={jobForm.deadline} onChange={handleJobChange} />
            </label>

            <label className="field">
              <span>Status</span>
              <select name="status" value={jobForm.status} onChange={handleJobChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          <div className="stacked-actions">
              <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingJob ? "Update job" : "Post job"}
              </button>
            <button type="button" className="btn btn--secondary" onClick={resetForm}>
              {editingJob ? "Cancel edit" : "Clear form"}
            </button>
          </div>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h3>Recruitment analytics</h3>
            <p>Live indicators for the hiring funnel.</p>
          </div>
          <AnalyticsChart
            title="Applications by status"
            type="bar"
            data={applicantChartData}
            dataKey="total"
            nameKey="label"
            height={220}
          />

          <div className="job-badges">
            {Object.entries(analytics.byMonth || {}).length > 0 ? (
              <AnalyticsChart
                title="Jobs by month"
                type="line"
                data={Object.entries(analytics.byMonth).map(([label, total]) => ({ label, total }))}
                dataKey="total"
                nameKey="label"
                height={220}
              />
            ) : (
              <div className="empty-state">
                <p>No trend data yet.</p>
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h3>Posted jobs</h3>
          <p>Edit, activate, or remove listings from here.</p>
        </div>

        <div className="jobs-grid">
          {jobs.length === 0 ? (
            <div className="empty-state">
              <p>No jobs have been posted yet.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onEdit={handleEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onViewApplicants={handleApplicants}
              />
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h3>Applicant review</h3>
              <p>See applied students and update their hiring status.</p>
              {reviewJob && <p className="muted">Reviewing applicants for {reviewJob.title}</p>}
              {reviewJob && (
                <button type="button" className="text-button" onClick={() => {
                  setReviewJob(null);
                  setApplicants([]);
                }}>
                  Show all applicants
                </button>
              )}
            </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleApplicants.length === 0 ? (
                <tr>
                  <td colSpan="5">No students have applied yet.</td>
                </tr>
              ) : (
                visibleApplicants.map((application) => (
                  <tr key={application._id}>
                    <td>
                      <strong>{application.studentId?.name || "Candidate"}</strong>
                      <span className="table-subtext">{application.studentId?.email || "Email not available"}</span>
                    </td>
                    <td>{application.jobId?.title || "Job"}</td>
                    <td>
                      <span className={`status-pill status-pill--${application.status === "Selected" ? "success" : application.status === "Rejected" ? "danger" : application.status === "Shortlisted" ? "warning" : "muted"}`}>
                        {application.status}
                      </span>
                    </td>
                    <td>{formatDate(application.appliedDate || application.createdAt)}</td>
                    <td>
                      <div className="inline-actions">
                        <button type="button" className="btn btn--secondary" onClick={() => handleShortlist(application)} disabled={application.status === "Shortlisted"}>
                          Shortlist
                        </button>
                        <button type="button" className="btn btn--primary" onClick={() => handleShortlist(application, "Selected")} disabled={application.status === "Selected"}>
                          Select
                        </button>
                      </div>
                    </td>
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

export default CompanyDashboard;
