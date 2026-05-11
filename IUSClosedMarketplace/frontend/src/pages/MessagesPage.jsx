import { useState, useEffect, useRef, useCallback } from 'react';
import { messagesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useChatHub } from '../hooks/useChatHub';
import Icon from '../components/Icon';

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

  const currentUserId = user?.userId ?? user?.id;
  const threadId = activeThread ? getThreadId(currentUserId, activeThread.otherUserId) : null;

  const handleNewMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
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
    } catch {
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
      <div className="page-header">
        <div className="page-header-text">
          <h2>Messages</h2>
          <p>Your conversations</p>
        </div>
      </div>

      <div className="msg-layout">
        <div className="msg-threads">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <div className="loading-spinner" />
            </div>
          ) : threads.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="icon"><Icon name="inbox" size={20} /></div>
              <p>No conversations yet</p>
            </div>
          ) : (
            threads.map((t, i) => (
              <div
                key={i}
                className={`msg-thread-item${activeThread?.otherUserId === t.otherUserId && activeThread?.listingId === t.listingId ? ' active' : ''}`}
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
                <Icon name="user" size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                {activeThread.otherUserName}
                <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '0.75rem' }}>
                  — {activeThread.listingTitle}
                </span>
                {connected && <span className="live-dot" title="Live" />}
              </div>
              <div className="msg-chat-body">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`msg-bubble${m.senderId === currentUserId ? ' sent' : ' received'}`}
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
                  <Icon name="send" size={14} />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <div className="icon"><Icon name="messageSquare" size={22} /></div>
              <h3>No conversation selected</h3>
              <p>Pick one from the list</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
