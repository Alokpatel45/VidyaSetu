import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { puter } from "@heyputer/puter.js";
import {
  FiSend,
  FiUser,
  FiCopy,
  FiCheck,
  FiTrash2,
  FiCpu,
  FiBookOpen,
  FiHelpCircle,
  FiZap,
  FiPaperclip,
  FiFileText,
  FiImage,
  FiX,
  FiUploadCloud,
} from "react-icons/fi";
import { RiRobotLine } from "react-icons/ri";
import api from "../../utils/api";
import "./ai.css";

// Helper component to render formatted markdown, code blocks, lists, and inline styles
const FormattedContent = ({ text }) => {
  if (!text) return null;

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="formatted-ai-response">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const firstLineEnd = part.indexOf("\n");
          const language =
            firstLineEnd !== -1
              ? part.slice(3, firstLineEnd).trim()
              : "code";
          const codeContent =
            firstLineEnd !== -1
              ? part.slice(firstLineEnd + 1, -3).trim()
              : part.slice(3, -3).trim();

          return (
            <div key={index} className="ai-code-block">
              <div className="code-header">
                <span className="code-lang">{language || "code"}</span>
                <button
                  className="code-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(codeContent);
                    toast.success("Code copied!");
                  }}
                  title="Copy code"
                >
                  <FiCopy size={13} /> Copy
                </button>
              </div>
              <pre>
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split("\n");
        return (
          <div key={index} className="ai-text-block">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="paragraph-spacer" />;

              if (trimmed.startsWith("### ")) {
                return (
                  <h4 key={lIdx} className="ai-heading-3">
                    {parseInlineMarkdown(trimmed.slice(4))}
                  </h4>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h3 key={lIdx} className="ai-heading-2">
                    {parseInlineMarkdown(trimmed.slice(3))}
                  </h3>
                );
              }
              if (trimmed.startsWith("# ")) {
                return (
                  <h2 key={lIdx} className="ai-heading-1">
                    {parseInlineMarkdown(trimmed.slice(2))}
                  </h2>
                );
              }

              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <div key={lIdx} className="list-item bullet">
                    <span className="bullet-dot">•</span>
                    <span className="list-text">
                      {parseInlineMarkdown(trimmed.slice(2))}
                    </span>
                  </div>
                );
              }

              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="list-item numbered">
                    <span className="list-num">{numMatch[1]}.</span>
                    <span className="list-text">
                      {parseInlineMarkdown(numMatch[2])}
                    </span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="ai-paragraph">
                  {parseInlineMarkdown(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const parseInlineMarkdown = (text) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const Ai = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [qaList, setQaList] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [qaList, isLoading]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get("/gemini/documents");
      setDocuments(data.documents || []);
    } catch {
      // Guest or unauthenticated state
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    const toastId = toast.loading("Extracting text & generating vector embeddings...");

    try {
      const { data } = await api.post("/gemini/upload-doc", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(data.message || "Document indexed for RAG search!", { id: toastId });
      fetchDocuments();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to process document for RAG.",
        { id: toastId }
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await api.delete(`/gemini/documents/${documentId}`);
      toast.success("Document removed from AI vector memory");
      setDocuments((prev) => prev.filter((d) => d._id !== documentId));
    } catch {
      toast.error("Failed to remove document");
    }
  };

  const handleAsk = async (customPrompt) => {
    const promptToSend = typeof customPrompt === "string" ? customPrompt : question;
    if (!promptToSend.trim() || isLoading) return;

    const userQuestion = promptToSend.trim();
    setQuestion("");
    setIsLoading(true);

    try {
      let answer = null;

      const messages = [
        {
          role: "system",
          content:
            "You are VidyaSetu Assistant, a helpful and friendly AI tutor for the VidyaSetu E-Learning platform. Your goal is to help students understand their courses, lectures, and study materials. Always refer to the platform as VidyaSetu. Format responses clearly with markdown, lists, and code blocks where helpful.",
        },
      ];

      qaList.forEach((item) => {
        messages.push({ role: "user", content: item.question });
        messages.push({ role: "assistant", content: item.answer });
      });

      messages.push({ role: "user", content: userQuestion });

      // Primary: VidyaSetu Server AI API (Seamless, Instant, RAG Context Search)
      try {
        const { data } = await api.post("/gemini", {
          question: userQuestion,
          history: qaList,
        });
        answer = data?.reply;
      } catch (serverErr) {
        console.warn(
          "Server AI endpoint error, attempting Puter client fallback...",
          serverErr
        );
      }

      // Secondary Fallback: Puter.js (Only if server API fails)
      if (!answer) {
        try {
          const response = await puter.ai.chat(messages, {
            model: "gemini-2.5-flash",
          });

          if (typeof response === "string") {
            answer = response;
          } else if (response?.message?.content) {
            answer =
              typeof response.message.content === "string"
                ? response.message.content
                : response.message.content[0]?.text;
          } else if (response?.text) {
            answer = response.text;
          }
        } catch (puterErr) {
          console.warn("Puter fallback failed:", puterErr);
        }
      }

      if (answer) {
        setQaList((prev) => [...prev, { question: userQuestion, answer }]);
      } else {
        toast.error("Could not get a response from AI service.");
      }
    } catch (err) {
      console.error("AI Assistant Error:", err);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not reach AI service"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAnswer = (answerText, index) => {
    navigator.clipboard.writeText(answerText);
    setCopiedIndex(index);
    toast.success("Response copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    if (qaList.length === 0) return;
    setQaList([]);
    toast.success("Chat cleared");
  };

  const starterSuggestions = [
    { icon: <FiUploadCloud />, text: "Upload a PDF or Image to ask questions based on your document" },
    { icon: <FiBookOpen />, text: "Explain key concepts of Object-Oriented Programming" },
    { icon: <FiZap />, text: "Give me study tips to prepare for final exams" },
  ];

  return (
    <div className="ai-page-wrapper">
      <div className="ai-chat-card">
        {/* Top Header */}
        <div className="ai-header">
          <div className="ai-header-left">
            <div className="ai-status-icon">
              <FiCpu />
            </div>
            <div className="ai-header-text">
              <h3>VidyaSetu AI Tutor</h3>
              <span className="online-badge">
                <span className="online-dot"></span> Ready to help
              </span>
            </div>
          </div>
          {qaList.length > 0 && (
            <button
              onClick={handleClearChat}
              className="clear-chat-btn"
              title="Clear Conversation"
            >
              <FiTrash2 size={16} /> Clear Chat
            </button>
          )}
        </div>

        {/* Scrollable Chat Area */}
        <div className="qa-scroll-area">
          {qaList.length === 0 && !isLoading && (
            <div className="ai-welcome">
              <div className="welcome-avatar">
                <RiRobotLine size={36} />
              </div>
              <h2>Hi! I'm your VidyaSetu Study Assistant</h2>
              <p>Ask me anything about your subjects, or upload a PDF, TXT, or Image for context-aware RAG search.</p>

              <div className="starter-chips">
                {starterSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    className="chip-btn"
                    onClick={() => {
                      if (idx === 0) {
                        fileInputRef.current?.click();
                      } else {
                        handleAsk(item.text);
                      }
                    }}
                  >
                    <span className="chip-icon">{item.icon}</span>
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {qaList.map((qa, index) => (
            <div key={index} className="chat-thread">
              {/* User Question */}
              <div className="msg-row user-row">
                <div className="avatar user-avatar">
                  <FiUser size={16} />
                </div>
                <div className="msg user-bubble">
                  <span className="msg-content">{qa.question}</span>
                </div>
              </div>

              {/* AI Answer */}
              <div className="msg-row ai-row">
                <div className="avatar ai-avatar">
                  <RiRobotLine size={16} />
                </div>
                <div className="msg ai-bubble">
                  <FormattedContent text={qa.answer} />
                  <div className="bubble-footer">
                    <button
                      onClick={() => handleCopyAnswer(qa.answer, index)}
                      className="action-btn copy-btn"
                      title="Copy response"
                    >
                      {copiedIndex === index ? (
                        <>
                          <FiCheck size={13} /> Copied
                        </>
                      ) : (
                        <>
                          <FiCopy size={13} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="msg-row ai-row loading-row">
              <div className="avatar ai-avatar pulsing">
                <RiRobotLine size={16} />
              </div>
              <div className="msg ai-bubble loading-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="thinking-text">Searching document embeddings & thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Fixed Input Bar & Document Context Bar */}
        <div className="ai-input-wrapper">
          {/* Active Documents List Bar */}
          {documents.length > 0 && (
            <div className="active-docs-bar">
              <span className="docs-bar-label">RAG Memory:</span>
              <div className="docs-chips-list">
                {documents.map((doc) => (
                  <div key={doc._id} className="doc-chip" title={`${doc.chunkCount} vector chunks`}>
                    <span className="doc-icon">
                      {doc.fileType === "image" ? <FiImage /> : <FiFileText />}
                    </span>
                    <span className="doc-name">{doc.fileName}</span>
                    <button
                      className="doc-remove-btn"
                      onClick={() => handleDeleteDocument(doc._id)}
                      title="Remove document from AI memory"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="input-group">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: "none" }}
              accept=".pdf,.txt,.md,image/*"
            />

            {/* Upload Attachment Button */}
            <button
              className={`attach-btn ${isUploading ? "uploading" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              title="Upload PDF, TXT, or Image for RAG AI Search"
            >
              <FiPaperclip size={18} />
            </button>

            <input
              type="text"
              placeholder="Ask a question or request information from uploaded files..."
              value={question}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAsk();
              }}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
            />
            <button
              onClick={() => handleAsk()}
              className={`send-btn ${isLoading || !question.trim() ? "disabled" : ""}`}
              disabled={isLoading || !question.trim()}
              title="Send Message"
            >
              <FiSend size={18} />
            </button>
          </div>
          <div className="input-footer-note">
            <span>Attach documents (PDF / TXT / Images) to query them with Gemini Vector RAG search.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ai;



