import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '../../config/supabase';
import { Mail, Trash2, Eye, EyeOff, CheckCircle, AlertTriangle, Search, User, BookOpen, Hash, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const GREEN = '#03632B';

const Page = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  h1 { font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 4px; display: flex; align-items: center; gap: 10px; }
  p { font-size: 14px; color: #6b7280; margin: 0; }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  max-width: 360px;
  input {
    width: 100%;
    padding: 10px 14px 10px 38px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    background: white;
    box-sizing: border-box;
    &:focus { border-color: ${GREEN}; box-shadow: 0 0 0 2px rgba(3,99,43,0.1); }
  }
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }
`;

const FilterBtn = styled.button`
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px solid ${p => p.$active ? GREEN : '#e5e7eb'};
  background: ${p => p.$active ? '#e8f5ee' : 'white'};
  color: ${p => p.$active ? GREEN : '#374151'};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  &:hover { border-color: ${GREEN}; background: #f0faf4; }
`;

const StatsBar = styled.div`
  display: flex;
  gap: 16px;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
`;

const StatNum = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: ${p => p.$color || '#111827'};
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;

const MessageRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  background: ${p => p.$unread ? '#f0fdf4' : 'white'};
  cursor: pointer;
  transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: #f9fafb; }
`;

const AvatarCircle = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 21px;
  background: ${p => p.$unread ? GREEN : '#e5e7eb'};
  color: ${p => p.$unread ? 'white' : '#6b7280'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
`;

const MsgMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const MsgName = styled.div`
  font-weight: ${p => p.$unread ? 700 : 600};
  font-size: 15px;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UnreadDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${GREEN};
  flex-shrink: 0;
`;

const MsgInfo = styled.div`
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  gap: 10px;
  margin-top: 2px;
  flex-wrap: wrap;
  align-items: center;
`;

const MsgPreview = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-top: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MsgActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  margin-top: 2px;
`;

const ActionBtn = styled.button`
  border: 1px solid ${p => p.$danger ? '#fca5a5' : '#e5e7eb'};
  background: ${p => p.$danger ? '#fee2e2' : '#f9fafb'};
  color: ${p => p.$danger ? '#dc2626' : '#374151'};
  border-radius: 7px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover { opacity: 0.8; }
`;

const Badge = styled.span`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: ${p =>
    p.$status === 'unread' ? '#fef3c7' :
    p.$status === 'read' ? '#dbeafe' :
    '#d1fae5'};
  color: ${p =>
    p.$status === 'unread' ? '#92400e' :
    p.$status === 'read' ? '#1d4ed8' :
    '#065f46'};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
`;

// Modal
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHead = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${GREEN};
  border-radius: 16px 16px 0 0;
  h2 { margin: 0; font-size: 18px; font-weight: 800; color: white; }
`;

const ModalBody = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 14px;
  color: #374151;
  svg { flex-shrink: 0; margin-top: 2px; color: ${GREEN}; }
  strong { font-weight: 700; color: #111827; margin-right: 4px; }
`;

const MessageBox = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  font-size: 14px;
  color: #374151;
  line-height: 1.7;
  white-space: pre-wrap;
`;

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read', 'resolved'
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    setMessages(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpen = async (msg) => {
    setSelected(msg);
    if (msg.status === 'unread') {
      await supabase.from('contact_messages').update({ status: 'read' }).eq('id', msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
    }
  };

  const handleResolve = async (msg, e) => {
    e.stopPropagation();
    await supabase.from('contact_messages').update({ status: 'resolved' }).eq('id', msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'resolved' } : m));
  };

  const handleDelete = async (id) => {
    await supabase.from('contact_messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    setConfirmDelete(null);
    if (selected?.id === id) setSelected(null);
  };

  const filtered = messages.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.message?.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || m.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: messages.length,
    unread: messages.filter(m => m.status === 'unread').length,
    read: messages.filter(m => m.status === 'read').length,
    resolved: messages.filter(m => m.status === 'resolved').length,
  };

  return (
    <Page>
      <PageHeader>
        <div>
          <h1><Mail size={26} color={GREEN} /> Contact Messages</h1>
          <p>Inquiries submitted by students from the public OSAS website.</p>
        </div>
      </PageHeader>

      {/* Stats */}
      <StatsBar>
        {[
          { label: 'Total', key: 'all', color: '#111827', icon: Mail },
          { label: 'Unread', key: 'unread', color: '#d97706', icon: EyeOff },
          { label: 'Read', key: 'read', color: '#2563eb', icon: Eye },
          { label: 'Resolved', key: 'resolved', color: GREEN, icon: CheckCircle },
        ].map(({ label, key, color, icon: Icon }) => (
          <StatCard key={key}>
            <div style={{ background: `${color}15`, padding: 10, borderRadius: 10 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <StatNum $color={color}>{counts[key]}</StatNum>
              <StatLabel>{label}</StatLabel>
            </div>
          </StatCard>
        ))}
      </StatsBar>

      {/* Toolbar */}
      <Toolbar>
        <SearchBox>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, email, or message..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchBox>
        {['all', 'unread', 'read', 'resolved'].map(f => (
          <FilterBtn key={f} $active={filter === f} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {counts[f] > 0 && `(${counts[f]})`}
          </FilterBtn>
        ))}
      </Toolbar>

      {/* List */}
      <MessageList>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <EmptyState>
            <Mail size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <h3 style={{ margin: '0 0 8px', color: '#374151' }}>No messages found</h3>
            <p style={{ margin: 0, fontSize: 14 }}>
              {filter !== 'all' ? `No ${filter} messages.` : 'No contact messages from the website yet.'}
            </p>
          </EmptyState>
        ) : (
          filtered.map(msg => {
            const unread = msg.status === 'unread';
            const initial = (msg.first_name || 'U')[0].toUpperCase();
            return (
              <MessageRow key={msg.id} $unread={unread} onClick={() => handleOpen(msg)}>
                <AvatarCircle $unread={unread}>{initial}</AvatarCircle>
                <MsgMeta>
                  <MsgName $unread={unread}>
                    {unread && <UnreadDot />}
                    {msg.first_name} {msg.last_name}
                    <Badge $status={msg.status}>{msg.status}</Badge>
                  </MsgName>
                  <MsgInfo>
                    <span>{msg.email}</span>
                    {msg.student_id && <><span>·</span><span>ID: {msg.student_id}</span></>}
                    {msg.course && <><span>·</span><span>{msg.course}</span></>}
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                  </MsgInfo>
                  <MsgPreview>{msg.message}</MsgPreview>
                </MsgMeta>
                <MsgActions onClick={e => e.stopPropagation()}>
                  {msg.status !== 'resolved' && (
                    <ActionBtn onClick={(e) => handleResolve(msg, e)}>
                      <CheckCircle size={13} /> Resolve
                    </ActionBtn>
                  )}
                  <ActionBtn $danger onClick={(e) => { e.stopPropagation(); setConfirmDelete(msg); }}>
                    <Trash2 size={13} /> Delete
                  </ActionBtn>
                </MsgActions>
              </MessageRow>
            );
          })
        )}
      </MessageList>

      {/* Detail Modal */}
      {selected && (
        <Overlay onClick={() => setSelected(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <h2>Message from {selected.first_name} {selected.last_name}</h2>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </ModalHead>
            <ModalBody>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Badge $status={selected.status} style={{ fontSize: 12, padding: '4px 12px' }}>{selected.status}</Badge>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>
                  Received {format(new Date(selected.created_at), 'MMMM d, yyyy — h:mm a')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <InfoRow>
                  <User size={16} />
                  <div><strong>Name:</strong>{selected.first_name} {selected.last_name}</div>
                </InfoRow>
                <InfoRow>
                  <Mail size={16} />
                  <div><strong>Email:</strong>{selected.email}</div>
                </InfoRow>
                {selected.student_id && (
                  <InfoRow>
                    <Hash size={16} />
                    <div><strong>Student ID:</strong>{selected.student_id}</div>
                  </InfoRow>
                )}
                {selected.course && (
                  <InfoRow>
                    <BookOpen size={16} />
                    <div><strong>Course:</strong>{selected.course}</div>
                  </InfoRow>
                )}
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Message</div>
                <MessageBox>{selected.message}</MessageBox>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                {selected.status !== 'resolved' && (
                  <button
                    onClick={(e) => { handleResolve(selected, e); setSelected(prev => ({ ...prev, status: 'resolved' })); }}
                    style={{ padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', background: GREEN, color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <CheckCircle size={16} /> Mark as Resolved
                  </button>
                )}
                <button
                  onClick={() => { setConfirmDelete(selected); setSelected(null); }}
                  style={{ padding: '10px 20px', border: '1px solid #fca5a5', borderRadius: 8, cursor: 'pointer', background: '#fee2e2', color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </ModalBody>
          </Modal>
        </Overlay>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <Overlay onClick={() => setConfirmDelete(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 380, width: '90%', textAlign: 'center' }}>
            <div style={{ background: '#fee2e2', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} color="#dc2626" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Delete Message?</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              The message from <strong>{confirmDelete.first_name} {confirmDelete.last_name}</strong> will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 700 }}
              >
                Delete
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </Page>
  );
}
