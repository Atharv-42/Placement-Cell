import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import LoadingState from "../components/LoadingState";
import { formatDate } from "../utils/portal";

function ResumeAnalyzer() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState(null);

  const loadLatestAnalysis = async () => {
    setLoading(true);
    try {
      const response = await API.get("/resume-analyzer/latest");
      setLatestAnalysis(response.data.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        setMessage(error.response?.data?.message || "Unable to load resume analyzer");
      }
      setLatestAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestAnalysis();
  }, []);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setMessage("");

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (nextFile.type !== "application/pdf") {
      setMessage("Please select a PDF resume.");
      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(nextFile);
  };

  const uploadResume = async () => {
    if (!file) {
      setMessage("Choose a PDF resume first.");
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
      setMessage("Resume uploaded securely. You can now analyze it or use the latest analysis page.");
      await loadLatestAnalysis();
    } catch (error) {
      setMessage(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const analyzeResume = async () => {
    const formData = file ? new FormData() : null;

    if (file) {
      formData.append("resume", file);
    }

    setAnalyzing(true);
    setMessage("");

    try {
      const response = await API.post("/resume-analyzer/analyze", formData || undefined, {
        headers: formData
          ? {
              "Content-Type": "multipart/form-data"
            }
          : undefined
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
          <p className="eyebrow">Resume analyzer</p>
          <h2>Upload your resume, analyze skill coverage, and compare it against live job requirements.</h2>
          <p className="muted">
            This workspace keeps the PDF private, extracts text with ATS-friendly parsing, and shows where your resume matches the portal jobs.
          </p>
        </div>

        <div className="hero-panel__stats">
          <article className="stat-card">
            <span>Latest score</span>
            <strong>{latestAnalysis?.matchPercentage ?? "--"}%</strong>
          </article>
          <article className="stat-card">
            <span>Extracted skills</span>
            <strong>{latestAnalysis?.extractedSkills?.length ?? 0}</strong>
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
            <h3>Resume upload</h3>
            <p>Securely store a PDF resume before running analysis.</p>
          </div>

          <label className="resume-dropzone">
            <input type="file" accept="application/pdf" onChange={handleFileChange} hidden />
            <span className="resume-dropzone__title">{file ? file.name : "Choose a PDF resume"}</span>
            <span className="resume-dropzone__hint">Only PDF files up to 5 MB are supported.</span>
          </label>

          <div className="stacked-actions">
            <button type="button" className="btn btn--primary" onClick={uploadResume} disabled={uploading || !file}>
              {uploading ? "Uploading..." : "Upload resume"}
            </button>
            <button type="button" className="btn btn--secondary" onClick={analyzeResume} disabled={analyzing}>
              {analyzing ? "Analyzing..." : "Analyze resume"}
            </button>
            <Link className="btn btn--secondary" to="/resume-analyzer/results">
              Open latest results
            </Link>
          </div>

          <div className="analysis-summary">
            <p className="muted">
              Upload first if you want to keep the file on the server, then run analysis at any time using the saved resume.
            </p>
            {latestAnalysis?.resumeFile && (
              <div className="analysis-summary__file">
                <strong>{latestAnalysis.resumeFile.originalName}</strong>
                <span>Analyzed on {formatDate(latestAnalysis.analyzedAt || latestAnalysis.createdAt)}</span>
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <h3>What the analyzer checks</h3>
            <p>It reads your PDF, extracts resume skills, and compares them to active job posts in the portal.</p>
          </div>

          <div className="feature-list">
            <div className="feature-list__item">
              <strong>Text extraction</strong>
              <p>Uses pdf-parse to read the resume content from a secure uploaded file.</p>
            </div>
            <div className="feature-list__item">
              <strong>Skill matching</strong>
              <p>Matches common technologies plus the exact skills listed in live job postings.</p>
            </div>
            <div className="feature-list__item">
              <strong>MongoDB storage</strong>
              <p>Saves the latest analysis result so students can return to it later.</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

export default ResumeAnalyzer;
