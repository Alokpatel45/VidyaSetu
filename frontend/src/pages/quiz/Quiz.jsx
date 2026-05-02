import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { CourseData } from "../../context/CourseContext.jsx";
import "./quiz.css";
import { useParams, useNavigate } from "react-router-dom";

const DEFAULT_QUIZ_SIZE = 10;

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOps, setSelectedOps] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const { fetchCourse, course } = CourseData();
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchCourse(id);
  }, [id, fetchCourse]);

  const startQuiz = async () => {
    const topic = course?.title?.trim();
    if (!topic) {
      toast.error("Loading course details...");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post("/gemini/quiz", {
        topic,
        numQuestions: DEFAULT_QUIZ_SIZE,
        difficulty: "medium",
      });
      setQuestions(Array.isArray(data.quiz) ? data.quiz : []);
      setSelectedOps({});
      setCurrentIndex(0);
      setShowResult(false);
      setQuizStarted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOps((prev) => ({
      ...prev,
      [currentIndex]: option,
    }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResult(true);
    }
  };

  const calculateScore = () => {
    return questions.reduce((acc, q, i) => {
      return selectedOps[i] === q.correctAnswer ? acc + 1 : acc;
    }, 0);
  };

  if (!quizStarted) {
    return (
      <div className="quiz-welcome-wrapper">
        <div className="quiz-intro-card">
          <div className="quiz-icon">🎯</div>
          <h1>{course?.title} Quiz</h1>
          <p>Test your knowledge with 10 AI-generated questions based on this course.</p>
          <div className="quiz-rules">
            <span>✓ 10 Questions</span>
            <span>✓ Multiple Choice</span>
            <span>✓ Instant Result</span>
          </div>
          <button className="start-quiz-btn" onClick={startQuiz} disabled={isLoading}>
            {isLoading ? "Generating Quiz..." : "Begin Now"}
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    const finalScore = calculateScore();
    const percentage = (finalScore / questions.length) * 100;
    
    return (
      <div className="quiz-result-wrapper">
        <div className="result-card">
          <div className="result-header">
            {percentage >= 70 ? "🎉 Amazing!" : percentage >= 40 ? "👍 Good Job!" : "📚 Keep Learning!"}
          </div>
          <div className="score-circle">
            <span className="score-num">{finalScore}</span>
            <span className="score-total">/ {questions.length}</span>
          </div>
          <h2>Quiz Completed</h2>
          <p>You scored {percentage}% in the {course?.title} assessment.</p>
          
          <div className="result-actions">
            <button className="retry-btn" onClick={startQuiz}>Try Again</button>
            <button className="back-btn" onClick={() => navigate(`/course/study/${id}`)}>Back to Course</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="quiz-active-wrapper">
      <div className="quiz-progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="question-card">
        <div className="question-header">
          <span className="q-count">Question {currentIndex + 1} of {questions.length}</span>
        </div>

        <h2 className="question-text">{currentQ?.question}</h2>

        <div className="options-grid">
          {currentQ?.options.map((opt, i) => (
            <div 
              key={i} 
              className={`option-item ${selectedOps[currentIndex] === opt ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(opt)}
            >
              <div className="option-letter">{String.fromCharCode(65 + i)}</div>
              <div className="option-content">{opt}</div>
            </div>
          ))}
        </div>

        <div className="quiz-footer">
          <button 
            className="next-btn" 
            onClick={nextQuestion} 
            disabled={!selectedOps[currentIndex]}
          >
            {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
