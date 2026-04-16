import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [adminEnrollments, setAdminEnrollments] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: "", discountPercent: "", maxUses: "", expiresAt: "" });
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [tab, setTab] = useState("stats");
  const [error, setError] = useState("");

  const loadAll = () => {
    api.get("/admin/stats").then(r => setStats(r.data)).catch(() => setError("Failed to load stats."));
    api.get("/admin/users").then(r => setUsers(r.data.users)).catch(() => {});
    api.get("/admin/quizzes").then(r => setAllQuizzes(r.data.quizzes)).catch(() => {});
    api.get("/admin/attempts").then(r => setAllAttempts(r.data.attempts)).catch(() => {});
    api.get("/admin/materials").then(r => setAllMaterials(r.data.materials)).catch(() => {});
    api.get("/admin/courses").then(r => setAdminCourses(r.data.courses)).catch(() => {});
    api.get("/admin/coupons").then(r => setCoupons(r.data.coupons)).catch(() => {});
    api.get("/admin/enrollments").then(r => setAdminEnrollments(r.data.enrollments)).catch(() => {});
  };

  useEffect(() => { loadAll(); }, [tab]);

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch { setError("Failed to update role."); }
  };

  const deleteMaterial = async (id) => {
    if (!window.confirm("Delete this material?")) return;
    try { await api.delete(`/admin/materials/${id}`); setAllMaterials(prev => prev.filter(m => m.id !== id)); }
    catch { setError("Failed to delete material."); }
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm("Delete this quiz?")) return;
    try { await api.delete(`/admin/quizzes/${id}`); setAllQuizzes(prev => prev.filter(q => q.id !== id)); }
    catch { setError("Failed to delete quiz."); }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try { await api.delete(`/admin/courses/${id}`); setAdminCourses(prev => prev.filter(c => c.id !== id)); }
    catch { setError("Failed to delete course."); }
  };

  const toggleCoursePublish = async (id) => {
    try { const { data } = await api.patch(`/admin/courses/${id}/publish`); setAdminCourses(prev => prev.map(c => c.id === id ? data.course : c)); }
    catch { setError("Failed."); }
  };

  const createCoupon = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/admin/coupons", { ...couponForm, discountPercent: Number(couponForm.discountPercent), maxUses: couponForm.maxUses ? Number(couponForm.maxUses) : null });
      setCoupons(prev => [data.coupon, ...prev]);
      setCouponForm({ code: "", discountPercent: "", maxUses: "", expiresAt: "" });
    } catch (err) { setError(err.response?.data?.message || "Failed."); }
  };

  const deleteCoupon = async (id) => {
    try { await api.delete(`/admin/coupons/${id}`); setCoupons(prev => prev.filter(c => c.id !== id)); }
    catch { setError("Failed."); }
  };

  const removeEnrollment = async (id) => {
    if (!window.confirm("Remove this student from the course?")) return;
    try { await api.delete(`/admin/enrollments/${id}`); setAdminEnrollments(prev => prev.filter(e => e.id !== id)); }
    catch { setError("Failed."); }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div style={s.page}>
      <aside style={s.sidebar}>
        <div style={s.logo} onClick={() => navigate("/courses")} title="Browse Courses">🎓 QuizPortal</div>
        <div style={{ fontSize: 11, color: "#667eea", cursor: "pointer", textAlign: "center", marginBottom: 8 }} onClick={() => navigate("/courses")}>🌐 Browse Courses</div>
        <div style={s.userInfo}>
          <div style={s.avatar}>{user.name[0].toUpperCase()}</div>
          <div>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userRole}>Administrator</div>
          </div>
        </div>
        <nav style={s.nav}>
          {[["stats", "📊 Site Stats"], ["users", "👥 Manage Users"], ["materials", "📚 All Materials"], ["quizzes", "📝 All Quizzes"], ["courses", "🎓 All Courses"], ["enrollments", "📋 Enrollments"], ["coupons", "🏷 Coupons"], ["attempts", "✅ All Attempts"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ ...s.navBtn, ...(tab === key ? s.navBtnActive : {}) }}>{label}</button>
          ))}
        </nav>
        <button onClick={handleLogout} style={s.logoutBtn}>🚪 Sign Out</button>
      </aside>

      <main style={s.main}>
        {error && <div style={s.errorBanner}>{error}</div>}

        {tab === "stats" && (
          <div>
            <h2 style={s.heading}>Site Overview</h2>
            {stats ? (
              <div style={s.statsGrid}>
                {[
                  ["👤 Total Users", stats.userCount],
                  ["📚 Materials", stats.materialCount],
                  ["📝 Quizzes", stats.quizCount],
                  ["✅ Attempts", stats.attemptCount],
                  ["⭐ Avg Score", `${stats.avgScore}%`],
                ].map(([label, val]) => (
                  <div key={label} style={s.statCard}>
                    <div style={s.statVal}>{val}</div>
                    <div style={s.statLabel}>{label}</div>
                  </div>
                ))}
              </div>
            ) : <p style={s.muted}>Loading…</p>}
          </div>
        )}

        {tab === "users" && (
          <div>
            <h2 style={s.heading}>Manage Users</h2>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{["Name", "Email", "Role", "Joined", "Change Role"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={s.tr}>
                      <td style={s.td}>{u.name}</td>
                      <td style={s.td}>{u.email}</td>
                      <td style={s.td}><span style={{ ...s.badge, ...roleBadge(u.role) }}>{u.role}</span></td>
                      <td style={s.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={s.td}>
                        <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={s.select}>
                          {["student", "teacher", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "materials" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ ...s.heading, margin: 0 }}>All Materials</h2>
              <button onClick={() => api.get("/admin/materials").then(r => setAllMaterials(r.data.materials))} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#667eea", color: "#fff", cursor: "pointer", fontSize: 13 }}>↻ Refresh</button>
            </div>
            {allMaterials.length === 0 && <p style={s.muted}>No materials yet.</p>}
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{["Title", "Topic", "Type", "Created By", "Date", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {allMaterials.map(m => (
                    <tr key={m.id} style={s.tr}>
                      <td style={s.td}>{m.title}</td>
                      <td style={s.td}>{m.topic}</td>
                      <td style={s.td}><span style={{ ...s.badge, background: "#e9d8fd", color: "#553c9a" }}>{m.type}</span></td>
                      <td style={s.td}>{m.owner?.name ?? "—"}</td>
                      <td style={s.td}>{new Date(m.createdAt).toLocaleDateString()}</td>
                      <td style={s.td}>
                        {m.fileUrl && (
                          <a href={m.fileUrl} target="_blank" rel="noreferrer"
                            style={{ marginRight: 8, fontSize: 13, color: "#667eea" }}>
                            {m.fileType === "pdf" ? "📄" : m.fileType === "video" ? "🎬" : "🔗"} View
                          </a>
                        )}
                        <button onClick={() => deleteMaterial(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", fontSize: 16 }}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "quizzes" && (
          <div>
            <h2 style={s.heading}>All Quizzes</h2>
            {allQuizzes.length === 0 && <p style={s.muted}>No quizzes yet.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {allQuizzes.map(q => (
                <div key={q.id} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a2e" }}>{q.title}</div>
                      <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                        {q.topic} · {q.questionCount} questions · by {q.creator?.name ?? "—"} · <span style={{ ...s.badge, background: "#e9d8fd", color: "#553c9a" }}>{q.sourceType}</span>
                      </div>
                    </div>
                    <button onClick={() => setExpandedQuiz(expandedQuiz === q.id ? null : q.id)}
                      style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: 13 }}>
                      {expandedQuiz === q.id ? "Hide ▲" : "View ▼"}
                    </button>
                    <button onClick={() => deleteQuiz(q.id)} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "#fed7d7", color: "#c53030", cursor: "pointer", fontSize: 13 }}>🗑</button>
                  </div>
                  {expandedQuiz === q.id && q.questions && (
                    <div style={{ marginTop: 14, borderTop: "1px solid #f0f0f0", paddingTop: 14 }}>
                      {[...q.questions].sort((a,b) => a.order - b.order).map((qu, i) => (
                        <div key={qu.id} style={{ marginBottom: 12 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>Q{i+1}. {qu.prompt}</div>
                          <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: 13 }}>
                            {(Array.isArray(qu.options) ? qu.options : []).map(opt => (
                              <li key={opt} style={{ color: opt === qu.correctAnswer ? "#276749" : "#555", fontWeight: opt === qu.correctAnswer ? 600 : 400 }}>
                                {opt} {opt === qu.correctAnswer ? "✓" : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "courses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ ...s.heading, margin: 0 }}>All Courses</h2>
              <button onClick={() => api.get("/admin/courses").then(r => setAdminCourses(r.data.courses))} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#667eea", color: "#fff", cursor: "pointer", fontSize: 13 }}>↻ Refresh</button>
            </div>
            {adminCourses.length === 0 && <p style={s.muted}>No courses yet.</p>}
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{["Title", "Teacher", "Price", "Level", "Status", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {adminCourses.map(c => (
                    <tr key={c.id} style={s.tr}>
                      <td style={s.td}>{c.title}</td>
                      <td style={s.td}>{c.teacher?.name}</td>
                      <td style={s.td}>{c.isFree ? <span style={{ color: "#48bb78", fontWeight: 700 }}>FREE</span> : `${c.currency} ${c.price}`}</td>
                      <td style={s.td}>{c.level}</td>
                      <td style={s.td}><span style={{ ...s.badge, background: c.published ? "#c6f6d5" : "#fed7d7", color: c.published ? "#276749" : "#c53030" }}>{c.published ? "Published" : "Draft"}</span></td>
                      <td style={s.td}>
                        <button onClick={() => toggleCoursePublish(c.id)} style={{ ...s.select, marginRight: 8, cursor: "pointer" }}>{c.published ? "Unpublish" : "Publish"}</button>
                        <button onClick={() => deleteCourse(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", fontSize: 16 }}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "enrollments" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ ...s.heading, margin: 0 }}>All Enrollments</h2>
              <button onClick={() => api.get("/admin/enrollments").then(r => setAdminEnrollments(r.data.enrollments))} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#667eea", color: "#fff", cursor: "pointer", fontSize: 13 }}>↻ Refresh</button>
            </div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{["Student", "Email", "Course", "Paid", "Enrolled", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {adminEnrollments.map(e => (
                    <tr key={e.id} style={s.tr}>
                      <td style={s.td}>{e.student?.name}</td>
                      <td style={s.td}>{e.student?.email}</td>
                      <td style={s.td}>{e.course?.title}</td>
                      <td style={s.td}>{e.paidAmount === 0 ? <span style={{ color: "#48bb78", fontWeight: 700 }}>Free</span> : `${e.currency} ${e.paidAmount}`}</td>
                      <td style={s.td}>{new Date(e.createdAt).toLocaleDateString()}</td>
                      <td style={s.td}><button onClick={() => removeEnrollment(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", fontSize: 16 }}>🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {adminEnrollments.length === 0 && <p style={s.muted}>No enrollments yet.</p>}
            </div>
          </div>
        )}

        {tab === "coupons" && (
          <div>
            <h2 style={s.heading}>Coupon Management</h2>
            <form onSubmit={createCoupon} style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 24, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <input placeholder="Code (e.g. SAVE20)" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required style={{ ...s.select, padding: "8px 12px", flex: 1, minWidth: 120 }} />
              <input type="number" placeholder="Discount %" min={1} max={100} value={couponForm.discountPercent} onChange={e => setCouponForm({ ...couponForm, discountPercent: e.target.value })} required style={{ ...s.select, padding: "8px 12px", width: 120 }} />
              <input type="number" placeholder="Max uses (optional)" value={couponForm.maxUses} onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value })} style={{ ...s.select, padding: "8px 12px", width: 150 }} />
              <input type="date" value={couponForm.expiresAt} onChange={e => setCouponForm({ ...couponForm, expiresAt: e.target.value })} style={{ ...s.select, padding: "8px 12px", width: 150 }} />
              <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#667eea", color: "#fff", cursor: "pointer", fontWeight: 600 }}>+ Create</button>
            </form>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{["Code", "Discount", "Used/Max", "Expires", "Status", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} style={s.tr}>
                      <td style={s.td}><strong>{c.code}</strong></td>
                      <td style={s.td}>{c.discountPercent}%</td>
                      <td style={s.td}>{c.usedCount}/{c.maxUses ?? "∞"}</td>
                      <td style={s.td}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}</td>
                      <td style={s.td}><span style={{ ...s.badge, background: c.active ? "#c6f6d5" : "#fed7d7", color: c.active ? "#276749" : "#c53030" }}>{c.active ? "Active" : "Inactive"}</span></td>
                      <td style={s.td}><button onClick={() => deleteCoupon(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", fontSize: 16 }}>🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {coupons.length === 0 && <p style={s.muted}>No coupons yet.</p>}
            </div>
          </div>
        )}

        {tab === "attempts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ ...s.heading, margin: 0 }}>All Attempts</h2>
              <button onClick={() => api.get("/admin/attempts").then(r => setAllAttempts(r.data.attempts))} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#667eea", color: "#fff", cursor: "pointer", fontSize: 13 }}>↻ Refresh</button>
            </div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{["Student", "Email", "Quiz", "Score", "Correct", "Date"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {allAttempts.map(a => (
                    <tr key={a.id} style={s.tr}>
                      <td style={s.td}>{a.user?.name}</td>
                      <td style={s.td}>{a.user?.email}</td>
                      <td style={s.td}>{a.quiz?.title}</td>
                      <td style={s.td}><span style={{ ...s.badge, background: a.score >= 70 ? "#c6f6d5" : "#fed7d7", color: a.score >= 70 ? "#276749" : "#c53030" }}>{a.score}%</span></td>
                      <td style={s.td}>{a.correctAnswers}/{a.totalQuestions}</td>
                      <td style={s.td}>{new Date(a.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allAttempts.length === 0 && <p style={s.muted}>No attempts yet.</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const roleBadge = (role) => ({
  admin: { background: "#fed7d7", color: "#c53030" },
  teacher: { background: "#c6f6d5", color: "#276749" },
  student: { background: "#bee3f8", color: "#2a69ac" },
}[role] ?? {});

const s = {
  page: { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f8fc" },
  sidebar: {
    width: 240, background: "#1a1a2e", color: "#fff", display: "flex",
    flexDirection: "column", padding: "24px 16px", gap: 8,
  },
  logo: { fontSize: 20, fontWeight: 700, marginBottom: 24, textAlign: "center" },
  userInfo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "12px", background: "#16213e", borderRadius: 10 },
  avatar: { width: 38, height: 38, borderRadius: "50%", background: "#667eea", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 },
  userName: { fontWeight: 600, fontSize: 14 },
  userRole: { fontSize: 12, color: "#a0aec0" },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navBtn: { padding: "10px 14px", borderRadius: 8, border: "none", background: "transparent", color: "#a0aec0", cursor: "pointer", textAlign: "left", fontSize: 14 },
  navBtnActive: { background: "#667eea", color: "#fff" },
  logoutBtn: { padding: "10px 14px", borderRadius: 8, border: "none", background: "#e53e3e22", color: "#fc8181", cursor: "pointer", textAlign: "left", fontSize: 14, marginTop: "auto" },
  main: { flex: 1, padding: "32px 36px", overflowY: "auto" },
  heading: { margin: "0 0 24px", fontSize: 22, color: "#1a1a2e" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 },
  statCard: { background: "#fff", borderRadius: 12, padding: "24px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  statVal: { fontSize: 32, fontWeight: 700, color: "#667eea" },
  statLabel: { fontSize: 13, color: "#666", marginTop: 6 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  th: { padding: "12px 16px", background: "#f0f0f7", textAlign: "left", fontSize: 13, color: "#555", fontWeight: 600 },
  tr: { borderBottom: "1px solid #f0f0f0" },
  td: { padding: "12px 16px", fontSize: 14, color: "#333" },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  select: { padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, cursor: "pointer" },
  muted: { color: "#999" },
  errorBanner: { background: "#fed7d7", color: "#c53030", padding: "10px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14 },
};
