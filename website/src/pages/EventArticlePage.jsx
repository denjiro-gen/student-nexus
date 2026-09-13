import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, Image as ImageIcon } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { api } from '../services/api';
import bannerBg from '../images/DSC_3272.JPG';
import gallery1 from '../images/gradpitik.jpg';
import gallery2 from '../images/DSC_3134.JPG';

export default function EventArticlePage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchEventData = async () => {
      setLoading(true);
      const { data, error } = await api.getEvent(id);
      
      if (data) {
        setEvent(data);
      } else {
        // Mock fallback if event not found or using placeholder ID
        if (id.startsWith('placeholder') || id === '1' || id === '2') {
          setEvent({
            title: 'Annual CodeFest 2026: Building Solutions for the Community',
            event_date: '2026-08-15',
            author: 'ITSS Media Team',
            image: bannerBg,
            description: `The Annual CodeFest 2026 was a resounding success, bringing together over 150 IT students for a grueling but rewarding 24-hour hackathon. The event, held at the main campus gymnasium, challenged participants to develop innovative software solutions aimed at addressing local community issues in Montalban.\n\nThe competition saw a variety of impressive projects, ranging from disaster response coordination apps to local marketplace platforms for small businesses. Mentors from leading tech companies were present to guide the students, providing valuable industry insights and technical assistance throughout the night.\n\n"We are incredibly proud of what our students have accomplished in such a short amount of time," said the ITSS President. "This event proves that our future IT professionals are not only technically proficient but also deeply committed to social responsibility."`,
            accomplishment_summary: '150+ Participants, 25 Completed Projects, 3 Winning Teams Awarded Seed Funding.',
            gallery: [gallery1, gallery2, bannerBg]
          });
        }
      }
      setLoading(false);
    };

    fetchEventData();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!event) {
    return <div className="min-h-screen flex items-center justify-center">Event not found.</div>;
  }

  return (
    <div className="bg-osas-secondary-bg min-h-screen pt-24 pb-20">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumbs items={[
            { label: 'Organizations', path: '/#organizations' },
            { label: event.title }
          ]} />
        </div>

        {/* Article Header */}
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight font-poppins drop-shadow-sm">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-gray-500 text-sm font-medium">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-osas-accent" />
              {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-osas-accent" />
              {event.author || 'OSAS Admin'}
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="w-full h-64 md:h-96 rounded-3xl overflow-hidden shadow-lg mb-12">
          <img src={event.image || bannerBg} alt={event.title} className="w-full h-full object-cover" />
        </motion.div>

        {/* Article Body */}
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-12">
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {event.description}
          </div>

          {/* Accomplishment Report Highlight */}
          {(event.accomplishment_summary || event.status === 'completed') && (
            <div className="mt-10 bg-osas-primary/5 border-l-4 border-osas-primary p-6 rounded-r-xl">
              <h3 className="text-lg font-bold text-osas-primary mb-2">Accomplishment Summary</h3>
              <p className="text-gray-700 font-medium">{event.accomplishment_summary || 'Event successfully completed.'}</p>
            </div>
          )}
        </motion.div>

        {/* Gallery */}
        <motion.section initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2}}>
          <div className="flex items-center mb-6">
            <ImageIcon className="w-6 h-6 mr-3 text-osas-primary" />
            <h2 className="text-2xl font-bold text-gray-900">Event Gallery</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(event.gallery || [gallery1, gallery2, bannerBg]).map((img, idx) => (
              <div key={idx} className="aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />
              </div>
            ))}
          </div>
        </motion.section>

      </article>
    </div>
  );
}
