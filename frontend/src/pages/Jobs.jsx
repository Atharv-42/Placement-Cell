import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import LoadingState from "../components/LoadingState";
import JobCard from "../components/JobCard";
import { useAuth } from "../context/AuthContext";
import { downloadFile } from "../utils/portal";

const initialProfileStatus = {
  complete: false,
  missingFields: [],
  hasResume: false
};

function Jobs() {
  const { user, pushNotification } = useAuth();
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
  const [submitting, setSubmitting] = useState("");
  const [error, setError] = useState("");

  const loadJobs = async (nextFilters = filters) => {
    setLoading(true);

    try {
      const [jobsResponse, profileResponse, applicationsResponse] = await Promise.all([
        API.get("/jobs", { params: nextFilters }),
        user?.role === "student" ? API.get("/students/me") : Promise.resolve({ data: { data: null } }),
        user?.role === "student" ? API.get("/applications/me") : Promise.resolve({ data: { data: [] } })
      ]);

      setJobs(jobsResponse.data.data || []);
      setProfileStatus(profileResponse.data?.data?.profileStatus || initialProfileStatus);
      setApplications(applicationsResponse.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applicationMap = useMemo(
    () =>
      applications.reduce((accumulator, application) => {
        accumulator[application.jobId?._id || application.jobId] = application;
        return accumulator;
      }, {}),
    [applications]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await loadJobs(filters);
  };

  const handleApply = async (job) => {
    setSubmitting(job._id);
    setError("");

    try {
      await API.post("/applications", {
        jobId: job._id,
        notes: "Applied from Jobs board"
      });
      pushNotification({
        title: "Application submitted",
        message: `Applied to ${job.title}`
      });
      await loadJobs(filters);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to apply for the job");
    } finally {
      setSubmitting("");
    }
  };

  if (loading) {
    return <LoadingState label="Loading jobs board" />;
  }

  const canApplyToJobs = profileStatus.complete && profileStatus.hasResume;

  return (
    <div className="dashboard-grid">
      <section className="hero-panel hero-panel--compact">
        <div>
          <p className="eyebrow">Jobs board</p>
          <h2>Search curated roles and apply without leaving the portal.</h2>
        </div>

        {user?.role === "admin" && (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={async () => {
              try {
                const response = await API.get("/admin/reports/placement");
                downloadFile(
                  new Blob([JSON.stringify(response.data.data, null, 2)], { type: "application/json" }),
                  "placement-report.json"
                );
              } catch (err) {
                setError(err.response?.data?.message || "Report download failed");
              }
            }}
          >
            Download report snapshot
          </button>
        )}
      </section>

      {error && <div className="alert alert--error">{error}</div>}

      {user?.role === "student" && !canApplyToJobs && (
        <div className="alert">
          Complete your profile and upload a PDF resume before applying to jobs.
        </div>
      )}

      <section className="panel">
        {submitting && <p className="muted">Submitting application for the selected job...</p>}
        <form className="filters-bar" onSubmit={handleSubmit}>
          <label className="field">
            <span>Search</span>
            <input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search role or company" />
          </label>
          <label className="field">
            <span>Location</span>
            <input name="location" value={filters.location} onChange={handleFilterChange} placeholder="Anywhere" />
          </label>
          <label className="field">
            <span>Skills</span>
            <input name="skills" value={filters.skills} onChange={handleFilterChange} placeholder="React, SQL, DevOps" />
          </label>
          <label className="field">
            <span>Min package</span>
            <input name="packageMin" value={filters.packageMin} onChange={handleFilterChange} placeholder="4" />
          </label>
          <label className="field">
            <span>Max package</span>
            <input name="packageMax" value={filters.packageMax} onChange={handleFilterChange} placeholder="25" />
          </label>
          <button className="btn btn--primary" type="submit">
            Filter jobs
          </button>
        </form>
      </section>

      <section className="jobs-grid">
        {jobs.length === 0 ? (
          <div className="empty-state">
            <p>No jobs found for your filters.</p>
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
                onApply={user?.role === "student" && !application ? handleApply : undefined}
              />
            );
          })
        )}
      </section>
    </div>
  );
}

export default Jobs;
