import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import TeacherCourseBuilder from "../components/TeacherCourseBuilder";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("materials");
  const [materials, setMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // Material form
  const [matForm, setMatForm] = useState({ title: "", topic: "", type: "note", content: "", summary: "", fileLink: "" });
  const [matFile, setMatFile] = useState(null);
  const [uploadMode, setUploadMode] = useState("text"); // "text" | "file" | "link"
  const [uploading, setUploading] = useState(false);
  // Quiz gen form
  const [quizForm, setQuizForm] = useState({ title: "", topic: "", materialId: "", questionCount: 5 });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get("/materials").then(r => setMaterials(r.data.materials)).catch(() => {});
    api.get("/quizzes").then(r => setQuizzes(r.data.quizzes)).catch(() => {});
    api.get("/teacher/results").then(r => setResults(r.data.results)).catch(() => {});
  }, [tab]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const createMaterial = async (e) => {
    e.preventDefault(); setError(""); setMsg(""); setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", matForm.title);
      formData.append("topic", matForm.topic);
      formData.append("type", matForm.type);
      formData.append("summary", matForm.summary);
      if (uploadMode === "text") {
        formData.append("content", matForm.content);
      } else if (uploadMode === "file" && matFile) {
        formData.append("file", matFile);
        formData.append("content", matForm.title);
      } else if (uploadMode === "link") {
        formData.append("fileLink", matForm.fileLink);
        formData.append("content", matForm.title);
      }
      const { data } = await api.post("/materials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMaterials(prev => [data.material, ...prev]);
      setMatForm({ title: "", topic: "", type: "note", content: "", summary: "", fileLink: "" });
      setMatFile(null);
      setMsg("Material created!");
    } catch (err) { setError(err.response?.data?.message ?? "Failed to create material."); }
    finally { setUploading(false); }
  };

  const generateQuiz = async (e) => {
    e.preventDefault(); setError(""); setMsg(""); setGenerating(true);
    try {
      const payload = { ...quizForm, questionCount: Number(quizForm.questionCount) };
      if (!payload.materialId) delete payload.materialId;
      const { data } = await api.post("/quizzes/generate", payload);
      setQuizzes(prev => [data.quiz, ...prev]);
      setQuizForm({ title: "", topic: "", materialId: "", questionCount: 5 });
      setMsg(`Quiz generated via ${data.provider}!`);
    } catch (err) { setError(err.response?.data?.message ?? "Failed to generate quiz."); }
    finally { setGenerating(false); }
  };

  const deleteMaterial = async (id) => {
    try {
      await api.delete(`/materials/${id}`);
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch { setError("Failed to delete."); }
  };

  return (
    <div style={s.page}>
      <aside style={s.sidebar}>
        <div style={s.logo} onClick={() => navigate("/courses")} title="Browse Courses">🎓 QuizPortal</div>
        <div style={{ fontSize: 11, color: "#48bb78", cursor: "pointer", textAlign: "center", marginBottom: 8 }} onClick={() => navigate("/courses")}>🌐 Browse Courses</div>
        <div style={s.userInfo}>
          <div style={s.avatar}>{user.name[0].toUpperCase()}</div>
          <div>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userRole}>Teacher</div>
          </div>
        </div>
        <nav style={s.nav}>
          {[
            ["materials", "📚 Materials"],
            ["generate", "⚡ Generate Quiz"],
            ["quizzes", "📝 My Quizzes"],
            ["courses", "🎓 My Courses"],
            ["results", "📊 Student Results"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setError(""); setMsg(""); }}
              style={{ ...s.navBtn, ...(tab === key ? s.navBtnActive : {}) }}>{label}</button>
          ))}
        </nav>
        <button onClick={handleLogout} style={s.logoutBtn}>🚪 Sign Out</button>
      </aside>

      <main style={s.main}>
        {error && <div style={s.errorBanner}>{error}</div>}
        {msg && <div style={s.successBanner}>{msg}</div>}

        {/* MATERIALS */}
        {tab === "materials" && (
          <div>
            <h2 style={s.heading}>Study Materials</h2>
            <form onSubmit={createMaterial} style={s.form}>
              <h3 style={s.subHeading}>Add New Material</h3>
              <div style={s.row}>
                <input placeholder="Title" value={matForm.title} onChange={e => setMatForm({ ...matForm, title: e.target.value })} required style={s.input} />
                <input placeholder="Topic" value={matForm.topic} onChange={e => setMatForm({ ...matForm, topic: e.target.value })} required style={s.input} />
                <select value={matForm.type} onChange={e => setMatForm({ ...matForm, type: e.target.value })} style={s.input}>
                  <option value="note">Note</option>
                  <option value="course">Course</option>
                </select>
              </div>

              {/* Upload mode selector */}
              <div style={{ display: "flex", gap: 8 }}>
                {[["text","📝 Text"],["file","📎 PDF/Video"],["link","🔗 Link"]].map(([m, label]) => (
                  <button type="button" key={m} onClick={() => setUploadMode(m)}
                    style={{ ...s.modeBtn, ...(uploadMode === m ? s.modeBtnActive : {}) }}>{label}</button>
                ))}
              </div>

              {uploadMode === "text" && (
                <textarea placeholder="Content (min 30 chars)" value={matForm.content}
                  onChange={e => setMatForm({ ...matForm, content: e.target.value })} required rows={4} style={s.textarea} />
              )}
              {uploadMode === "file" && (
                <div style={s.fileZone}>
                  <input type="file" accept=".pdf,video/*" onChange={e => setMatFile(e.target.files[0])} required style={{ fontSize: 14 }} />
                  {matFile && <span style={{ fontSize: 13, color: "#555" }}>📎 {matFile.name} ({(matFile.size/1024/1024).toFixed(1)} MB)</span>}
                </div>
              )}
              {uploadMode === "link" && (
                <input placeholder="Paste URL (YouTube, Google Drive, etc.)" value={matForm.fileLink}
                  onChange={e => setMatForm({ ...matForm, fileLink: e.target.value })} required style={s.input} />
              )}

              <input placeholder="Summary (optional)" value={matForm.summary}
                onChange={e => setMatForm({ ...matForm, summary: e.target.value })} style={s.input} />
              <button type="submit" disabled={uploading} style={s.btn}>
                {uploading ? "Uploading…" : "Add Material"}
              </button>
            </form>

            <div style={s.list}>
              {materials.length === 0 && <p style={s.muted}>No materials yet.</p>}
              {materials.map(m => (
                <div key={m.id} style={s.card}>
                  <div style={s.cardHeader}>
                    <div>
                      <div style={s.cardTitle}>{m.title}</div>
                      <div style={s.cardMeta}>{m.topic} · <span style={s.typeBadge}>{m.type}</span> · <span style={s.typeBadge}>{m.fileType}</span></div>
                    </div>
                    <button onClick={() => deleteMaterial(m.id)} style={s.deleteBtn}>🗑</button>
                  </div>
                  {m.fileType === "text" && <p style={s.cardContent}>{m.content?.slice(0, 120)}…</p>}
                  {m.fileType === "pdf" && m.fileUrl && (
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <a href={m.fileUrl} target="_blank" rel="noreferrer"
                        style={{ padding: "6px 14px", background: "#667eea", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>📄 View PDF</a>
                      <a href={m.fileUrl} download
                        style={{ padding: "6px 14px", background: "#48bb78", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>⬇ Download</a>
                    </div>
                  )}
                  {m.fileType === "video" && m.fileUrl && (
                    <video controls style={{ width: "100%", borderRadius: 8, maxHeight: 280, marginTop: 10 }}>
                      <source src={m.fileUrl} />
                    </video>
                  )}
                  {m.fileType === "link" && m.fileUrl && (
                    <a href={m.fileUrl} target="_blank" rel="noreferrer"
                      style={{ display: "inline-block", marginTop: 10, padding: "6px 14px", background: "#667eea", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>🔗 Open Link</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GENERATE QUIZ */}
        {tab === "generate" && (
          <div>
            <h2 style={s.heading}>Generate Quiz</h2>
            <form onSubmit={generateQuiz} style={{ ...s.form, maxWidth: 520 }}>
              <input placeholder="Quiz title (optional)" value={quizForm.title}
                onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} style={s.input} />
              <input placeholder="Topic *" value={quizForm.topic}
                onChange={e => setQuizForm({ ...quizForm, topic: e.target.value })} required style={s.input} />
              <select value={quizForm.materialId} onChange={e => setQuizForm({ ...quizForm, materialId: e.target.value })} style={s.input}>
                <option value="">— From topic only —</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <input type="number" min={1} max={10} placeholder="Number of questions"
                value={quizForm.questionCount} onChange={e => setQuizForm({ ...quizForm, questionCount: e.target.value })} style={s.input} />
              <button type="submit" disabled={generating} style={s.btn}>
                {generating ? "Generating…" : "⚡ Generate Quiz"}
              </button>
            </form>
          </div>
        )}

        {/* MY QUIZZES */}
        {tab === "quizzes" && (
          <div>
            <h2 style={s.heading}>My Quizzes</h2>
            {quizzes.length === 0 && <p style={s.muted}>No quizzes yet.</p>}
            <div style={s.list}>
              {quizzes.map(q => (
                <div key={q.id} style={s.card}>
                  <div style={s.cardHeader}>
                    <div>
                      <div style={s.cardTitle}>{q.title}</div>
                      <div style={s.cardMeta}>{q.topic} · {q.questionCount} questions · <span style={s.typeBadge}>{q.sourceType}</span></div>
                      <div style={s.cardMeta}>{new Date(q.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => setExpandedQuiz(expandedQuiz === q.id ? null : q.id)} style={s.btn}>
                      {expandedQuiz === q.id ? "Hide ▲" : "View ▼"}
                    </button>
                  </div>
                  {expandedQuiz === q.id && q.questions && (
                    <div style={{ marginTop: 14, borderTop: "1px solid #f0f0f0", paddingTop: 14 }}>
                      {q.questions.sort((a,b) => a.order - b.order).map((qu, i) => (
                        <div key={qu.id} style={{ marginBottom: 12 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>Q{i+1}. {qu.prompt}</div>
                          <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: 13, color: "#555" }}>
                            {qu.options?.map(opt => (
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

        {tab === "courses" && <TeacherCourseBuilder />}

        {/* STUDENT RESULTS */}
        {tab === "results" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ ...s.heading, margin: 0 }}>Student Results</h2>
              <button onClick={() => api.get("/teacher/results").then(r => setResults(r.data.results))} style={{ ...s.btn, padding: "8px 16px" }}>↻ Refresh</button>
            </div>
            {results.length === 0 && <p style={s.muted}>No attempts on your quizzes yet.</p>}
            <div style={s.tableWrap}>
              {results.length > 0 && (
                <table style={s.table}>
                  <thead>
                    <tr>{["Student", "Email", "Quiz", "Score", "Date"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.id} style={s.tr}>
                        <td style={s.td}>{r.user?.name}</td>
                        <td style={s.td}>{r.user?.email}</td>
                        <td style={s.td}>{r.quiz?.title}</td>
                        <td style={s.td}><span style={{ ...s.scoreBadge, background: r.score >= 70 ? "#c6f6d5" : "#fed7d7", color: r.score >= 70 ? "#276749" : "#c53030" }}>{r.score}%</span></td>
                        <td style={s.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  page: { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#f7f8fc" },
  sidebar: { width: 240, background: "#1a1a2e", color: "#fff", display: "flex", flexDirection: "column", padding: "24px 16px", gap: 8 },
  logo: { fontSize: 20, fontWeight: 700, marginBottom: 24, textAlign: "center" },
  userInfo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "12px", background: "#16213e", borderRadius: 10 },
  avatar: { width: 38, height: 38, borderRadius: "50%", background: "#48bb78", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 },
  userName: { fontWeight: 600, fontSize: 14 },
  userRole: { fontSize: 12, color: "#a0aec0" },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navBtn: { padding: "10px 14px", borderRadius: 8, border: "none", background: "transparent", color: "#a0aec0", cursor: "pointer", textAlign: "left", fontSize: 14 },
  navBtnActive: { background: "#48bb78", color: "#fff" },
  logoutBtn: { padding: "10px 14px", borderRadius: 8, border: "none", background: "#e53e3e22", color: "#fc8181", cursor: "pointer", textAlign: "left", fontSize: 14 },
  main: { flex: 1, padding: "32px 36px", overflowY: "auto" },
  heading: { margin: "0 0 24px", fontSize: 22, color: "#1a1a2e" },
  subHeading: { margin: "0 0 16px", fontSize: 16, color: "#444" },
  form: { background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 28, display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, flex: 1, minWidth: 140, boxSizing: "border-box" },
  textarea: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, resize: "vertical", fontFamily: "inherit" },
  btn: { padding: "11px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#48bb78,#38a169)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: { background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardTitle: { fontWeight: 600, fontSize: 15, color: "#1a1a2e" },
  cardMeta: { fontSize: 13, color: "#888", marginTop: 2 },
  cardContent: { margin: 0, fontSize: 13, color: "#555" },
  typeBadge: { background: "#e9d8fd", color: "#553c9a", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#e53e3e" },
  modeBtn: { padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  modeBtnActive: { background: "#48bb78", color: "#fff", border: "1px solid #48bb78" },
  fileZone: { border: "2px dashed #ddd", borderRadius: 8, padding: "16px", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  th: { padding: "12px 16px", background: "#f0f0f7", textAlign: "left", fontSize: 13, color: "#555", fontWeight: 600 },
  tr: { borderBottom: "1px solid #f0f0f0" },
  td: { padding: "12px 16px", fontSize: 14, color: "#333" },
  scoreBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  muted: { color: "#999" },
  errorBanner: { background: "#fed7d7", color: "#c53030", padding: "10px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14 },
  successBanner: { background: "#c6f6d5", color: "#276749", padding: "10px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14 },
};
