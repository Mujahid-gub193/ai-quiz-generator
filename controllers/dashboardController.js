import { Material, Quiz, QuizAttempt } from "../models/index.js";

export const getDashboardOverview = async (req, res) => {
  const [materialCount, quizCount, recentAttempts, allAttempts] = await Promise.all([
    Material.count({ where: { userId: req.user.id } }),
    Quiz.count({ where: { userId: req.user.id } }),
    QuizAttempt.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Quiz,
          as: "quiz",
          attributes: ["id", "title", "topic"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),
    QuizAttempt.findAll({
      where: { userId: req.user.id },
      attributes: ["score"],
    }),
  ]);

  const allScores = allAttempts.map((attempt) => attempt.score);
  const averageScore =
    allScores.length === 0
      ? 0
      : Number(
          (
            allScores.reduce((total, score) => total + score, 0) / allScores.length
          ).toFixed(2),
        );

  res.json({
    stats: {
      materialCount,
      quizCount,
      totalAttemptCount: allAttempts.length,
      averageScore,
    },
    recentAttempts,
  });
};
