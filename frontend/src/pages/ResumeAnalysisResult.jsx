import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import API from "../services/api";
import LoadingState from "../components/LoadingState";
import { formatDate } from "../utils/portal";

const renderList = (items, emptyText) =>
  (items || []).length === 0 ? (
    <p className="muted">{emptyText}</p>
  ) : (
    <div className="suggestion-list">
      {items.map((item) => (
        <div className="suggestion-list__item" key={item}>
          {item}
        </div>
      ))}
    </div>
  );

const ChipCloud = ({ items, emptyText, variant }) => (
  <div className="chip-cloud">
    {(items || []).length === 0 ? (
      <p className="muted">{emptyText}</p>
    ) : (
      items.map((item) => (
        <span className={`chip-cloud__item ${variant ? `chip-cloud__item--${variant}` : ""}`} key={item}>
          {item}
        </span>
      ))
    )}
  </div>
);

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
            <p className="muted">{message || "Upload a resume and run the analyzer to see ATS insights."}</p>
          </div>
          <Link className="btn btn--primary" to="/resume-analyzer">
            Go to analyzer
          </Link>
        </section>
      </div>
    );
  }

  const score = analysis.atsScore ?? analysis.matchPercentage ?? 0;
  const matchedSkills = analysis.matchedSkills || analysis.extractedSkills || [];
  const improvements = analysis.atsImprovements || analysis.suggestions || [];

  return (
    <div className="dashboard-grid">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">AI ATS analysis result</p>
          <h2>Your resume scored {score}/100 for {analysis.jobTitle || "the selected role"}.</h2>
          <p className="muted">
            {analysis.resumeFile?.originalName || "Uploaded resume"} analyzed on{" "}
            {formatDate(analysis.analyzedAt || analysis.createdAt)}.
          </p>
        </div>

        <div className="hero-panel__stats">
          <article className="stat-card">
            <span>ATS score</span>
            <strong>{score}</strong>
          </article>
          <article className="stat-card">
            <span>Matched skills</span>
            <strong>{matchedSkills.length}</strong>
          </article>
          <article className="stat-card">
            <span>Missing skills</span>
            <strong>{analysis.missingSkills?.length ?? 0}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid content-grid--two">
        <article className="panel">
          <div className="section-heading">
            <h3>Candidate details</h3>
            <p>Information extracted from the resume.</p>
          </div>
          <div className="feature-list">
            <div className="feature-list__item">
              <strong>Name</strong>
              <p>{analysis.candidate?.name || "Not detected"}</p>
            </div>
            <div className="feature-list__item">
              <strong>Email</strong>
              <p>{analysis.candidate?.email || "Not detected"}</p>
            </div>
            <div className="feature-list__item">
              <strong>Phone</strong>
              <p>{analysis.candidate?.phone || "Not detected"}</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h3>ATS improvements</h3>
            <p>Apply these changes before submitting the resume.</p>
          </div>
          {renderList(improvements, "No improvements were generated.")}
        </article>
      </section>

      <section className="content-grid content-grid--two">
        <article className="panel">
          <div className="section-heading">
            <h3>Matched skills</h3>
            <p>Skills that align with the job description.</p>
          </div>
          <ChipCloud items={matchedSkills} emptyText="No matched skills detected." />
        </article>

        <article className="panel">
          <div className="section-heading">
            <h3>Missing skills</h3>
            <p>Important keywords or skills to add if they are accurate for you.</p>
          </div>
          <ChipCloud items={analysis.missingSkills} emptyText="No missing skills detected." variant="missing" />
        </article>
      </section>

      <section className="content-grid content-grid--two">
        <article className="panel">
          <div className="section-heading">
            <h3>Extracted resume sections</h3>
            <p>AI-readable content found in the resume.</p>
          </div>
          <div className="feature-list">
            <div className="feature-list__item">
              <strong>Summary</strong>
              <p>{analysis.sections?.summary || "No summary detected."}</p>
            </div>
            <div className="feature-list__item">
              <strong>Skills</strong>
              <p>{(analysis.sections?.skills || []).join(", ") || "No skills section detected."}</p>
            </div>
            <div className="feature-list__item">
              <strong>Education</strong>
              <p>{(analysis.sections?.education || []).join(" | ") || "No education section detected."}</p>
            </div>
            <div className="feature-list__item">
              <strong>Experience</strong>
              <p>{(analysis.sections?.experience || []).join(" | ") || "No experience section detected."}</p>
            </div>
            <div className="feature-list__item">
              <strong>Projects</strong>
              <p>{(analysis.sections?.projects || []).join(" | ") || "No projects section detected."}</p>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h3>Section-wise feedback</h3>
            <p>Targeted feedback for each resume section.</p>
          </div>
          <div className="feature-list">
            {["summary", "skills", "education", "experience", "projects"].map((section) => (
              <div className="feature-list__item" key={section}>
                <strong>{section.charAt(0).toUpperCase() + section.slice(1)}</strong>
                <p>{(analysis.sectionFeedback?.[section] || []).join(" ") || "No feedback generated."}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid content-grid--two">
        <article className="panel">
          <div className="section-heading">
            <h3>Stronger bullet rewrites</h3>
            <p>Weak bullets rewritten with action and impact.</p>
          </div>
          <div className="feature-list">
            {(analysis.weakBullets || []).length === 0 ? (
              <p className="muted">No bullet rewrites were generated.</p>
            ) : (
              analysis.weakBullets.map((bullet) => (
                <div className="feature-list__item" key={`${bullet.original}-${bullet.rewritten}`}>
                  <strong>Before</strong>
                  <p>{bullet.original || "Not available"}</p>
                  <strong>After</strong>
                  <p>{bullet.rewritten || "Not available"}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h3>Recommended keywords</h3>
            <p>Add only the keywords that honestly match your skills or work.</p>
          </div>
          <ChipCloud items={analysis.recommendedKeywords} emptyText="No keyword recommendations generated." />
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h3>Interview questions</h3>
          <p>Practice questions based on your resume and the target job.</p>
        </div>
        {renderList(analysis.interviewQuestions, "No interview questions were generated.")}
      </section>
    </div>
  );
}

export default ResumeAnalysisResult;
