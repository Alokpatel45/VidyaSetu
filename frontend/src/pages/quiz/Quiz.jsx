import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { CourseData } from "../../context/CourseContext.jsx";
import { UserData } from "../../context/UserContext.jsx";
import QuizReview from "../../components/quiz/QuizReview.jsx";
import "./quiz.css";
import { useParams, useNavigate } from "react-router-dom";

const Quiz = () => {
  const [attempt, setAttempt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState(false);
  const [restoreKey, setRestoreKey] = useState(0);
  const requestPending = useRef(false);
  const { fetchCourse, course } = CourseData();
  const { user } = UserData();
  const { id } = useParams();
  const navigate = useNavigate();
  const storageKey = `quiz-attempt:${user?._id}:${id}`;

  useEffect(() => {
    if (id) fetchCourse(id);
  }, [id, fetchCourse]);
  useEffect(() => {
    let active = true;
    setAttempt(null);
    setRestoring(true);
    setRestoreError(false);
    const savedId = localStorage.getItem(storageKey);
    if (!savedId) {
      setRestoring(false);
      return;
    }
    api
      .get(`/gemini/quiz/attempts/${savedId}`)
      .then(({ data }) => {
        if (!active) return;
        if (String(data.attempt.courseId) !== id) {
          localStorage.removeItem(storageKey);
          return;
        }
        setAttempt(data.attempt);
        setCurrentIndex(
          Math.min(
            data.attempt.answers.length,
            data.attempt.questions.length - 1,
          ),
        );
        setSelected("");
      })
      .catch((error) => {
        if (!active) return;
        if ([400, 404].includes(error.response?.status))
          localStorage.removeItem(storageKey);
        else setRestoreError(true);
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
    return () => {
      active = false;
    };
  }, [storageKey, id, restoreKey]);

  const startQuiz = async () => {
    if (requestPending.current) return;
    requestPending.current = true;
    setBusy(true);
    try {
      const { data } = await api.post("/gemini/quiz", {
        courseId: id,
        numQuestions: 10,
        difficulty: "medium",
      });
      localStorage.setItem(storageKey, data.attempt._id);
      setAttempt(data.attempt);
      setCurrentIndex(0);
      setSelected("");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to generate quiz",
      );
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  };

  const checkAnswer = async () => {
    if (!selected || attempt.answers[currentIndex] || requestPending.current)
      return;
    requestPending.current = true;
    setBusy(true);
    try {
      const { data } = await api.post(
        `/gemini/quiz/attempts/${attempt._id}/answers`,
        {
          questionIndex: currentIndex,
          selectedAnswer: selected,
        },
      );
      setAttempt(data.attempt);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not save answer. Check again to retry.",
      );
      // Reconcile a concurrent tab or a successful write whose response was lost.
      try {
        const { data } = await api.get(`/gemini/quiz/attempts/${attempt._id}`);
        setAttempt(data.attempt);
        if (data.attempt.answers[currentIndex])
          setSelected(data.attempt.answers[currentIndex].selectedAnswer);
      } catch {
        /* Keep the selection available for retry. */
      }
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  };

  if (restoring)
    return (
      <div className="quiz-welcome-wrapper" role="status">
        Loading saved quiz…
      </div>
    );
  if (restoreError)
    return (
      <div className="quiz-welcome-wrapper" role="alert">
        <p>Could not load your saved quiz.</p>
        <button
          className="next-btn"
          onClick={() => setRestoreKey((key) => key + 1)}
        >
          Retry
        </button>
      </div>
    );

  if (!attempt)
    return (
      <div className="quiz-welcome-wrapper">
        <div className="quiz-intro-card">
          <div className="quiz-icon" aria-hidden="true">
            ?
          </div>
          <h1>{course?.title} Quiz</h1>
          <p>
            Answer 10 AI-generated questions. Check each answer to see the
            correct answer and explanation. Checked answers are final.
          </p>
          <div className="quiz-rules">
            <span>✓ Instant feedback</span>
            <span>✓ Saved results</span>
            <span>✓ Auto-submit</span>
          </div>
          <button
            className="start-quiz-btn"
            onClick={startQuiz}
            disabled={busy}
          >
            {busy ? "Generating Quiz…" : "Begin Now"}
          </button>
        </div>
      </div>
    );

  if (attempt.status === "completed")
    return (
      <div className="quiz-result-wrapper">
        <div className="result-card quiz-result-detail">
          <h1>Quiz completed</h1>
          <div className="score-circle">
            <span className="score-num">{attempt.score}</span>
            <span className="score-total">/ {attempt.questions.length}</span>
          </div>
          <p>
            Your {attempt.topic} result is saved. You can review it in Past
            Tests on your dashboard.
          </p>
          <div className="result-actions">
            <button className="retry-btn" onClick={startQuiz} disabled={busy}>
              {busy ? "Generating…" : "Try Again"}
            </button>
            <button
              className="back-btn"
              onClick={() => navigate(`/${user._id}/dashboard#past-tests`)}
            >
              Past Tests
            </button>
            <button
              className="back-btn"
              onClick={() => navigate(`/course/study/${id}`)}
            >
              Back to Course
            </button>
          </div>
          <QuizReview attempt={attempt} />
        </div>
      </div>
    );

  const question = attempt.questions[currentIndex];
  const feedback = attempt.answers[currentIndex];
  return (
    <div className="quiz-active-wrapper">
      <div
        className="quiz-progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={attempt.questions.length}
        aria-valuenow={attempt.answers.length}
        aria-label={`${attempt.answers.length} of ${attempt.questions.length} checked`}
      >
        <div
          className="progress-fill"
          style={{
            width: `${(attempt.answers.length / attempt.questions.length) * 100}%`,
          }}
        />
      </div>
      <div className="question-card">
        <span className="q-count">
          Question {currentIndex + 1} of {attempt.questions.length} · Score:{" "}
          {attempt.score}/{attempt.answers.length}
        </span>
        <h1 className="question-text">{question.question}</h1>
        <div className="options-grid" role="group" aria-label="Answer options">
          {question.options.map((option, index) => (
            <button
              key={option}
              type="button"
              aria-pressed={(feedback?.selectedAnswer || selected) === option}
              className={`option-item ${(feedback?.selectedAnswer || selected) === option ? "selected" : ""} ${feedback ? (option === feedback.correctAnswer ? "option-correct" : option === feedback.selectedAnswer ? "option-wrong" : "") : ""}`}
              disabled={Boolean(feedback) || busy}
              onClick={() => setSelected(option)}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-content">{option}</span>
            </button>
          ))}
        </div>
        {feedback && (
          <div className="quiz-feedback" role="status">
            <strong
              className={feedback.isCorrect ? "quiz-correct" : "quiz-wrong"}
            >
              {feedback.isCorrect ? "Correct!" : "Incorrect"}
            </strong>
            <p>Correct answer: {feedback.correctAnswer}</p>
            <p>{feedback.explanation}</p>
            <p>Answer saved and locked.</p>
          </div>
        )}
        <div className="quiz-footer">
          {!feedback ? (
            <button
              className="next-btn"
              disabled={!selected || busy}
              onClick={checkAnswer}
            >
              {busy ? "Saving…" : "Check"}
            </button>
          ) : (
            <button
              className="next-btn"
              onClick={() => {
                setCurrentIndex(currentIndex + 1);
                setSelected("");
              }}
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default Quiz;
