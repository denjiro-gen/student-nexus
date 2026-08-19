import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { adminAPI } from '../../services/api';
import { supabase } from '../../config/supabase';
import { MessageSquare, Send, Search, X, Trash2, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const GREEN = '#03632B';

const Page = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  margin-bottom: 24px;
  flex-shrink: 0;
  h1 { font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 8px; display: flex; align-items: center; gap: 10px; }
  p { font-size: 14px; color: #6b7280; margin: 0; }
`;

const ChatContainer = styled.div`
  display: flex;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  flex: 1;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;

const Sidebar = styled.div`
  width: 320px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
`;

const SearchBox = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
  
  input {
    width: 100%;
    padding: 10px 10px 10px 36px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 13px;
    outline: none;
    &:focus { border-color: ${GREEN}; box-shadow: 0 0 0 2px rgba(3,99,43,0.1); }
  }
  
  svg {
    position: absolute;
    left: 26px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }
`;

const ConvoList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConvoItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  background: ${p => p.$active ? '#e8f5ee' : 'transparent'};
  border-left: 3px solid ${p => p.$active ? GREEN : 'transparent'};
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: ${p => p.$active ? '#e8f5ee' : '#f3f4f6'};
  }

  &:hover .delete-btn {
    opacity: 1;
  }
`;

const DeleteBtn = styled.button`
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  background: #fee2e2;
  border: none;
  border-radius: 6px;
  padding: 4px 7px;
  color: #dc2626;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;

  &:hover { background: #fca5a5; }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: ${GREEN};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
`;

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
`;

const ChatHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
`;

const DeleteConvoBtn = styled.button`
  margin-left: auto;
  background: #fee2e2;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  color: #dc2626;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s;

  &:hover { background: #fca5a5; }
`;

const MessagesArea = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fafafa;
`;

const BubbleWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${p => p.$isMe ? 'flex-end' : 'flex-start'};
`;

const Bubble = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${p => p.$isMe ? GREEN : '#ffffff'};
  color: ${p => p.$isMe ? '#ffffff' : '#111827'};
  border: ${p => p.$isMe ? 'none' : '1px solid #e5e7eb'};
  border-bottom-right-radius: ${p => p.$isMe ? '4px' : '16px'};
  border-bottom-left-radius: ${p => p.$isMe ? '16px' : '4px'};
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
`;

const Time = styled.span`
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
  margin-left: 4px;
  margin-right: 4px;
`;

const InputArea = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  align-items: flex-end;
  gap: 12px;

  textarea {
    flex: 1;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    padding: 12px;
    font-size: 14px;
    outline: none;
    resize: none;
    min-height: 20px;
    max-height: 120px;
    font-family: inherit;
    
    &:focus { border-color: ${GREEN}; box-shadow: 0 0 0 2px rgba(3,99,43,0.1); }
  }

  button {
    width: 44px;
    height: 44px;
    border-radius: 22px;
    background: ${GREEN};
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;

    &:hover { background: #024d21; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
`;

const NewChatModal = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background: white;
  width: 400px;
  max-width: 90%;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
`;

const ConfirmModal = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`;

export default function AdminMessages() {
  const [adminId, setAdminId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [activePartner, setActivePartner] = useState(null);
  const [threadMsgs, setThreadMsgs] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // { partner, fromList }

  const messagesEndRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { init(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMsgs]);

  useEffect(() => {
    if (!adminId) return;
    const sub = supabase
      .channel('admin_messages_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${adminId}` },
        (payload) => {
          loadConversations(adminId);
          if (activePartner && payload.new.sender_id === activePartner.id) {
            loadThread(activePartner);
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(sub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId, activePartner]);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setAdminId(user.id);
      const { data: uData } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle();
      if (!uData) {
        await supabase.from('users').insert({ id: user.id, email: user.email, full_name: 'Workspace Admin', role: 'osas_admin', password_hash: 'managed' });
      }
      loadConversations(user.id);
    }
  };

  const loadConversations = async (aid) => {
    const idToUse = aid || adminId;
    if (!idToUse) return;
    setLoading(true);
    const { data } = await adminAPI.getAdminConversations(idToUse);
    if (data) {
      const seen = new Map();
      data.forEach(m => {
        const pid = m.sender_id === (aid || adminId) ? m.recipient_id : m.sender_id;
        const ex = seen.get(pid);
        if (!ex || new Date(m.created_at) > new Date(ex.created_at)) seen.set(pid, m);
      });
      setMessages(Array.from(seen.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
    setLoading(false);
  };

  const loadThread = async (partner) => {
    if (!adminId) return;
    setActivePartner(partner);
    const { data } = await adminAPI.getThread(adminId, partner.id);
    setThreadMsgs(data || []);
    adminAPI.markThreadAsRead(adminId, partner.id);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !activePartner || sending || !adminId) return;
    setSending(true);
    const { data, error } = await adminAPI.sendMessage(adminId, activePartner.id, inputText.trim());
    if (error) { alert("Failed to send message: " + error.message); }
    if (!error && data) {
      setThreadMsgs([...threadMsgs, { ...data, sender_id: adminId }]);
      setInputText('');
      loadConversations(adminId);
    }
    setSending(false);
  };

  const handleDeleteConversation = async (partner) => {
    if (!adminId || !partner) return;
    const { error } = await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${adminId},recipient_id.eq.${partner.id}),and(sender_id.eq.${partner.id},recipient_id.eq.${adminId})`);
    
    if (!error) {
      setActivePartner(null);
      setThreadMsgs([]);
      setConfirmDelete(null);
      loadConversations(adminId);
    } else {
      alert('Failed to delete conversation: ' + error.message);
    }
  };

  const handleNewChat = async () => {
    setShowNewChat(true);
    const { data } = await supabase.from('users').select('*').neq('role', 'osas_admin');
    if (data) setContacts(data);
  };

  const startNewChat = (contact) => {
    setShowNewChat(false);
    loadThread(contact);
  };

  const filtered = messages.filter(m => {
    const p = m.sender_id === adminId ? m.recipient : m.sender;
    return !search.trim() || (p?.full_name || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Page>
      <Header>
        <h1><MessageSquare size={28} color={GREEN} /> Messages</h1>
        <p>Communicate with student leaders regarding event proposals and organization matters.</p>
      </Header>

      <ChatContainer>
        <Sidebar>
          <SearchBox>
            <Search size={16} />
            <input type="text" placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} />
          </SearchBox>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <button 
              onClick={handleNewChat}
              style={{ width: '100%', padding: '8px', background: GREEN, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <MessageSquare size={16} /> New Message
            </button>
          </div>
          <ConvoList>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No conversations found.</div>
            ) : (
              filtered.map(item => {
                const partner = item.sender_id === adminId ? item.recipient : item.sender;
                const unread = !item.read && item.recipient_id === adminId;
                return (
                  <ConvoItem 
                    key={item.id} 
                    $active={activePartner?.id === partner.id}
                    onClick={() => loadThread(partner)}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingRight: '60px' }}>
                      <Avatar style={{ background: unread ? GREEN : '#e5e7eb', color: unread ? 'white' : '#6b7280' }}>
                        {(partner?.full_name || 'U')[0].toUpperCase()}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <div style={{ fontWeight: unread ? 700 : 500, color: '#111827', fontSize: 14 }}>
                            {partner?.full_name || 'User'}
                          </div>
                          <div style={{ fontSize: 11, color: unread ? GREEN : '#6b7280', fontWeight: unread ? 600 : 400 }}>
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.sender_id === adminId ? 'You: ' : ''}{item.body}
                        </div>
                      </div>
                    </div>
                    <DeleteBtn
                      className="delete-btn"
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete({ partner, fromList: true }); }}
                    >
                      <Trash2 size={12} /> Delete
                    </DeleteBtn>
                  </ConvoItem>
                );
              })
            )}
          </ConvoList>
        </Sidebar>

        <MainArea>
          {activePartner ? (
            <>
              <ChatHeader>
                <Avatar>{(activePartner.full_name || 'U')[0].toUpperCase()}</Avatar>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{activePartner.full_name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{activePartner.email}</div>
                </div>
                <DeleteConvoBtn onClick={() => setConfirmDelete({ partner: activePartner })}>
                  <Trash2 size={14} /> Delete Conversation
                </DeleteConvoBtn>
              </ChatHeader>
              <MessagesArea>
                {threadMsgs.map(msg => {
                  const isMe = msg.sender_id === adminId;
                  return (
                    <BubbleWrap key={msg.id} $isMe={isMe}>
                      <Bubble $isMe={isMe}>{msg.body}</Bubble>
                      <Time>{format(new Date(msg.created_at), 'MMM d, h:mm a')}</Time>
                    </BubbleWrap>
                  );
                })}
                <div ref={messagesEndRef} />
              </MessagesArea>
              <InputArea>
                <textarea 
                  placeholder="Type your message..." 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                />
                <button disabled={!inputText.trim() || sending} onClick={handleSend}>
                  <Send size={18} />
                </button>
              </InputArea>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
              <MessageSquare size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h3 style={{ margin: 0, color: '#374151' }}>No Conversation Selected</h3>
              <p style={{ marginTop: 8, fontSize: 14 }}>Select a conversation from the sidebar or start a new one.</p>
            </div>
          )}
        </MainArea>
      </ChatContainer>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatModal onClick={() => setShowNewChat(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>New Message</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowNewChat(false)} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
              {contacts.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>No users found.</div>
              ) : (
                contacts.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => startNewChat(c)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                  >
                    <Avatar style={{ width: 36, height: 36, fontSize: 14 }}>{c.full_name[0].toUpperCase()}</Avatar>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{c.full_name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{c.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ModalContent>
        </NewChatModal>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <ConfirmModal onClick={() => setConfirmDelete(null)}>
          <div 
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 380, width: '90%', textAlign: 'center' }}
          >
            <div style={{ background: '#fee2e2', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} color="#dc2626" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#111827' }}>Delete Conversation?</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              All messages with <strong>{confirmDelete.partner?.full_name}</strong> will be permanently deleted. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600, fontSize: 14 }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteConversation(confirmDelete.partner)}
                style={{ flex: 1, padding: '10px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 600, fontSize: 14 }}
              >
                Delete
              </button>
            </div>
          </div>
        </ConfirmModal>
      )}
    </Page>
  );
}
