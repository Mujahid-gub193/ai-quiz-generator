import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError(""); setMsg(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMsg(data.message);
    } catch (err) {
      setError(err.response?.data?.message ?? "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.brand}>🎓 QuizPortal</h1>
        <h2 style={s.heading}>Forgot Password</h2>
        <p style={s.sub}>Enter your email and we'll send you a reset link.</p>
        {msg ? (
          <div style={s.success}>{msg}</div>
        ) : (
          <form onSubmit={submit} style={s.form}>
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} required style={s.input} />
            {error && <p style={s.error}>{error}</p>}
            <button type="submit" disabled={loading} style={s.btn}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}
        <Link to="/login" style={s.link}>← Back to Sign In</Link>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#667eea,#764ba2)", fontFamily: "'Segoe UI',sans-serif" },
  card: { background: "#fff", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  brand: { margin: 0, fontSize: 24, color: "#1a1a2e", textAlign: "center" },
  heading: { margin: "16px 0 8px", fontSize: 20, color: "#1a1a2e", textAlign: "center" },
  sub: { margin: "0 0 24px", color: "#666", fontSize: 14, textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: { padding: "12px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" },
  btn: { padding: "13px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  error: { margin: 0, color: "#e53e3e", fontSize: 13, textAlign: "center" },
  success: { background: "#c6f6d5", color: "#276749", padding: "14px", borderRadius: 8, fontSize: 14, textAlign: "center", marginBottom: 16 },
  link: { display: "block", marginTop: 20, textAlign: "center", color: "#667eea", fontSize: 14 },
};
