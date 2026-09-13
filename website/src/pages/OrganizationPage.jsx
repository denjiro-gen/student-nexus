import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Breadcrumbs from '../components/Breadcrumbs';
import { api } from '../services/api';
import logoImg from '../assets/logo.png'; 
import bannerBg from '../images/DSC_3272.JPG';

export default function OrganizationPage() {
  const { id } = useParams();
  const [org, setOrg] = useState(null);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      setLoading(true);
      
      const { data: orgData } = await api.getOrganization(id);
      if (orgData) {
        setOrg(orgData);
      } else if (id.startsWith('placeholder')) {
        setOrg({
          name: 'Information Technology Student Society',
          acronym: 'ITSS',
          type: 'Recognized Organization',
          vision: 'To be the premier student organization in technological innovation and excellence, fostering a community of skilled, ethical, and socially responsible IT professionals.',
          mission: 'To empower IT students through collaborative learning, skills development workshops, and meaningful community engagements that bridge the gap between academic theory and industry practice.',
          background: 'Founded in 2010, the ITSS has been the official student body of the Institute of Computer Studies. We organize the annual IT week, coding bootcamps, and tech seminars.',
          objectives: [
            'Provide supplementary technical training to students.',
            'Promote ethical use of information technology.',
            'Facilitate networking between students and alumni.'
          ]
        });
      }

      if (orgData || id.startsWith('placeholder')) {
        const [eventsRes, membersRes] = await Promise.all([
          api.getOrganizationEvents(id),
          api.getOrganizationMembers(id)
        ]);

        if (eventsRes.data && eventsRes.data.length > 0) {
          setEvents(eventsRes.data);
        } else if (id.startsWith('placeholder')) {
          setEvents([{
            id: '1', title: 'Annual CodeFest 2026', event_date: '2026-08-15', image: bannerBg,
            description: 'A 24-hour hackathon where students build innovative solutions for local community problems.'
          }]);
        }
        
        if (membersRes.data) {
          setMembers(membersRes.data);
        }
      }
      
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-osas-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!org) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Organization not found.</div>;
  }

  const roleOrder = {
    'President': 1, 'Vice President': 2, 'Vice-President': 2, 'Secretary': 3, 'Treasurer': 4
  };

  const sortedMembers = [...members].sort((a, b) => {
    const orderA = roleOrder[a.position] || 99;
    const orderB = roleOrder[b.position] || 99;
    return orderA - orderB;
  });

  return (
    <div className="bg-[#F8FAFC] min-h-screen pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-6">
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-bold text-slate-600 hover:text-osas-primary border border-slate-200 hover:border-osas-primary/30 shadow-sm transition-all group">
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Hero Banner Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative w-full h-[340px] md:h-[400px] rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" 
               style={{ backgroundImage: `url(${org.background_image_url || bannerBg})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-osas-secondary/95 via-osas-secondary/60 to-transparent" />
          </div>
          
          <div className="absolute bottom-0 w-full p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
              className="w-32 h-32 md:w-40 md:h-40 bg-white/90 backdrop-blur-sm rounded-full p-2 md:p-3 shadow-[0_8px_30px_rgb(0,0,0,0.2)] shrink-0 overflow-hidden border-4 border-white/20"
            >
              <img src={org.logo_url || logoImg} alt={org.name} className="w-full h-full object-contain rounded-full bg-white" />
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center md:text-left mb-2 md:mb-4"
            >
              <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-3 shadow-sm">
                {org.type || 'Student Organization'}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">
                {org.name} <span className="text-white/80 font-medium tracking-normal text-2xl md:text-4xl">({org.acronym})</span>
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.3}} className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-osas-primary/10 flex items-center justify-center text-osas-primary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              About Us
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative overflow-hidden group hover:border-osas-primary/30 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <svg className="w-16 h-16 text-osas-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Vision</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{org.vision}</p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative overflow-hidden group hover:border-osas-accent/30 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <svg className="w-16 h-16 text-osas-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Mission</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{org.mission}</p>
              </div>
            </div>
            
            <div className="pt-2">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Background & History</h3>
              <p className="text-slate-600 leading-relaxed">{org.background}</p>
            </div>
          </motion.div>

          {org.objectives && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.4}} className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-osas-accent/10 flex items-center justify-center text-osas-accent">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                Objectives
              </h2>
              <div className="space-y-4">
                {(Array.isArray(org.objectives) ? org.objectives : [org.objectives]).map((obj, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-osas-accent/20 hover:shadow-sm transition-all">
                    <div className="w-6 h-6 rounded-full bg-osas-accent/20 text-osas-accent font-bold flex items-center justify-center shrink-0 text-sm mt-0.5">{i+1}</div>
                    <p className="text-slate-700 leading-relaxed flex-1">{obj}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Events Section */}
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.5}}>
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3 px-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </span>
              Recent Events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {events.map((event) => (
                <Link to={`/event/${event.id}`} key={event.id} className="group block bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_2px_15px_rgb(0,0,0,0.02)] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="h-48 overflow-hidden relative">
                    <img src={event.image || bannerBg} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-slate-800 text-xs font-bold shadow-sm flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-osas-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-osas-primary transition-colors">{event.title}</h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">{event.description}</p>
                    <div className="text-osas-primary font-bold text-sm flex items-center group-hover:text-osas-accent transition-colors">
                      View Details
                      <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {events.length === 0 && (
              <div className="bg-white p-10 rounded-3xl border border-slate-100 text-center text-slate-500 italic shadow-sm">
                No events posted by this organization yet.
              </div>
            )}
          </motion.div>

        </div>

        {/* Sidebar: Org Chart */}
        <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay: 0.6}} className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.03)] border border-slate-100 sticky top-28">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </span>
              Organization Leaders
            </h2>
            
            <div className="space-y-4">
              {sortedMembers.length > 0 ? sortedMembers.map((member, index) => (
                <div key={member.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                  <div className="relative">
                    {member.user?.profile_picture_url || (member.position === 'President' && org.logo_url) ? (
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                        <img src={member.user?.profile_picture_url || org.logo_url} alt={member.user?.full_name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-osas-primary to-osas-primary/80 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform border-2 border-white">
                        {member.user?.full_name?.substring(0, 2).toUpperCase() || '?'}
                      </div>
                    )}
                    {index === 0 && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-[10px]">
                        ⭐
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-osas-primary transition-colors">{member.user?.full_name}</h4>
                    <p className="text-xs font-semibold text-osas-accent uppercase tracking-wide mt-1">{member.position}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-slate-500 text-sm font-medium">No leaders registered yet.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
