import { useState, useEffect, useRef } from 'react';
import { messagesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    messagesApi.getThreads()
      .then((res) => setThreads(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectThread = async (thread) => {
    setActiveThread(thread);
    try {
      const res = await messagesApi.getConversation(thread.otherUserId, thread.listingId);
      setMessages(res.data);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeThread) return;
    try {
      await messagesApi.send({
        receiverId: activeThread.otherUserId,
        listingId: activeThread.listingId,
        content: newMsg
      });
      setNewMsg('');
      // Reload conversation
      const res = await messagesApi.getConversation(activeThread.otherUserId, activeThread.listingId);
      setMessages(res.data);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { }
  };

  const fmtTime = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="page-header"><h2>Messages</h2><p>Your conversations</p></div>
      <div className="msg-layout">
        <div className="msg-threads">
          {loading ? <p style={{ padding: 20 }}>Loading...</p> : threads.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}><p>No conversations yet</p></div>
          ) : (
            threads.map((t, i) => (
              <div
                key={i}
                className={`msg-thread-item ${activeThread?.otherUserId === t.otherUserId && activeThread?.listingId === t.listingId ? 'active' : ''}`}
                onClick={() => selectThread(t)}
              >
                <span className="thread-time">{fmtTime(t.lastMessageTime)}</span>
                <div className="thread-title">{t.otherUserName}</div>
                <div className="thread-preview">Re: {t.listingTitle} — {t.lastMessage}</div>
              </div>
            ))
          )}
        </div>
        <div className="msg-chat">
          {activeThread ? (
            <>
              <div className="msg-chat-header">
                {activeThread.otherUserName} — {activeThread.listingTitle}
              </div>
              <div className="msg-chat-body">
                {messages.map((m) => (
                  <div key={m.id} className={`msg-bubble ${m.senderId === user?.userId ? 'sent' : 'received'}`}>
                    {m.content}
                    <div className="time">{fmtTime(m.createdAt)}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="msg-input-bar">
                <input
                  placeholder="Type a message..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="btn btn-primary" onClick={sendMessage}>Send</button>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ margin: 'auto' }}><div className="icon">💬</div><p>Select a conversation</p></div>
          )}
        </div>
      </div>
    </>
  );
}
