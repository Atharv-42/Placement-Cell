import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verify = async () => {
      try {
        const response = await API.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        setStatus("success");
        setMessage(response.data.message || "Email verified successfully. You can now log in.");
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Email verification failed.");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <p className="eyebrow">Email verification</p>
          <h1>{status === "loading" ? "Checking link" : status === "success" ? "Email verified" : "Verification failed"}</h1>
        </div>

        <div className={`alert${status === "error" ? " alert--error" : ""}`}>{message}</div>

        <p className="auth-footer">
          <Link to="/">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;
