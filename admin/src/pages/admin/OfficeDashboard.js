import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Calendar, CheckCircle, Clock, XCircle, FileText,
  Package, MapPin, ShieldCheck, RefreshCw,
  AlertCircle, Inbox, TrendingUp
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { format, isToday, isTomorrow } from 'date-fns';

const GREEN = '#03632B';

const Page = styled.div`font-family: 'Inter', -apple-system, sans-serif;`;
const RoleBadge = styled.span`
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  background: ${p => p.$bg}; color: ${p => p.$color}; margin-bottom: 6px;
`;
const Title = styled.h1`font-size: 26px; font-weight: 700; color: #111827; margin: 0 0 4px 0;`;
const Subtitle = styled.p`font-size: 14px; color: #6b7280; margin: 0 0 24px 0;`;
const StatsRow = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px; margin-bottom: 24px;
`;
const StatCard = styled.div`
  background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb;
  display: flex; align-items: flex-start; gap: 14px;
`;
const StatIcon = styled.div`
  width: 42px; height: 42px; border-radius: 10px; background: ${p => p.$bg};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;
const StatValue = styled.div`font-size: 26px; font-weight: 700; color: #111827; line-height: 1;`;
const StatLabel = styled.div`font-size: 12px; color: #6b7280; margin-top: 4px;`;
const Grid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;
const Card = styled.div`background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;`;
const CardHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid #f3f4f6;
`;
const CardTitle = styled.h3`
  font-size: 14px; font-weight: 600; color: #111827; margin: 0;
  display: flex; align-items: center; gap: 8px;
