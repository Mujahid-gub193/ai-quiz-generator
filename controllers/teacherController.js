import { Quiz, QuizAttempt, User } from "../models/index.js";

export const getStudentResults = async (req, res) => {
  const teacherQuizzes = await Quiz.findAll({
    where: { userId: req.user.id },
    attributes: ["id", "title", "topic"],
  });

  const quizIds = teacherQuizzes.map((q) => q.id);

  if (quizIds.length === 0) {
    return res.json({ count: 0, results: [] });
  }

  const attempts = await QuizAttempt.findAll({
    where: { quizId: quizIds },
    include: [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Quiz, as: "quiz", attributes: ["id", "title", "topic"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  res.json({ count: attempts.length, results: attempts });
};
