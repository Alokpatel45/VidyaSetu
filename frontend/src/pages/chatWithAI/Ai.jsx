import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import "./ai.css";

const Ai = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [qaList, setQaList] = useState([]);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [qaList, isLoading]);

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userQuestion = question;
    setQuestion("");
    setIsLoading(true);

    try {
      const { data } = await api.post("/gemini", { question: userQuestion });
      const answer = data.reply;

      setQaList((prev) => [...prev, { question: userQuestion, answer }]);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not reach AI service"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-page-wrapper">
      <div className="ai-chat-card">
        <div className="ai-header">
          <div className="ai-status-icon">✨</div>
          <div className="ai-header-text">
            <h3>VidyaSetu Assistant</h3>
            <span>Powered by Gemini AI</span>
          </div>
        </div>

        <div className="qa-scroll-area">
          {qaList.length === 0 && !isLoading && (
            <div className="ai-welcome">
              <div className="welcome-icon">👋</div>
              <h2>How can I help you today?</h2>
              <p>Ask anything about your courses, lectures, or general study topics.</p>
            </div>
          )}

          {qaList.map((qa, index) => (
            <div key={index} className="message-pair">
              <div className="msg user-bubble">
                <span className="msg-content">{qa.question}</span>
              </div>
              <div className="msg ai-bubble">
                <span className="msg-content">{qa.answer}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="msg ai-bubble loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="ai-input-wrapper">
          <div className="input-group">
            <input
              type="text"
              placeholder="Type your question..."
              value={question}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAsk();
              }}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
            />
            <button 
              onClick={handleAsk} 
              className={`send-btn ${isLoading ? 'disabled' : ''}`}
              disabled={isLoading || !question.trim()}
            >
              <svg viewBox="0 0 24 24" width="24px" height="24px">
                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ai;
