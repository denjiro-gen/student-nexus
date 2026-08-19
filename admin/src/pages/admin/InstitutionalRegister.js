import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Search, ShieldCheck, FileText, CheckCircle2, 
  XCircle, CalendarDays, Target, MapPin,
  ChevronLeft, ChevronRight, AlertCircle, Loader2, MessageSquare, Trash2
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { supabase } from '../../config/supabase';
import { auditTrail } from '../../config/security';
import {
  format, formatDistanceToNow, getDaysInMonth,
  startOfMonth, getDay, addMonths, subMonths,
  isSameDay, parseISO
} from 'date-fns';

const GREEN = '#03632B';

const Page = styled.div`
  display: grid;
  grid-template-columns: 355px 1fr;
  height: calc(100vh - 114px);
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 40px;
  gap: 12px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(17, 24, 39, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 16px;
  width: 440px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 12px;
  h3 { margin: 0; font-size: 18px; font-weight: 800; color: #111827; }
`;

const ModalBody = styled.div`
  padding: 24px;
  p { margin: 0 0 16px; font-size: 14px; color: #4b5563; line-height: 1.5; }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  &:focus { border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(3, 99, 43, 0.1); }
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ModalBtn = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  &.cancel { background: #ffffff; color: #374151; border: 1px solid #d1d5db; &:hover { background: #f3f4f6; } }
  &.confirm { background: ${p => p.$color || GREEN}; color: #ffffff; &:hover { filter: brightness(0.9); } }
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  overflow: hidden;
  background: #ffffff;
`;

const PanelTitle = styled.div`
  padding: 18px 18px 0;
  font-size: 11.5px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: #111827;
  margin-bottom: 12px;
`;

const TabsWrap = styled.div`
  display: flex;
  gap: 4px;
  padding: 0 14px 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const Tab = styled.button`
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  background: ${p => p.$a ? GREEN : '#f3f4f6'};
  color: ${p => p.$a ? '#ffffff' : '#6b7280'};
  &:hover { background: ${p => p.$a ? '#024d21' : '#e5e7eb'}; }
