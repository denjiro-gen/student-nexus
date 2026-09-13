import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaArrowRight, FaTimes } from 'react-icons/fa';
import { supabase } from '../config/supabase';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('official_announcements')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);
      setAnnouncements(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <section id="announcements" className="py-24 section-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
          <div>
            <motion.span
              className="section-label"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Stay Updated
            </motion.span>
            <motion.h2
              className="section-title"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
            >
              Latest <span className="text-osas-primary">Announcements</span>
            </motion.h2>
            <motion.p
              className="section-subtitle"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Stay updated with the latest news, deadlines, and information from OSAS.
            </motion.p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-osas-primary border-t-transparent" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-center text-gray-400 py-20">No announcements at this time. Check back later!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {announcements.map((item, index) => (
              <motion.div
                key={item.id}
                onClick={() => setSelected(item)}
                className="card flex flex-col group cursor-pointer"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={item.image_url || FALLBACK_IMAGE}
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    onError={e => { e.target.src = FALLBACK_IMAGE; }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-osas-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow">
                    <FaCalendarAlt className="text-[10px]" />
                    {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-base font-bold mb-2 text-osas-text font-poppins group-hover:text-osas-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-5 flex-grow line-clamp-3 leading-relaxed">
                    {item.description || 'No description.'}
                  </p>
                  <div className="flex items-center gap-1.5 text-osas-primary text-xs font-semibold group-hover:gap-2.5 transition-all duration-200 mt-auto">
                    Read More <FaArrowRight className="text-[10px]" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {selected.image_url && (
                <div className="h-48 overflow-hidden shrink-0">
                  <img src={selected.image_url} alt={selected.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="bg-osas-primary px-6 py-5 text-white flex justify-between items-start shrink-0">
                <div className="pr-8">
                  <div className="text-osas-accent text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <FaCalendarAlt />
                    {new Date(selected.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <h2 className="text-lg font-extrabold font-poppins leading-snug">{selected.title}</h2>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors shrink-0"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-6 overflow-y-auto text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {selected.description || 'No additional details available.'}
              </div>
              <div className="p-5 border-t border-gray-100 flex justify-end shrink-0">
                <button onClick={() => setSelected(null)} className="btn-primary">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Announcements;
