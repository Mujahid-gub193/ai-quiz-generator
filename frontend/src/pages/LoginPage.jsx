import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

function CoursesTeaser() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    if (!courses) api.get("/courses").then(r => setCourses(r.data.courses.slice(0, 4))).catch(() => setCourses([]));
    setOpen(o => !o);
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999 }}>
      {open && (
        <div style={ts.panel}>
          <div style={ts.panelHeader}>
            <span style={ts.panelTitle}>🎓 Popular Courses</span>
            <button onClick={() => navigate("/courses")} style={ts.seeAll}>See all →</button>
          </div>
          {!courses && <div style={ts.loading}>Loading…</div>}
          {courses?.length === 0 && <div style={ts.loading}>No courses yet.</div>}
          {courses?.map(c => (
            <div key={c.id} onClick={() => navigate(`/courses/${c.id}`)} style={ts.courseRow}>
              <div style={ts.courseThumb}>
                {c.thumbnail ? <img src={c.thumbnail} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎓"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={ts.courseTitle}>{c.title}</div>
                <div style={ts.courseMeta}>{c.isFree || c.price === 0 ? <span style={{ color: "#22c55e", fontWeight: 700 }}>FREE</span> : `${c.currency} ${c.price}`}</div>
              </div>
            </div>
          ))}
          <button onClick={() => navigate("/courses")} style={ts.browseBtn}>Browse All Courses</button>
        </div>
      )}
      <button onClick={load} style={ts.fab}>
        <span style={{ fontSize: 20 }}>🎓</span>
        <span style={ts.fabText}>Courses</span>
        <span style={ts.fabBadge}>NEW</span>
      </button>
    </div>
  );
}

const ts = {
  panel: { background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", width: 300, marginBottom: 12, overflow: "hidden", border: "1px solid #ede9fe" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff" },
  panelTitle: { fontWeight: 700, fontSize: 14 },
  seeAll: { background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, padding: "4px 10px", borderRadius: 6, fontWeight: 600 },
  loading: { padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: 13 },
  courseRow: { display: "flex", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f5f3ff", alignItems: "center" },
  courseThumb: { width: 44, height: 44, borderRadius: 8, background: "#ede9fe", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  courseTitle: { fontWeight: 600, fontSize: 13, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  courseMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  browseBtn: { width: "100%", padding: "12px", border: "none", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  fab: { display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 50, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.5)", fontSize: 14, fontWeight: 700 },
  fabText: { fontWeight: 700 },
  fabBadge: { background: "#f59e0b", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 10 },
};

const QUICK_LOGINS = [
  { label: "Student", email: "mujahidulislamgub193@gmail.com", role: "student", color: "#667eea" },
  { label: "Teacher", email: "mujahidulislamgub193@gmail.com", role: "teacher", color: "#48bb78" },
  { label: "Admin",   email: "mujahidulislamgub193@gmail.com", role: "admin",   color: "#e53e3e" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resetMsg = location.state?.msg || "";
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: form.role };
      const { data } = await api.post(endpoint, payload);
      login(data.user, data.token);
      const dest = { admin: "/admin", teacher: "/teacher", student: "/student" }[data.user.role] ?? "/student";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email, password = "password123") => {
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.user, data.token);
      const dest = { admin: "/admin", teacher: "/teacher", student: "/student" }[data.user.role] ?? "/student";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? "Quick login failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>

      {/* Top-left Courses link */}
      <Link to="/courses" style={{ position: "fixed", top: 20, left: 24, display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", zIndex: 100 }}>
        🎓 Courses
      </Link>

      {/* Floating course teaser — bottom right */}
      <CoursesTeaser />

      <div style={styles.card}>
        <h1 style={styles.brand}>🎓 QuizPortal</h1>
        <p style={styles.sub}>Online Learning Platform</p>

        {resetMsg && <div style={styles.success}>{resetMsg}</div>}

        {/* Quick login buttons */}
        {mode === "login" && (
          <div style={styles.quickSection}>
            <p style={styles.quickLabel}>Quick Login</p>
            <div style={styles.quickRow}>
              {QUICK_LOGINS.map(({ label, email, color }) => (
                <button key={label} onClick={() => quickLogin(email)}
                  disabled={loading}
                  style={{ ...styles.quickBtn, background: color }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={styles.divider}><span>or sign in manually</span></div>
          </div>
        )}

        <div style={styles.tabs}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={styles.form}>
          {mode === "register" && (
            <input name="name" placeholder="Full name" value={form.name}
              onChange={handle} required style={styles.input} />
          )}
          <input name="email" type="email" placeholder="Email address" value={form.email}
            onChange={handle} required style={styles.input} />
          <input name="password" type="password" placeholder="Password" value={form.password}
            onChange={handle} required style={styles.input} />

          {mode === "register" && (
            <select name="role" value={form.role} onChange={handle} style={styles.input}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          )}

          {error && <p style={styles.error}>{error}</p>}

          {mode === "login" && (
            <Link to="/forgot-password" style={{ fontSize: 13, color: "#667eea", textAlign: "right" }}>
              Forgot password?
            </Link>
          )}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: "#fff", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 440,
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  },
  brand: { margin: 0, fontSize: 28, color: "#1a1a2e", textAlign: "center" },
  sub: { margin: "4px 0 20px", color: "#666", textAlign: "center", fontSize: 14 },
  quickSection: { marginBottom: 20 },
  quickLabel: { margin: "0 0 10px", fontSize: 12, color: "#999", textAlign: "center", textTransform: "uppercase", letterSpacing: 1 },
  quickRow: { display: "flex", gap: 10 },
  quickBtn: {
    flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
    color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
  },
  divider: {
    display: "flex", alignItems: "center", gap: 10, margin: "16px 0 0",
    fontSize: 12, color: "#bbb",
    "::before": { content: '""', flex: 1, height: 1, background: "#eee" },
    "::after":  { content: '""', flex: 1, height: 1, background: "#eee" },
  },
  tabs: { display: "flex", marginBottom: 20, borderRadius: 8, overflow: "hidden", border: "1px solid #e0e0e0" },
  tab: { flex: 1, padding: "10px 0", border: "none", background: "#f5f5f5", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#555" },
  tabActive: { background: "#667eea", color: "#fff" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  input: { padding: "12px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  btn: { padding: "13px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 4 },
  error: { margin: 0, color: "#e53e3e", fontSize: 13, textAlign: "center" },
  success: { background: "#c6f6d5", color: "#276749", padding: "10px 14px", borderRadius: 8, fontSize: 13, textAlign: "center", marginBottom: 12 },
};
