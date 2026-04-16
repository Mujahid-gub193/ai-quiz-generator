import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

export default function CoursePlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [progress, setProgress] = useState({ percent: 0, completed: 0, total: 0 });

  useEffect(() => {
    api.get(`/enrollments/course/${id}`)
      .then(r => {
        setCourse(r.data.course);
        const first = r.data.course.chapters?.[0]?.lessons?.[0];
        if (first) setActiveLesson(first);
      })
      .catch(() => navigate(`/courses/${id}`));

    api.get(`/progress/completed/${id}`)
      .then(r => setCompletedIds(new Set(r.data.completedLessonIds)));

    api.get(`/progress/course/${id}`)
      .then(r => setProgress(r.data));
  }, [id]);

  const toggleComplete = async (lessonId) => {
    const { data } = await api.post(`/progress/lesson/${lessonId}`);
    setCompletedIds(prev => {
      const next = new Set(prev);
      data.completed ? next.add(lessonId) : next.delete(lessonId);
      return next;
    });
    api.get(`/progress/course/${id}`).then(r => setProgress(r.data));
  };

  const unenroll = async () => {
    if (!window.confirm("Unenroll from this course?")) return;
    await api.delete(`/enrollments/unenroll/${id}`);
    navigate("/student");
  };

  if (!course) return <div style={{ padding: 40, textAlign: "center" }}>Loading…</div>;

  const totalLessons = course.chapters?.reduce((a, ch) => a + (ch.lessons?.length || 0), 0);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <span style={s.logo} onClick={() => navigate("/student")}>🎓 QuizPortal</span>
        <span style={s.courseTitle}>{course.title}</span>
        <div style={s.headerRight}>
          <div style={s.progressWrap}>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${progress.percent}%` }} />
            </div>
            <span style={s.progressText}>{progress.percent}% complete</span>
          </div>
          <button onClick={unenroll} style={s.unenrollBtn}>Unenroll</button>
          <button onClick={() => navigate("/student")} style={s.backBtn}>← My Courses</button>
        </div>
      </header>

      <div style={s.body}>
        <aside style={s.sidebar}>
          <div style={s.sidebarProgress}>
            {progress.completed}/{progress.total} lessons completed
          </div>
          {course.chapters?.sort((a, b) => a.order - b.order).map((ch, ci) => (
            <div key={ch.id}>
              <div style={s.chapterLabel}>Chapter {ci + 1}: {ch.title}</div>
              {ch.lessons?.sort((a, b) => a.order - b.order).map(l => (
                <div key={l.id} onClick={() => setActiveLesson(l)}
                  style={{ ...s.lessonItem, ...(activeLesson?.id === l.id ? s.lessonActive : {}) }}>
                  <span style={{ marginRight: 8 }}>
                    {completedIds.has(l.id) ? "✅" : l.type === "video" ? "🎬" : l.type === "pdf" ? "📄" : "📝"}
                  </span>
                  {l.title}
                </div>
              ))}
            </div>
          ))}
        </aside>

        <main style={s.main}>
          {activeLesson ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={s.lessonTitle}>{activeLesson.title}</h2>
                <button onClick={() => toggleComplete(activeLesson.id)}
                  style={{ ...s.completeBtn, background: completedIds.has(activeLesson.id) ? "#c6f6d5" : "#f0f0f0", color: completedIds.has(activeLesson.id) ? "#276749" : "#555" }}>
                  {completedIds.has(activeLesson.id) ? "✅ Completed" : "Mark Complete"}
                </button>
              </div>

              {activeLesson.type === "video" && activeLesson.videoUrl && (
                <video controls style={s.video} key={activeLesson.id}>
                  <source src={activeLesson.videoUrl} />
                </video>
              )}
              {activeLesson.type === "pdf" && activeLesson.videoUrl && (
                <div>
                  <iframe src={activeLesson.videoUrl} style={s.pdf} title={activeLesson.title} />
                  <a href={activeLesson.videoUrl} download style={s.downloadBtn}>⬇ Download PDF</a>
                </div>
              )}
              {activeLesson.type === "text" && (
                <div style={s.textContent}>{activeLesson.content}</div>
              )}

              {/* Next lesson button */}
              {(() => {
                const allLessons = course.chapters?.flatMap(ch => ch.lessons?.sort((a,b) => a.order - b.order) || []) || [];
                const idx = allLessons.findIndex(l => l.id === activeLesson.id);
                const next = allLessons[idx + 1];
                return next ? (
                  <button onClick={() => { toggleComplete(activeLesson.id); setActiveLesson(next); }}
                    style={s.nextBtn}>Next Lesson → {next.title}</button>
                ) : (
                  <div style={s.completionMsg}>🎉 You've reached the end of this course!</div>
                );
              })()}
            </div>
          ) : (
            <div style={{ color: "#999", textAlign: "center", marginTop: 80 }}>Select a lesson to start learning</div>
          )}
        </main>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI',sans-serif" },
  header: { background: "#1a1a2e", color: "#fff", padding: "0 24px", display: "flex", alignItems: "center", gap: 16, height: 60, flexShrink: 0 },
  logo: { fontWeight: 700, fontSize: 18, cursor: "pointer", whiteSpace: "nowrap" },
  courseTitle: { flex: 1, fontSize: 14, color: "#a0aec0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  headerRight: { display: "flex", alignItems: "center", gap: 12, flexShrink: 0 },
  progressWrap: { display: "flex", alignItems: "center", gap: 8 },
  progressBar: { width: 120, height: 6, background: "#2d3748", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", background: "#48bb78", borderRadius: 3, transition: "width 0.3s" },
  progressText: { fontSize: 12, color: "#a0aec0", whiteSpace: "nowrap" },
  unenrollBtn: { padding: "6px 12px", borderRadius: 8, border: "1px solid #e53e3e", background: "transparent", color: "#fc8181", cursor: "pointer", fontSize: 12 },
  backBtn: { padding: "6px 14px", borderRadius: 8, border: "1px solid #667eea", background: "transparent", color: "#667eea", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: { width: 280, background: "#fff", borderRight: "1px solid #eee", overflowY: "auto", flexShrink: 0 },
  sidebarProgress: { padding: "12px 16px", background: "#f7f8fc", fontSize: 13, color: "#555", borderBottom: "1px solid #eee", fontWeight: 600 },
  chapterLabel: { padding: "10px 16px", background: "#f7f8fc", fontWeight: 700, fontSize: 12, color: "#555", borderBottom: "1px solid #eee", textTransform: "uppercase", letterSpacing: 0.5 },
  lessonItem: { padding: "10px 16px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f5f5f5", color: "#333", display: "flex", alignItems: "center" },
  lessonActive: { background: "#ebf4ff", color: "#667eea", fontWeight: 600 },
  main: { flex: 1, overflowY: "auto", padding: "32px 40px" },
  lessonTitle: { margin: 0, fontSize: 22, color: "#1a1a2e" },
  completeBtn: { padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  video: { width: "100%", borderRadius: 12, maxHeight: 480, background: "#000" },
  pdf: { width: "100%", height: 600, borderRadius: 8, border: "1px solid #eee" },
  downloadBtn: { display: "inline-block", marginTop: 10, padding: "8px 16px", background: "#48bb78", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" },
  textContent: { fontSize: 15, lineHeight: 1.8, color: "#333", whiteSpace: "pre-wrap" },
  nextBtn: { marginTop: 24, padding: "12px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  completionMsg: { marginTop: 24, padding: 20, background: "#c6f6d5", borderRadius: 12, color: "#276749", fontWeight: 600, fontSize: 16, textAlign: "center" },
};
