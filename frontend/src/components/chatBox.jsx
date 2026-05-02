import { useEffect, useState } from "react";
import api from "../utils/api";
import { useSocket } from "../context/SocketContext";
import "./chatBox.css";

const ChatBox = ({ user }) => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    api
      .get("/api/chat")
      .then((res) => setMessages(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("chatMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("chatMessage");
  }, [socket]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      await api.post("/api/chat", { text });
      setMessages((prev) => [...prev, { userName: user.name, text }]);
      setText("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="chat-container">
      <h2 className="chat-header">Group Chat</h2>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className="chat-message">
            <span className="username">{msg.userName}:</span> {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input-group">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Type message..."
          className="chat-input"
        />
        <button type="button" onClick={sendMessage} className="common-btn chat-send-btn">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
