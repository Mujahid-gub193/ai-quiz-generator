import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Play, FileText, BookOpen, Users, Clock, Star, Lock, CheckCircle, ChevronDown, ChevronUp, GraduationCap, Globe } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function CourseDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [currency, setCurrency] = useState("USD");
  const [enrolled, setEnrolled] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedChapters, setExpandedChapters] = useState(new Set([0]));

  useEffect(() => {
    api.get(`/courses/${id}`).then(r => setCourse(r.data.course)).catch(() => navigate("/courses"));
    api.get("/currency").then(r => setCurrency(r.data.currency)).catch(() => {});
    if (user) api.get(`/enrollments/check/${id}`).then(r => setEnrolled(r.data.enrolled)).catch(() => {});
    if (searchParams.get("success") && user) {
      setTimeout(() => api.get(`/enrollments/check/${id}`).then(r => setEnrolled(r.data.enrolled)), 2000);
    }
  }, [id, user]);

  const applyCoupon = async () => {
    setCouponMsg(""); setDiscount(0);
    try {
      const { data } = await api.post("/coupons/validate", { code: coupon, courseId: id });
      setDiscount(data.discountPercent);
      setCouponMsg(`✅ ${data.discountPercent}% discount applied!`);
    } catch (err) { setCouponMsg("❌ " + (err.response?.data?.message || "Invalid coupon")); }
  };

  const handleEnroll = async () => {
    if (!user) return navigate("/login");
    setLoading(true); setError("");
    try {
      const { data } = await api.post("/enrollments/checkout", { courseId: id, couponCode: coupon || undefined, currency });
      if (data.free) setEnrolled(true);
      else if (data.url) window.location.href = data.url;
    } catch (err) { setError(err.response?.data?.message || "Failed to start checkout."); }
    finally { setLoading(false); }
  };

  const toggleChapter = (i) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  if (!course) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#6b7280" }}>Loading course…</p>
      </div>
    </div>
  );

  const totalLessons = course.chapters?.reduce((a, ch) => a + (ch.lessons?.length || 0), 0) || 0;
  const freePreviewCount = course.chapters?.flatMap(ch => ch.lessons || []).filter(l => l.freePreview).length || 0;
  const finalPrice = discount > 0 ? (course.price * (1 - discount / 100)).toFixed(2) : course.price;
  const isFree = course.isFree || course.price === 0;

  return (
    <div style={s.page}>
      {/* ── NAVBAR ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <button onClick={() => navigate("/courses")} style={s.backBtn}>
            <ChevronLeft size={18} /> All Courses
          </button>
          <span style={s.navTitle}>{course.title}</span>
          {user && (
            <button onClick={() => navigate(user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/student")}
              style={s.dashBtn}>Dashboard</button>
          )}
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroLeft}>
            <div style={s.breadcrumb}>
              <span style={s.breadcrumbItem} onClick={() => navigate("/courses")}>Home</span>
              <span style={s.breadcrumbSep}>›</span>
              <span style={s.breadcrumbItem} onClick={() => navigate(`/courses?cat=${course.category}`)}>{course.category || "General"}</span>
              <span style={s.breadcrumbSep}>›</span>
              <span style={{ color: "#c4b5fd" }}>{course.title}</span>
            </div>
            <h1 style={s.title}>{course.title}</h1>
            <p style={s.desc}>{course.description}</p>
            <div style={s.metaRow}>
              <div style={s.stars}>
                {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                <span style={s.ratingText}>5.0</span>
              </div>
              <span style={s.metaDot}>·</span>
              <Users size={14} color="#a78bfa" />
              <span style={s.metaText}>{course.enrollments?.length || 0} students</span>
              <span style={s.metaDot}>·</span>
              <BookOpen size={14} color="#a78bfa" />
              <span style={s.metaText}>{totalLessons} lessons</span>
              <span style={s.metaDot}>·</span>
              <Globe size={14} color="#a78bfa" />
              <span style={s.metaText}>English</span>
            </div>
            <div style={s.teacherRow}>
              <div style={s.teacherAvatar}>{course.teacher?.name?.[0]?.toUpperCase()}</div>
              <span style={s.teacherName}>Created by <strong>{course.teacher?.name}</strong></span>
            </div>
            <div style={s.levelBadgeWrap}>
              <span style={s.levelBadge(course.level)}>{course.level}</span>
              {freePreviewCount > 0 && <span style={s.previewBadge}>{freePreviewCount} free preview lessons</span>}
            </div>
          </div>

          {/* ── PURCHASE CARD ── */}
          <div style={s.purchaseCard}>
            {course.thumbnail && <img src={course.thumbnail} alt={course.title} style={s.cardThumb} />}
            {enrolled ? (
              <div style={s.enrolledBox}>
                <CheckCircle size={32} color="#22c55e" />
                <div style={s.enrolledTitle}>You're enrolled!</div>
                <button onClick={() => navigate(`/learn/${id}`)} style={s.goBtn}>
                  <Play size={16} /> Continue Learning
                </button>
              </div>
            ) : (
              <div style={s.buyBox}>
                <div style={s.priceRow}>
                  {isFree ? (
                    <span style={s.freePrice}>FREE</span>
                  ) : (
                    <>
                      {discount > 0 && <span style={s.originalPrice}>{currency} {course.price}</span>}
                      <span style={s.finalPrice}>{currency} {finalPrice}</span>
                      {discount > 0 && <span style={s.discountBadge}>{discount}% OFF</span>}
                    </>
                  )}
                </div>
                {!isFree && (
                  <div style={s.couponRow}>
                    <input placeholder="Coupon code" value={coupon}
                      onChange={e => setCoupon(e.target.value.toUpperCase())} style={s.couponInput} />
                    <button onClick={applyCoupon} style={s.couponBtn}>Apply</button>
                  </div>
                )}
                {couponMsg && <div style={{ fontSize: 13, marginBottom: 8, color: couponMsg.startsWith("✅") ? "#22c55e" : "#ef4444" }}>{couponMsg}</div>}
                {error && <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 8 }}>{error}</div>}
                <button onClick={handleEnroll} disabled={loading} style={s.enrollBtn}>
                  {loading ? "Processing…" : isFree ? "Enroll for Free" : `Buy Now — ${currency} ${finalPrice}`}
                </button>
                {!user && <p style={s.loginHint}>Sign in required to enroll</p>}
                <div style={s.guarantee}>
                  <CheckCircle size={14} color="#22c55e" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
            )}
            <div style={s.includes}>
              <div style={s.includesTitle}>This course includes:</div>
              {[
                [<Play size={14} />, `${totalLessons} on-demand lessons`],
                [<BookOpen size={14} />, `${course.chapters?.length || 0} chapters`],
                [<Clock size={14} />, "Full lifetime access"],
                [<Globe size={14} />, "Access on all devices"],
              ].map(([icon, text]) => (
                <div key={text} style={s.includeItem}>
                  <span style={{ color: "#7c3aed" }}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={s.content}>
        <div style={s.contentInner}>
          {/* Syllabus */}
          <div style={s.syllabus}>
            <h2 style={s.sectionTitle}>Course Content</h2>
            <div style={s.syllabusStats}>
              {course.chapters?.length} chapters · {totalLessons} lessons
            </div>
            {course.chapters?.sort((a, b) => a.order - b.order).map((ch, ci) => (
              <div key={ch.id} style={s.chapter}>
                <button onClick={() => toggleChapter(ci)} style={s.chapterHeader}>
                  <div style={s.chapterLeft}>
                    {expandedChapters.has(ci) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span style={s.chapterTitle}>Chapter {ci + 1}: {ch.title}</span>
                  </div>
                  <span style={s.chapterMeta}>{ch.lessons?.length || 0} lessons</span>
                </button>
                {expandedChapters.has(ci) && (
                  <div style={s.lessonList}>
                    {ch.lessons?.sort((a, b) => a.order - b.order).map(l => (
                      <div key={l.id} style={s.lesson}>
                        <div style={s.lessonLeft}>
                          {l.type === "video" ? <Play size={14} color="#7c3aed" /> : l.type === "pdf" ? <FileText size={14} color="#7c3aed" /> : <BookOpen size={14} color="#7c3aed" />}
                          <span style={s.lessonTitle}>{l.title}</span>
                          {l.freePreview && <span style={s.previewTag}>Preview</span>}
                        </div>
                        <div style={s.lessonRight}>
                          {l.duration && <span style={s.duration}>{Math.floor(l.duration / 60)}m</span>}
                          {!enrolled && !l.freePreview && <Lock size={13} color="#9ca3af" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 18 }}>
            <GraduationCap size={20} color="#a78bfa" /> QuizPortal
          </span>
          <span style={{ fontSize: 13, color: "#8b5cf6" }}>© 2026 QuizPortal. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

const levelColors = { beginner: { bg: "#dcfce7", color: "#166534" }, intermediate: { bg: "#fef9c3", color: "#854d0e" }, advanced: { bg: "#fee2e2", color: "#991b1b" } };

const s = {
  page: { minHeight: "100vh", background: "#f9fafb", fontFamily: "'Segoe UI',system-ui,sans-serif" },
  nav: { background: "#1e1b4b", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, height: 60 },
  backBtn: { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.4)", background: "transparent", color: "#a78bfa", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" },
  navTitle: { flex: 1, color: "#e0e7ff", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  dashBtn: { padding: "7px 16px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" },
  hero: { background: "linear-gradient(135deg,#1e1b4b,#312e81)", color: "#fff", padding: "48px 24px" },
  heroInner: { maxWidth: 1280, margin: "0 auto", display: "flex", gap: 48, flexWrap: "wrap" },
  heroLeft: { flex: 1, minWidth: 300 },
  breadcrumb: { display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 13 },
  breadcrumbItem: { color: "#a78bfa", cursor: "pointer" },
  breadcrumbSep: { color: "#6b7280" },
  title: { margin: "0 0 14px", fontSize: 34, fontWeight: 900, lineHeight: 1.2 },
  desc: { margin: "0 0 18px", color: "#c4b5fd", fontSize: 15, lineHeight: 1.6, maxWidth: 600 },
  metaRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  stars: { display: "flex", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 14, color: "#f59e0b", fontWeight: 700, marginLeft: 4 },
  metaDot: { color: "#6b7280" },
  metaText: { fontSize: 14, color: "#c4b5fd" },
  teacherRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
  teacherAvatar: { width: 32, height: 32, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff" },
  teacherName: { fontSize: 14, color: "#c4b5fd" },
  levelBadgeWrap: { display: "flex", gap: 10, flexWrap: "wrap" },
  levelBadge: (level) => ({ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: levelColors[level]?.bg || "#f3f4f6", color: levelColors[level]?.color || "#374151" }),
  previewBadge: { padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(167,139,250,0.2)", color: "#c4b5fd" },
  purchaseCard: { width: 340, flexShrink: 0, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", alignSelf: "flex-start" },
  cardThumb: { width: "100%", height: 180, objectFit: "cover" },
  enrolledBox: { padding: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  enrolledTitle: { fontWeight: 700, fontSize: 18, color: "#1e1b4b" },
  goBtn: { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", justifyContent: "center" },
  buyBox: { padding: 24 },
  priceRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  freePrice: { fontSize: 32, fontWeight: 900, color: "#22c55e" },
  originalPrice: { fontSize: 16, color: "#9ca3af", textDecoration: "line-through" },
  finalPrice: { fontSize: 32, fontWeight: 900, color: "#1e1b4b" },
  discountBadge: { padding: "3px 10px", borderRadius: 20, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700 },
  couponRow: { display: "flex", gap: 8, marginBottom: 10 },
  couponInput: { flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 },
  couponBtn: { padding: "9px 14px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  enrollBtn: { width: "100%", padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10 },
  loginHint: { margin: "0 0 10px", fontSize: 12, color: "#9ca3af", textAlign: "center" },
  guarantee: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280", justifyContent: "center" },
  includes: { padding: "16px 24px", borderTop: "1px solid #f3f4f6" },
  includesTitle: { fontWeight: 700, fontSize: 14, color: "#1e1b4b", marginBottom: 10 },
  includeItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginBottom: 8 },
  content: { padding: "48px 24px" },
  contentInner: { maxWidth: 860, margin: "0 auto" },
  syllabus: {},
  sectionTitle: { margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#1e1b4b" },
  syllabusStats: { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  chapter: { border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 8, overflow: "hidden" },
  chapterHeader: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "#f9fafb", border: "none", cursor: "pointer", textAlign: "left" },
  chapterLeft: { display: "flex", alignItems: "center", gap: 10 },
  chapterTitle: { fontWeight: 700, fontSize: 14, color: "#1e1b4b" },
  chapterMeta: { fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" },
  lessonList: { background: "#fff" },
  lesson: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 18px", borderTop: "1px solid #f3f4f6" },
  lessonLeft: { display: "flex", alignItems: "center", gap: 10 },
  lessonTitle: { fontSize: 14, color: "#374151" },
  previewTag: { fontSize: 11, background: "#ede9fe", color: "#7c3aed", padding: "2px 8px", borderRadius: 10, fontWeight: 600 },
  lessonRight: { display: "flex", alignItems: "center", gap: 8 },
  duration: { fontSize: 12, color: "#9ca3af" },
  footer: { background: "#1e1b4b", color: "#a78bfa", padding: "24px" },
};
