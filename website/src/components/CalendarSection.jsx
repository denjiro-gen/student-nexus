import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../config/supabase';
import { X, MapPin, Clock } from 'lucide-react';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const Section = styled.section`
  padding: 80px 20px;
  background: var(--bg-color);
`;

const Content = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const SectionHeader = styled.div`
  margin-bottom: 40px;
  
  h2 {
    font-size: 32px;
    color: var(--text-main);
    margin-bottom: 8px;
  }
  
  p {
    color: var(--text-muted);
    font-size: 16px;
  }
`;

const CalendarWrapper = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  height: 600px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
`;

const ModalHeader = styled.div`
  background: var(--primary);
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  h3 { font-size: 20px; font-weight: 700; margin: 0; }
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  opacity: 0.8;
  &:hover { opacity: 1; }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 12px;
  font-weight: 500;
`;

const Description = styled.p`
  color: var(--text-main);
  font-size: 15px;
  line-height: 1.6;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
`;

export default function CalendarSection() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();

    const channel = supabase.channel('public_events_calendar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_proposals' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('event_proposals')
      .select('id, title, description, event_date, event_time_start, event_time_end, venue, status, organization:organizations(name)')
      .in('status', ['approved', 'completed']);

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    const formattedEvents = data.map(ev => {
      // Parse dates safely
      const dateStr = ev.event_date; // YYYY-MM-DD
      const startStr = ev.event_time_start || '08:00:00';
      const endStr = ev.event_time_end || '17:00:00';

      const start = new Date(`${dateStr}T${startStr}`);
      const end = new Date(`${dateStr}T${endStr}`);

      return {
        ...ev,
        start,
        end,
      };
    });

    setEvents(formattedEvents);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const closeModal = () => setSelectedEvent(null);

  return (
    <Section id="events">
      <Content>
        <SectionHeader>
          <h2>Campus Calendar</h2>
          <p>Upcoming and past approved events across the institution.</p>
        </SectionHeader>

        <CalendarWrapper>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            views={['month', 'week', 'agenda']}
            defaultView="month"
          />
        </CalendarWrapper>

        {selectedEvent && (
          <ModalOverlay onClick={closeModal}>
            <ModalBox onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h3>{selectedEvent.title}</h3>
                <CloseBtn onClick={closeModal}><X size={20} /></CloseBtn>
              </ModalHeader>
              <ModalBody>
                <MetaRow>
                  <Clock size={16} color="var(--primary)" />
                  {format(selectedEvent.start, 'MMM d, yyyy')} • {format(selectedEvent.start, 'h:mm a')} - {format(selectedEvent.end, 'h:mm a')}
                </MetaRow>
                
                {selectedEvent.venue && (
                  <MetaRow>
                    <MapPin size={16} color="var(--primary)" />
                    {selectedEvent.venue}
                  </MetaRow>
                )}

                <MetaRow>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--primary)' }}>O</span>
                  </div>
                  {selectedEvent.organization?.name || 'Unknown Organization'}
                </MetaRow>

                {selectedEvent.description ? (
                  <Description>{selectedEvent.description}</Description>
                ) : (
                  <Description style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided.</Description>
                )}
              </ModalBody>
            </ModalBox>
          </ModalOverlay>
        )}
      </Content>
    </Section>
  );
}
