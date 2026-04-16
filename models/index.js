import User from "./User.js";
import Material from "./Material.js";
import Quiz from "./Quiz.js";
import Question from "./Question.js";
import QuizAttempt from "./QuizAttempt.js";
import PasswordResetToken from "./PasswordResetToken.js";
import Course from "./Course.js";
import Chapter from "./Chapter.js";
import Lesson from "./Lesson.js";
import Enrollment from "./Enrollment.js";
import Coupon from "./Coupon.js";

User.hasMany(PasswordResetToken, { foreignKey: "userId", as: "resetTokens" });
PasswordResetToken.belongsTo(User, { foreignKey: "userId" });

// Course associations
User.hasMany(Course, { foreignKey: "teacherId", as: "courses" });
Course.belongsTo(User, { foreignKey: "teacherId", as: "teacher" });

Course.hasMany(Chapter, { foreignKey: "courseId", as: "chapters", onDelete: "CASCADE" });
Chapter.belongsTo(Course, { foreignKey: "courseId" });

Chapter.hasMany(Lesson, { foreignKey: "chapterId", as: "lessons", onDelete: "CASCADE" });
Lesson.belongsTo(Chapter, { foreignKey: "chapterId" });

import LessonProgress from "./LessonProgress.js";

User.hasMany(Enrollment, { foreignKey: "userId", as: "enrollments" });
Enrollment.belongsTo(User, { foreignKey: "userId", as: "student" });

Course.hasMany(Enrollment, { foreignKey: "courseId", as: "enrollments", onDelete: "CASCADE" });
Enrollment.belongsTo(Course, { foreignKey: "courseId", as: "course" });

User.hasMany(LessonProgress, { foreignKey: "userId", as: "lessonProgress" });
LessonProgress.belongsTo(User, { foreignKey: "userId" });

Lesson.hasMany(LessonProgress, { foreignKey: "lessonId", as: "progress", onDelete: "CASCADE" });
LessonProgress.belongsTo(Lesson, { foreignKey: "lessonId" });

User.hasMany(Material, { foreignKey: "userId", as: "materials" });
Material.belongsTo(User, { foreignKey: "userId", as: "owner" });

User.hasMany(Quiz, { foreignKey: "userId", as: "quizzes" });
Quiz.belongsTo(User, { foreignKey: "userId", as: "creator" });

Material.hasMany(Quiz, { foreignKey: "materialId", as: "quizzes" });
Quiz.belongsTo(Material, { foreignKey: "materialId", as: "material" });

Quiz.hasMany(Question, {
  foreignKey: "quizId",
  as: "questions",
  onDelete: "CASCADE",
});
Question.belongsTo(Quiz, { foreignKey: "quizId", as: "quiz" });

User.hasMany(QuizAttempt, { foreignKey: "userId", as: "attempts" });
QuizAttempt.belongsTo(User, { foreignKey: "userId", as: "user" });

Quiz.hasMany(QuizAttempt, {
  foreignKey: "quizId",
  as: "attempts",
  onDelete: "CASCADE",
});
QuizAttempt.belongsTo(Quiz, { foreignKey: "quizId", as: "quiz" });

export { User, Material, Quiz, Question, QuizAttempt, PasswordResetToken, Course, Chapter, Lesson, Enrollment, Coupon, LessonProgress };
