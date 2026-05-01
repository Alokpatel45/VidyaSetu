// src/components/ChatBox.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useSocket } from "../context/SocketContext";
import "./chatBox.css";

const ChatBox = ({ user }) => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const socket = useSocket();

  const token = localStorage.getItem("token");
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/chat", {
        headers: { token },
      })
      .then((res) => setMessages(res.data))
      .catch((err) => console.error(err));
  }, [token]);

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
      await axios.post(
        "http://localhost:5000/api/chat",
        { text },
        {
          headers: { token },
        }
      );
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
        <button onClick={sendMessage} className="chat-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
