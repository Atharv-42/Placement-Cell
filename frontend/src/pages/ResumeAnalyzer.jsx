import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import LoadingState from "../components/LoadingState";
import { formatDate } from "../utils/portal";

const allowedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

function ResumeAnalyzer() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const loadAnalyzerData = async () => {
    setLoading(true);
    try {
      const [jobsResponse, historyResponse] = await Promise.all([
        API.get("/jobs", { params: { active: true } }),
        API.get("/resume-analyzer/history")
      ]);

      const nextHistory = historyResponse.data.data || [];
      setJobs(jobsResponse.data.data || []);
      setHistory(nextHistory);
      setLatestAnalysis(nextHistory[0] || null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load resume analyzer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyzerData();
  }, []);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setMessage("");

    if (!nextFile) {
      setFile(null);
      return;
    }

    const extension = nextFile.name.split(".").pop()?.toLowerCase();
    const isAllowed = allowedTypes.includes(nextFile.type) || ["pdf", "docx"].includes(extension);

    if (!isAllowed) {
      setMessage("Please select a PDF or DOCX resume.");
      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(nextFile);
  };

  const uploadResume = async () => {
    if (!file) {
      setMessage("Choose a PDF or DOCX resume first.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    setUploading(true);
    setMessage("");

    try {
      await API.post("/resume-analyzer/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setMessage("Resume uploaded securely. Add a job description and run AI analysis.");
      await loadAnalyzerData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const analyzeResume = async () => {
    if (!jobId && !jobDescription.trim()) {
      setMessage("Select a job or paste a job description before analyzing.");
      return;
    }

    const formData = new FormData();

    if (file) {
      formData.append("resume", file);
    }

    if (jobId) {
      formData.append("jobId", jobId);
    } else {
      formData.append("jobDescription", jobDescription.trim());
    }

    setAnalyzing(true);
    setMessage("");

    try {
      const response = await API.post("/resume-analyzer/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setLatestAnalysis(response.data.data);
      navigate("/resume-analyzer/results", {
        state: {
          analysis: response.data.data
        }
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <LoadingState label="Loading resume analyzer" />;
  }

  return (
    <div className="dashboard-grid">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">AI ATS resume analyzer</p>
          <h2>Compare your resume with a real job description and get ATS-ready feedback.</h2>
          <p className="muted">
            Upload PDF or DOCX resumes, choose a portal job or paste your own JD, and generate AI feedback with skills,
            improvements, rewritten bullets, keywords, and interview questions.
          </p>
        </div>

        <div className="hero-panel__stats">
          <article className="stat-card">
            <span>Latest ATS score</span>
            <strong>{latestAnalysis?.atsScore ?? latestAnalysis?.matchPercentage ?? "--"}</strong>
          </article>
          <article className="stat-card">
            <span>Matched skills</span>
            <strong>{latestAnalysis?.matchedSkills?.length ?? 0}</strong>
          </article>
          <article className="stat-card">
            <span>Missing skills</span>
            <strong>{latestAnalysis?.missingSkills?.length ?? 0}</strong>
          </article>
        </div>
      </section>

      {message && <div className="alert">{message}</div>}

      <section className="content-grid content-grid--two">
        <article className="panel">
          <div className="section-heading">
            <h3>Resume and target role</h3>
            <p>Use a saved resume or upload a new PDF/DOCX for this analysis.</p>
          </div>

          <label className="resume-dropzone">
            <input
              type="file"
              accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
              onChange={handleFileChange}
              hidden
            />
            <span className="resume-dropzone__title">{file ? file.name : "Choose a PDF or DOCX resume"}</span>
            <span className="resume-dropzone__hint">Files up to 5 MB are supported.</span>
          </label>

          <label className="field">
            <span>Select job from portal</span>
            <select value={jobId} onChange={(event) => setJobId(event.target.value)}>
              <option value="">Use custom job description</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} {job.companyName ? `- ${job.companyName}` : ""}
                </option>
              ))}
            </select>
          </label>

          {!jobId && (
            <label className="field">
              <span>Custom job description</span>
              <textarea
                rows="8"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the job description, required skills, responsibilities, and eligibility here."
              />
            </label>
          )}

          <div className="stacked-actions">
            <button type="button" className="btn btn--secondary" onClick={uploadResume} disabled={uploading || !file}>
              {uploading ? "Uploading..." : "Upload resume"}
            </button>
            <button type="button" className="btn btn--primary" onClick={analyzeResume} disabled={analyzing}>
              {analyzing ? "Analyzing with AI..." : "Run AI ATS analysis"}
            </button>
            <Link className="btn btn--secondary" to="/resume-analyzer/results">
              Open latest results
            </Link>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h3>Previous analysis history</h3>
            <p>Recent AI analyses are saved for review.</p>
          </div>

          <div className="feature-list">
            {history.length === 0 ? (
              <p className="muted">No analysis history yet.</p>
            ) : (
              history.map((item) => (
                <button
                  className="feature-list__item analysis-history-button"
                  key={item._id}
                  type="button"
                  onClick={() =>
                    navigate("/resume-analyzer/results", {
                      state: {
                        analysis: item
                      }
                    })
                  }
                >
                  <strong>
                    {(item.atsScore ?? item.matchPercentage ?? 0)}/100 - {item.jobTitle || "Resume analysis"}
                  </strong>
                  <p>
                    {item.resumeFile?.originalName || "Uploaded resume"} analyzed on{" "}
                    {formatDate(item.analyzedAt || item.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export default ResumeAnalyzer;
