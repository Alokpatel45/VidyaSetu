/** Server-authoritative quiz answer grading. Never send unrevealed answer keys to clients. */
export function checkAnswer(question, selectedAnswer) {
  if (!question || !Array.isArray(question.options) || !question.options.includes(selectedAnswer)) {
    throw new Error('Invalid answer option');
  }
  if (typeof question.correctAnswer !== 'string' || !question.options.includes(question.correctAnswer)) {
    throw new Error('Invalid stored question');
  }
  return {
    selectedAnswer,
    correctAnswer: question.correctAnswer,
    isCorrect: selectedAnswer === question.correctAnswer,
    explanation: question.explanation || 'Review the correct answer above.'
  };
}

/** Pure state transition for a quiz attempt. Persist atomically with a version guard. */
export function submitAnswer(attempt, questionIndex, selectedAnswer) {
  if (attempt.status !== 'in_progress') throw new Error('Quiz already completed');
  if (!Number.isInteger(questionIndex) || questionIndex !== attempt.answers.length) {
    throw new Error('Answer must be submitted in sequence and only once');
  }
  const question = attempt.questions[questionIndex];
  if (!question) throw new Error('Question does not exist');
  const result = checkAnswer(question, selectedAnswer);
  const answers = [...attempt.answers, { questionIndex, ...result }];
  const completed = answers.length === attempt.questions.length;
  return {
    ...attempt,
    answers,
    score: answers.filter(a => a.isCorrect).length,
    status: completed ? 'completed' : 'in_progress',
    completedAt: completed ? new Date().toISOString() : null,
    lastFeedback: result
  };
}

export function publicQuestion(question) {
  return { question: question.question, options: question.options };
}
