function SkillMatchVisualization({ analysis }) {
  if (!analysis) {
    return null;
  }

  const jobs = analysis.jobMatches || [];
  const topJobs = jobs.slice(0, 5);

  return (
    <section className="panel">
      <div className="section-heading">
        <h3>Skill Match Visualization</h3>
        <p>How your resume lines up against current job requirements in the portal.</p>
      </div>

      <div className="match-overview">
        <div className="match-overview__copy">
          <span className="match-score">{analysis.matchPercentage || 0}%</span>
          <p className="muted">
            Overall alignment with active job skills. The chart below highlights the best-fit jobs and the skills that still need attention.
          </p>
        </div>

        <div className="progress-shell" aria-label="Overall resume match">
          <div className="progress-shell__bar">
            <span style={{ width: `${Math.max(0, Math.min(100, analysis.matchPercentage || 0))}%` }} />
          </div>
          <div className="progress-shell__labels">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="match-grid">
        <article className="match-card">
          <div className="match-card__header">
            <h4>Top matched jobs</h4>
            <span>{jobs.length} jobs analyzed</span>
          </div>

          <div className="match-list">
            {topJobs.length === 0 ? (
              <p className="muted">No active jobs were found to compare against.</p>
            ) : (
              topJobs.map((job) => (
                <div className="match-list__item" key={job.jobId}>
                  <div className="match-list__heading">
                    <strong>{job.title}</strong>
                    <span>{job.companyName}</span>
                  </div>

                  <div className="progress-shell progress-shell--compact">
                    <div className="progress-shell__bar">
                      <span style={{ width: `${job.matchPercentage || 0}%` }} />
                    </div>
                    <div className="progress-shell__labels">
                      <span>{job.matchPercentage || 0}%</span>
                      <span>{job.matchedSkills?.length || 0}/{job.requiredSkills?.length || 0} skills</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="match-card">
          <div className="match-card__header">
            <h4>Skill gaps</h4>
            <span>{analysis.missingSkills?.length || 0} missing</span>
          </div>

          <div className="chip-cloud">
            {(analysis.missingSkills || []).length === 0 ? (
              <p className="muted">Great match. There are no major skill gaps for the current job set.</p>
            ) : (
              analysis.missingSkills.map((skill) => (
                <span className="chip-cloud__item chip-cloud__item--missing" key={skill}>
                  {skill}
                </span>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

export default SkillMatchVisualization;
