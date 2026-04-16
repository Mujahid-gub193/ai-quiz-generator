import { env } from "../config/env.js";

const STOP_WORDS = new Set([
  "about",
  "above",
  "after",
  "again",
  "along",
  "also",
  "among",
  "around",
  "because",
  "before",
  "being",
  "between",
  "could",
  "first",
  "found",
  "from",
  "into",
  "lesson",
  "might",
  "other",
  "should",
  "their",
  "there",
  "these",
  "those",
  "through",
  "topic",
  "under",
  "using",
  "where",
  "which",
  "while",
  "would",
]);

const QUIZ_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          prompt: { type: "string" },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: { type: "string" },
          },
          correctAnswer: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["prompt", "options", "correctAnswer", "explanation"],
      },
    },
  },
  required: ["questions"],
};

const normalizeText = (value) => value.replace(/\s+/g, " ").trim();

const splitSentences = (text) =>
  normalizeText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40);

const extractKeywords = (text) => {
  const matches = text.toLowerCase().match(/[a-zA-Z][a-zA-Z-]{3,}/g) || [];

  return [...new Set(matches.filter((word) => !STOP_WORDS.has(word)))];
};

const shuffle = (items) => {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
};

const buildFallbackText = ({ topic, sourceText }) => {
  if (sourceText && sourceText.trim().length >= 80) {
    return sourceText;
  }

  return [
    `${topic} is an important concept that learners should understand clearly.`,
    `${topic} includes terminology, processes, and practical examples that can be assessed with short quizzes.`,
    `When studying ${topic}, students should focus on major ideas, definitions, and relationships between concepts.`,
    `${topic} can be reviewed by identifying keywords, comparing ideas, and recalling core explanations.`,
    `Effective learning in ${topic} comes from reading the material, testing knowledge, and reflecting on mistakes.`,
  ].join(" ");
};

const generateFallbackQuizQuestions = ({
  topic,
  sourceText,
  questionCount = 5,
}) => {
  const preparedText = buildFallbackText({ topic, sourceText });
  const sentences = splitSentences(preparedText);
  const keywordPool = extractKeywords(preparedText);
  const totalQuestions = Math.min(Math.max(Number(questionCount) || 5, 1), 10);
  const questions = [];

  for (const sentence of sentences) {
    if (questions.length >= totalQuestions) {
      break;
    }

    const keywords = extractKeywords(sentence);
    const answer = keywords.sort((a, b) => b.length - a.length)[0];

    if (!answer) {
      continue;
    }

    const blankedSentence = sentence.replace(new RegExp(answer, "i"), "_____");
    const distractors = shuffle(
      keywordPool.filter((word) => word !== answer),
    ).slice(0, 3);

    if (distractors.length < 3) {
      continue;
    }

    questions.push({
      prompt: `Choose the best word to complete the statement: ${blankedSentence}`,
      options: shuffle([answer, ...distractors]).map((option) => option.trim()),
      correctAnswer: answer,
      explanation: `The missing keyword is "${answer}" based on the original study material.`,
      order: questions.length + 1,
    });
  }

  while (questions.length < totalQuestions) {
    const baseKeyword = keywordPool[questions.length] || extractKeywords(topic)[0] || "concept";
    const otherOptions = shuffle(
      keywordPool.filter((word) => word !== baseKeyword),
    ).slice(0, 3);

    while (otherOptions.length < 3) {
      otherOptions.push(`${topic.toLowerCase().replace(/\s+/g, "-")}-${otherOptions.length + 1}`);
    }

    questions.push({
      prompt: `Which keyword is most closely related to the topic "${topic}"?`,
      options: shuffle([baseKeyword, ...otherOptions]),
      correctAnswer: baseKeyword,
      explanation: `The expected answer is "${baseKeyword}" because it appears as a key concept in the quiz source.`,
      order: questions.length + 1,
    });
  }

  return questions;
};

const extractResponseText = (payload) => {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputItems = Array.isArray(payload.output) ? payload.output : [];

  for (const item of outputItems) {
    const contentItems = Array.isArray(item.content) ? item.content : [];

    for (const content of contentItems) {
      if (typeof content.text === "string" && content.text.trim()) {
        return content.text.trim();
      }
    }
  }

  return "";
};

const sanitizeAiQuestions = (questions, requestedCount) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("OpenAI did not return any quiz questions.");
  }

  const limitedQuestions = questions.slice(0, Math.min(Math.max(Number(requestedCount) || 5, 1), 10));

  return limitedQuestions.map((question, index) => {
    const prompt = String(question.prompt || "").trim();
    const options = Array.isArray(question.options)
      ? question.options.map((option) => String(option).trim()).filter(Boolean)
      : [];
    const uniqueOptions = [...new Set(options)];
    const correctAnswer = String(question.correctAnswer || "").trim();
    const explanation = String(question.explanation || "").trim();

    if (!prompt || uniqueOptions.length !== 4 || !correctAnswer || !explanation) {
      throw new Error("OpenAI returned an invalid quiz question shape.");
    }

    if (!uniqueOptions.includes(correctAnswer)) {
      throw new Error("OpenAI returned a correct answer that is not present in the options.");
    }

    return {
      prompt,
      options: uniqueOptions,
      correctAnswer,
      explanation,
      order: index + 1,
    };
  });
};

const generateWithGroq = async ({ topic, sourceText, questionCount }) => {
  const source = buildFallbackText({ topic, sourceText });
  const totalQuestions = Math.min(Math.max(Number(questionCount) || 5, 1), 10);

  const prompt = [
    `Generate ${totalQuestions} multiple-choice questions about the topic "${topic}".`,
    "Use only the source content below.",
    "Return ONLY a valid JSON object in this exact format, no extra text:",
    `{"questions":[{"prompt":"...","options":["a","b","c","d"],"correctAnswer":"a","explanation":"..."}]}`,
    "Rules: exactly 4 options, correctAnswer must exactly match one option, no duplicate questions.",
    "",
    "Source content:",
    source,
  ].join("\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.groqApiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a quiz generator. Always respond with valid JSON only, no markdown, no explanation." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API request failed: ${response.status} ${err}`);
  }

  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content?.trim();

  if (!text) throw new Error("Groq returned an empty response.");

  // strip markdown code fences if present
  const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  const parsed = JSON.parse(json);

  return sanitizeAiQuestions(parsed.questions, totalQuestions);
};

export const generateQuizQuestions = async ({ topic, sourceText, questionCount = 5 }) => {
  if (!env.groqApiKey) {
    return {
      provider: "local-fallback",
      questions: generateFallbackQuizQuestions({ topic, sourceText, questionCount }),
    };
  }

  const questions = await generateWithGroq({ topic, sourceText, questionCount });
  return { provider: "groq", questions };
};
