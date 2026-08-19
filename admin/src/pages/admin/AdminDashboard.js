import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Clock, CalendarDays, ChevronLeft, ChevronRight,
  Users, Building2, TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import {
  format, getDaysInMonth, startOfMonth, getDay,
  addMonths, subMonths, isSameDay
} from 'date-fns';
import { supabase } from '../../config/supabase';

const PAGE_BG  = '#f9fafb';
const GREEN    = '#03632B';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1100px;
`;

const WelcomeBlock = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  .left {
    h1 { font-size: 26px; font-weight: 800; color: ${GREEN}; margin-bottom: 4px; letter-spacing: -0.3px; }
    p  { font-size: 13px; color: #4b5563; }
  }

  .refresh {
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    color: #6b7280;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s;
    &:hover { background: #f3f4f6; color: #374151; }
    &:disabled { opacity: 0.5; cursor: default; }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  /* Extra bottom margin so the floating number badge doesn't get clipped */
  margin-bottom: 8px;
`;

/* The stat card looks like it has a bite taken out of the bottom right corner */
const StatCard = styled.div`
  position: relative;
  background: #ffffff;
  border: 2px solid ${p => p.$color};
  border-radius: 16px;
  padding: 16px 20px 14px 18px;
  min-height: 106px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* Overflow is visible so the notch can overlap the border */
  overflow: visible;

  .label {
    font-size: 11px;
    font-weight: 800;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    line-height: 1.3;
  }

  .value {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 900;
    color: ${p => p.$color};
    z-index: 2;
  }

  /* The Notch — covers the bottom-right corner of the white card 
     with the page background color to create the concave curve illusion */
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    right:  -2px;
    width:  48px;
    height: 48px;
    background: ${PAGE_BG};
    border-radius: 20px 0 14px 0; /* Creates the concave inner curve */
    border-top:  2px solid ${p => p.$color};
    border-left: 2px solid ${p => p.$color};
    z-index: 1;
  }
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 316px;
  gap: 20px;
  align-items: start;
`;

const Panel = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px 22px 22px;
`;

const SectionHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;

  .left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 800;
    color: #111827;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  a {
    font-size: 13px;
    color: ${GREEN};
    font-weight: 700;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`;

const TaskRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TaskRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.12s;
  &:hover { background: #ebebeb; }

  .icon      { color: #9ca3af; display: flex; align-items: center; flex-shrink: 0; }
  .icon.done { color: ${GREEN}; }

  .info {
    flex: 1;
    .title { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px; }
    .org   { font-size: 12px; color: #6b7280; font-style: italic; }
  }
`;

const StatusBadge = styled.span`
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 6px;
  flex-shrink: 0;
  background: ${p => {
    if (p.$s === 'approved')  return '#d1fae5';
    if (p.$s === 'rejected')  return '#fee2e2';
    if (p.$s === 'completed') return '#e0f2fe';
    if (p.$s === 'cancelled') return '#f3f4f6';
    return '#fef3c7'; // pending
  }};
  color: ${p => {
    if (p.$s === 'approved')  return '#059669';
    if (p.$s === 'rejected')  return '#dc2626';
    if (p.$s === 'completed') return '#0284c7';
    if (p.$s === 'cancelled') return '#6b7280';
    return '#d97706'; // pending
  }};
  text-transform: capitalize;
`;

const HighBadge = styled.div`
  background: #ef4444;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 6px;
  flex-shrink: 0;
`;

const CalHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;

  .left {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 800;
    color: #111827;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #6b7280;
  }

  .navbtn {
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 5px;
    padding: 2px 5px;
    cursor: pointer;
    color: #6b7280;
    line-height: 0;
    &:hover { background: #f3f4f6; }
  }
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  text-align: center;
`;

const DayLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  padding-bottom: 8px;
`;

const Day = styled.div`
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 13px;
  cursor: pointer;
  font-weight: ${p => (p.$today || p.$circle) ? '700' : '400'};
  color: ${p => {
    if (p.$today)   return '#ffffff';
    if (p.$red)     return '#dc2626';
    if (p.$yellow)  return '#b45309';
    if (p.$outline) return '#374151';
    if (p.$muted)   return '#d1d5db';
    return '#374151';
  }};
  background: ${p => p.$today ? GREEN : 'transparent'};
  border: ${p => {
    if (p.$today)   return 'none';
    if (p.$red)     return '2px solid #ef4444';
    if (p.$yellow)  return '2px solid #fbbf24';
    if (p.$outline) return '2px solid #9ca3af';
    return 'none';
  }};

  &:hover { background: ${p => p.$today ? '#024d21' : '#f3f4f6'}; }
`;

const QuickGuide = styled.div`
  margin-top: 14px;
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;

  .title { font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 4px; }
  .item  { font-size: 10px; color: #6b7280; margin-bottom: 2px; padding-left: 8px; }
`;

const MiniStatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
`;

const MiniCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;

  .icon-box {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: ${p => p.$bg || '#f3f4f6'};
    flex-shrink: 0;
  }

  .info { flex: 1; }
  .label { font-size: 11px; color: #6b7280; font-weight: 500; margin-bottom: 2px; }
  .value { font-size: 22px; font-weight: 800; color: #111827; line-height: 1; }
`;

function buildDays(month, today, calEvents = []) {
  const dim   = getDaysInMonth(month);
  const start = getDay(startOfMonth(month));
  const cells = [];

  // Group events by day of month
  const eventsByDay = {};
  calEvents.forEach(ev => {
    if (!ev.event_date) return;
    const dStr = ev.event_date.split('T')[0];
    const evDate = new Date(dStr); void evDate; // kept for reference
    const [,, d] = dStr.split('-');
    const day = parseInt(d, 10);
    
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(ev);
  });

  for (let i = 0; i < start; i++) cells.push({ empty: true });

  for (let d = 1; d <= dim; d++) {
    const date = new Date(month.getFullYear(), month.getMonth(), d);
    const dayEvents = eventsByDay[d] || [];
    
    let red = false;
    let yellow = false;
    let outline = false;

    if (dayEvents.length > 0) {
      if (dayEvents.some(ev => ev.status === 'rejected')) red = true;
      else if (dayEvents.some(ev => ev.status === 'pending')) yellow = true;
      else outline = true; // completed or approved
    }

    cells.push({
      day:     d,
      today:   isSameDay(date, today),
      red:     red,
      yellow:  yellow,
      outline: outline,
      events:  dayEvents,
    });
  }
  return cells;
}

export default function AdminDashboard() {
  const [stats,     setStats]     = useState({ dueToday: 0, inProgress: 0, pendingReview: 0, completed: 0, totalUsers: 0, totalOrgs: 0 });
  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [calMonth,  setCalMonth]  = useState(new Date());
  const today = new Date();
  const [calEvents, setCalEvents] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getRecentEvents(5),
      ]);
      if (statsRes.data)  setStats(statsRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch events specifically for the displayed calendar month
  const fetchCal = useCallback(async () => {
    const res = await adminAPI.getCalendarEvents(calMonth.getFullYear(), calMonth.getMonth());
    if (res.data) setCalEvents(res.data);
  }, [calMonth]);

  useEffect(() => {
    fetchCal();
  }, [fetchCal]);

  useEffect(() => { load(); }, [load]);

  // Supabase realtime subscription for event_proposals
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_proposals' },
        (payload) => {
          console.log('Realtime update received!', payload);
          // Reload dashboard stats/events
          load();
          // Reload calendar events
          fetchCal();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, fetchCal]);

  const cells = buildDays(calMonth, today, calEvents);

  const statCards = [
    { label: 'Task Due Today', value: stats.dueToday,     color: GREEN     },
    { label: 'In Process',     value: stats.inProgress,   color: '#fbbf24' },
    { label: 'Pendings',       value: stats.pendingReview, color: '#93c5fd' },
    { label: 'Completed',      value: stats.completed,    color: '#f87171' },
  ];

  return (
    <Page>
      {}
      <WelcomeBlock>
        <div className="left">
          <h1>Welcome back, Workspace Lead Admin!</h1>
          <p>
            Today is {format(today, 'MMMM d, yyyy')}.&nbsp;
            Here is the active progress state of your remote product team.
          </p>
        </div>
        <button className="refresh" onClick={load} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </WelcomeBlock>

      {/* */}
      <StatsGrid>
        {statCards.map(c => (
          <StatCard key={c.label} $color={c.color}>
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
          </StatCard>
        ))}
      </StatsGrid>

      {}
      <MiniStatRow>
        <MiniCard $bg="#dcfce7">
          <div className="icon-box"><Users size={20} color={GREEN} /></div>
          <div className="info">
            <div className="label">Total Active Users</div>
            <div className="value">{stats.totalUsers}</div>
          </div>
        </MiniCard>
        <MiniCard $bg="#dbeafe">
          <div className="icon-box"><Building2 size={20} color="#3b82f6" /></div>
          <div className="info">
            <div className="label">Active Organizations</div>
            <div className="value">{stats.totalOrgs}</div>
          </div>
        </MiniCard>
      </MiniStatRow>

      {}
      <BottomGrid>
        {}
        <Panel>
          <SectionHead>
            <div className="left">
              <CheckCircle2 size={18} color={GREEN} />
              Task Board Quick Access
            </div>
            <Link to="/kanban">View details Kanban</Link>
          </SectionHead>
          <TaskRows>
            {loading && (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: '#9ca3af' }}>
                Loading events…
              </div>
            )}
            {!loading && events.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 13 }}>
                <AlertCircle size={28} style={{ margin: '0 auto 8px' }} />
                <p>No events found. Add events via the Kanban board.</p>
              </div>
            )}
            {events.map((ev, idx) => (
              <TaskRow key={ev.id}>
                <div className={`icon${ev.status === 'approved' || ev.status === 'completed' ? ' done' : ''}`}>
                  {ev.status === 'approved' || ev.status === 'completed'
                    ? <CheckCircle2 size={20} />
                    : <Clock size={20} />}
                </div>
                <div className="info">
                  <div className="title">{ev.title}</div>
                  <div className="org">{ev.organization?.name || '—'}</div>
                </div>
                {idx === 0
                  ? <HighBadge>HIGH</HighBadge>
                  : <StatusBadge $s={ev.status}>{ev.status}</StatusBadge>}
              </TaskRow>
            ))}
          </TaskRows>
        </Panel>

        {}
        <Panel>
          <CalHead>
            <div className="left">
              <CalendarDays size={15} />
              {format(calMonth, 'MMMM yyyy').toUpperCase()}
            </div>
            <div className="right">
              <span>Today: {format(today, 'MMMM d')}</span>
              <button className="navbtn" onClick={() => setCalMonth(subMonths(calMonth, 1))}>
                <ChevronLeft size={13} />
              </button>
              <button className="navbtn" onClick={() => setCalMonth(addMonths(calMonth, 1))}>
                <ChevronRight size={13} />
              </button>
            </div>
          </CalHead>

          <CalGrid>
            {['S','M','T','W','TH','F','S'].map((d, idx) => <DayLabel key={idx}>{d}</DayLabel>)}
            {cells.map((c, i) => (
              c.empty
                ? <div key={i} />
                : <Day key={i} $today={c.today} $red={c.red && !c.today} $yellow={c.yellow && !c.today} $outline={c.outline && !c.today}>
                    {c.day}
                  </Day>
            ))}
          </CalGrid>

          <QuickGuide>
            <div className="title">Quick Guide:</div>
            <div className="item">• Selected highlighted dates to view tasks.</div>
            <div className="item">• Click empty days to schedule deliverables directly.</div>
          </QuickGuide>

          {}
          <div style={{ marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <TrendingUp size={14} color={GREEN} />
            <span style={{ fontSize: 12, color: '#4b5563' }}>
              <strong style={{ color: GREEN }}>{stats.pendingReview}</strong> events pending review
            </span>
          </div>
        </Panel>
      </BottomGrid>
    </Page>
  );
}
