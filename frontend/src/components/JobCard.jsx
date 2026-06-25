import { useMemo } from "react";

const formatPackage = (job) => {
  if (job.packageText) {
    return job.packageText;
  }

  if (job.package) {
    return `${job.package} LPA`;
  }

  return "Package on request";
};

function JobCard({
  job,
  applied = false,
  applyDisabled = false,
  onApply,
  onEdit,
  onDelete,
  onToggle,
  onViewApplicants,
  onSelect
}) {
  const skills = useMemo(() => (Array.isArray(job.skills) ? job.skills : []), [job.skills]);

  return (
    <article className="job-card">
      <div className="job-card__header">
        <div>
          <p className="job-card__company">{job.companyName || job.companyId?.name || "Placement partner"}</p>
          <h3>{job.title}</h3>
        </div>
        <span className={`status-pill status-pill--${job.status === "active" ? "success" : "muted"}`}>
          {job.status}
        </span>
      </div>

      <p className="job-card__role">{job.role || "Open role"}</p>
      <p className="job-card__description">{job.description}</p>

      <div className="job-card__meta">
        <span>{job.location || "Location flexible"}</span>
        <span>{formatPackage(job)}</span>
        <span>{job.applicationsCount || 0} applications</span>
      </div>

      {skills.length > 0 && (
        <div className="job-card__tags">
          {skills.slice(0, 6).map((skill) => (
            <span key={skill} className="tag">
              {skill}
            </span>
          ))}
        </div>
      )}

      {job.deadline && (
        <p className="job-card__deadline">
          Deadline: {new Date(job.deadline).toLocaleDateString()}
        </p>
      )}

      <div className="job-card__actions">
        {onApply && (
          <div className="job-card__apply-group">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onApply(job)}
              disabled={applied || applyDisabled}
            >
              {applied ? "Applied" : applyDisabled ? "Complete profile first" : "Apply"}
            </button>
            {applyDisabled && !applied && <span className="job-card__hint">Update your profile and upload a resume first.</span>}
          </div>
        )}
        {onSelect && (
          <button type="button" className="btn btn--secondary" onClick={() => onSelect(job)}>
            View
          </button>
        )}
        {onViewApplicants && (
          <button type="button" className="btn btn--secondary" onClick={() => onViewApplicants(job)}>
            Applicants
          </button>
        )}
        {onEdit && (
          <button type="button" className="btn btn--secondary" onClick={() => onEdit(job)}>
            Edit
          </button>
        )}
        {onToggle && (
          <button type="button" className="btn btn--secondary" onClick={() => onToggle(job)}>
            {job.status === "active" ? "Deactivate" : "Activate"}
          </button>
        )}
        {onDelete && (
          <button type="button" className="btn btn--danger" onClick={() => onDelete(job)}>
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

export default JobCard;
