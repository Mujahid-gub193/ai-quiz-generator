export const scoreQuizAttempt = (questions, submittedAnswers) => {
  const answerMap = Array.isArray(submittedAnswers)
    ? submittedAnswers.reduce((accumulator, entry) => {
        if (entry && entry.questionId) {
          accumulator[String(entry.questionId)] = entry.answer;
        }

        return accumulator;
      }, {})
    : submittedAnswers || {};

  let correctAnswers = 0;

  const feedback = questions.map((question) => {
    const submitted = answerMap[String(question.id)] || null;
    const isCorrect = submitted === question.correctAnswer;

    if (isCorrect) {
      correctAnswers += 1;
    }

    return {
      questionId: question.id,
      prompt: question.prompt,
      submittedAnswer: submitted,
      correctAnswer: question.correctAnswer,
      isCorrect,
      explanation: question.explanation,
    };
  });

  const totalQuestions = questions.length;
  const score = totalQuestions === 0 ? 0 : Number(((correctAnswers / totalQuestions) * 100).toFixed(2));

  return {
    score,
    totalQuestions,
    correctAnswers,
    feedback,
    answers: answerMap,
  };
};
