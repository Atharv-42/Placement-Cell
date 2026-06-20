import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import API from "../services/api";
import LoadingState from "../components/LoadingState";
import SkillMatchVisualization from "../components/SkillMatchVisualization";
import { formatDate } from "../utils/portal";

function ResumeAnalysisResult() {
  const location = useLocation();
  const [analysis, setAnalysis] = useState(location.state?.analysis || null);
  const [loading, setLoading] = useState(!location.state?.analysis);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (analysis) {
      return;
    }

    const loadAnalysis = async () => {
      setLoading(true);
      try {
        const response = await API.get("/resume-analyzer/latest");
        setAnalysis(response.data.data);
      } catch (error) {
        setMessage(error.response?.data?.message || "No analysis has been generated yet.");
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [analysis]);

  if (loading) {
    return <LoadingState label="Loading analysis results" />;
  }

  if (!analysis) {
    return (
      <div className="dashboard-grid">
        <section className="hero-panel hero-panel--compact">
          <div>
            <p className="eyebrow">Resume analysis</p>
            <h2>No analysis results yet.</h2>
            <p className="muted">{message || "Upload a resume and run the analyzer to see match insights."}</p>
          </div>
          <Link className="btn btn--primary" to="/resume-analyzer">
            Go to analyzer
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Analysis result</p>
          <h2>Your resume is {analysis.matchPercentage || 0}% aligned with the portal job requirements.</h2>
          <p className="muted">
            {analysis.resumeFile?.originalName || "Uploaded resume"} analyzed on {formatDate(analysis.analyzedAt || analysis.createdAt)}.
          </p>
        </div>

        <div className="hero-panel__stats">
          <article className="stat-card">
            <span>Matched skills</span>
            <strong>
              {Math.max(
                0,
                (analysis.requiredSkills?.length || 0) - (analysis.missingSkills?.length || 0)
              )}
            </strong>
          </article>
          <article className="stat-card">
            <span>Missing skills</span>
            <strong>{analysis.missingSkills?.length ?? 0}</strong>
          </article>
          <article className="stat-card">
            <span>Jobs analyzed</span>
            <strong>{analysis.jobMatches?.length ?? 0}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid content-grid--two">
        <article className="panel">
          <div className="section-heading">
            <h3>Extracted skills</h3>
            <p>Skills detected from the uploaded PDF.</p>
          </div>
          <div className="chip-cloud">
            {(analysis.extractedSkills || []).length === 0 ? (
              <p className="muted">No skills were detected in the current resume.</p>
            ) : (
              analysis.extractedSkills.map((skill) => (
                <span className="chip-cloud__item" key={skill}>
                  {skill}
                </span>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h3>Suggestions to improve</h3>
            <p>Use these ideas to make the resume more job-ready.</p>
          </div>
          <div className="suggestion-list">
            {(analysis.suggestions || []).map((item) => (
              <div className="suggestion-list__item" key={item}>
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>

      <SkillMatchVisualization analysis={analysis} />

      <section className="panel">
        <div className="section-heading">
          <h3>Missing skills</h3>
          <p>These are the capabilities that appear in portal jobs but were not found in the resume.</p>
        </div>
        <div className="chip-cloud">
          {(analysis.missingSkills || []).length === 0 ? (
            <p className="muted">No missing skills found for the current active job set.</p>
          ) : (
            analysis.missingSkills.map((skill) => (
              <span className="chip-cloud__item chip-cloud__item--missing" key={skill}>
                {skill}
              </span>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default ResumeAnalysisResult;
