import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  Package, CheckCircle, XCircle, Clock, RefreshCw,
  FileText, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { format, isToday, isTomorrow } from 'date-fns';

const ACCENT = '#0284c7';

const Page = styled.div`font-family: 'Inter', sans-serif;`;
const Header = styled.div`margin-bottom: 24px;`;
const Badge = styled.span`display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;background:#e0f2fe;color:${ACCENT};margin-bottom:6px;`;
const Title = styled.h1`font-size:26px;font-weight:700;color:#111827;margin:0 0 4px 0;`;
const Sub = styled.p`font-size:14px;color:#6b7280;margin:0;`;
const Grid4 = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px;`;
const StatCard = styled.div`background:#fff;border-radius:12px;padding:20px;border:1px solid #e5e7eb;display:flex;align-items:flex-start;gap:14px;`;
const StatIcon = styled.div`width:42px;height:42px;border-radius:10px;background:${p=>p.$bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;`;
const StatVal = styled.div`font-size:26px;font-weight:700;color:#111827;line-height:1;`;
const StatLbl = styled.div`font-size:12px;color:#6b7280;margin-top:4px;`;
const Card = styled.div`background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:20px;`;
const CardHead = styled.div`display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f3f4f6;`;
const CardTitle = styled.h3`font-size:14px;font-weight:600;color:#111827;margin:0;display:flex;align-items:center;gap:8px;`;
const RefBtn = styled.button`background:none;border:none;cursor:pointer;color:#9ca3af;padding:4px;border-radius:6px;&:hover{color:#374151;background:#f3f4f6;}`;
const Row = styled.div`display:flex;align-items:flex-start;gap:12px;padding:14px 20px;border-bottom:1px solid #f9fafb;&:last-child{border-bottom:none;}`;
const RowBody = styled.div`flex:1;min-width:0;`;
const RowTitle = styled.div`font-size:13px;font-weight:600;color:#111827;`;
const RowSub = styled.div`font-size:11px;color:#9ca3af;margin-top:2px;`;
const RowDesc = styled.div`font-size:12px;color:#6b7280;margin-top:6px;line-height:1.5;`;
const RowActions = styled.div`display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;`;
const Btn = styled.button`padding:6px 14px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;background:${p=>p.$v==='approve'?'#d1fae5':p.$v==='reject'?'#fee2e2':'#f3f4f6'};color:${p=>p.$v==='approve'?'#065f46':p.$v==='reject'?'#991b1b':'#374151'};&:hover{opacity:.8;}`;
const NoteInput = styled.textarea`width:100%;margin-top:8px;padding:8px;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;resize:vertical;min-height:60px;font-family:inherit;box-sizing:border-box;`;
const StatusBadge = styled.span`font-size:11px;font-weight:600;padding:2px 8px;border-radius:12px;white-space:nowrap;background:${p=>p.$s==='approved'?'#d1fae5':p.$s==='pending'?'#fef3c7':'#fee2e2'};color:${p=>p.$s==='approved'?'#065f46':p.$s==='pending'?'#92400e':'#991b1b'};`;
const Empty = styled.div`padding:32px 20px;text-align:center;color:#9ca3af;font-size:13px;`;
const ToggleBtn = styled.button`background:none;border:none;cursor:pointer;color:#6b7280;display:flex;align-items:center;gap:4px;font-size:12px;&:hover{color:#111827;}`;

