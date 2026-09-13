import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { supabase } from '../config/supabase';

const contactInfo = [
  { icon: FaPhoneAlt,    label: 'Phone',   value: '+63 (2) 1234 5678' },
  { icon: FaEnvelope,    label: 'Email',   value: 'osas@university.edu' },
  { icon: FaMapMarkerAlt,label: 'Address', value: 'Student Center Building,\nUniversity Campus, Manila' },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    student_id: '',
    course: '',
    message: '',
    csrf_token: ''
  });
  
  const [status, setStatus] = useState({ type: null, message: '' }); // 'success' or 'error'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCsrf, setActiveCsrf] = useState('');

  // Generate a rotating security token on mount and after successful submissions
  const generateCsrfToken = () => {
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('osas_contact_csrf', token);
    setActiveCsrf(token);
    setFormData(prev => ({ ...prev, csrf_token: token }));
  };

  useEffect(() => {
    generateCsrfToken();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // CSRF / Security validation
    const storedToken = sessionStorage.getItem('osas_contact_csrf');
    if (!formData.csrf_token || formData.csrf_token !== storedToken || formData.csrf_token !== activeCsrf) {
      setStatus({ type: 'error', message: 'Security token validation failed. Please refresh the page.' });
      return;
    }

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.message) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          student_id: formData.student_id,
          course: formData.course,
          message: formData.message,
          status: 'unread'
        }]);

      if (error) throw error;

      setStatus({ type: 'success', message: 'Your message has been sent successfully! Our team will get back to you soon.' });
      
      // Clear form and rotate security token
      generateCsrfToken();
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        student_id: '',
        course: '',
        message: '',
        csrf_token: sessionStorage.getItem('osas_contact_csrf') || ''
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Something went wrong. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 section-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.span
            className="section-label"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Get in Touch
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            Contact <span className="text-osas-primary">OSAS</span>
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Have questions? Reach out and our team will get back to you within 24 hours.
          </motion.p>
        </div>

        {/* Card split */}
        <div className="flex flex-col lg:flex-row rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden group">

          {/* Left — green info panel */}
          <motion.div
            className="lg:w-2/5 bg-osas-primary text-white p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-700 ease-in-out" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-700 ease-in-out" />

            <div className="relative z-10">
              <h3 className="text-2xl font-extrabold font-poppins mb-3 text-white">
                Contact Information
              </h3>
              <p className="text-white/70 text-sm leading-relaxed mb-10">
                Fill out the form and our team will respond within 24 hours.
              </p>

              <div className="flex flex-col gap-7">
                {contactInfo.map(({ icon: Icon, label, value }, idx) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className="flex items-start gap-4 hover:translate-x-1 transition-transform cursor-default"
                  >
                    <div className="bg-white/15 p-2.5 rounded-xl shrink-0">
                      <Icon className="text-osas-accent text-base" />
                    </div>
                    <div>
                      <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="text-white text-sm font-medium whitespace-pre-line">{value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — white form panel */}
          <motion.div
            className="lg:w-3/5 bg-white dark:bg-[#11141b] p-10 lg:p-12 relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            {status.message && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium transition-all ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {status.type === 'success' ? <FaCheckCircle className="text-lg shrink-0 mt-0.5" /> : <FaExclamationCircle className="text-lg shrink-0 mt-0.5" />}
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
              {/* Rotating Security Token (Hidden) */}
              <input type="hidden" name="csrf_token" value={formData.csrf_token} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5 group/input">
                  <label className="text-xs font-semibold text-gray-600 dark:text-white/90 uppercase tracking-wide group-focus-within/input:text-osas-primary transition-colors">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-osas-primary focus:ring-2 focus:ring-osas-primary/15 transition-all shadow-sm focus:shadow-md"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5 group/input">
                  <label className="text-xs font-semibold text-gray-600 dark:text-white/90 uppercase tracking-wide group-focus-within/input:text-osas-primary transition-colors">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-osas-primary focus:ring-2 focus:ring-osas-primary/15 transition-all shadow-sm focus:shadow-md"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 group/input">
                <label className="text-xs font-semibold text-gray-600 dark:text-white/90 uppercase tracking-wide group-focus-within/input:text-osas-primary transition-colors">Student Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="johndoe@university.edu"
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-osas-primary focus:ring-2 focus:ring-osas-primary/15 transition-all shadow-sm focus:shadow-md"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5 group/input">
                  <label className="text-xs font-semibold text-gray-600 dark:text-white/90 uppercase tracking-wide group-focus-within/input:text-osas-primary transition-colors">Student ID</label>
                  <input
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleChange}
                    placeholder="2024-00001"
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-osas-primary focus:ring-2 focus:ring-osas-primary/15 transition-all shadow-sm focus:shadow-md"
                  />
                </div>
                <div className="flex flex-col gap-1.5 group/input">
                  <label className="text-xs font-semibold text-gray-600 dark:text-white/90 uppercase tracking-wide group-focus-within/input:text-osas-primary transition-colors">Course / Program</label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    placeholder="BSCS"
                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-osas-primary focus:ring-2 focus:ring-osas-primary/15 transition-all shadow-sm focus:shadow-md"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 group/input">
                <label className="text-xs font-semibold text-gray-600 dark:text-white/90 uppercase tracking-wide group-focus-within/input:text-osas-primary transition-colors">Message *</label>
                <textarea
                  rows={4}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-osas-primary focus:ring-2 focus:ring-osas-primary/15 transition-all resize-none shadow-sm focus:shadow-md"
                  required
                />
              </div>

              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary w-full justify-center py-3.5 text-sm shadow-md shadow-osas-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </motion.button>
              </div>
            </form>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Contact;
