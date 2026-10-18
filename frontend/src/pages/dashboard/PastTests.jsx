import { useEffect, useState } from "react";
import api from "../../utils/api";
import QuizReview from "../../components/quiz/QuizReview.jsx";
import "../quiz/quiz.css";

const PastTests = () => {
  const [tests, setTests] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [review, setReview] = useState(null);
  const [opening, setOpening] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get(`/gemini/quiz/attempts?page=${page}`).then(({ data }) => {
      if (!active) return;
      setTests(data.tests); setHasMore(data.hasMore);
    }).catch(() => { if (active) setError("Could not load past tests. Please retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, retry]);
  const openReview = async id => {
    setOpening(true); setError("");
    try {
      const { data } = await api.get(`/gemini/quiz/attempts/${id}`);
      setReview(data.attempt);
    } catch { setError("Could not open the test. Please retry."); }
    finally { setOpening(false); }
  };
  return <section className="past-tests" aria-labelledby="past-tests-heading">
    <h2 id="past-tests-heading">Past Tests</h2>
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
    {loading ? <p role="status">Loading past tests…</p> : !error && tests.length === 0 ? <p>Your completed quizzes will appear here.</p> : !error && <>
      <ul className="past-tests-list">{tests.map(test => <li key={test._id}>
        <div><strong>{test.topic}</strong><p>{new Date(test.completedAt).toLocaleString()} · {test.difficulty}</p></div>
        <span>{test.score}/{test.totalQuestions}</span>
        <button className="back-btn" disabled={opening} onClick={() => openReview(test._id)}>Review test</button>
      </li>)}</ul>
      <div className="result-actions">
        <button disabled={page === 1} onClick={() => { setPage(page - 1); setReview(null); }}>Previous</button>
        <button disabled={!hasMore} onClick={() => { setPage(page + 1); setReview(null); }}>Next</button>
      </div>
    </>}
    {opening && <p role="status">Loading test…</p>}
    {review && <div className="past-test-review"><h3>{review.topic} · {review.score}/{review.questions.length}</h3>
      <button className="back-btn" onClick={() => setReview(null)}>Close review</button><QuizReview attempt={review} /></div>}
  </section>;
};
export default PastTests;
