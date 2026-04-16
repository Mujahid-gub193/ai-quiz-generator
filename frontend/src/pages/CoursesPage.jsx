import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Users, Star, ChevronRight, GraduationCap, Globe, Award, TrendingUp } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["All", "Programming", "Science", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Language", "Business", "Design", "Other"];

const SUBCATEGORIES = {
  Programming: ["Python", "JavaScript", "C", "C++", "C#", "Java", "PHP", "Ruby", "Go", "Rust", "Swift", "Kotlin"],
  Science: ["Physics", "Chemistry", "Biology", "Astronomy", "Earth Science"],
  Mathematics: ["Algebra", "Calculus", "Statistics", "Geometry", "Trigonometry"],
  Business: ["Marketing", "Finance", "Entrepreneurship", "Management", "Accounting"],
  Design: ["UI/UX", "Graphic Design", "3D Modeling", "Animation"],
  Language: ["English", "Spanish", "French", "Arabic", "Chinese", "Bengali"],
};

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [currency, setCurrency] = useState("USD");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");
  const [hoveredCat, setHoveredCat] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/courses").then(r => setCourses(r.data.courses)).catch(() => {});
    api.get("/currency").then(r => setCurrency(r.data.currency)).catch(() => {});
  }, []);

  const filtered = courses.filter(c => {
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || c.category?.toLowerCase() === category.toLowerCase();
    const matchLevel = level === "All" || c.level === level.toLowerCase();
    return matchSearch && matchCat && matchLevel;
  });

  const featured = courses.slice(0, 4);
  const totalStudents = courses.reduce((a, c) => a + (c.enrollments?.length || 0), 0);

  const formatPrice = (course) => {
    if (course.isFree || course.price === 0) return { label: "FREE", color: "#22c55e" };
    return { label: `${currency} ${course.price}`, color: "#1a1a2e" };
  };

  const totalLessons = (course) =>
    course.chapters?.reduce((a, ch) => a + (ch.lessons?.length || 0), 0) || 0;

  return (
    <div style={s.page}>
      {/* ── NAVBAR ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLeft}>
            <span style={s.logo} onClick={() => navigate("/courses")}>
              <GraduationCap size={24} color="#a78bfa" />
              <span>QuizPortal</span>
            </span>
            <div style={s.navSearch}>
              <Search size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
              <input
                placeholder="Search for anything…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setSearch(searchInput)}
                style={s.navSearchInput}
              />
              <button onClick={() => setSearch(searchInput)} style={s.navSearchBtn}>Search</button>
            </div>
          </div>
          <div style={s.navRight}>
            {user ? (
              <button onClick={() => navigate(user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/student")}
                style={s.btnOutline}>My Dashboard</button>
            ) : (
              <>
                <button onClick={() => navigate("/login")} style={s.btnGhost}>Log in</button>
                <button onClick={() => navigate("/login")} style={s.btnFill}>Sign up</button>
              </>
            )}
          </div>
        </div>
        {/* Category bar */}
        <div style={s.catBar}>
          <div style={s.catInner}>
            {CATEGORIES.map(cat => (
              <div key={cat} style={{ position: "relative" }}
                onMouseEnter={() => setHoveredCat(cat)}
                onMouseLeave={() => setHoveredCat(null)}>
                <button onClick={() => { setCategory(cat); setSearch(""); setSearchInput(""); }}
                  style={{ ...s.catBtn, ...(category === cat ? s.catBtnActive : {}) }}>
                  {cat} {SUBCATEGORIES[cat] ? "▾" : ""}
                </button>
                {SUBCATEGORIES[cat] && hoveredCat === cat && (
                  <div style={s.dropdown}>
                    {SUBCATEGORIES[cat].map(sub => (
                      <div key={sub} onClick={() => { setSearch(sub); setSearchInput(sub); setHoveredCat(null); }}
                        style={s.dropdownItem}>
                        {sub}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      {!search && category === "All" && (
        <section style={s.hero}>
          <div style={s.heroContent}>
            <div style={s.heroLeft}>
              <div style={s.heroBadge}>🔥 New courses added weekly</div>
              <h1 style={s.heroTitle}>Learn Without<br /><span style={s.heroAccent}>Limits</span></h1>
              <p style={s.heroSub}>
                Explore expert-led courses in programming, science, math and more.
                Start learning today — free or paid.
              </p>
              <div style={s.heroSearch}>
                <Search size={18} color="#6b7280" />
                <input
                  placeholder="What do you want to learn?"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setSearch(searchInput)}
                  style={s.heroSearchInput}
                />
                <button onClick={() => setSearch(searchInput)} style={s.heroSearchBtn}>Search</button>
              </div>
              <div style={s.heroStats}>
                {[
                  [<BookOpen size={16} />, `${courses.length} Courses`],
                  [<Users size={16} />, `${totalStudents} Students`],
                  [<Award size={16} />, "Expert Teachers"],
                ].map(([icon, label]) => (
                  <div key={label} style={s.heroStat}>
                    <span style={{ color: "#a78bfa" }}>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={s.heroRight}>
              <div style={s.heroIllustration}>
                <div style={s.heroCard1}>
                  <div style={s.heroCardIcon}>🐍</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Python Masterclass</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>4.9 ★ · 2.4k students</div>
                  </div>
                </div>
                <div style={s.heroCard2}>
                  <div style={s.heroCardIcon}>⚛️</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>React Complete Guide</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>4.8 ★ · 1.8k students</div>
                  </div>
                </div>
                <div style={s.heroCard3}>
                  <TrendingUp size={20} color="#22c55e" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>+24% this week</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED (only on home) ── */}
      {!search && category === "All" && featured.length > 0 && (
        <section style={s.section}>
          <div style={s.sectionInner}>
            <div style={s.sectionHeader}>
              <div>
                <h2 style={s.sectionTitle}>Featured Courses</h2>
                <p style={s.sectionSub}>Hand-picked by our team</p>
              </div>
              <button onClick={() => setCategory("All")} style={s.seeAll}>
                See all <ChevronRight size={16} />
              </button>
            </div>
            <div style={s.featuredGrid}>
              {featured.map(course => (
                <CourseCard key={course.id} course={course} currency={currency}
                  formatPrice={formatPrice} totalLessons={totalLessons}
                  onClick={() => navigate(`/courses/${course.id}`)} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ALL / FILTERED COURSES ── */}
      <section style={{ ...s.section, background: "#f9fafb" }}>
        <div style={s.sectionInner}>
          <div style={s.sectionHeader}>
            <div>
              <h2 style={s.sectionTitle}>
                {search ? `Results for "${search}"` : category !== "All" ? `${category} Courses` : "All Courses"}
              </h2>
              <p style={s.sectionSub}>{filtered.length} course{filtered.length !== 1 ? "s" : ""} found</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <select value={level} onChange={e => setLevel(e.target.value)} style={s.filterSelect}>
                <option value="All">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              {(search || category !== "All") && (
                <button onClick={() => { setSearch(""); setSearchInput(""); setCategory("All"); setLevel("All"); }}
                  style={s.clearBtn}>Clear filters</button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={s.empty}>
              <Search size={48} color="#d1d5db" />
              <p style={{ color: "#9ca3af", fontSize: 16, marginTop: 12 }}>No courses found. Try a different search.</p>
            </div>
          ) : (
            <div style={s.grid}>
              {filtered.map(course => (
                <CourseCard key={course.id} course={course} currency={currency}
                  formatPrice={formatPrice} totalLessons={totalLessons}
                  onClick={() => navigate(`/courses/${course.id}`)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerBrand}>
            <span style={s.logo}>
              <GraduationCap size={20} color="#a78bfa" />
              <span style={{ color: "#fff" }}>QuizPortal</span>
            </span>
            <p style={s.footerTagline}>Empowering learners worldwide</p>
          </div>
          <div style={s.footerLinks}>
            {[
              ["Platform", [
                ["Browse Courses", () => { window.scrollTo(0,0); }],
                ["Become a Teacher", () => navigate("/login")],
                ["Sign Up Free", () => navigate("/login")],
              ]],
              ["Support", [
                ["Help Center", () => alert("For help, email us at mujahidulislamgub193@gmail.com")],
                ["Contact Us", () => window.open("mailto:mujahidulislamgub193@gmail.com")],
                ["Privacy Policy", () => alert("We respect your privacy. Your data is never sold to third parties.")],
              ]],
              ["Community", [
                ["Blog", () => alert("Blog coming soon!")],
                ["Forum", () => alert("Community forum coming soon!")],
                ["Events", () => alert("Events coming soon!")],
              ]],
            ].map(([title, links]) => (
              <div key={title}>
                <div style={s.footerLinkTitle}>{title}</div>
                {links.map(([label, action]) => (
                  <div key={label} onClick={action} style={{ ...s.footerLink, cursor: "pointer" }}
                    onMouseEnter={e => e.target.style.color = "#fff"}
                    onMouseLeave={e => e.target.style.color = "#a78bfa"}>
                    {label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={s.footerBottom}>
          <span>© 2026 QuizPortal. All rights reserved.</span>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Globe size={14} />
            <span>English</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CourseCard({ course, currency, formatPrice, totalLessons, onClick, featured }) {
  const price = formatPrice(course);
  const lessons = totalLessons(course);
  const chapters = course.chapters?.length || 0;

  return (
    <div onClick={onClick} style={{ ...s.card, ...(featured ? s.cardFeatured : {}) }}>
      <div style={s.cardThumb}>
        {course.thumbnail
          ? <img src={course.thumbnail} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={s.cardThumbPlaceholder}>
              <GraduationCap size={32} color="#a78bfa" />
            </div>
        }
        {(course.isFree || course.price === 0) && <div style={s.freeBadge}>FREE</div>}
      </div>
      <div style={s.cardBody}>
        <div style={s.cardCategory}>{course.category || "General"}</div>
        <div style={s.cardTitle}>{course.title}</div>
        <div style={s.cardTeacher}>by {course.teacher?.name}</div>
        <div style={s.cardMeta}>
          <span style={s.levelBadge(course.level)}>{course.level}</span>
          <span style={s.dot}>·</span>
          <span style={s.metaText}>{chapters} chapters</span>
          <span style={s.dot}>·</span>
          <span style={s.metaText}>{lessons} lessons</span>
        </div>
        <div style={s.cardFooter}>
          <div style={s.stars}>
            {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />)}
          </div>
          <span style={{ ...s.priceTag, color: price.color }}>{price.label}</span>
        </div>
      </div>
    </div>
  );
}

const levelColors = {
  beginner: { bg: "#dcfce7", color: "#166534" },
  intermediate: { bg: "#fef9c3", color: "#854d0e" },
  advanced: { bg: "#fee2e2", color: "#991b1b" },
};

const s = {
  page: { minHeight: "100vh", background: "#fff", fontFamily: "'Segoe UI', system-ui, sans-serif" },

  // Nav
  nav: { background: "#1e1b4b", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" },
  navInner: { maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 20, height: 64 },
  navLeft: { display: "flex", alignItems: "center", gap: 16, flex: 1 },
  navRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  logo: { display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 800, fontSize: 20, cursor: "pointer", whiteSpace: "nowrap", textDecoration: "none" },
  navSearch: { display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 8, padding: "8px 14px", flex: 1, maxWidth: 480 },
  navSearchInput: { flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent" },
  navSearchBtn: { padding: "6px 16px", borderRadius: 6, border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" },
  btnGhost: { padding: "8px 18px", borderRadius: 8, border: "1px solid #a78bfa", background: "transparent", color: "#a78bfa", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnOutline: { padding: "8px 18px", borderRadius: 8, border: "1px solid #a78bfa", background: "transparent", color: "#a78bfa", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnFill: { padding: "8px 18px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 },

  // Category bar
  catBar: { background: "#1e1b4b", borderTop: "1px solid rgba(255,255,255,0.1)" },
  catInner: { maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" },
  catBtn: { padding: "10px 16px", border: "none", background: "transparent", color: "#c4b5fd", cursor: "pointer", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", borderBottom: "2px solid transparent" },
  catBtnActive: { color: "#fff", borderBottom: "2px solid #a78bfa" },
  dropdown: { position: "absolute", top: "100%", left: 0, background: "#fff", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 180, zIndex: 200, padding: "8px 0", border: "1px solid #e5e7eb" },
  dropdownItem: { padding: "9px 18px", fontSize: 14, color: "#1e1b4b", cursor: "pointer", fontWeight: 500, transition: "background 0.1s" },

  // Hero
  hero: { background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)", color: "#fff", padding: "80px 24px" },
  heroContent: { maxWidth: 1280, margin: "0 auto", display: "flex", gap: 60, alignItems: "center", flexWrap: "wrap" },
  heroLeft: { flex: 1, minWidth: 320 },
  heroRight: { width: 380, flexShrink: 0 },
  heroBadge: { display: "inline-block", background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.4)", color: "#c4b5fd", padding: "6px 14px", borderRadius: 20, fontSize: 13, marginBottom: 20 },
  heroTitle: { margin: "0 0 16px", fontSize: 52, fontWeight: 900, lineHeight: 1.1 },
  heroAccent: { background: "linear-gradient(135deg,#a78bfa,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  heroSub: { margin: "0 0 28px", fontSize: 17, color: "#c4b5fd", lineHeight: 1.6, maxWidth: 480 },
  heroSearch: { display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 12, padding: "12px 16px", maxWidth: 520, marginBottom: 28 },
  heroSearchInput: { flex: 1, border: "none", outline: "none", fontSize: 15, color: "#1a1a2e" },
  heroSearchBtn: { padding: "10px 24px", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 },
  heroStats: { display: "flex", gap: 24, flexWrap: "wrap" },
  heroStat: { display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#e0e7ff" },
  heroIllustration: { position: "relative", height: 280 },
  heroCard1: { position: "absolute", top: 0, left: 0, background: "#fff", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12, alignItems: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", width: 240 },
  heroCard2: { position: "absolute", bottom: 40, right: 0, background: "#fff", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12, alignItems: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", width: 240 },
  heroCard3: { position: "absolute", bottom: 0, left: 20, background: "#fff", borderRadius: 10, padding: "10px 16px", display: "flex", gap: 8, alignItems: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" },
  heroCardIcon: { fontSize: 28 },

  // Sections
  section: { padding: "60px 24px" },
  sectionInner: { maxWidth: 1280, margin: "0 auto" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 },
  sectionTitle: { margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#1e1b4b" },
  sectionSub: { margin: 0, color: "#6b7280", fontSize: 14 },
  seeAll: { display: "flex", alignItems: "center", gap: 4, padding: "8px 16px", borderRadius: 8, border: "1px solid #7c3aed", background: "transparent", color: "#7c3aed", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  featuredGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 },
  filterSelect: { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, cursor: "pointer", background: "#fff" },
  clearBtn: { padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, color: "#6b7280" },
  empty: { textAlign: "center", padding: "60px 0" },

  // Cards
  card: { background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", cursor: "pointer", border: "1px solid #f3f4f6", transition: "all 0.2s" },
  cardFeatured: { boxShadow: "0 4px 20px rgba(124,58,237,0.12)", border: "1px solid #ede9fe" },
  cardThumb: { height: 160, background: "#ede9fe", position: "relative", overflow: "hidden" },
  cardThumbPlaceholder: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#ede9fe,#ddd6fe)" },
  freeBadge: { position: "absolute", top: 10, right: 10, background: "#22c55e", color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 },
  cardBody: { padding: "14px 16px" },
  cardCategory: { fontSize: 11, color: "#7c3aed", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  cardTitle: { fontWeight: 700, fontSize: 15, color: "#1e1b4b", marginBottom: 4, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardTeacher: { fontSize: 12, color: "#9ca3af", marginBottom: 10 },
  cardMeta: { display: "flex", alignItems: "center", gap: 6, marginBottom: 12 },
  levelBadge: (level) => ({ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: levelColors[level]?.bg || "#f3f4f6", color: levelColors[level]?.color || "#374151" }),
  dot: { color: "#d1d5db", fontSize: 12 },
  metaText: { fontSize: 12, color: "#6b7280" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f9fafb", paddingTop: 10 },
  stars: { display: "flex", gap: 2 },
  priceTag: { fontWeight: 800, fontSize: 16 },

  // Footer
  footer: { background: "#1e1b4b", color: "#c4b5fd", padding: "48px 24px 24px" },
  footerInner: { maxWidth: 1280, margin: "0 auto", display: "flex", gap: 60, flexWrap: "wrap", marginBottom: 40 },
  footerBrand: { flex: 1, minWidth: 200 },
  footerTagline: { margin: "12px 0 0", fontSize: 14, color: "#8b5cf6" },
  footerLinks: { display: "flex", gap: 60, flexWrap: "wrap" },
  footerLinkTitle: { fontWeight: 700, color: "#fff", marginBottom: 12, fontSize: 14 },
  footerLink: { fontSize: 13, marginBottom: 8, cursor: "pointer", color: "#a78bfa" },
  footerBottom: { maxWidth: 1280, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 },
};
