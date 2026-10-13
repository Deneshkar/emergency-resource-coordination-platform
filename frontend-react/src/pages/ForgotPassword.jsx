import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { apiPost } from "../services/api";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    try {
      const data = await apiPost("/auth/forgot-password", { email });
      toast.success(data?.message || "OTP sent successfully!");
      setStep(2);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const normalizedOtp = otp.trim();
    if (!/^\d{6}$/.test(normalizedOtp)) {
      const message = "Please enter the 6-digit OTP sent to your email.";
      setError(message);
      toast.error(message);
      return;
    }
    if (!newPassword) return;

    setLoading(true);
    setError("");

    try {
      const data = await apiPost("/auth/reset-password", {
        email,
        otp: normalizedOtp,
        newPassword,
      });
      toast.success(data?.message || "Password reset successful! Please log in.");
      
      // Navigate to login after 2 seconds
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <Toaster position="top-right" theme="dark" richColors />
      
      <div className="auth-card anim-slide-up">
        <div className="auth-header">
          <div className="auth-brand-badge">
            <span className="auth-beacon" />
            <span>ERCP OPS-AUTH</span>
          </div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            {step === 1 
              ? "Enter your email to receive a One-Time Password (OTP) code." 
              : "Enter the 6-digit OTP code sent to your email and your new password."}
          </p>
        </div>

        {error && (
          <div className="auth-alert-error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="form-group">
              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. citizen@ercp.org"
                required
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send Reset Code"}
            </button>
            
            <div className="auth-footer" style={{ marginTop: "1rem" }}>
              <Link to="/login" className="auth-link">
                ← Back to Sign In
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                value={email}
                disabled
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-otp">6-Digit OTP</label>
              <input
                id="auth-otp"
                type="text"
                className="auth-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                inputMode="numeric"
                pattern="\d{6}"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-new-password">New Password</label>
              <input
                id="auth-new-password"
                type="password"
                className="auth-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              style={{ background: "var(--success)" }}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
            
            <div className="auth-footer" style={{ marginTop: "1rem" }}>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setStep(1)}
              >
                Use a different email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
