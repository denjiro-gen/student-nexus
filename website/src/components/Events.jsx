import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaRegClock, FaCalendarAlt, FaList, FaTimes, FaUsers, FaBuilding } from 'react-icons/fa';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { api } from '../services/api';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const Events = () => {
  const [events, setEvents]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [viewMode, setViewMode]           = useState('list');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const { data, error } = await api.getApprovedEvents();
      if (!error && data) setEvents(data);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const calendarEvents = events.map(event => ({
    title: event.title,
    start: new Date(`${event.event_date}T${event.event_time_start || '00:00'}`),
    end:   new Date(`${event.event_date}T${event.event_time_end   || '23:59'}`),
    resource: event,
  }));

  return (
    <section id="events" className="py-24 section-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <motion.span
            className="section-label"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Campus Calendar
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            Upcoming <span className="text-osas-primary">Events</span>
          </motion.h2>
          <motion.p
            className="section-subtitle mb-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Don't miss out on these exciting upcoming student activities and programs.
          </motion.p>

          {/* View Toggle */}
          <div className="inline-flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-osas-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-osas-primary'
              }`}
            >
              <FaList className="text-xs" /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === 'calendar'
                  ? 'bg-osas-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-osas-primary'
              }`}
            >
              <FaCalendarAlt className="text-xs" /> Calendar
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-osas-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {events.length === 0 ? (
                  <p className="col-span-2 text-center text-gray-400 py-16">No upcoming events found.</p>
                ) : (
                  events.map((event, index) => {
                    const dateObj = new Date(event.event_date);
                    const month   = dateObj.toLocaleString('default', { month: 'short' });
                    const day     = dateObj.getDate();
                    return (
                      <motion.div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="card flex overflow-hidden group cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: index * 0.07 }}
                      >
                        {/* Date block */}
                        <div className="bg-osas-primary text-white w-24 flex flex-col justify-center items-center p-4 shrink-0 group-hover:bg-osas-secondary transition-colors duration-200">
                          <span className="text-3xl font-extrabold font-poppins">{day}</span>
                          <span className="text-xs uppercase tracking-widest mt-0.5">{month}</span>
                        </div>
                        {/* Details */}
                        <div className="p-5 flex-grow">
                          <span className="badge mb-2 inline-block">
                            {event.organization?.acronym || event.organization?.name || 'OSAS'}
                          </span>
                          <h3 className="text-base font-bold text-osas-text mb-2 font-poppins group-hover:text-osas-primary transition-colors line-clamp-1">
                            {event.title}
                          </h3>
                          <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <FaRegClock className="text-osas-primary/60 shrink-0" />
                              <span>{event.event_time_start} – {event.event_time_end}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt className="text-osas-primary/60 shrink-0" />
                              <span className="truncate">{event.venue}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            ) : (
              <motion.div
                className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 h-[600px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  onSelectEvent={e => setSelectedEvent(e.resource)}
                  views={['month', 'week', 'day', 'agenda']}
                />
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal header */}
              <div className="bg-osas-primary p-6 text-white relative shrink-0">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <FaTimes />
                </button>
                <span className="section-label text-osas-accent mb-1">Event Details</span>
                <h2 className="text-xl font-extrabold font-poppins leading-tight pr-8">
                  {selectedEvent.title}
                </h2>
              </div>

              {/* Modal body */}
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-7">
                  {[
                    { icon: FaCalendarAlt, label: 'Date & Time',
                      value: new Date(selectedEvent.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                      sub: `${selectedEvent.event_time_start} – ${selectedEvent.event_time_end}` },
                    { icon: FaMapMarkerAlt, label: 'Venue',      value: selectedEvent.venue },
                    { icon: FaBuilding,    label: 'Organized By',
                      value: `${selectedEvent.organization?.name || 'OSAS'}${selectedEvent.organization?.acronym ? ` (${selectedEvent.organization.acronym})` : ''}` },
                    { icon: FaUsers,       label: 'Expected Attendees', value: selectedEvent.expected_attendees || 'N/A' },
                  ].map(({ icon: Icon, label, value, sub }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="icon-box w-9 h-9 rounded-lg shrink-0 mt-0.5">
                        <Icon className="text-sm" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-semibold mb-0.5">{label}</p>
                        <p className="text-sm font-semibold text-osas-text">{value}</p>
                        {sub && <p className="text-xs text-gray-500">{sub}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-osas-text mb-2 font-poppins">About this Event</h3>
                  <p className="text-gray-500 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedEvent.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-5 border-t border-gray-100 flex justify-end shrink-0">
                <button onClick={() => setSelectedEvent(null)} className="btn-primary">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Events;
