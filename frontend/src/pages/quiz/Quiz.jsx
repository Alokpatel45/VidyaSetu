import React, { useEffect, useState } from "react";
import axios from "axios";
import { server } from "../../main";
import { CourseData } from "../../context/CourseContext";
import "./quiz.css";
import { useParams } from "react-router-dom";
const Quiz = () => {
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [selectedOps, setSelectedOps] = useState({});
  const [checkClicked, setCheckClicked] = useState({});
  const [score, setScore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { fetchCourse, course } = CourseData();
  const { id } = useParams();
  useEffect(() => {
    fetchCourse(id);
  }, []);
  const handleQuiz = async () => {
    setIsLoading(true);
    const selectedSubject = course.title;
    console.log(selectedSubject);
    try {
      const res = await axios.post(`${server}/gemini/quiz`, {
        subject: selectedSubject,
      });
      setQuestions(res.data.quiz);
      setSelectedOps({});
      setCheckClicked({});
      setScore(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = (id) => {
    const userAnswer = selectedOps[id];
    if (!userAnswer) return;

    const isCorrect = userAnswer === questions[id].correctAnswer;

    setCheckClicked((prev) => ({
      ...prev,
      [id]: isCorrect,
    }));

    const allAnswered = questions.every((_, idx) => {
      const selected = selectedOps[idx];
      return selected && selected === questions[idx].correctAnswer;
    });

    if (allAnswered) {
      const correctCount = questions.reduce((acc, q, i) => {
        return selectedOps[i] === q.correctAnswer ? acc + 1 : acc;
      }, 0);
      setScore(correctCount);
    }
  };

  return (
    <div className="quiz-container">
      <h1>Quiz</h1>
      <button className="common-btn" onClick={handleQuiz}>
        {isLoading ? "Loading..." : "Start Quiz"}
      </button>

      <div className="quiz">
        {questions.map((q, id) => (
          <div key={id} className="question-box">
            <h2>{q.question}</h2>
            <ol type="1">
              {q.options.map((opt, i) => (
                <li key={i}>
                  <label>
                    <input
                      type="radio"
                      name={`question-${id}`}
                      value={opt}
                      checked={selectedOps[id] === opt}
                      onChange={() =>
                        setSelectedOps((prev) => ({ ...prev, [id]: opt }))
                      }
                    />
                    {opt}
                  </label>
                </li>
              ))}
            </ol>
            <button onClick={() => checkAnswer(id)} className="common-btn">
              Check
            </button>
            {checkClicked[id] !== undefined && (
              <p className={checkClicked[id] ? "correct" : "incorrect"}>
                {checkClicked[id] ? "Correct ✅" : "Try Again ❌"}
              </p>
            )}
          </div>
        ))}
      </div>

      {score !== null && (
        <div className="score">
          🎉 Final Score: {score} / {questions.length}
        </div>
      )}
    </div>
  );
};

export default Quiz;
