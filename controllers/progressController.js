import { Chapter, Course, Enrollment, Lesson, LessonProgress, User } from "../models/index.js";
import ApiError from "../utils/apiError.js";

// Toggle lesson complete/incomplete
export const toggleLessonProgress = async (req, res) => {
  const { lessonId } = req.params;
  const lesson = await Lesson.findByPk(lessonId);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  const [record, created] = await LessonProgress.findOrCreate({
    where: { userId: req.user.id, lessonId: Number(lessonId) },
    defaults: { completed: true },
  });

  if (!created) await record.update({ completed: !record.completed });

  res.json({ lessonId: Number(lessonId), completed: created ? true : record.completed });
};

// Get progress for a course
export const getCourseProgress = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.query.userId ? Number(req.query.userId) : req.user.id;

  // Only admin/teacher can query other users
  if (userId !== req.user.id && !["admin", "teacher"].includes(req.user.role)) {
    throw new ApiError(403, "Access denied.");
  }

  const course = await Course.findByPk(courseId, {
    include: [{ model: Chapter, as: "chapters", include: [{ model: Lesson, as: "lessons", attributes: ["id"] }] }],
  });
  if (!course) throw new ApiError(404, "Course not found.");

  const allLessonIds = course.chapters.flatMap(ch => ch.lessons.map(l => l.id));
  const completed = await LessonProgress.count({
    where: { userId, lessonId: allLessonIds, completed: true },
  });

  const total = allLessonIds.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  res.json({ total, completed, percent, lessonIds: allLessonIds });
};

// Get completed lesson IDs for a user in a course
export const getCompletedLessons = async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findByPk(courseId, {
    include: [{ model: Chapter, as: "chapters", include: [{ model: Lesson, as: "lessons", attributes: ["id"] }] }],
  });
  const allLessonIds = course?.chapters.flatMap(ch => ch.lessons.map(l => l.id)) || [];
  const records = await LessonProgress.findAll({
    where: { userId: req.user.id, lessonId: allLessonIds, completed: true },
    attributes: ["lessonId"],
  });
  res.json({ completedLessonIds: records.map(r => r.lessonId) });
};

// Admin/Teacher: get enrolled students with progress for a course
export const getCourseStudents = async (req, res) => {
  const { courseId } = req.params;

  // Teacher can only see their own course students
  if (req.user.role === "teacher") {
    const course = await Course.findOne({ where: { id: courseId, teacherId: req.user.id } });
    if (!course) throw new ApiError(403, "Access denied.");
  }

  const enrollments = await Enrollment.findAll({
    where: { courseId, status: "active" },
    include: [{ model: User, as: "student", attributes: ["id", "name", "email"] }],
  });

  const course = await Course.findByPk(courseId, {
    include: [{ model: Chapter, as: "chapters", include: [{ model: Lesson, as: "lessons", attributes: ["id"] }] }],
  });
  const allLessonIds = course?.chapters.flatMap(ch => ch.lessons.map(l => l.id)) || [];
  const total = allLessonIds.length;

  const result = await Promise.all(enrollments.map(async (e) => {
    const completed = total === 0 ? 0 : await LessonProgress.count({
      where: { userId: e.userId, lessonId: allLessonIds, completed: true },
    });
    return {
      enrollmentId: e.id,
      student: e.student,
      paidAmount: e.paidAmount,
      currency: e.currency,
      enrolledAt: e.createdAt,
      progress: { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) },
    };
  }));

  res.json({ students: result });
};

// Admin/Teacher: remove student from course
export const removeEnrollment = async (req, res) => {
  const enrollment = await Enrollment.findByPk(req.params.enrollmentId, {
    include: [{ model: Course, as: "course" }],
  });
  if (!enrollment) throw new ApiError(404, "Enrollment not found.");

  if (req.user.role === "teacher" && enrollment.course?.teacherId !== req.user.id) {
    throw new ApiError(403, "Access denied.");
  }

  await enrollment.destroy();
  res.json({ message: "Student removed from course." });
};

// Student: unenroll from course
export const unenroll = async (req, res) => {
  const enrollment = await Enrollment.findOne({
    where: { userId: req.user.id, courseId: req.params.courseId },
  });
  if (!enrollment) throw new ApiError(404, "Enrollment not found.");
  await enrollment.destroy();
  res.json({ message: "Unenrolled successfully." });
};

// Admin: list all enrollments
export const adminListEnrollments = async (req, res) => {
  const enrollments = await Enrollment.findAll({
    include: [
      { model: User, as: "student", attributes: ["id", "name", "email"] },
      { model: Course, as: "course", attributes: ["id", "title"] },
    ],
    order: [["createdAt", "DESC"]],
  });
  res.json({ enrollments });
};
