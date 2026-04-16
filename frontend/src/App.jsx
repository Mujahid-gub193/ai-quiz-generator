import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursePlayerPage from "./pages/CoursePlayerPage";

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/courses" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "teacher") return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

function LoginRoute() {
  const { user } = useAuth();
  if (user) return <RoleRedirect />;
  return <LoginPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:id" element={<CourseDetailPage />} />
      <Route path="/learn/:id" element={
        <ProtectedRoute roles={["student", "teacher", "admin"]}><CoursePlayerPage /></ProtectedRoute>
      } />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin" element={
        <ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/teacher" element={
        <ProtectedRoute roles={["teacher"]}><TeacherDashboard /></ProtectedRoute>
      } />
      <Route path="/student" element={
        <ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>
      } />
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}
