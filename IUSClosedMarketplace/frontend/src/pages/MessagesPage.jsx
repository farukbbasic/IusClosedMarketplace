import { useState, useEffect, useRef, useCallback } from 'react';
import { messagesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useChatHub } from '../hooks/useChatHub';

// Thread ID formula must match the backend (canonical pair key)
function getThreadId(userId, otherUserId) {
  if (!userId || !otherUserId) return null;
  return Math.min(userId, otherUserId) * 100000 + Math.max(userId, otherUserId);
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  // Works after both login (user.userId from AuthResponseDto)
  // and page refresh (user.id from UserDto via getMe())
  const currentUserId = user?.userId ?? user?.id;

  // Canonical thread ID for SignalR group — matches backend formula
  const threadId = activeThread ? getThreadId(currentUserId, activeThread.otherUserId) : null;

  // Handle incoming real-time message from SignalR
  const handleNewMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev; // dedupe
      return [...prev, msg];
    });
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const { connected } = useChatHub(threadId, handleNewMessage);

  useEffect(() => {
    messagesApi.getThreads()
      .then((res) => setThreads(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectThread = async (thread) => {
    setActiveThread(thread);
    setMessages([]);
    try {
      const res = await messagesApi.getConversation(thread.otherUserId, thread.listingId);
      setMessages(res.data);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeThread || sending) return;
    setSending(true);
    try {
      await messagesApi.send({
        receiverId: activeThread.otherUserId,
        listingId: activeThread.listingId,
        content: newMsg,
      });
      setNewMsg('');
      // SignalR pushes the new message to both parties — no manual reload needed
    } catch {
      // Fallback: reload manually if SignalR push fails
      const res = await messagesApi.getConversation(activeThread.otherUserId, activeThread.listingId);
      setMessages(res.data);
    } finally {
      setSending(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
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
                {connected && <span style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 8 }}>● live</span>}
              </div>
              <div className="msg-chat-body">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`msg-bubble ${m.senderId === currentUserId ? 'sent' : 'received'}`}
                  >
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
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                />
                <button className="btn btn-primary" onClick={sendMessage} disabled={sending}>
                  {sending ? '...' : 'Send'}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <div className="icon">💬</div>
              <p>Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
