import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAPI } from '../../services/api';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, startOfMonth, endOfMonth, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, AlertCircle, ChevronLeft, ChevronRight, X, MapPin, Clock, Users, Building, CheckCircle, XCircle, AlertTriangle, Award } from 'lucide-react';

const GREEN = '#03632B';

// ── Status Config ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  approved:  { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', chip: '#DCFCE7', text: '#166534', label: 'Approved',  Icon: CheckCircle  },
  completed: { color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE', chip: '#E0E7FF', text: '#3730A3', label: 'Completed', Icon: Award         },
  pending:   { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', chip: '#FEF3C7', text: '#92400E', label: 'Pending',   Icon: AlertTriangle  },
  rejected:  { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', chip: '#FEE2E2', text: '#991B1B', label: 'Rejected',  Icon: XCircle        },
};

// ── Styled Components ─────────────────────────────────────────────────────────
const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 114px);
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  position: relative;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 800;
  color: ${GREEN};
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
`;

const Nav = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  .month { font-size: 16px; font-weight: 700; color: #111827; min-width: 140px; text-align: center; }
`;

const NavBtn = styled.button`
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #374151;
  &:hover { background: #e5e7eb; }
`;

/* Legend row */
const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
`;
const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
`;
const LegendDot = styled.div`
  width: 10px; height: 10px;
  border-radius: 50%;
  background: ${p => p.$color};
`;

const CalendarGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: 40px repeat(auto-fill, minmax(110px, 1fr));
  overflow-y: auto;
`;

const DayHeader = styled.div`
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  padding: 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  position: sticky; top: 0; z-index: 2;
  &:last-child { border-right: none; }
`;

const Cell = styled.div`
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  padding: 6px;
  min-height: 110px;
  background: ${p => p.$isCurrentMonth ? '#ffffff' : '#f9fafb'};
  &:nth-child(7n) { border-right: none; }
  .day-num {
    font-size: 13px;
    font-weight: 700;
    color: ${p => p.$isCurrentMonth ? '#111827' : '#9ca3af'};
    margin-bottom: 5px;
    display: inline-block;
    width: 26px; height: 26px;
    border-radius: 50%;
    text-align: center;
    line-height: 26px;
    ${p => p.$today && `background: ${GREEN}; color: #ffffff;`}
  }
`;

const EventChip = styled.button`
  display: block;
  width: 100%;
  background: ${p => p.$bg};
  border: 1px solid ${p => p.$border};
  border-left: 3px solid ${p => p.$color};
  padding: 4px 6px;
  border-radius: 4px;
  margin-bottom: 3px;
  font-size: 10px;
  cursor: pointer;
  text-align: left;
  transition: opacity 0.1s;
  &:hover { opacity: 0.82; }
  .chip-title { font-weight: 700; color: ${p => p.$text}; margin-bottom: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .chip-sub   { color: ${p => p.$color}; font-size: 9px; }
  .chip-org   { font-weight: 600; color: #6b7280; margin-top: 1px; font-size: 9px; }
`;

/* ── Detail Panel ── */
const Panel = styled.div`
  position: fixed;
  top: 0; right: 0;
  width: 380px; height: 100vh;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  box-shadow: -4px 0 24px rgba(0,0,0,0.12);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transform: translateX(${p => p.$open ? '0' : '100%'});
  transition: transform 0.25s ease;
`;

const PanelHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: ${p => p.$bg || '#f0fdf4'};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const PanelBody = styled.div`
  padding: 20px;
  flex: 1;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; }
  .label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .value { font-size: 14px; font-weight: 600; color: #111827; }
`;

const IconBox = styled.div`
  width: 32px; height: 32px;
  border-radius: 8px;
  background: ${p => p.$bg || '#f3f4f6'};
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 20px;
  background: ${p => p.$chip};
  color: ${p => p.$text};
  font-size: 12px;
  font-weight: 700;
`;

const ConflictAlert = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 12px 24px 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #991b1b;
  flex-shrink: 0;
  h4 { margin: 0 0 4px; font-size: 14px; font-weight: 700; }
  p  { margin: 0; font-size: 13px; line-height: 1.4; }
  ul { margin: 4px 0 0; padding-left: 20px; font-size: 12px; }
`;

const Overlay = styled.div`
  display: ${p => p.$show ? 'block' : 'none'};
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.25);
  z-index: 99;
`;

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminCalendar() {
  const [events, setEvents]         = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [conflicts, setConflicts]   = useState([]);
  const [selected, setSelected]     = useState(null);   // event detail to show

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    const { data: eventsData } = await adminAPI.getEventProposals();
    
    if (eventsData) {
      // Show all non-rejected events (approved, pending, completed)
      let activeEvents = eventsData.filter(e =>
        ['approved', 'pending', 'completed'].includes(e.status)
      );

      setEvents(activeEvents);
      
      // Detect venue + date conflicts
      const foundConflicts = [];
      const grouped = {};
      activeEvents.forEach(e => {
        if (!e.event_date) return;
        const key = `${e.event_date}_${e.venue}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(e);
      });
      Object.values(grouped).forEach(group => {
        if (group.length > 1) foundConflicts.push(group);
      });
      setConflicts(foundConflicts);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(monthStart);
  const startDate  = startOfWeek(monthStart);
  const endDate    = endOfWeek(monthEnd);
  const days       = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Summary counts for the current month
  const monthEvents   = events.filter(e => e.event_date && isSameMonth(parseISO(e.event_date), monthStart));
  const approvedCount = monthEvents.filter(e => e.status === 'approved').length;
  const pendingCount  = monthEvents.filter(e => e.status === 'pending').length;

  const formatEventTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const d = new Date(); d.setHours(Number(h), Number(m));
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const selCfg = selected ? (STATUS_MAP[selected.status] || STATUS_MAP.pending) : null;

  return (
    <>
      <Page>
        <Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Title><CalendarIcon size={24} /> Master Event Calendar</Title>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ background: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                ✓ {approvedCount} Approved
              </span>
              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                ⏳ {pendingCount} Pending
              </span>
            </div>
          </div>
          <Nav>
            <NavBtn onClick={() => setCurrentDate(addDays(monthStart, -1))}><ChevronLeft size={18}/></NavBtn>
            <div className="month">{format(currentDate, 'MMMM yyyy')}</div>
            <NavBtn onClick={() => setCurrentDate(addDays(monthEnd, 1))}><ChevronRight size={18}/></NavBtn>
          </Nav>
        </Header>

        <LegendRow>
          {Object.entries(STATUS_MAP).map(([status, cfg]) => (
            <LegendItem key={status}>
              <LegendDot $color={cfg.color} />
              {cfg.label}
            </LegendItem>
          ))}
          <LegendItem style={{ marginLeft: 'auto', color: '#6b7280', fontWeight: 400, fontSize: 11 }}>
            Click any event chip to view details
          </LegendItem>
        </LegendRow>

        {conflicts.length > 0 && (
          <ConflictAlert>
            <AlertCircle size={20} />
            <div>
              <h4>⚠ Venue Conflicts Detected ({conflicts.length})</h4>
              <ul>
                {conflicts.map((group, i) => (
                  <li key={i}>
                    <strong>{group[0].event_date} — {group[0].venue}:</strong> {group.map(g => g.title).join(' vs ')}
                  </li>
                ))}
              </ul>
            </div>
          </ConflictAlert>
        )}

        <CalendarGrid>
          {weekDays.map(d => <DayHeader key={d}>{d}</DayHeader>)}
          
          {days.map(day => {
            const dayEvents      = events.filter(e => e.event_date && isSameDay(parseISO(e.event_date), day));
            const isToday        = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, monthStart);
            const dayNum         = format(day, 'd');
            
            return (
              <Cell key={day.toString()} $isCurrentMonth={isCurrentMonth} $today={isToday}>
                <span className="day-num">{dayNum}</span>
                {dayEvents.map((e, idx) => {
                  const isConflict = conflicts.some(c => c.some(ce => ce.id === e.id));
                  if (e.is_faculty_request) {
                    return (
                      <EventChip
                        key={e.id || idx}
                        $bg="#EFF6FF" $border="#BFDBFE" $color="#2563EB" $text="#1D4ED8"
                        onClick={() => setSelected(e)}
                      >
                        <div className="chip-title">{e.title}</div>
                        <div className="chip-sub">Faculty Request</div>
                        <div className="chip-org">{e.organization?.name}</div>
                      </EventChip>
                    );
                  }
                  const cfg = STATUS_MAP[e.status] || STATUS_MAP.pending;
                  return (
                    <EventChip
                      key={e.id || idx}
                      $bg={isConflict ? '#fef2f2' : cfg.bg}
                      $border={isConflict ? '#fecaca' : cfg.border}
                      $color={isConflict ? '#ef4444' : cfg.color}
                      $text={isConflict ? '#991b1b' : cfg.text}
                      onClick={() => setSelected(e)}
                    >
                      <div className="chip-title">{e.title}</div>
                      <div className="chip-sub">
                        {formatEventTime(e.event_time_start) || 'TBA'} · {e.venue || 'No Venue'}
                        {isConflict ? ' ⚠' : ''}
                      </div>
                      <div className="chip-org">{e.organization?.acronym || e.organization?.name}</div>
                    </EventChip>
                  );
                })}
              </Cell>
            );
          })}
        </CalendarGrid>
      </Page>

      {/* ── Event Detail Slide Panel ── */}
      <Overlay $show={!!selected} onClick={() => setSelected(null)} />
      <Panel $open={!!selected}>
        {selected && selCfg && (
          <>
            <PanelHeader $bg={selCfg.bg}>
              <div style={{ flex: 1 }}>
                <StatusBadge $chip={selCfg.chip} $text={selCfg.text} style={{ marginBottom: 10 }}>
                  <selCfg.Icon size={12} />
                  {selCfg.label}
                </StatusBadge>
                <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#111827', lineHeight: 1.3 }}>
                  {selected.title}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                  {selected.organization?.name || 'Independent'}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </PanelHeader>

            <PanelBody>
              <DetailRow>
                <IconBox $bg="#F0FDF4"><CalendarIcon size={15} color={GREEN} /></IconBox>
                <div>
                  <div className="label">Date</div>
                  <div className="value">
                    {selected.event_date
                      ? new Date(selected.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                      : 'Not specified'}
                  </div>
                </div>
              </DetailRow>

              {(selected.event_time_start || selected.event_time_end) && (
                <DetailRow>
                  <IconBox $bg="#FEF3C7"><Clock size={15} color="#D97706" /></IconBox>
                  <div>
                    <div className="label">Time</div>
                    <div className="value">
                      {formatEventTime(selected.event_time_start)}
                      {selected.event_time_end ? ` – ${formatEventTime(selected.event_time_end)}` : ''}
                    </div>
                  </div>
                </DetailRow>
              )}

              {selected.venue && (
                <DetailRow>
                  <IconBox $bg="#EEF2FF"><MapPin size={15} color="#4F46E5" /></IconBox>
                  <div>
                    <div className="label">Venue</div>
                    <div className="value">{selected.venue}</div>
                  </div>
                </DetailRow>
              )}

              {selected.expected_attendees && (
                <DetailRow>
                  <IconBox $bg="#F0FDF4"><Users size={15} color={GREEN} /></IconBox>
                  <div>
                    <div className="label">Expected Attendees</div>
                    <div className="value">{Number(selected.expected_attendees).toLocaleString()}</div>
                  </div>
                </DetailRow>
              )}

              {selected.organization && (
                <DetailRow>
                  <IconBox $bg="#F0FDF4"><Building size={15} color={GREEN} /></IconBox>
                  <div>
                    <div className="label">Organization</div>
                    <div className="value">{selected.organization.name}</div>
                    {selected.organization.acronym && (
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{selected.organization.acronym}</div>
                    )}
                  </div>
                </DetailRow>
              )}

              {selected.description && (
                <DetailRow>
                  <div style={{ flex: 1 }}>
                    <div className="label" style={{ marginBottom: 6 }}>Description</div>
                    <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                      {selected.description}
                    </p>
                  </div>
                </DetailRow>
              )}

              {selected.review_notes && (
                <div style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>
                    OSAS Remarks
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#7F1D1D', lineHeight: 1.5 }}>{selected.review_notes}</p>
                </div>
              )}

              {conflicts.some(c => c.some(ce => ce.id === selected.id)) && (
                <div style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#991B1B', fontSize: 13, marginBottom: 5 }}>
                    <AlertCircle size={14} /> Venue Conflict
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#7F1D1D' }}>
                    This event shares a date and venue with another event. Coordination required.
                  </p>
                </div>
              )}
            </PanelBody>
          </>
        )}
      </Panel>
    </>
  );
}
