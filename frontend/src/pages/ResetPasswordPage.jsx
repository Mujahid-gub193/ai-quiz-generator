import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/client";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      navigate("/login", { state: { msg: "Password reset! You can now sign in." } });
    } catch (err) {
      setError(err.response?.data?.message ?? "Something went wrong.");
    } finally { setLoading(false); }
  };

  if (!token) return (
    <div style={s.page}><div style={s.card}><p style={{ color: "#e53e3e" }}>Invalid reset link.</p></div></div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.brand}>🎓 QuizPortal</h1>
        <h2 style={s.heading}>Set New Password</h2>
        <form onSubmit={submit} style={s.form}>
          <input type="password" placeholder="New password" value={password}
            onChange={e => setPassword(e.target.value)} required style={s.input} />
          <input type="password" placeholder="Confirm password" value={confirm}
            onChange={e => setConfirm(e.target.value)} required style={s.input} />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#667eea,#764ba2)", fontFamily: "'Segoe UI',sans-serif" },
  card: { background: "#fff", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  brand: { margin: 0, fontSize: 24, color: "#1a1a2e", textAlign: "center" },
  heading: { margin: "16px 0 24px", fontSize: 20, color: "#1a1a2e", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: { padding: "12px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" },
  btn: { padding: "13px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  error: { margin: 0, color: "#e53e3e", fontSize: 13, textAlign: "center" },
};
