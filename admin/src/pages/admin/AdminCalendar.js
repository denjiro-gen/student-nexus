import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAPI } from '../../services/api';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, startOfMonth, endOfMonth, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const GREEN = '#03632B';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 114px);
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
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

const CalendarGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: 40px repeat(5, 1fr);
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
  
  &:last-child { border-right: none; }
`;

const Cell = styled.div`
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  padding: 8px;
  min-height: 120px;
  background: ${p => p.$isCurrentMonth ? '#ffffff' : '#f9fafb'};
  
  &:nth-child(7n) { border-right: none; }
  
  .day-num {
    font-size: 14px;
    font-weight: 600;
    color: ${p => p.$isCurrentMonth ? '#111827' : '#9ca3af'};
    margin-bottom: 8px;
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    ${p => p.$today && `background: ${GREEN}; color: #ffffff;`}
  }
`;

const EventChip = styled.div`
  background: ${p => p.$conflict ? '#fef2f2' : '#f0fdf4'};
  border: 1px solid ${p => p.$conflict ? '#fecaca' : '#bbf7d0'};
  border-left: 3px solid ${p => p.$conflict ? '#ef4444' : GREEN};
  padding: 6px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 11px;
  cursor: pointer;
  
  .title { font-weight: 700; color: ${p => p.$conflict ? '#991b1b' : '#166534'}; margin-bottom: 2px; }
  .time { color: ${p => p.$conflict ? '#b91c1c' : '#15803d'}; font-size: 10px; }
  .org { font-weight: 600; color: #6b7280; margin-top: 2px; }
`;

const ConflictAlert = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 16px 24px 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #991b1b;
  
  h4 { margin: 0 0 4px; font-size: 14px; font-weight: 700; }
  p { margin: 0; font-size: 13px; line-height: 1.4; }
  ul { margin: 4px 0 0; padding-left: 20px; font-size: 12px; }
`;

export default function AdminCalendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const [eventsRes, facultyRes] = await Promise.all([
      adminAPI.getEventProposals(),
      adminAPI.getFacultyRequests()
    ]);
    
    if (eventsRes.data) {
      let activeEvents = eventsRes.data.filter(e => e.status === 'approved' || e.status === 'completed');
      
      if (facultyRes.data) {
        const approvedFaculty = facultyRes.data
          .filter(f => f.status === 'approved')
          .map(f => ({
            ...f,
            is_faculty_request: true,
            event_date: f.created_at ? f.created_at.split('T')[0] : null,
            venue: 'Faculty Request',
            title: f.title || 'Faculty Request',
            organization: { name: f.user?.full_name || 'Faculty Member' }
          }));
        activeEvents = [...activeEvents, ...approvedFaculty];
      }

      setEvents(activeEvents);
      
      const foundConflicts = [];
      const grouped = {};
      
      activeEvents.forEach(e => {
        if (!e.event_date) return;
        if (e.is_faculty_request) return;
        
        const key = e.event_date + '_' + e.venue;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(e);
      });
      
      Object.values(grouped).forEach(group => {
        if (group.length > 1) {
          foundConflicts.push(group);
        }
      });
      setConflicts(foundConflicts);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Page>
      <Header>
        <Title><CalendarIcon size={24} /> Master Event Calendar Matrix</Title>
        <Nav>
          <NavBtn onClick={() => setCurrentDate(addDays(monthStart, -1))}><ChevronLeft size={18}/></NavBtn>
          <div className="month">{format(currentDate, dateFormat)}</div>
          <NavBtn onClick={() => setCurrentDate(addDays(monthEnd, 1))}><ChevronRight size={18}/></NavBtn>
        </Nav>
      </Header>
      
      {conflicts.length > 0 && (
        <ConflictAlert>
          <AlertCircle size={20} />
          <div>
            <h4>Warning: Scheduling Conflicts Detected</h4>
            <p>The following events overlap in venue or time and require coordination:</p>
            <ul>
              {conflicts.map((group, i) => (
                <li key={i}>
                  <strong>{group[0].event_date} at {group[0].venue}:</strong> {group.map(g => g.title).join(' vs ')}
                </li>
              ))}
            </ul>
          </div>
        </ConflictAlert>
      )}

      <CalendarGrid>
        {weekDays.map(d => <DayHeader key={d}>{d}</DayHeader>)}
        
        {days.map(day => {
          const dayEvents = events.filter(e => e.event_date && isSameDay(parseISO(e.event_date), day));
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);
          const dayNum = format(day, 'd');
          
          return (
            <Cell key={day.toString()} $isCurrentMonth={isCurrentMonth} $today={isToday}>
              <span className="day-num">{dayNum}</span>
              {dayEvents.map((e, idx) => {
                const isConflict = conflicts.some(c => c.some(ce => ce.id === e.id));
                if (e.is_faculty_request) {
                  return (
                    <EventChip key={e.id || idx} $conflict={false} style={{ borderLeftColor: '#3B82F6', backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
                      <div className="title" style={{ color: '#1D4ED8' }}>{e.title}</div>
                      <div className="time" style={{ color: '#2563EB' }}>Faculty Request</div>
                      <div className="org">{e.organization?.name}</div>
                    </EventChip>
                  );
                }
                return (
                  <EventChip key={e.id || idx} $conflict={isConflict}>
                    <div className="title">{e.title}</div>
                    <div className="time">{e.event_time_start || 'TBA'} • {e.venue || 'No Venue'}</div>
                    <div className="org">{e.organization?.acronym || e.organization?.name}</div>
                  </EventChip>
                );
              })}
            </Cell>
          );
        })}
      </CalendarGrid>
    </Page>
  );
}
