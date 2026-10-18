const QuizReview = ({ attempt }) => (
  <section className="quiz-review" aria-label="Question review">
    <h3>Questions and answers</h3>
    {attempt.questions.map((question, index) => {
      const answer = attempt.answers[index];
      return (
        <article className="quiz-review-question" key={index}>
          <h4>{index + 1}. {question.question}</h4>
          <ul>{question.options.map(option => <li key={option}>{option}</li>)}</ul>
          <p className={answer?.isCorrect ? "quiz-correct" : "quiz-wrong"}>
            {answer?.isCorrect ? "Correct" : "Incorrect"} · Your answer: {answer?.selectedAnswer}
          </p>
          <p><strong>Correct answer:</strong> {answer?.correctAnswer}</p>
          <p>{answer?.explanation}</p>
        </article>
      );
    })}
  </section>
);
export default QuizReview;