`;

const SearchWrap = styled.div`
  position: relative;
  margin: 10px 14px;
  input {
    width: 100%;
    padding: 9px 12px 9px 34px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 12px;
    outline: none;
    box-sizing: border-box;
    &:focus { border-color: ${GREEN}; }
    &::placeholder { color: #9ca3af; }
  }
  svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
`;

const EventList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 10px;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
`;

const EventCard = styled.div`
  padding: 12px;
  margin-bottom: 6px;
  border-radius: 10px;
  border: 1px solid ${p => p.$sel ? '#a7f3d0' : '#e5e7eb'};
  background: ${p => p.$sel ? '#f0fdf4' : '#ffffff'};
  cursor: pointer;
  transition: all 0.12s;
  &:hover { border-color: #a7f3d0; background: #f9fafb; }
`;

const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 3px;
`;

const CardTitle = styled.div`
  font-size: 14px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 4px;
`;

const CardDesc = styled.div`
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VenueTag = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #9ca3af;
`;

const StatusPill = styled.span`
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  background: ${p => {
    if (p.$s === 'approved') return '#d1fae5';
    if (p.$s === 'pending')  return '#fef3c7';
    if (p.$s === 'rejected') return '#fee2e2';
    return '#f3f4f6';
  }};
  color: ${p => {
    if (p.$s === 'approved') return '#059669';
    if (p.$s === 'pending')  return '#d97706';
    if (p.$s === 'rejected') return '#dc2626';
    return '#6b7280';
  }};
  text-transform: capitalize;
`;

const DeleteBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px; height: 24px;
  border-radius: 6px;
  border: 1px solid #fee2e2;
  background: #fff5f5;
  color: #ef4444;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 6px;
  transition: all 0.15s;
  &:hover { background: #fee2e2; border-color: #ef4444; }
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: #ffffff;
`;

const RightScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px 90px;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const EventTitleBlock = styled.div`
  h1 { font-size: 26px; font-weight: 900; color: #111827; letter-spacing: -0.4px; margin-bottom: 5px; }
  .proposed { font-size: 13px; color: #6b7280; font-weight: 400; span { color: #111827; font-weight: 700; } }
`;

const StatusLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  white-space: nowrap;
`;

const TwoCols = styled.div`
  display: grid;
  grid-template-columns: 1fr 296px;
  gap: 20px;
`;

const LeftCol = styled.div``;

const SectionH = styled.h3`
  font-size: 14px;
  font-weight: 800;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const ObjectivesBox = styled.div`
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 18px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.62;
  margin-bottom: 18px;
`;

const InfoCards = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const InfoCard = styled.div`
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
  background: #fafafa;
  .lbl { font-size: 11px; color: #9ca3af; display: flex; align-items: center; gap: 5px; margin-bottom: 8px; }
  .val { font-size: 14px; font-weight: 700; color: #111827; line-height: 1.4; }
`;

const DocsTitle = styled.h3`
  font-size: 14px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 10px;
`;

const DocRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  margin-bottom: 8px;
  background: #ffffff;
  transition: background 0.12s;
  &:hover { background: #f9fafb; }
  .icon { width: 36px; height: 36px; border-radius: 8px; background: ${p => p.$pdf ? '#fef2f2' : '#eff6ff'}; color: ${p => p.$pdf ? '#ef4444' : '#3b82f6'}; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; }
  .info { flex: 1; }
  .name { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px; }
  .meta { font-size: 11px; color: #9ca3af; }
  .view { font-size: 12px; font-weight: 700; color: ${GREEN}; cursor: pointer; }
`;

const CalBox = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px 16px 14px;
`;

const CalHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  h4 { font-size: 13px; font-weight: 800; color: #111827; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
  .navs { display: flex; gap: 4px; }
  button { background: none; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; padding: 2px 5px; color: #6b7280; display: flex; align-items: center; &:hover { background: #f3f4f6; } }
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  text-align: center;
`;

const DayName = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  padding: 3px 0 7px;
`;

const DayCell = styled.div`
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.12s;
  font-weight: ${p => (p.$today || p.$ev) ? '700' : '400'};
  color: ${p => {
    if (p.$today) return '#ffffff';
    if (p.$ev)    return '#dc2626';
    if (p.$hi)    return '#b45309';
    if (p.$circ)  return '#374151';
    if (p.$muted) return '#d1d5db';
    return '#374151';
  }};
  background: ${p => p.$today ? GREEN : 'transparent'};
  border: ${p => {
    if (p.$today) return 'none';
    if (p.$ev)    return '2px solid #ef4444';
    if (p.$hi)    return '2px solid #fbbf24';
    if (p.$circ)  return '2px solid #9ca3af';
    return 'none';
  }};
  &:hover { background: ${p => p.$today ? '#024d21' : '#f0f0f0'}; }
`;

const SchedSection = styled.div`
  margin-top: 12px;
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
  .title { font-size: 11px; color: #6b7280; font-weight: 500; margin-bottom: 8px; }
`;

const SchedRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  .left { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; color: #111827; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: ${p => p.$c}; }
  .date { font-size: 11px; color: #9ca3af; }
`;

const ActionBar = styled.div`
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  padding: 14px 28px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const ActBtn = styled.button`
  padding: 10px 28px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.85; }
`;

const TABS = ['All', 'Pending', 'Approved', 'Revision Requested'];

function matchFilter(filter, status) {
  if (filter === 'All')                 return true;
  if (filter === 'Pending')             return status === 'pending';
  if (filter === 'Approved')            return status === 'approved';
  if (filter === 'Revision Requested')  return status === 'rejected';
  return true;
}

function buildCells(calMonth, selectedDate) {
  const dim   = getDaysInMonth(calMonth);
  const start = getDay(startOfMonth(calMonth));
  const cells = [];
  const today = new Date();

  for (let i = 0; i < start; i++) cells.push({ muted: true });

  for (let d = 1; d <= dim; d++) {
    const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), d);
    cells.push({
      day:   d,
      today: isSameDay(date, today),
      ev:    selectedDate ? isSameDay(date, selectedDate) : false,
      hi:    d === 13,
      circ:  d === 28,
    });
  }
  return cells;
}

export default function InstitutionalRegister() {
  const [events,   setEvents]   = useState([]);
  const [filter,   setFilter]   = useState('All');
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  const [docVerified, setDocVerified] = useState(null);
  const [docError,    setDocError]    = useState(null);
  const [attachments, setAttachments] = useState([]);

  const [calMonth, setCalMonth] = useState(startOfMonth(new Date()));

  const [decisionModal, setDecisionModal] = useState({ open: false, type: '', title: '' });
  const [decisionNotes, setDecisionNotes] = useState('');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, event: null });
  const [deleting,    setDeleting]    = useState(false);

  useEffect(() => {
    load();
    const channel = supabase.channel('realtime_event_proposals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_proposals' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function load() {
    const { data } = await adminAPI.getEventProposals();
    if (data && data.length > 0) {
      setEvents(data);
      setSelected(prev => {
        if (!prev) return data[0];
        const fresh = data.find(e => e.id === prev.id);
        return fresh || data[0];
      });
    }
  }

  useEffect(() => {
    setDocVerified(null);
    setDocError(null);
    setAttachments([]);
    if (selected?.id) {
      supabase
        .from('event_attachments')
        .select('*')
        .eq('event_id', selected.id)
        .order('uploaded_at', { ascending: false })
        .then(({ data }) => { if (data && data.length > 0) setAttachments(data); });
    }
  }, [selected?.id]);

  async function handleVerifyDocument() {
    if (!selected || !selected.file_url) return;
    setDocVerified('verifying');
    setDocError(null);
    const { verified, error } = await adminAPI.verifyDocumentHash(selected.id, selected.file_url);
    if (error) { setDocError(error); setDocVerified(false); }
    else setDocVerified(verified);
  }

  function promptDecision(status) {
    if (!selected) return;
    setDecisionModal({ open: true, type: status, title: selected.title, error: '' });
    setDecisionNotes('');
  }

  async function submitDecision() {
    const status = decisionModal.type;
    const notes  = decisionNotes.trim() || null;

    if ((status === 'rejected' || status === 'cancelled' || status === 'revision') && !notes) {
      setDecisionModal(prev => ({ ...prev, error: 'Remarks are required for this action.' }));
      return;
    }

    setDecisionModal({ open: false, type: '', title: '', error: '' });

    const { error } = await adminAPI.updateEventStatus(selected.id, status, notes);
    if (!error) {
      setEvents(prev => prev.map(e => e.id === selected.id ? { ...e, status, review_notes: notes } : e));
      setSelected(prev => ({ ...prev, status, review_notes: notes }));
      auditTrail.log('UPDATE_EVENT_STATUS', 'event_proposal', selected.id, { status: selected.status }, { status, review_notes: notes });

      if (selected.submitted_by) {
        let msg = `Your event proposal "${selected.title}" has been ${status}.`;
        if (notes) msg += ` Remarks: ${notes}`;
        await adminAPI.sendNotification(selected.submitted_by, `Event Proposal ${status.toUpperCase()}`, msg, 'event_approval');
      }
    } else {
      alert('Failed to update status.');
    }
  }

  function openDeleteModal(e, ev) {
    e.stopPropagation();
    setDeleteModal({ open: true, event: ev });
  }

  async function confirmDelete() {
    if (!deleteModal.event) return;
    setDeleting(true);
    const { error } = await adminAPI.deleteEventProposal(deleteModal.event.id);
    setDeleting(false);
    if (!error) {
      const remaining = events.filter(e => e.id !== deleteModal.event.id);
      setEvents(remaining);
      if (selected?.id === deleteModal.event.id) {
        setSelected(remaining.length > 0 ? remaining[0] : null);
      }
    } else {
      alert('Failed to delete event.');
    }
    setDeleteModal({ open: false, event: null });
  }

  const filtered = events.filter(e =>
    matchFilter(filter, e.status) &&
    (!search || e.title.toLowerCase().includes(search.toLowerCase()) ||
     (e.venue || '').toLowerCase().includes(search.toLowerCase()))
  );

  const eventDate = selected?.event_date ? parseISO(selected.event_date) : null;
  const cells     = buildCells(calMonth, eventDate);

  const scheduledEvents = [
    { color: '#ef4444', label: selected?.title || '—',  date: eventDate ? format(eventDate, 'MM/dd/yy') : '—' },
    { color: GREEN,     label: 'General Assembly FH',    date: '06/28/26' },
    { color: '#f59e0b', label: 'Chess Championship',     date: '06/13/26' },
  ];

  return (
    <Page>

      {/* Left */}
      <LeftPanel>
        <PanelTitle>Institutional Booking Register</PanelTitle>

        <TabsWrap>
          {TABS.map(t => (
            <Tab key={t} $a={filter === t} onClick={() => setFilter(t)}>{t}</Tab>
          ))}
        </TabsWrap>

        <SearchWrap>
          <Search size={13} />
          <input
            type="text"
            placeholder="Filter by title, acronym, or venue"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchWrap>

        <EventList>
          {filtered.map(ev => (
            <EventCard
              key={ev.id}
              $sel={selected?.id === ev.id}
              onClick={() => setSelected(ev)}
            >
              <CardMeta>
                <span>{ev.organization?.name || 'Unknown'}</span>
                <span>{formatDistanceToNow(new Date(ev.created_at))} ago</span>
              </CardMeta>
              <CardTitle>{ev.title}</CardTitle>
              <CardDesc>{ev.description}</CardDesc>
              <CardFoot>
                <VenueTag><MapPin size={11}/>{ev.venue || '—'}</VenueTag>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <StatusPill $s={ev.status}>{ev.status}</StatusPill>
                  {(ev.status === 'completed' || ev.status === 'approved') && (
                    <DeleteBtn title="Delete event" onClick={e => openDeleteModal(e, ev)}>
                      <Trash2 size={11} />
                    </DeleteBtn>
                  )}
                </div>
              </CardFoot>
            </EventCard>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
              No events found.
            </div>
          )}
        </EventList>
      </LeftPanel>

      {/* Right */}
      <RightPanel>
        {selected ? (
          <>
            <RightScroll>
              <TitleRow>
                <EventTitleBlock>
                  <h1>{selected.title}</h1>
                  <div className="proposed">
                    Proposed by: <span>{selected.submitter?.full_name || selected.organization?.name || '—'}</span>
                    {selected.submitter?.email && <span style={{color:'#9ca3af',fontWeight:400,marginLeft:8}}>{selected.submitter.email}</span>}
                  </div>
                </EventTitleBlock>
                <StatusLabel>Status: Administrative Review</StatusLabel>
              </TitleRow>

              <TwoCols>
                <LeftCol>
                  <SectionH>
                    <Target size={18} color="#111827" style={{ marginRight: 6 }} /> Event Objectives
                  </SectionH>
                  <ObjectivesBox>{selected.description}</ObjectivesBox>

                  <InfoCards>
                    <InfoCard>
                      <div className="lbl"><MapPin size={12}/>Venue</div>
                      <div className="val">{selected.venue || '—'}</div>
                    </InfoCard>
                    <InfoCard>
                      <div className="lbl"><CalendarDays size={12}/>Date &amp; Time</div>
                      <div className="val">
                        {eventDate
                          ? `${format(eventDate, 'MMM d')} • ${selected.event_time_start || '09:00'} - ${selected.event_time_end || '18:00'}`
                          : '—'}
                      </div>
                    </InfoCard>
                    <InfoCard>
                      <div className="lbl"><Target size={12}/>Est. Budget</div>
                      <div className="val">{selected.budget_amount ? `PHP ${Number(selected.budget_amount).toLocaleString()}` : '—'}</div>
                    </InfoCard>
                    <InfoCard>
                      <div className="lbl"><CalendarDays size={12}/>Expected Attendees</div>
                      <div className="val">{selected.expected_attendees ? `${selected.expected_attendees} pax` : '—'}</div>
                    </InfoCard>
                  </InfoCards>

                  <DocsTitle>Supporting Documents</DocsTitle>

                  {(selected.file_url || attachments.length > 0) ? (
                    <>
                      {selected.file_url && (
                        <DocRow>
                          <div className="icon"><FileText size={17}/></div>
                          <div className="info">
                            <div className="name">{selected.file_name || 'Event_Attachment.pdf'}</div>
                            <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                              {docVerified === 'verifying' && <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Verifying Hash...</span>}
                              {docVerified === true  && <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={12}/> Integrity Verified (SHA-256 Match)</span>}
                              {docVerified === false && <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12}/> {docError || 'Hash Mismatch - Tampered'}</span>}
                              {docVerified === null  && <span style={{ color: '#9ca3af' }}>Attached File</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {docVerified === null && (
                              <div className="view" onClick={handleVerifyDocument} style={{ color: '#03632B', border: '1px solid #03632B', cursor: 'pointer', padding: '2px 8px', borderRadius: 4 }}>
                                Verify
                              </div>
                            )}
                            <div className="view" onClick={() => window.open(selected.file_url, '_blank')} style={{ cursor: 'pointer' }}>View</div>
                          </div>
                          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                        </DocRow>
                      )}
                      {attachments.filter(a => a.file_url !== selected.file_url).map(att => (
                        <DocRow key={att.id}>
                          <div className="icon" style={{ background: att.category === 'post_event' ? '#fef3c7' : '#eff6ff', color: att.category === 'post_event' ? '#d97706' : '#3b82f6' }}><FileText size={17}/></div>
                          <div className="info">
                            <div className="name">{att.file_name || 'Attachment'}</div>
                            <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: att.category === 'post_event' ? '#fef3c7' : '#eff6ff', color: att.category === 'post_event' ? '#d97706' : '#3b82f6', fontWeight: 600 }}>
                                {att.category === 'post_event' ? '📋 Post-Event' : '📄 Proposal'}
                              </span>
                            </div>
                          </div>
                          <div className="view" onClick={() => window.open(att.file_url, '_blank')} style={{ cursor: 'pointer' }}>View</div>
                        </DocRow>
                      ))}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 12 }}>No supporting documents attached.</div>
                  )}

                  {(selected.status === 'approved' || selected.status === 'completed') && (
                    <div style={{ marginTop: 20, padding: '14px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#374151' }}>Post-Event Requirements Checklist</div>
                      {['Post-Event Report','Narrative Report','Attendance Sheet','Photos/Documentation','Financial Liquidation','Official Receipts (if applicable)','Event Summary'].map(req => {
                        const submitted = attachments.some(a => a.category === 'post_event');
                        return (
                          <div key={req} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 14, color: submitted ? '#059669' : '#9ca3af' }}>{submitted ? '✓' : '○'}</span>
                            <span style={{ fontSize: 13, color: '#374151' }}>{req}</span>
                          </div>
                        );
                      })}
                      {!attachments.some(a => a.category === 'post_event') && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444', fontStyle: 'italic' }}>
                          ⚠ Student leader has not yet submitted post-event requirements.
                        </div>
                      )}
                    </div>
                  )}
                </LeftCol>

                <div>
                  <CalBox>
                    <CalHead>
                      <h4><CalendarDays size={13}/>{format(calMonth, 'MMMM yyyy')}</h4>
                      <div className="navs">
                        <button onClick={() => setCalMonth(subMonths(calMonth, 1))}><ChevronLeft size={13}/></button>
                        <button onClick={() => setCalMonth(addMonths(calMonth, 1))}><ChevronRight size={13}/></button>
                      </div>
                    </CalHead>

                    <CalGrid>
                      {['S','M','T','W','TH','F','S'].map((d, i) => <DayName key={i}>{d}</DayName>)}
                      {cells.map((c, i) => (
                        c.muted
                          ? <div key={i}/>
                          : <DayCell
                              key={i}
                              $today={c.today}
                              $ev={c.ev && !c.today}
                              $hi={c.hi && !c.today && !c.ev}
                              $circ={c.circ && !c.today && !c.ev && !c.hi}
                            >
                              {c.day}
                            </DayCell>
                      ))}
                    </CalGrid>

                    <SchedSection>
                      <div className="title">Scheduled events: {format(calMonth, 'MMMM yyyy')}</div>
                      {scheduledEvents.map((s, i) => (
                        <SchedRow key={i} $c={s.color}>
                          <div className="left"><div className="dot"/>{s.label.length > 22 ? s.label.substring(0, 22) + '…' : s.label}</div>
                          <div className="date">{s.date}</div>
                        </SchedRow>
                      ))}
                    </SchedSection>
                  </CalBox>
                </div>
              </TwoCols>
            </RightScroll>

            {selected.status === 'pending' || selected.status === 'under_review' ? (
              <ActionBar>
                <ActBtn style={{ background: GREEN, color: '#fff' }} onClick={() => promptDecision('approved')}>Approve</ActBtn>
                <ActBtn style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }} onClick={() => promptDecision('revision')}>Request Revision</ActBtn>
                <ActBtn style={{ background: '#ef4444', color: '#fff' }} onClick={() => promptDecision('rejected')}>Reject</ActBtn>
              </ActionBar>
            ) : (
              <div style={{ padding: '16px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
                <CheckCircle2 size={16} /> Decision has been made. Editing is disabled.
              </div>
            )}
          </>
        ) : (
          <EmptyState>
            <CalendarDays size={48} color="#d1d5db" />
            <div>Select an event to view details</div>
          </EmptyState>
        )}
      </RightPanel>

      {/* Decision modal */}
      {decisionModal.open && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              {decisionModal.type === 'approved' ? <CheckCircle2 color={GREEN} size={22} /> :
               decisionModal.type === 'revision' ? <MessageSquare color="#f59e0b" size={22} /> :
               <XCircle color="#ef4444" size={22} />}
              <h3>
                {decisionModal.type === 'approved' ? 'Approve Event' :
                 decisionModal.type === 'revision' ? 'Request Revision' : 'Reject Event'}
              </h3>
            </ModalHeader>
            <ModalBody>
              <p>
                You are about to <strong>{decisionModal.type === 'approved' ? 'approve' : decisionModal.type === 'revision' ? 'request a revision for' : 'reject'}</strong> the proposal:
                <br/><span style={{color: '#111827', fontWeight: 600}}>{decisionModal.title}</span>
              </p>
              <StyledTextarea
                placeholder={`Enter remarks or feedback ${decisionModal.type === 'approved' ? '(optional)' : '(required)'}...`}
                value={decisionNotes}
                onChange={e => {
                  setDecisionNotes(e.target.value);
                  if (decisionModal.error) setDecisionModal(prev => ({ ...prev, error: '' }));
                }}
                autoFocus
                style={decisionModal.error ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : {}}
              />
              {decisionModal.error && (
                <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{decisionModal.error}</div>
              )}
            </ModalBody>
            <ModalFooter>
              <ModalBtn className="cancel" onClick={() => setDecisionModal({ open: false, type: '', title: '', error: '' })}>Cancel</ModalBtn>
              <ModalBtn
                className="confirm"
                $color={decisionModal.type === 'approved' ? GREEN : decisionModal.type === 'revision' ? '#f59e0b' : '#ef4444'}
                onClick={submitDecision}
              >
                Confirm {decisionModal.type === 'approved' ? 'Approval' : decisionModal.type === 'revision' ? 'Revision' : 'Rejection'}
              </ModalBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Delete confirmation modal */}
      {deleteModal.open && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <Trash2 color="#ef4444" size={22} />
              <h3>Delete Event</h3>
            </ModalHeader>
            <ModalBody>
              <p>
                Are you sure you want to permanently delete:<br/>
                <span style={{ color: '#111827', fontWeight: 700 }}>{deleteModal.event?.title}</span>
              </p>
              <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 0 }}>⚠ This action cannot be undone.</p>
            </ModalBody>
            <ModalFooter>
              <ModalBtn className="cancel" onClick={() => setDeleteModal({ open: false, event: null })}>Cancel</ModalBtn>
              <ModalBtn className="confirm" $color="#ef4444" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Event'}
              </ModalBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Page>
  );
}