`;
const RefreshBtn = styled.button`
  background: none; border: none; cursor: pointer; color: #9ca3af;
  padding: 4px; border-radius: 6px; display: flex; align-items: center;
  &:hover { color: #374151; background: #f3f4f6; }
`;
const Item = styled.div`
  display: flex; align-items: center; gap: 12px; padding: 12px 20px;
  border-bottom: 1px solid #f9fafb; &:last-child { border-bottom: none; }
`;
const ItemIcon = styled.div`
  width: 34px; height: 34px; border-radius: 8px; background: ${p => p.$bg || '#f3f4f6'};
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
`;
const ItemBody = styled.div`flex: 1; min-width: 0;`;
const ItemTitle = styled.div`font-size: 13px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const ItemSub = styled.div`font-size: 11px; color: #9ca3af; margin-top: 2px;`;
const StatusBadge = styled.span`
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; white-space: nowrap;
  background: ${p => p.$s === 'approved' ? '#d1fae5' : p.$s === 'pending' ? '#fef3c7' : '#fee2e2'};
  color: ${p => p.$s === 'approved' ? '#065f46' : p.$s === 'pending' ? '#92400e' : '#991b1b'};
`;
const Empty = styled.div`padding: 32px 20px; text-align: center; color: #9ca3af; font-size: 13px;`;
const ActionBtn = styled.button`
  display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px;
  border: none; cursor: pointer; font-size: 13px; font-weight: 600;
  background: ${p => p.$primary ? GREEN : '#f3f4f6'};
  color: ${p => p.$primary ? '#fff' : '#374151'};
  &:hover { opacity: 0.85; }
`;

const ROLE_CONFIG = {
  gso:             { label: 'GSO',            badge: { bg: '#e0f2fe', color: '#0284c7' }, icon: Package,    color: '#0284c7', description: 'Manage facility and equipment requests.' },
  pso:             { label: 'PSO',            badge: { bg: '#ccfbf1', color: '#0d9488' }, icon: TrendingUp, color: '#0d9488', description: 'Review event proposals involving sports venues.' },
  supply:          { label: 'Supply Office',  badge: { bg: '#fef9c3', color: '#ca8a04' }, icon: Package,    color: '#ca8a04', description: 'Manage supply requests and inventory for events.' },
  venue:           { label: 'Venue Office',   badge: { bg: '#ede9fe', color: '#7c3aed' }, icon: MapPin,     color: '#7c3aed', description: 'Approve or reject venue booking requests.' },
  admin_assistant: { label: 'Admin Assistant',badge: { bg: '#fce7f3', color: '#9d174d' }, icon: ShieldCheck,color: '#9d174d', description: 'Assist OSAS administration with org management.' },
};

export default function OfficeDashboard() {
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [events, setEvents]     = useState([]);
  const [stats, setStats]       = useState({ pending: 0, approved: 0, rejected: 0, today: 0 });
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('users').select('role, full_name').eq('id', user.id).single();
      if (profile) { setUserRole(profile.role); setUserName(profile.full_name || user.email); }

      const { data: evData } = await supabase
        .from('event_proposals')
        .select('id, title, event_date, venue, status, created_at, organization:organizations(name)')
        .order('created_at', { ascending: false })
        .limit(12);

      const evList = evData || [];
      setEvents(evList);
      setStats({
        pending:  evList.filter(e => e.status === 'pending').length,
        approved: evList.filter(e => e.status === 'approved').length,
        rejected: evList.filter(e => e.status === 'rejected').length,
        today:    evList.filter(e => e.event_date && isToday(new Date(e.event_date))).length,
      });
    } catch (err) {
      console.error('[OfficeDashboard]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cfg = ROLE_CONFIG[userRole] || ROLE_CONFIG.admin_assistant;
  const pendingEvents  = events.filter(e => e.status === 'pending');
  const approvedEvents = events.filter(e => e.status === 'approved');

  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    if (isToday(dt))    return 'Today';
    if (isTomorrow(dt)) return 'Tomorrow';
    return format(dt, 'MMM d, yyyy');
  };

  return (
    <Page>
      <RoleBadge $bg={cfg.badge.bg} $color={cfg.badge.color}>{cfg.label}</RoleBadge>
      <Title>Welcome back, {userName.split(' ')[0] || 'Officer'}! 👋</Title>
      <Subtitle>{cfg.description}</Subtitle>

      <StatsRow>
        <StatCard><StatIcon $bg="#fef3c7"><Clock size={20} color="#d97706" /></StatIcon><div><StatValue>{stats.pending}</StatValue><StatLabel>Pending</StatLabel></div></StatCard>
        <StatCard><StatIcon $bg="#d1fae5"><CheckCircle size={20} color="#059669" /></StatIcon><div><StatValue>{stats.approved}</StatValue><StatLabel>Approved</StatLabel></div></StatCard>
        <StatCard><StatIcon $bg="#fee2e2"><XCircle size={20} color="#dc2626" /></StatIcon><div><StatValue>{stats.rejected}</StatValue><StatLabel>Rejected</StatLabel></div></StatCard>
        <StatCard><StatIcon $bg={cfg.badge.bg}><Calendar size={20} color={cfg.color} /></StatIcon><div><StatValue>{stats.today}</StatValue><StatLabel>Today</StatLabel></div></StatCard>
      </StatsRow>

      <Grid>
        <Card>
          <CardHeader>
            <CardTitle><AlertCircle size={15} color="#d97706" />Pending Requests</CardTitle>
            <RefreshBtn onClick={load}><RefreshCw size={14} /></RefreshBtn>
          </CardHeader>
          {loading ? <Empty>Loading…</Empty> : pendingEvents.length === 0 ? <Empty>🎉 No pending requests!</Empty>
            : pendingEvents.slice(0, 6).map(ev => (
              <Item key={ev.id}>
                <ItemIcon $bg="#fef3c7"><FileText size={15} color="#d97706" /></ItemIcon>
                <ItemBody>
                  <ItemTitle>{ev.title}</ItemTitle>
                  <ItemSub>{ev.organization?.name || '—'} · {fmtDate(ev.event_date)}{ev.venue ? ` · ${ev.venue}` : ''}</ItemSub>
                </ItemBody>
                <StatusBadge $s="pending">Pending</StatusBadge>
              </Item>
            ))}
        </Card>

        <Card>
          <CardHeader><CardTitle><Calendar size={15} color={GREEN} />Approved Events</CardTitle></CardHeader>
          {loading ? <Empty>Loading…</Empty> : approvedEvents.length === 0 ? <Empty>No approved events yet.</Empty>
            : approvedEvents.slice(0, 6).map(ev => (
              <Item key={ev.id}>
                <ItemIcon $bg="#d1fae5"><CheckCircle size={15} color="#059669" /></ItemIcon>
                <ItemBody>
                  <ItemTitle>{ev.title}</ItemTitle>
                  <ItemSub>{ev.organization?.name || '—'} · {fmtDate(ev.event_date)}</ItemSub>
                </ItemBody>
                <StatusBadge $s="approved">Approved</StatusBadge>
              </Item>
            ))}
        </Card>
      </Grid>

      <Card style={{ marginTop: 20 }}>
        <CardHeader><CardTitle><Inbox size={15} color="#6b7280" />Quick Actions</CardTitle></CardHeader>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <ActionBtn $primary onClick={() => { window.location.hash = '#/calendar'; }}><Calendar size={14} /> View Calendar</ActionBtn>
          <ActionBtn onClick={() => { window.location.hash = '#/register'; }}><FileText size={14} /> Booking Register</ActionBtn>
          <ActionBtn onClick={() => { window.location.hash = '#/compliance'; }}><ShieldCheck size={14} /> Compliance</ActionBtn>
          <ActionBtn onClick={() => { window.location.hash = '#/messages'; }}><Inbox size={14} /> Messages</ActionBtn>
        </div>
      </Card>
    </Page>
  );
}

