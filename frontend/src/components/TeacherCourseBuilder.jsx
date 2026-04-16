import { useEffect, useState } from "react";
import api from "../api/client";

export default function TeacherCourseBuilder() {
  const [courses, setCourses] = useState([]);
  const [view, setView] = useState("list"); // list | create | edit | students
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", price: "", currency: "USD", isFree: false, level: "beginner", category: "" });
  const [thumb, setThumb] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [lessonForms, setLessonForms] = useState({}); // chapterId -> form

  const load = () => api.get("/teacher/courses").then(r => setCourses(r.data.courses)).catch(() => {});
  useEffect(() => { load(); }, []);

  const saveCourse = async (e) => {
    e.preventDefault(); setError(""); setMsg("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "isFree") fd.append(k, v ? "1" : "0");
      else fd.append(k, v);
    });
    if (thumb) fd.append("thumbnail", thumb);
    try {
      if (selected) {
        await api.patch(`/teacher/courses/${selected.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        setMsg("Course updated!");
      } else {
        const { data } = await api.post("/teacher/courses", fd, { headers: { "Content-Type": "multipart/form-data" } });
        setSelected(data.course);
        setMsg("Course created! Now add chapters below.");
      }
      load();
    } catch (err) { setError(err.response?.data?.message || "Failed."); }
  };

  const addChapter = async () => {
    if (!chapterTitle.trim() || !selected) return;
    await api.post(`/teacher/courses/${selected.id}/chapters`, { title: chapterTitle });
    setChapterTitle("");
    const { data } = await api.get("/teacher/courses");
    const updated = data.courses.find(c => c.id === selected.id);
    setSelected(updated);
    setCourses(data.courses);
  };

  const deleteChapter = async (chId) => {
    await api.delete(`/teacher/chapters/${chId}`);
    const { data } = await api.get("/teacher/courses");
    const updated = data.courses.find(c => c.id === selected.id);
    setSelected(updated);
    setCourses(data.courses);
  };

  const addLesson = async (chapterId) => {
    const lf = lessonForms[chapterId] || {};
    if (!lf.title) return;
    setMsg(""); setError("");
    const fd = new FormData();
    fd.append("title", lf.title);
    fd.append("type", lf.type || "video");
    fd.append("freePreview", lf.freePreview ? "1" : "0");
    if (lf.content) fd.append("content", lf.content);
    if (lf.file) fd.append("file", lf.file);
    try {
      await api.post(`/teacher/chapters/${chapterId}/lessons`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setLessonForms(prev => ({ ...prev, [chapterId]: {} }));
      const { data } = await api.get("/teacher/courses");
      const updated = data.courses.find(c => c.id === selected.id);
      setSelected(updated); setCourses(data.courses);
      setMsg("Lesson added!");
    } catch (err) { setError(err.response?.data?.message || "Failed to add lesson."); }
  };

  const deleteLesson = async (lessonId) => {
    await api.delete(`/teacher/lessons/${lessonId}`);
    const { data } = await api.get("/teacher/courses");
    const updated = data.courses.find(c => c.id === selected.id);
    setSelected(updated);
    setCourses(data.courses);
  };

  const viewStudents = async (course) => {
    setSelected(course);
    const { data } = await api.get(`/teacher/courses/${course.id}/students`);
    setStudents(data.students);
    setView("students");
  };

  const removeStudent = async (enrollmentId) => {
    if (!window.confirm("Remove this student from the course?")) return;
    await api.delete(`/teacher/enrollments/${enrollmentId}`);
    setStudents(prev => prev.filter(s => s.enrollmentId !== enrollmentId));
  };

  const togglePublish = async (course) => {
    await api.patch(`/teacher/courses/${course.id}`, JSON.stringify({ published: !course.published }), { headers: { "Content-Type": "application/json" } });
    load();
  };

  if (view === "list") return (
    <div>
      <div style={s.topBar}>
        <h2 style={s.heading}>My Courses</h2>
        <button onClick={() => { setSelected(null); setForm({ title: "", description: "", price: "", currency: "USD", isFree: false, level: "beginner", category: "" }); setView("create"); }} style={s.btn}>+ New Course</button>
      </div>
      {courses.length === 0 && <p style={s.muted}>No courses yet. Create your first course!</p>}
      <div style={s.list}>
        {courses.map(c => (
          <div key={c.id} style={s.card}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              {c.thumbnail && <img src={c.thumbnail} style={{ width: 80, height: 60, borderRadius: 8, objectFit: "cover" }} />}
              <div style={{ flex: 1 }}>
                <div style={s.cardTitle}>{c.title}</div>
                <div style={s.cardMeta}>{c.category} · {c.level} · {c.isFree ? "FREE" : `${c.currency} ${c.price}`}</div>
                <div style={s.cardMeta}>{c.chapters?.length || 0} chapters · {c.chapters?.reduce((a, ch) => a + (ch.lessons?.length || 0), 0)} lessons</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ ...s.badge, background: c.published ? "#c6f6d5" : "#fed7d7", color: c.published ? "#276749" : "#c53030" }}>
                  {c.published ? "Published" : "Draft"}
                </span>
                <button onClick={() => { setSelected(c); setForm({ title: c.title, description: c.description, price: c.price, currency: c.currency, isFree: c.isFree, level: c.level, category: c.category || "" }); setView("edit"); }} style={s.editBtn}>Edit</button>
                <button onClick={() => viewStudents(c)} style={{ ...s.editBtn, background: "#ebf4ff", color: "#667eea" }}>👥 Students</button>
                <button onClick={() => togglePublish(c)} style={{ ...s.editBtn, background: c.published ? "#fed7d7" : "#c6f6d5", color: c.published ? "#c53030" : "#276749" }}>
                  {c.published ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (view === "students") return (
    <div>
      <button onClick={() => setView("list")} style={{ ...s.editBtn, marginBottom: 20 }}>← Back to Courses</button>
      <h2 style={s.heading}>Students — {selected?.title}</h2>
      {students.length === 0 && <p style={s.muted}>No students enrolled yet.</p>}
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <thead>
          <tr>{["Student", "Email", "Paid", "Progress", "Enrolled", ""].map(h => (
            <th key={h} style={{ padding: "12px 16px", background: "#f0f0f7", textAlign: "left", fontSize: 13, color: "#555", fontWeight: 600 }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {students.map(st => (
            <tr key={st.enrollmentId} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "12px 16px", fontSize: 14 }}>{st.student?.name}</td>
              <td style={{ padding: "12px 16px", fontSize: 14 }}>{st.student?.email}</td>
              <td style={{ padding: "12px 16px", fontSize: 14 }}>{st.paidAmount === 0 ? "Free" : `${st.currency} ${st.paidAmount}`}</td>
              <td style={{ padding: "12px 16px", fontSize: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 80, height: 6, background: "#e0e0e0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${st.progress.percent}%`, background: st.progress.percent === 100 ? "#48bb78" : "#667eea", borderRadius: 3 }} />
                  </div>
                  <span>{st.progress.percent}%</span>
                </div>
              </td>
              <td style={{ padding: "12px 16px", fontSize: 13, color: "#888" }}>{new Date(st.enrolledAt).toLocaleDateString()}</td>
              <td style={{ padding: "12px 16px" }}>
                <button onClick={() => removeStudent(st.enrollmentId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", fontSize: 16 }}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <button onClick={() => setView("list")} style={{ ...s.editBtn, marginBottom: 20 }}>← Back to Courses</button>
      {msg && <div style={s.success}>{msg}</div>}
      {error && <div style={s.errorBanner}>{error}</div>}

      {/* Course form */}
      <form onSubmit={saveCourse} style={s.form}>
        <h3 style={s.subHeading}>{selected ? "Edit Course" : "Create Course"}</h3>
        <input placeholder="Course title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={s.input} />
        <textarea placeholder="Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={3} style={s.textarea} />
        <div style={s.row}>
          <input placeholder="Category (e.g. Python, Physics)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={s.input} />
          <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} style={s.input}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div style={s.row}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={form.isFree} onChange={e => setForm({ ...form, isFree: e.target.checked })} />
            Free Course
          </label>
          {!form.isFree && <>
            <input type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={{ ...s.input, maxWidth: 120 }} />
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} style={{ ...s.input, maxWidth: 100 }}>
              {["USD", "BDT", "GBP", "EUR", "INR", "AUD"].map(c => <option key={c}>{c}</option>)}
            </select>
          </>}
        </div>
        <div style={s.fileZone}>
          <label style={{ fontSize: 13, color: "#666" }}>Thumbnail image (optional)</label>
          <input type="file" accept="image/*" onChange={e => setThumb(e.target.files[0])} style={{ fontSize: 13 }} />
        </div>
        <button type="submit" style={s.btn}>{selected ? "Save Changes" : "Create Course"}</button>
      </form>

      {/* Chapters & Lessons (only after course created) */}
      {selected && (
        <div style={{ marginTop: 32 }}>
          <h3 style={s.subHeading}>Course Content</h3>
          <div style={s.row}>
            <input placeholder="New chapter title" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} style={s.input} />
            <button onClick={addChapter} style={s.btn}>+ Add Chapter</button>
          </div>

          {selected.chapters?.sort((a, b) => a.order - b.order).map((ch, ci) => (
            <div key={ch.id} style={{ ...s.card, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>Chapter {ci + 1}: {ch.title}</div>
                <button onClick={() => deleteChapter(ch.id)} style={s.deleteBtn}>🗑</button>
              </div>

              {/* Existing lessons */}
              {ch.lessons?.sort((a, b) => a.order - b.order).map((l, li) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 14 }}>
                  <span>{l.type === "video" ? "🎬" : l.type === "pdf" ? "📄" : "📝"} {l.title} {l.freePreview && <span style={s.previewBadge}>Preview</span>}</span>
                  <button onClick={() => deleteLesson(l.id)} style={s.deleteBtn}>🗑</button>
                </div>
              ))}

              {/* Add lesson form */}
              <div style={{ marginTop: 12, background: "#f7f8fc", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Add Lesson</div>
                <div style={s.row}>
                  <input placeholder="Lesson title" value={lessonForms[ch.id]?.title || ""} onChange={e => setLessonForms(p => ({ ...p, [ch.id]: { ...p[ch.id], title: e.target.value } }))} style={s.input} />
                  <select value={lessonForms[ch.id]?.type || "video"} onChange={e => setLessonForms(p => ({ ...p, [ch.id]: { ...p[ch.id], type: e.target.value } }))} style={{ ...s.input, maxWidth: 100 }}>
                    <option value="video">Video</option>
                    <option value="text">Text</option>
                    <option value="pdf">PDF</option>
                  </select>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={lessonForms[ch.id]?.freePreview || false} onChange={e => setLessonForms(p => ({ ...p, [ch.id]: { ...p[ch.id], freePreview: e.target.checked } }))} />
                    Free Preview
                  </label>
                </div>
                {(lessonForms[ch.id]?.type === "video" || lessonForms[ch.id]?.type === "pdf") && (
                  <input type="file" accept={lessonForms[ch.id]?.type === "video" ? "video/*" : ".pdf"} onChange={e => setLessonForms(p => ({ ...p, [ch.id]: { ...p[ch.id], file: e.target.files[0] } }))} style={{ fontSize: 13, marginTop: 8 }} />
                )}
                {lessonForms[ch.id]?.type === "text" && (
                  <textarea placeholder="Lesson content" value={lessonForms[ch.id]?.content || ""} onChange={e => setLessonForms(p => ({ ...p, [ch.id]: { ...p[ch.id], content: e.target.value } }))} rows={3} style={{ ...s.textarea, marginTop: 8 }} />
                )}
                <button onClick={() => addLesson(ch.id)} style={{ ...s.btn, marginTop: 8, padding: "8px 16px", fontSize: 13 }}>+ Add Lesson</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  heading: { margin: 0, fontSize: 22, color: "#1a1a2e" },
  subHeading: { margin: "0 0 16px", fontSize: 16, color: "#444" },
  form: { background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, flex: 1, minWidth: 140, boxSizing: "border-box" },
  textarea: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, resize: "vertical", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  btn: { padding: "10px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#48bb78,#38a169)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  editBtn: { padding: "6px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#f5f5f5", cursor: "pointer", fontSize: 13 },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", color: "#e53e3e", fontSize: 16 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: { background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardTitle: { fontWeight: 600, fontSize: 15, color: "#1a1a2e", marginBottom: 4 },
  cardMeta: { fontSize: 13, color: "#888" },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  previewBadge: { fontSize: 11, background: "#c6f6d5", color: "#276749", padding: "2px 8px", borderRadius: 10, fontWeight: 600, marginLeft: 6 },
  fileZone: { border: "2px dashed #ddd", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6 },
  muted: { color: "#999" },
  success: { background: "#c6f6d5", color: "#276749", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  errorBanner: { background: "#fed7d7", color: "#c53030", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
};
