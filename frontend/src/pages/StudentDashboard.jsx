import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import LoadingState from "../components/LoadingState";
import JobCard from "../components/JobCard";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { downloadFile, formatDate } from "../utils/portal";

const initialProfile = {
  name: "",
  email: "",
  phone: "",
  department: "",
  cgpa: "",
  passingYear: "",
  address: "",
  skills: "",
  linkedin: "",
  github: "",
  portfolio: ""
};

const initialProfileStatus = {
  complete: false,
  missingFields: [],
  hasResume: false
};

const formatFieldLabel = (field) =>
  field.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (letter) => letter.toUpperCase());

function StudentDashboard() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profileStatus, setProfileStatus] = useState(initialProfileStatus);
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    skills: "",
    packageMin: "",
    packageMax: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyingId, setApplyingId] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const [profileResponse, applicationsResponse, jobsResponse] = await Promise.all([
        API.get("/students/me"),
        API.get("/applications/me"),
        API.get("/jobs", { params: nextFilters })
      ]);

      const student = profileResponse.data.data;
      setProfileStatus(student?.profileStatus || initialProfileStatus);
      setProfile({
        name: student?.name || user?.name || "",
        email: student?.email || user?.email || "",
        phone: student?.phone || "",
        department: student?.department || "",
        cgpa: student?.cgpa || "",
        passingYear: student?.passingYear || "",
        address: student?.address || "",
        skills: Array.isArray(student?.skills) ? student.skills.join(", ") : "",
        linkedin: student?.socialLinks?.linkedin || "",
        github: student?.socialLinks?.github || "",
        portfolio: student?.socialLinks?.portfolio || ""
      });

      setApplications(applicationsResponse.data.data || []);
      setJobs(jobsResponse.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load student dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applicationMap = useMemo(() => {
    return applications.reduce((accumulator, application) => {
      const jobId = application.jobId?._id || application.jobId;
      accumulator[jobId] = application;
      return accumulator;
    }, {});
  }, [applications]);

  const stats = useMemo(() => {
    const statusCounts = applications.reduce(
      (accumulator, application) => {
        accumulator.total += 1;
        accumulator[application.status?.toLowerCase().replace(/\s+/g, "")] =
          (accumulator[application.status?.toLowerCase().replace(/\s+/g, "")] || 0) + 1;
        return accumulator;
      },
      {
        total: 0,
        applied: 0,
        shortlisted: 0,
        selected: 0,
        rejected: 0
      }
    );

    return statusCounts;
  }, [applications]);

  const companyDecisions = useMemo(
    () => applications.filter((application) => ["Shortlisted", "Selected"].includes(application.status)),
    [applications]
  );

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await API.put("/students/me", profile);
      setProfileStatus(response.data.data.profileStatus || initialProfileStatus);
      setUser((current) => ({
        ...current,
        name: response.data.data.name,
        email: response.data.data.email
      }));
      setMessage("Profile saved successfully");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setMessage("Please upload a PDF resume");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setSaving(true);
      await API.post("/resume-analyzer/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setMessage("Resume uploaded successfully");
      loadDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    try {
      setSaving(true);
      await API.post("/students/me/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setMessage("Profile photo uploaded successfully");
    } catch (error) {
      setMessage(error.response?.data?.message || "Photo upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      const response = await API.get("/students/me/resume", {
        responseType: "blob"
      });
      downloadFile(response.data, "resume.pdf");
    } catch (error) {
      setMessage(error.response?.data?.message || "Resume not available");
    }
  };

  const handleDeleteResume = async () => {
    try {
      await API.delete("/students/me/resume");
      setMessage("Resume removed");
      loadDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to remove resume");
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleApplyFilters = async (event) => {
    event.preventDefault();
    await loadDashboard(filters);
  };

  const handleApply = async (job) => {
    setApplyingId(job._id);
    setMessage("");

    try {
      await API.post("/applications", {
        jobId: job._id,
        notes: `Applied from the student dashboard on ${new Date().toLocaleDateString()}`
      });
      setMessage("Application submitted successfully");
      await loadDashboard(filters);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not apply for the job");
    } finally {
      setApplyingId("");
    }
  };

  if (loading) {
    return <LoadingState label="Loading student dashboard" />;
  }

  const canApplyToJobs = profileStatus.complete && profileStatus.hasResume;

  return (
    <div className="dashboard-grid">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Student workspace</p>
          <h2>{user?.name || "Student"} profile and job tracker</h2>
          <p className="muted">
            Keep your profile current, upload your resume, and move between jobs and application status without leaving the dashboard.
          </p>
        </div>

        <div className="hero-panel__stats">
          <article className="stat-card">
            <span>Applied</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat-card">
            <span>Shortlisted</span>
            <strong>{stats.shortlisted}</strong>
          </article>
          <article className="stat-card">
            <span>Selected</span>
            <strong>{stats.selected}</strong>
          </article>
          <article className="stat-card">
            <span>Active jobs</span>
            <strong>{jobs.length}</strong>
          </article>
        </div>

        <div className="panel panel--link">
          <div>
            <p className="eyebrow">Resume analyzer</p>
            <strong>Check how well your resume matches portal jobs.</strong>
            <p className="muted">Upload a PDF and review extracted skills, match percentage, and improvement tips.</p>
          </div>
          <Link className="btn btn--primary" to="/resume-analyzer">
            Open analyzer
          </Link>
        </div>
      </section>

      {!canApplyToJobs && (
        <div className="alert">
          Complete your profile and upload a PDF resume before applying to jobs.
          <div className="chip-cloud" style={{ marginTop: "0.8rem" }}>
            {profileStatus.missingFields.map((field) => (
              <span key={field} className="chip-cloud__item chip-cloud__item--missing">
                Missing {formatFieldLabel(field)}
              </span>
            ))}
            {!profileStatus.hasResume && (
              <span className="chip-cloud__item chip-cloud__item--missing">Resume not uploaded</span>
            )}
          </div>
        </div>
      )}

      {message && <div className="alert">{message}</div>}

      <section className="content-grid content-grid--two">
        <form className="panel" onSubmit={handleSaveProfile}>
          <div className="section-heading">
            <h3>Profile management</h3>
            <p>Update your academic and contact details.</p>
          </div>

          <div className="form-grid">
            {Object.entries({
              name: "Name",
              email: "Email",
              phone: "Phone",
              department: "Department",
              cgpa: "CGPA",
              passingYear: "Passing year"
            }).map(([key, label]) => (
              <label key={key} className="field">
                <span>{label}</span>
                <input type="text" name={key} value={profile[key]} onChange={handleProfileChange} />
              </label>
            ))}

            <label className="field field--full">
              <span>Address</span>
              <textarea name="address" rows="3" value={profile.address} onChange={handleProfileChange} />
            </label>

            <label className="field field--full">
              <span>Skills</span>
              <input
                type="text"
                name="skills"
                value={profile.skills}
                onChange={handleProfileChange}
                placeholder="React, Node.js, MongoDB"
              />
            </label>

            <label className="field">
              <span>LinkedIn</span>
              <input type="url" name="linkedin" value={profile.linkedin} onChange={handleProfileChange} />
            </label>
            <label className="field">
              <span>GitHub</span>
              <input type="url" name="github" value={profile.github} onChange={handleProfileChange} />
            </label>
            <label className="field field--full">
              <span>Portfolio</span>
              <input type="url" name="portfolio" value={profile.portfolio} onChange={handleProfileChange} />
            </label>
          </div>

          <div className="stacked-actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </button>

            <label className="btn btn--secondary file-button">
              Upload photo
              <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
            </label>

            <label className="btn btn--secondary file-button">
              Upload resume PDF
              <input type="file" accept="application/pdf" onChange={handleResumeUpload} hidden />
            </label>

            <button type="button" className="btn btn--secondary" onClick={handleDownloadResume}>
              Download resume
            </button>

            <button type="button" className="btn btn--danger" onClick={handleDeleteResume}>
              Remove resume
            </button>
          </div>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h3>Application status</h3>
            <p>Track every application and its current state.</p>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan="4">No applications yet.</td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr key={application._id}>
                      <td>{application.jobId?.title || "Job"}</td>
                      <td>{application.jobId?.companyId?.name || application.companyId?.name || "Company"}</td>
                      <td>
                        <span className={`status-pill status-pill--${application.status === "Selected" ? "success" : application.status === "Rejected" ? "danger" : application.status === "Shortlisted" ? "warning" : "muted"}`}>
                          {application.status}
                        </span>
                      </td>
                      <td>{formatDate(application.appliedDate || application.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="decision-list">
            {companyDecisions.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <p>No shortlist or selection updates yet.</p>
              </div>
            ) : (
              companyDecisions.map((application) => (
                <article className="decision-card" key={application._id}>
                  <div>
                    <strong>{application.jobId?.title || "Job"}</strong>
                    <span>{application.jobId?.companyId?.name || application.companyId?.name || "Company"}</span>
                  </div>
                  <span className={`status-pill status-pill--${application.status === "Selected" ? "success" : "warning"}`}>
                    {application.status}
                  </span>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h3>Job search and filters</h3>
          <p>Find openings that match your profile and recent skills.</p>
        </div>

        {applyingId && <p className="muted">Submitting application for your selected job...</p>}

        <form className="filters-bar" onSubmit={handleApplyFilters}>
          <label className="field">
            <span>Search</span>
            <input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search title, company, or role" />
          </label>
          <label className="field">
            <span>Location</span>
            <input name="location" value={filters.location} onChange={handleFilterChange} placeholder="Bengaluru, Remote, Pune" />
          </label>
          <label className="field">
            <span>Skills</span>
            <input name="skills" value={filters.skills} onChange={handleFilterChange} placeholder="React, Node, SQL" />
          </label>
          <label className="field">
            <span>Min package</span>
            <input name="packageMin" value={filters.packageMin} onChange={handleFilterChange} placeholder="4" />
          </label>
          <label className="field">
            <span>Max package</span>
            <input name="packageMax" value={filters.packageMax} onChange={handleFilterChange} placeholder="20" />
          </label>
          <button type="submit" className="btn btn--primary">
            Search jobs
          </button>
        </form>

        <div className="jobs-grid">
          {jobs.length === 0 ? (
            <div className="empty-state">
              <p>No jobs match your current filters.</p>
            </div>
          ) : (
            jobs.map((job) => {
              const application = applicationMap[job._id];
              return (
                <JobCard
                  key={job._id}
                  job={job}
                  applied={Boolean(application)}
                  applyDisabled={!canApplyToJobs}
                  onApply={application ? undefined : handleApply}
                />
              );
            })
          )}
        </div>
      </section>

    </div>
  );
}

export default StudentDashboard;
