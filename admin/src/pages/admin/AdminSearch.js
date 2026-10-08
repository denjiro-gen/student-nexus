import React, { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { Search, Plus, Paperclip, Sparkles, Send, User, Clock, Loader, Bot, Calendar, FileText, CheckCircle2, XCircle, Users, Trash2 } from 'lucide-react';
import { getSessionHistory, AIAssistantSession, deleteSession, deleteAllSessions } from '../../services/aiService';
import { format } from 'date-fns';

const GlobalBlink = createGlobalStyle`
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;

const GREEN = '#03632B';

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good Morning';
  if (h >= 12 && h < 17) return 'Good Afternoon';
  if (h >= 17 && h < 21) return 'Good Evening';
  return 'Good Night';
}

const Page = styled.div`
  display: grid;
  grid-template-columns: 290px 1fr;
  gap: 20px;
  height: calc(100vh - 130px);
  max-width: 1100px;
`;

const LeftCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
`;

const AgentCard = styled.div`
  background: ${GREEN};
  border-radius: 16px;
  padding: 16px 18px 20px;
  flex-shrink: 0;
  position: relative;
`;

const AgentTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
`;

const AgentIconBox = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`;

const AgentTitle = styled.div`
  font-size: 13px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const AgentSearch = styled.div`
  position: relative;
  margin-bottom: 14px;

  input {
    width: 100%;
    padding: 9px 12px 9px 34px;
    border-radius: 8px;
    border: none;
    font-size: 12px;
    outline: none;
    box-sizing: border-box;
    background: rgba(255,255,255,0.95);
    color: #374151;
    &::placeholder { color: #9ca3af; }
  }

  svg {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }
`;

const AgentDesc = styled.p`
  font-size: 11.5px;
  color: rgba(255,255,255,0.88);
  line-height: 1.55;
  margin: 0;
`;

const HistoryCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px 18px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const HistoryTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 14px;
  font-weight: 500;
`;

const HistScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
`;

const HistSection = styled.div`
  font-size: 10px;
  font-weight: 800;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 10px 0 6px;

  &:first-child { margin-top: 0; }
`;

const HistItem = styled.div`
  font-size: 12px;
  color: #374151;
  padding: 6px 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 6px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: #f3f4f6;
    color: ${GREEN};
  }

  .session-title {
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .delete-btn {
    opacity: 0;
    color: #9ca3af;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      background: #fee2e2;
      color: #dc2626;
    }
  }

  &:hover .delete-btn {
    opacity: 1;
  }
`;

const NewChatBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: #f9fafb; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
`;

const ModalBox = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 340px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;

  h3 { margin: 0; font-size: 16px; color: #111827; }
  p { margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5; }
  .btn-row { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
  button {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }
  .cancel-btn { background: #f3f4f6; color: #374151; }
  .cancel-btn:hover { background: #e5e7eb; }
  .danger-btn { background: #dc2626; color: #fff; }
  .danger-btn:hover { background: #b91c1c; }
`;

const ChatPanel = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`;

const ChatBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px 28px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
`;

const WelcomeCenter = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-bottom: 60px;

  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
    letter-spacing: -0.3px;
  }

  p {
    font-size: 15px;
    color: #6b7280;
  }
`;

const MsgRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-direction: ${p => p.$user ? 'row-reverse' : 'row'};
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${p => p.$user ? '#e5e7eb' : 'linear-gradient(135deg, #03632B 0%, #059669 100%)'};
  color: ${p => p.$user ? '#4b5563' : '#ffffff'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: ${p => p.$user ? 'none' : '0 2px 8px rgba(3,99,43,0.4)'};
`;

const BubbleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 85%;
  align-items: ${p => p.$user ? 'flex-end' : 'flex-start'};
`;

const Bubble = styled.div`
  padding: 12px 16px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.6;
  ${p => p.$user ? `
    background: #f3f4f6;
    color: #1f2937;
    border-bottom-right-radius: 4px;
  ` : `
    background: linear-gradient(145deg, #022b12 0%, #03632B 100%);
    color: #d1fae5;
    border: 1px solid rgba(16,185,129,0.3);
    border-bottom-left-radius: 4px;
    box-shadow: 0 4px 20px rgba(3,99,43,0.25), inset 0 1px 0 rgba(255,255,255,0.06);
  `}
`;

/* ── Markdown content styles inside AI bubble ────────────────────────── */
const MdWrap = styled.div`
  /* Headings */
  h1, h2, h3, h4 {
    color: #ecfdf5;
    font-weight: 700;
    margin: 14px 0 6px;
    line-height: 1.3;
    &:first-child { margin-top: 0; }
  }
  h1 { font-size: 16px; border-bottom: 1px solid rgba(16,185,129,0.35); padding-bottom: 6px; }
  h2 { font-size: 14px; }
  h3 { font-size: 13px; color: #6ee7b7; }

  /* Paragraphs */
  p {
    margin: 6px 0;
    &:first-child { margin-top: 0; }
    &:last-child  { margin-bottom: 0; }
  }

  /* Lists */
  ul, ol {
    margin: 8px 0;
    padding-left: 18px;
  }
  li {
    margin: 4px 0;
    &::marker { color: #34d399; }
  }

  /* Inline code */
  code {
    background: rgba(16,185,129,0.15);
    color: #6ee7b7;
    border: 1px solid rgba(16,185,129,0.3);
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 12px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }

  /* Code blocks */
  pre {
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(16,185,129,0.2);
    border-radius: 8px;
    padding: 12px 14px;
    overflow-x: auto;
    margin: 10px 0;
    code {
      background: none;
      border: none;
      padding: 0;
      color: #6ee7b7;
      font-size: 12px;
    }
  }

  /* Bold & Italic */
  strong { color: #ecfdf5; font-weight: 700; }
  em { color: #a7f3d0; font-style: italic; }

  /* Blockquote */
  blockquote {
    border-left: 3px solid #10b981;
    background: rgba(16,185,129,0.1);
    margin: 10px 0;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    color: #a7f3d0;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 12px;
  }
  th {
    background: rgba(16,185,129,0.2);
    color: #6ee7b7;
    font-weight: 600;
    padding: 6px 10px;
    text-align: left;
    border: 1px solid rgba(16,185,129,0.2);
  }
  td {
    padding: 6px 10px;
    border: 1px solid rgba(255,255,255,0.07);
    color: #d1fae5;
  }
  tr:nth-child(even) td { background: rgba(255,255,255,0.03); }

  /* Horizontal rule */
  hr {
    border: none;
    border-top: 1px solid rgba(16,185,129,0.25);
    margin: 12px 0;
  }

  /* Links */
  a {
    color: #34d399;
    text-decoration: underline;
    text-decoration-color: rgba(52,211,153,0.4);
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6ee7b7;
  font-size: 12px;
  font-style: italic;
  padding: 4px 0;

  .dots {
    display: flex;
    gap: 4px;
    span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
      animation: bounce 1.2s ease-in-out infinite;
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
`;

const WidgetContainer = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
`;

const EventCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const EventMiniCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 8px;

  .info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .title {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 11px;
    color: #6b7280;
  }
  .badge {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 12px;
    text-transform: uppercase;
    background: ${p => p.$status === 'approved' ? '#dcfce7' : p.$status === 'rejected' ? '#fee2e2' : '#fef3c7'};
    color: ${p => p.$status === 'approved' ? '#059669' : p.$status === 'rejected' ? '#dc2626' : '#d97706'};
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const StatBox = styled.div`
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;

  .icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: ${p => p.$bg || '#e5e7eb'};
    color: ${p => p.$color || '#374151'};
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .val {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }
  .lbl {
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
  }
`;

const LogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LogRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; padding-bottom: 0; }
  
  .time { color: #9ca3af; white-space: nowrap; font-family: monospace; }
  .user { font-weight: 600; color: #374151; }
  .action { color: #111827; }
`;

const InputBar = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
`;

const InputInner = styled.div`
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 6px 12px;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 13px;
    padding: 8px 4px;
    color: #374151;
    background: transparent;
    &::placeholder { color: #9ca3af; }
  }
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: ${p => p.$blue ? '#3b82f6' : '#9ca3af'};
  display: flex;
  align-items: center;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  &:hover { color: ${p => p.$blue ? '#2563eb' : '#6b7280'}; background: #f3f4f6; }
`;

const SEED_MESSAGES = [
  {
    id: 1,
    user: false,
    text: "To propose an event, you'll need a project charter, a detailed budget plan, and a risk assessment form. Would you like me to generate a template for you?"
  },
  {
    id: 2,
    user: true,
    text: 'What are the requirements for a new event proposal?'
  },
  {
    id: 3,
    user: false,
    text: "Hello! I'm your Nexus Assistant. How can I help you manage your organization today?"
  },
];

const makeSessionId = () => crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export default function AdminSearch() {
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [isNew,       setIsNew]       = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [leftSearch,  setLeftSearch]  = useState('');
  const [sessionId,   setSessionId]   = useState(() => makeSessionId());
  // eslint-disable-next-line no-unused-vars
  const [pastSessions, setPastSessions] = useState([]);
  const [session, setSession] = useState(() => new AIAssistantSession());
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'single'|'all', id?: string }
  const bodyRef = useRef(null);

  // Load most recent session on mount
  useEffect(() => {
    const loadChats = async () => {
      const sessions = await getSessionHistory(1);
      if (sessions.length > 0) {
        const lastSession = sessions[0];
        // Restore messages from the saved JSONB array
        const restored = (lastSession.messages || []).map((m, i) => ({
          id: i,
          user: m.role === 'user',
          text: m.parts?.[0]?.text || '',
          componentType: null,
          payload: null,
        })).filter(m => m.text);
        setMessages(restored.length > 0 ? restored : SEED_MESSAGES);
        setSessionId(lastSession.session_id); // resume last session
      } else {
        setMessages(SEED_MESSAGES);
      }
      // Also load session list for history panel
      const allSessions = await getSessionHistory(10);
      setPastSessions(allSessions);
      setLoading(false);
    };
    loadChats();
  }, []);
  
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendRef = useRef(null);

  const handleSend = async (overrideText) => {
    const textToUse = typeof overrideText === 'string' ? overrideText : input;
    const txt = textToUse.trim();
    if (!txt || loading) return;

    const userMsg = { id: Date.now(), user: true, text: txt };
    const aiMsgId = Date.now() + 1;

    setMessages(prev => [...prev, userMsg, {
      id: aiMsgId, user: false, text: '', responding: true
    }]);
    setInput('');
    setIsNew(false);
    setLoading(true);

    try {
      const responseObj = await session.sendMessage(txt);
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { 
          ...m, 
          text: responseObj.text, 
          componentType: responseObj.type, 
          payload: responseObj.payload, 
          responding: false 
        } : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { ...m, text: `⚠️ **Error**: ${err.message}`, responding: false } : m
      ));
    } finally {
      setLoading(false);
      const allSessions = await getSessionHistory(10);
      setPastSessions(allSessions);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setIsNew(true);
    const newId = makeSessionId();
    setSessionId(newId); // ✅ New session = new DB row
    setSession(new AIAssistantSession(newId)); // ✅ Fresh Gemini context
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    setDeleteConfirm({ type: 'single', id });
  };

  const executeDeleteSingle = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'single') return;
    const id = deleteConfirm.id;
    setDeleteConfirm(null);
    
    const success = await deleteSession(id);
    if (success) {
      if (sessionId === id) handleNewChat();
      const allSessions = await getSessionHistory(10);
      setPastSessions(allSessions);
    }
  };

  const handleClearAll = async () => {
    setDeleteConfirm({ type: 'all' });
  };

  const executeClearAll = async () => {
    setDeleteConfirm(null);
    
    const success = await deleteAllSessions();
    if (success) {
      handleNewChat();
      setPastSessions([]);
    }
  };

  
  handleSendRef.current = handleSend;

  return (
    <Page>
      <GlobalBlink />
      <LeftCol>
        {}
        <AgentCard>
          <AgentTopRow>
            <AgentIconBox><Bot size={20} color="#ffffff" /></AgentIconBox>
            <AgentTitle>OSAS Intelligent Agent</AgentTitle>
          </AgentTopRow>

          <AgentSearch>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search organization, events, users..."
              value={leftSearch}
              onChange={e => setLeftSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && leftSearch.trim()) {
                  setInput(leftSearch);
                  setLeftSearch('');
                  
                  handleSendRef.current(leftSearch.trim());
                }
              }}
            />
          </AgentSearch>

          <AgentDesc>
            This AI-powered virtual operations assistant digest state database on-demand.
            Ask context questions, audit portfolios, or verify handbook guidelines automatically
          </AgentDesc>
        </AgentCard>

        {}
        <HistoryCard>
          <HistoryTitle>
            <Clock size={14} /> History
          </HistoryTitle>

          <HistScroll>
            <HistSection>RECENT SESSIONS</HistSection>
            {pastSessions && pastSessions.length > 0 ? (
              pastSessions.map((session, i) => (
                <HistItem key={i} onClick={async () => {
                  // Load a past session when clicked
                  setSessionId(session.session_id);
                  const restored = (session.messages || []).map((m, j) => ({
                    id: j,
                    user: m.role === 'user',
                    text: m.parts?.[0]?.text || ''
                  })).filter(m => m.text);
                  setMessages(restored.length > 0 ? restored : []);
                  setIsNew(false);
                }}>
                  <span className="session-title">
                    {session.title?.length > 36 ? session.title.substring(0, 36) + '...' : (session.title || 'Untitled Session')}
                  </span>
                  <div className="delete-btn" onClick={(e) => handleDeleteSession(e, session.session_id)} title="Delete session">
                    <Trash2 size={12} />
                  </div>
                </HistItem>
              ))
            ) : (
              <div style={{fontSize:11,color:'#9ca3af',padding:'4px 4px'}}>No past sessions</div>
            )}
          </HistScroll>

          <div style={{ display: 'flex', gap: '8px' }}>
            <NewChatBtn onClick={handleNewChat} style={{ flex: 1 }}>
              <Plus size={14} /> New Chat
            </NewChatBtn>
            {pastSessions && pastSessions.length > 0 && (
              <NewChatBtn onClick={handleClearAll} style={{ flex: 1, color: '#dc2626' }} title="Clear All History">
                <Trash2 size={14} /> Clear All
              </NewChatBtn>
            )}
          </div>
        </HistoryCard>
      </LeftCol>

      {}
      <ChatPanel>
        <ChatBody ref={bodyRef}>
          {(messages.length === 0 || isNew) ? (
            <WelcomeCenter>
              <h1>{getGreeting()}, Admin</h1>
              <p>How Can I Assist You Today?</p>
            </WelcomeCenter>
          ) : (
            messages.map(msg => (
              <MsgRow key={msg.id} $user={msg.user}>
                <Avatar $user={msg.user}>
                  {msg.user ? <User size={14} /> : <Bot size={14} />}
                </Avatar>
                <BubbleWrapper $user={msg.user}>
                  <Bubble $user={msg.user}>
                    {msg.user ? (
                      <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                    ) : msg.responding ? (
                      <StatusIndicator>
                        <div className="dots">
                          <span /><span /><span />
                        </div>
                        Responding...
                      </StatusIndicator>
                    ) : (
                      <MdWrap>
                        <ReactMarkdown>{msg.text || ''}</ReactMarkdown>
                      </MdWrap>
                    )}
                  </Bubble>
                  {/* ── Custom UI Widgets ── */}
                  {msg.componentType === 'dashboard' && msg.payload && (
                    <WidgetContainer>
                      <StatGrid>
                        <StatBox $bg="#dcfce7" $color="#059669"><div className="icon-wrap"><Users size={16}/></div><div><div className="val">{msg.payload.totalUsers}</div><div className="lbl">Users</div></div></StatBox>
                        <StatBox $bg="#e0e7ff" $color="#4f46e5"><div className="icon-wrap"><Bot size={16}/></div><div><div className="val">{msg.payload.totalOrgs}</div><div className="lbl">Organizations</div></div></StatBox>
                        <StatBox $bg="#fef3c7" $color="#d97706"><div className="icon-wrap"><Clock size={16}/></div><div><div className="val">{msg.payload.pendingReview}</div><div className="lbl">Pending Events</div></div></StatBox>
                        <StatBox $bg="#fee2e2" $color="#dc2626"><div className="icon-wrap"><XCircle size={16}/></div><div><div className="val">{msg.payload.dueToday}</div><div className="lbl">Events Today</div></div></StatBox>
                      </StatGrid>
                    </WidgetContainer>
                  )}

                  {msg.componentType === 'events' && msg.payload && (
                    <WidgetContainer>
                      <EventCardList>
                        {msg.payload.slice(0, 5).map(ev => (
                          <EventMiniCard key={ev.id} $status={ev.status}>
                            <div className="info">
                              <div className="title">{ev.title}</div>
                              <div className="meta">
                                <span><Calendar size={10} style={{marginRight:3, marginBottom:-1}}/> {ev.event_date ? format(new Date(ev.event_date), 'MMM d, yyyy') : 'TBD'}</span>
                                <span><FileText size={10} style={{marginRight:3, marginBottom:-1}}/> {ev.organization?.acronym || 'ORG'}</span>
                              </div>
                            </div>
                            <div className="badge">{ev.status}</div>
                          </EventMiniCard>
                        ))}
                      </EventCardList>
                    </WidgetContainer>
                  )}

                  {msg.componentType === 'orgs' && msg.payload && (
                    <WidgetContainer>
                      <EventCardList>
                        {msg.payload.slice(0, 5).map(org => (
                          <EventMiniCard key={org.id}>
                            <div className="info">
                              <div className="title">{org.name} ({org.acronym})</div>
                              <div className="meta">
                                <span><Users size={10} style={{marginRight:3, marginBottom:-1}}/> {org.member_count ?? 0} Members</span>
                              </div>
                            </div>
                          </EventMiniCard>
                        ))}
                      </EventCardList>
                    </WidgetContainer>
                  )}

                  {msg.componentType === 'users' && msg.payload && (
                    <WidgetContainer>
                      <StatGrid>
                        <StatBox $bg="#dcfce7" $color="#059669">
                          <div className="icon-wrap"><CheckCircle2 size={16}/></div>
                          <div>
                            <div className="val">{msg.payload.filter(u => u.is_active).length}</div>
                            <div className="lbl">Active Users</div>
                          </div>
                        </StatBox>
                        <StatBox $bg="#fee2e2" $color="#dc2626">
                          <div className="icon-wrap"><XCircle size={16}/></div>
                          <div>
                            <div className="val">{msg.payload.filter(u => !u.is_active).length}</div>
                            <div className="lbl">Inactive</div>
                          </div>
                        </StatBox>
                      </StatGrid>
                    </WidgetContainer>
                  )}

                  {msg.componentType === 'compliance' && msg.payload && (
                    <WidgetContainer>
                      <EventCardList>
                        {msg.payload.slice(0, 5).map(c => (
                          <EventMiniCard key={c.id} $status={c.is_compliant ? 'approved' : 'rejected'}>
                            <div className="info">
                              <div className="title">{c.organization?.acronym || 'ORG'}</div>
                              <div className="meta">
                                <span><FileText size={10} style={{marginRight:3, marginBottom:-1}}/> {typeof c.requirement === 'string' ? c.requirement : c.requirement?.name}</span>
                                <span><Calendar size={10} style={{marginRight:3, marginBottom:-1}}/> Due: {c.deadline ? format(new Date(c.deadline), 'MMM d') : 'N/A'}</span>
                              </div>
                            </div>
                            <div className="badge">{c.is_compliant ? 'Compliant' : 'Missing'}</div>
                          </EventMiniCard>
                        ))}
                      </EventCardList>
                    </WidgetContainer>
                  )}

                  {msg.componentType === 'logs' && msg.payload && (
                    <WidgetContainer>
                      <LogList>
                        {msg.payload.slice(0, 5).map(l => (
                          <LogRow key={l.id}>
                            <div className="time">{format(new Date(l.created_at), 'HH:mm')}</div>
                            <div className="action">
                              <span className="user">{l.user?.full_name || l.performed_by || 'System'}</span> {l.action || l.description}
                            </div>
                          </LogRow>
                        ))}
                      </LogList>
                    </WidgetContainer>
                  )}
                  {msg.componentType === 'orgs' && (
                    <WidgetContainer>
                       <StatBox $bg="#f3e8ff" $color="#9333ea">
                          <div className="icon-wrap"><Users size={16}/></div>
                          <div>
                            <div className="val">{msg.payload.total}</div>
                            <div className="lbl">Registered Orgs</div>
                          </div>
                        </StatBox>
                    </WidgetContainer>
                  )}
                </BubbleWrapper>
              </MsgRow>
            ))
          )}
          {loading && (
            <MsgRow $user={false}>
              <Avatar $user={false}><Bot size={14} /></Avatar>
              <Bubble $user={false}>
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              </Bubble>
            </MsgRow>
          )}
        </ChatBody>

        <InputBar>
          <InputInner>
            <IconBtn><Paperclip size={18} /></IconBtn>
            <IconBtn $blue><Sparkles size={18} /></IconBtn>
            <input
              type="text"
              placeholder="Initiate a query or send a command to the AI..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleSend()}
              disabled={loading}
            />
            <IconBtn onClick={handleSend} disabled={loading}>
              <Send size={16} />
            </IconBtn>
          </InputInner>
        </InputBar>
      </ChatPanel>

      {deleteConfirm && (
        <ModalOverlay onClick={() => setDeleteConfirm(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <h3>{deleteConfirm.type === 'single' ? 'Delete Session' : 'Clear All History'}</h3>
            <p>
              {deleteConfirm.type === 'single' 
                ? 'Are you sure you want to delete this chat session? This action cannot be undone.' 
                : 'Are you sure you want to delete ALL chat history? This action cannot be undone.'}
            </p>
            <div className="btn-row">
              <button className="cancel-btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="danger-btn" onClick={deleteConfirm.type === 'single' ? executeDeleteSingle : executeClearAll}>
                Delete
              </button>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </Page>
  );
}
