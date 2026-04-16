import { Material, Quiz, Question, QuizAttempt, User } from "../models/index.js";
import ApiError from "../utils/apiError.js";

export const listUsers = async (req, res) => {
  const users = await User.findAll({ order: [["createdAt", "DESC"]] });
  res.json({ count: users.length, users });
};

export const updateUserRole = async (req, res) => {
  const { role } = req.body;
  const allowed = ["admin", "teacher", "student"];

  if (!allowed.includes(role)) {
    throw new ApiError(400, "Invalid role.");
  }

  const user = await User.findByPk(req.params.id);
  if (!user) throw new ApiError(404, "User not found.");

  await user.update({ role });
  res.json({ message: "Role updated.", user });
};

export const getSiteStats = async (req, res) => {
  const [userCount, materialCount, quizCount, attempts] = await Promise.all([
    User.count(),
    Material.count(),
    Quiz.count(),
    QuizAttempt.findAll({ attributes: ["score"] }),
  ]);

  const avgScore =
    attempts.length === 0
      ? 0
      : Number(
          (attempts.reduce((s, a) => s + a.score, 0) / attempts.length).toFixed(2),
        );

  res.json({ userCount, materialCount, quizCount, attemptCount: attempts.length, avgScore });
};

export const listAllQuizzes = async (req, res) => {
  const quizzes = await Quiz.findAll({
    include: [
      { model: User, as: "creator", attributes: ["id", "name", "email"] },
      { model: Question, as: "questions" },
    ],
    order: [["createdAt", "DESC"]],
  });
  res.json({ count: quizzes.length, quizzes });
};

export const listAllAttempts = async (req, res) => {
  const attempts = await QuizAttempt.findAll({
    include: [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Quiz, as: "quiz", attributes: ["id", "title", "topic"] },
    ],
    order: [["createdAt", "DESC"]],
  });
  res.json({ count: attempts.length, attempts });
};

export const listAllMaterials = async (req, res) => {
  const materials = await Material.findAll({
    include: [{ model: User, as: "owner", attributes: ["id", "name", "email"] }],
    order: [["createdAt", "DESC"]],
  });
  res.json({ count: materials.length, materials });
};

export const deleteAnyMaterial = async (req, res) => {
  const material = await Material.findByPk(req.params.id);
  if (!material) throw new ApiError(404, "Material not found.");
  await material.destroy();
  res.json({ message: "Material deleted." });
};

export const deleteAnyQuiz = async (req, res) => {
  const quiz = await Quiz.findByPk(req.params.id);
  if (!quiz) throw new ApiError(404, "Quiz not found.");
  await quiz.destroy();
  res.json({ message: "Quiz deleted." });
};