function EventRow({ ev, onAction }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);

  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    if (isToday(dt)) return 'Today';
    if (isTomorrow(dt)) return 'Tomorrow';
    return format(dt, 'MMM d, yyyy');
  };

  const handle = async (status) => {
    setActing(true);
    await onAction(ev.id, status, note);
    setActing(false);
    setOpen(false);
    setNote('');
  };

  return (
    <Row>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Package size={15} color={ACCENT} />
      </div>
      <RowBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <RowTitle>{ev.title}</RowTitle>
          <StatusBadge $s={ev.status}>{ev.status}</StatusBadge>
        </div>
        <RowSub>{ev.organization?.name || '—'} · {fmtDate(ev.event_date)}{ev.venue ? ` · ${ev.venue}` : ''}</RowSub>
        {ev.description && <RowDesc>{ev.description.slice(0, 120)}{ev.description.length > 120 ? '…' : ''}</RowDesc>}

        {ev.status === 'pending' && (
          <>
            <RowActions>
              <Btn $v="approve" disabled={acting} onClick={() => handle('approved')}>✓ Approve</Btn>
              <Btn $v="reject" disabled={acting} onClick={() => handle('rejected')}>✗ Reject</Btn>
              <ToggleBtn onClick={() => setOpen(o => !o)}>
                {open ? <ChevronUp size={13}/> : <ChevronDown size={13}/>} Add Remarks
              </ToggleBtn>
            </RowActions>
            {open && (
              <NoteInput
                placeholder="Optional remarks for the student org..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            )}
          </>
        )}
      </RowBody>
    </Row>
  );
}

export default function GSODashboard() {
  const [userName, setUserName] = useState('');
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).single();
      setUserName(profile?.full_name || user.email);

      const { data: evData } = await supabase
        .from('event_proposals')
        .select('id, title, description, event_date, venue, status, created_at, organization:organizations(name)')
        .order('created_at', { ascending: false });

      const evList = evData || [];
      setEvents(evList);
      setStats({
        pending:  evList.filter(e => e.status === 'pending').length,
        approved: evList.filter(e => e.status === 'approved').length,
        rejected: evList.filter(e => e.status === 'rejected').length,
        today:    evList.filter(e => e.event_date && isToday(new Date(e.event_date))).length,
      });
    } catch (err) { console.error('[GSODashboard]', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, status, notes) => {
    await supabase.from('event_proposals').update({ status, notes, updated_at: new Date().toISOString() }).eq('id', id);
    load();
  };

  const pending = events.filter(e => e.status === 'pending');
  const processed = events.filter(e => e.status !== 'pending');

  return (
    <Page>
      <Header>
        <Badge>General Services Office</Badge>
        <Title>Welcome, {userName.split(' ')[0] || 'GSO Officer'}! 👋</Title>
        <Sub>Review and process event proposals that require facility and equipment support.</Sub>
      </Header>

      <Grid4>
        <StatCard><StatIcon $bg="#fef3c7"><Clock size={20} color="#d97706"/></StatIcon><div><StatVal>{stats.pending}</StatVal><StatLbl>Pending</StatLbl></div></StatCard>
        <StatCard><StatIcon $bg="#d1fae5"><CheckCircle size={20} color="#059669"/></StatIcon><div><StatVal>{stats.approved}</StatVal><StatLbl>Approved</StatLbl></div></StatCard>
        <StatCard><StatIcon $bg="#fee2e2"><XCircle size={20} color="#dc2626"/></StatIcon><div><StatVal>{stats.rejected}</StatVal><StatLbl>Rejected</StatLbl></div></StatCard>
        <StatCard><StatIcon $bg="#e0f2fe"><Package size={20} color={ACCENT}/></StatIcon><div><StatVal>{stats.today}</StatVal><StatLbl>Events Today</StatLbl></div></StatCard>
      </Grid4>

      <Card>
        <CardHead>
          <CardTitle><AlertCircle size={15} color="#d97706"/> Pending Requests ({pending.length})</CardTitle>
          <RefBtn onClick={load}><RefreshCw size={14}/></RefBtn>
        </CardHead>
        {loading ? <Empty>Loading…</Empty> : pending.length === 0
          ? <Empty>🎉 No pending requests! All caught up.</Empty>
          : pending.map(ev => <EventRow key={ev.id} ev={ev} onAction={handleAction}/>)
        }
      </Card>

      <Card>
        <CardHead>
          <CardTitle><FileText size={15} color="#6b7280"/> Processed Requests ({processed.length})</CardTitle>
        </CardHead>
        {loading ? <Empty>Loading…</Empty> : processed.length === 0
          ? <Empty>No processed requests yet.</Empty>
          : processed.slice(0, 10).map(ev => <EventRow key={ev.id} ev={ev} onAction={handleAction}/>)
        }
      </Card>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
        <Btn onClick={() => { window.location.hash = '#/calendar'; }}>📅 View Calendar</Btn>
        <Btn onClick={() => { window.location.hash = '#/messages'; }}>💬 Messages</Btn>
        <Btn onClick={() => { window.location.hash = '#/register'; }}>📋 Booking Register</Btn>
      </div>
    </Page>
  );
}
