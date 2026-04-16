import { Material, Question, Quiz, QuizAttempt } from "../models/index.js";
import { generateQuizQuestions } from "../services/quizGeneratorService.js";
import { scoreQuizAttempt } from "../services/scoringService.js";
import ApiError from "../utils/apiError.js";

const formatQuestion = (question, includeAnswer = false) => {
  const payload = {
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    explanation: question.explanation,
    order: question.order,
  };

  if (includeAnswer) {
    payload.correctAnswer = question.correctAnswer;
  }

  return payload;
};

const formatQuiz = (quiz, includeAnswers = false) => {
  const questions = quiz.questions || quiz.dataValues?.questions;

  return {
    id: quiz.id,
    title: quiz.title,
    topic: quiz.topic,
    sourceType: quiz.sourceType,
    sourceText: quiz.sourceText,
    questionCount: quiz.questionCount,
    materialId: quiz.materialId,
    userId: quiz.userId,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
    questions: questions
      ? questions
          .sort((left, right) => left.order - right.order)
          .map((question) => formatQuestion(question, includeAnswers))
      : undefined,
  };
};

export const generateQuiz = async (req, res) => {
  const { title, topic, materialId, sourceText, questionCount } = req.body;

  if (!topic || topic.trim().length < 2) {
    throw new ApiError(400, "Topic is required to generate a quiz.");
  }

  let resolvedSourceType = "topic";
  let resolvedSourceText = sourceText?.trim() || "";
  let resolvedMaterialId = null;

  if (materialId) {
    const material = await Material.findOne({
      where: { id: materialId, userId: req.user.id },
    });

    if (!material) {
      throw new ApiError(404, "Material not found for this user.");
    }

    resolvedSourceType = "material";
    resolvedSourceText = material.content;
    resolvedMaterialId = material.id;
  } else if (resolvedSourceText) {
    resolvedSourceType = "text";
  }

  const generation = await generateQuizQuestions({
    topic: topic.trim(),
    sourceText: resolvedSourceText,
    questionCount,
  });
  const questionsPayload = generation.questions;

  const quiz = await Quiz.create({
    title: title?.trim() || `${topic.trim()} Quiz`,
    topic: topic.trim(),
    sourceType: resolvedSourceType,
    sourceText: resolvedSourceText || topic.trim(),
    questionCount: questionsPayload.length,
    materialId: resolvedMaterialId,
    userId: req.user.id,
  });

  const questionRecords = await Question.bulkCreate(
    questionsPayload.map((question) => ({
      ...question,
      quizId: quiz.id,
    })),
    { returning: true },
  );

  quiz.setDataValue("questions", questionRecords);

  res.status(201).json({
    message: "Quiz generated successfully.",
    provider: generation.provider,
    quiz: formatQuiz(quiz, true),
  });
};

export const listQuizzes = async (req, res) => {
  const where = req.user.role === "student" ? {} : { userId: req.user.id };
  const quizzes = await Quiz.findAll({
    where,
    include: [{ model: Question, as: "questions" }],
    order: [["createdAt", "DESC"]],
  });

  res.json({
    count: quizzes.length,
    quizzes: quizzes.map((quiz) => formatQuiz(quiz)),
  });
};

export const getQuizById = async (req, res) => {
  const where = req.user.role === "student"
    ? { id: req.params.id }
    : { id: req.params.id, userId: req.user.id };

  const quiz = await Quiz.findOne({
    where,
    include: [{ model: Question, as: "questions" }],
  });

  if (!quiz) {
    throw new ApiError(404, "Quiz not found.");
  }

  res.json({ quiz: formatQuiz(quiz) });
};

export const submitQuiz = async (req, res) => {
  const quiz = await Quiz.findOne({
    where: { id: req.params.id },
    include: [{ model: Question, as: "questions" }],
  });

  if (!quiz) {
    throw new ApiError(404, "Quiz not found.");
  }

  if (!req.body.answers || typeof req.body.answers !== "object") {
    throw new ApiError(400, "Answers payload is required.");
  }

  const result = scoreQuizAttempt(quiz.questions, req.body.answers);

  const attempt = await QuizAttempt.create({
    quizId: quiz.id,
    userId: req.user.id,
    score: result.score,
    totalQuestions: result.totalQuestions,
    correctAnswers: result.correctAnswers,
    answers: result.answers,
    feedback: result.feedback,
  });

  res.status(201).json({
    message: "Quiz submitted successfully.",
    attempt: {
      id: attempt.id,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      feedback: result.feedback,
      createdAt: attempt.createdAt,
    },
  });
};

export const listAttempts = async (req, res) => {
  const attempts = await QuizAttempt.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Quiz,
        as: "quiz",
        attributes: ["id", "title", "topic"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  res.json({
    count: attempts.length,
    attempts,
  });
};
