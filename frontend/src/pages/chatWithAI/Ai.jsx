import React, { useState } from "react";
import axios from "axios";
import Loading from "../../components/loding/Loading";
import { server } from "../../main";
import "./Ai.css";

const Ai = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [qaList, setQaList] = useState([]);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setIsLoading(true);

    try {
      const res = await axios.post(`${server}/gemini`, { question });
      const answer = res.data.reply;

      setQaList((prev) => [...prev, { question, answer }]);
      setQuestion("");
    } catch (err) {
      console.error(" Axios Error:", err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-container">
      <input
        type="text"
        placeholder="Ask Question to Ai"
        value={question}
        onKeyDown={(e) => {
          if (e.key == "Enter") handleAsk();
        }}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button onClick={handleAsk} className="common-btn">
        {isLoading ? "Please Wait" : "Ask"}
      </button>

      <div className="qa-container">
        {qaList.map((qa, index) => (
          <div key={index} className="qa-block">
            <p className="user-msg">👤: {qa.question}</p>
            <p className="ai-msg">🤖: {qa.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ai;
