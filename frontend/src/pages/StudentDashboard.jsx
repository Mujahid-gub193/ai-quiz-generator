import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function EnrolledCourseCard({ enrollment: e, onNavigate }) {
  const [progress, setProgress] = useState({ percent: 0, completed: 0, total: 0 });
  useEffect(() => {
    api.get(`/progress/course/${e.course?.id}`).then(r => setProgress(r.data)).catch(() => {});
  }, [e.course?.id]);
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a2e" }}>{e.course?.title}</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>by {e.course?.teacher?.name} · {e.paidAmount === 0 ? "Free" : `${e.currency} ${e.paidAmount}`}</div>
        </div>
        <button onClick={() => onNavigate(`/learn/${e.course?.id}`)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Continue →
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 8, background: "#e0e0e0", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress.percent}%`, background: progress.percent === 100 ? "#48bb78" : "#667eea", borderRadius: 4, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 13, color: "#555", whiteSpace: "nowrap" }}>{progress.percent}% · {progress.completed}/{progress.total} lessons</span>
      </div>
    </div>
  );
}
export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get("/dashboard/overview").then(r => setOverview(r.data)).catch(() => {});
    api.get("/quizzes").then(r => setQuizzes(r.data.quizzes)).catch(() => {});
    api.get("/materials").then(r => setMaterials(r.data.materials)).catch(() => {});
    api.get("/quizzes/attempts").then(r => setAttempts(r.data.attempts)).catch(() => {});
    api.get("/enrollments/my").then(r => setEnrollments(r.data.enrollments)).catch(() => {});
  }, [tab]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const startQuiz = async (quizId) => {
    setError("");
    try {
      const { data } = await api.get(`/quizzes/${quizId}`);
      // normalize options to array in case of legacy string data
      const quiz = {
        ...data.quiz,
        questions: (data.quiz.questions || []).map(q => ({
          ...q,
          options: Array.isArray(q.options)
            ? q.options
            : String(q.options).split(" ").filter(Boolean),
        })),
      };
      setActiveQuiz(quiz);
      setAnswers({});
      setResult(null);
      setTab("take");
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to load quiz.");
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true); setError("");
    try {
      const { data } = await api.post(`/quizzes/${activeQuiz.id}/submit`, { answers });
      setResult(data.attempt);
      // refresh attempts
      api.get("/quizzes/attempts").then(r => setAttempts(r.data.attempts));
      api.get("/dashboard/overview").then(r => setOverview(r.data));
    } catch (err) { setError(err.response?.data?.message ?? "Submission failed."); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={s.page}>
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
      <div className={`sidebar-overlay${sidebarOpen ? " open" : ""}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`dashboard-sidebar${sidebarOpen ? " open" : ""}`} style={s.sidebar}>
        <div style={s.logo} onClick={() => navigate("/courses")} title="Browse Courses">🎓 QuizPortal</div>
        <div style={{ fontSize: 11, color: "#667eea", cursor: "pointer", textAlign: "center", marginBottom: 8 }} onClick={() => navigate("/courses")}>🌐 Browse Courses</div>
        <div style={s.userInfo}>
          <div style={s.avatar}>{user.name[0].toUpperCase()}</div>
          <div>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userRole}>Student</div>
          </div>
        </div>
        <nav style={s.nav}>
          {[
            ["overview", "📊 Overview"],
            ["materials", "📚 Study Materials"],
            ["quizzes", "📝 Browse Quizzes"],
            ["mycourses", "🎓 My Courses"],
            ["history", "📈 My Progress"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setError(""); }}
              style={{ ...s.navBtn, ...(tab === key || (tab === "take" && key === "quizzes") ? s.navBtnActive : {}) }}>
              {label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} style={s.logoutBtn}>🚪 Sign Out</button>
      </aside>

      <main className="dashboard-main" style={s.main}>
        {error && <div style={s.errorBanner}>{error}</div>}

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div>
            <h2 style={s.heading}>Welcome back, {user.name.split(" ")[0]}! 👋</h2>
            {overview ? (
              <>
                <div style={s.statsGrid}>
                  {[
                    ["📚 Materials", overview.stats.materialCount],
                    ["📝 Quizzes", overview.stats.quizCount],
                    ["✅ Attempts", overview.stats.totalAttemptCount],
                    ["⭐ Avg Score", `${overview.stats.averageScore}%`],
                  ].map(([label, val]) => (
                    <div key={label} style={s.statCard}>
                      <div style={s.statVal}>{val}</div>
                      <div style={s.statLabel}>{label}</div>
                    </div>
                  ))}
                </div>
                {overview.recentAttempts.length > 0 && (
                  <div style={{ marginTop: 32 }}>
                    <h3 style={s.subHeading}>Recent Activity</h3>
                    <div style={s.list}>
                      {overview.recentAttempts.map(a => (
                        <div key={a.id} style={s.card}>
                          <div style={s.cardHeader}>
                            <div>
                              <div style={s.cardTitle}>{a.quiz?.title}</div>
                              <div style={s.cardMeta}>{a.quiz?.topic} · {new Date(a.createdAt).toLocaleDateString()}</div>
                            </div>
                            <span style={{ ...s.scoreBadge, background: a.score >= 70 ? "#c6f6d5" : "#fed7d7", color: a.score >= 70 ? "#276749" : "#c53030" }}>
                              {a.score}%
                            </span>
                          </div>
                          <div style={s.cardMeta}>{a.correctAnswers}/{a.totalQuestions} correct</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : <p style={s.muted}>Loading…</p>}
          </div>
        )}

        {/* MATERIALS */}
        {tab === "materials" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ ...s.heading, margin: 0 }}>Study Materials</h2>
              <button onClick={() => api.get("/materials").then(r => setMaterials(r.data.materials))}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#667eea", color: "#fff", cursor: "pointer", fontSize: 13 }}>↻ Refresh</button>
            </div>
            {materials.length === 0 && <p style={s.muted}>No materials available yet.</p>}
            <div style={s.list}>
              {materials.map(m => (
                <div key={m.id} style={s.card}>
                  <div style={s.cardTitle}>{m.title}</div>
                  <div style={s.cardMeta}>{m.topic} · <span style={{ background: "#e9d8fd", color: "#553c9a", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{m.type}</span></div>
                  {m.summary && <div style={{ ...s.cardMeta, marginTop: 6 }}>{m.summary}</div>}

                  {/* Text content */}
                  {m.fileType === "text" && (
                    <p style={{ margin: "10px 0 0", fontSize: 13, color: "#444", lineHeight: 1.6 }}>{m.content}</p>
                  )}

                  {/* PDF */}
                  {m.fileType === "pdf" && m.fileUrl && (
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      <iframe
                        src={m.fileUrl}
                        style={{ width: "100%", height: 500, borderRadius: 8, border: "1px solid #e0e0e0" }}
                        title={m.fileName}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <a href={m.fileUrl} target="_blank" rel="noreferrer"
                          style={{ padding: "8px 16px", background: "#667eea", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                          📄 Open in Browser
                        </a>
                        <a href={m.fileUrl} download
                          style={{ padding: "8px 16px", background: "#48bb78", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                          ⬇ Download PDF
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Video file */}
                  {m.fileType === "video" && m.fileUrl && (
                    <div style={{ marginTop: 12 }}>
                      <video controls style={{ width: "100%", borderRadius: 8, maxHeight: 360 }}>
                        <source src={m.fileUrl} />
                        Your browser does not support video.
                      </video>
                      <a href={m.fileUrl} download target="_blank" rel="noreferrer"
                        style={{ display: "inline-block", marginTop: 8, padding: "8px 16px", background: "#48bb78", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                        ⬇ Download Video
                      </a>
                    </div>
                  )}

                  {/* Link */}
                  {m.fileType === "link" && m.fileUrl && (
                    <div style={{ marginTop: 12 }}>
                      <a href={m.fileUrl} target="_blank" rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#667eea", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                        🔗 Open Link
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BROWSE QUIZZES */}
        {tab === "quizzes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ ...s.heading, margin: 0 }}>Available Quizzes</h2>
              <button onClick={() => api.get("/quizzes").then(r => setQuizzes(r.data.quizzes))}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#667eea", color: "#fff", cursor: "pointer", fontSize: 13 }}>↻ Refresh</button>
            </div>
            {quizzes.length === 0 && <p style={s.muted}>No quizzes available yet.</p>}
            <div style={s.list}>
              {quizzes.map(q => (
                <div key={q.id} style={s.card}>
                  <div style={s.cardHeader}>
                    <div>
                      <div style={s.cardTitle}>{q.title}</div>
                      <div style={s.cardMeta}>{q.topic} · {q.questionCount} questions</div>
                    </div>
                    <button onClick={() => startQuiz(q.id)} style={s.btn}>Take Quiz →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAKE QUIZ */}
        {tab === "take" && activeQuiz && !result && (
          <div>
            <h2 style={s.heading}>{activeQuiz.title}</h2>
            <p style={s.cardMeta}>{activeQuiz.topic} · {activeQuiz.questions?.length} questions</p>
            <div style={s.list}>
              {activeQuiz.questions?.map((q, i) => (
                <div key={q.id} style={s.card}>
                  <div style={s.cardTitle}>Q{i + 1}. {q.prompt}</div>
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    {(Array.isArray(q.options) ? q.options : []).map(opt => (
                      <label key={opt} style={{ ...s.optionLabel, ...(answers[q.id] === opt ? s.optionSelected : {}) }}>
                        <input type="radio" name={`q${q.id}`} value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                          style={{ marginRight: 10 }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={submitQuiz} disabled={submitting} style={{ ...s.btn, marginTop: 20, padding: "12px 28px" }}>
              {submitting ? "Submitting…" : "Submit Quiz"}
            </button>
          </div>
        )}

        {/* RESULT */}
        {tab === "take" && result && (
          <div>
            <h2 style={s.heading}>Quiz Result</h2>
            <div style={{ ...s.card, textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 64, fontWeight: 700, color: result.score >= 70 ? "#48bb78" : "#e53e3e" }}>
                {result.score}%
              </div>
              <div style={{ fontSize: 18, color: "#555", marginTop: 8 }}>
                {result.correctAnswers} / {result.totalQuestions} correct
              </div>
              <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={() => { setTab("quizzes"); setActiveQuiz(null); setResult(null); }} style={s.btn}>
                  Browse More Quizzes
                </button>
                <button onClick={() => setTab("history")} style={{ ...s.btn, background: "#667eea" }}>
                  View History
                </button>
              </div>
            </div>
            {result.feedback && (
              <div style={{ marginTop: 24 }}>
                <h3 style={s.subHeading}>Feedback</h3>
                <div style={s.list}>
                  {result.feedback.map((f, i) => (
                    <div key={f.questionId} style={{ ...s.card, borderLeft: `4px solid ${f.isCorrect ? "#48bb78" : "#e53e3e"}` }}>
                      <div style={s.cardTitle}>Q{i + 1}. {f.prompt}</div>
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        <span style={{ color: f.isCorrect ? "#276749" : "#c53030" }}>
                          {f.isCorrect ? "✅ Correct" : `❌ You answered: ${f.submittedAnswer ?? "—"}`}
                        </span>
                        {!f.isCorrect && <span style={{ color: "#555" }}> · Correct: <strong>{f.correctAnswer}</strong></span>}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "#666" }}>{f.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MY COURSES */}
        {tab === "mycourses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ ...s.heading, margin: 0 }}>My Courses</h2>
              <button onClick={() => navigate("/courses")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#667eea", color: "#fff", cursor: "pointer", fontSize: 13 }}>Browse More Courses</button>
            </div>
            {enrollments.length === 0 && <p style={s.muted}>No courses yet. <span style={{ color: "#667eea", cursor: "pointer" }} onClick={() => navigate("/courses")}>Browse courses →</span></p>}
            <div style={s.list}>
              {enrollments.map(e => (
                <EnrolledCourseCard key={e.id} enrollment={e} onNavigate={navigate} />
              ))}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {tab === "history" && (
          <div>
            <h2 style={s.heading}>My Progress</h2>
            {attempts.length === 0 && <p style={s.muted}>No attempts yet. Take a quiz!</p>}
            <div style={s.list}>
              {attempts.map(a => (
                <div key={a.id} style={s.card}>
                  <div style={s.cardHeader}>
                    <div>
                      <div style={s.cardTitle}>{a.quiz?.title}</div>
                      <div style={s.cardMeta}>{a.quiz?.topic} · {new Date(a.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span style={{ ...s.scoreBadge, background: a.score >= 70 ? "#c6f6d5" : "#fed7d7", color: a.score >= 70 ? "#276749" : "#c53030" }}>
                      {a.score}%
                    </span>
                  </div>
                  <div style={s.cardMeta}>{a.correctAnswers}/{a.totalQuestions} correct</div>
                </div>
              ))}
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
  avatar: { width: 38, height: 38, borderRadius: "50%", background: "#667eea", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 },
  userName: { fontWeight: 600, fontSize: 14 },
  userRole: { fontSize: 12, color: "#a0aec0" },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navBtn: { padding: "10px 14px", borderRadius: 8, border: "none", background: "transparent", color: "#a0aec0", cursor: "pointer", textAlign: "left", fontSize: 14 },
  navBtnActive: { background: "#667eea", color: "#fff" },
  logoutBtn: { padding: "10px 14px", borderRadius: 8, border: "none", background: "#e53e3e22", color: "#fc8181", cursor: "pointer", textAlign: "left", fontSize: 14 },
  main: { flex: 1, padding: "32px 36px", overflowY: "auto" },
  heading: { margin: "0 0 24px", fontSize: 22, color: "#1a1a2e" },
  subHeading: { margin: "0 0 16px", fontSize: 16, color: "#444" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 },
  statCard: { background: "#fff", borderRadius: 12, padding: "24px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  statVal: { fontSize: 32, fontWeight: 700, color: "#667eea" },
  statLabel: { fontSize: 13, color: "#666", marginTop: 6 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: { background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontWeight: 600, fontSize: 15, color: "#1a1a2e" },
  cardMeta: { fontSize: 13, color: "#888", marginTop: 4 },
  btn: { padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  optionLabel: { display: "flex", alignItems: "center", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 14 },
  optionSelected: { background: "#ebf4ff", borderColor: "#667eea" },
  scoreBadge: { padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700 },
  muted: { color: "#999" },
  errorBanner: { background: "#fed7d7", color: "#c53030", padding: "10px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14 },
};
