import { motion } from 'framer-motion';
import {
  FaCertificate, FaChalkboardTeacher, FaGavel, FaUserMd,
  FaMoneyCheckAlt, FaTheaterMasks, FaGlobeAmericas, FaHandsHelping,
} from 'react-icons/fa';

const services = [
  { icon: FaCertificate,      title: 'Organization Accreditation', desc: 'Accreditation and recognition of all student organizations on campus.' },
  { icon: FaChalkboardTeacher,title: 'Leadership Training',         desc: 'Seminars and workshops to develop effective student leaders.' },
  { icon: FaGavel,            title: 'Student Discipline',          desc: 'Maintaining campus peace and order through discipline policies.' },
  { icon: FaUserMd,           title: 'Counseling Services',         desc: 'Professional guidance and mental wellness support for students.' },
  { icon: FaMoneyCheckAlt,    title: 'Scholarship Assistance',      desc: 'Processing and management of various student financial grants.' },
  { icon: FaTheaterMasks,     title: 'Student Activities',          desc: 'Coordination of extracurricular and co-curricular campus events.' },
  { icon: FaGlobeAmericas,    title: 'Community Extension',         desc: 'Outreach programs fostering social responsibility and service.' },
  { icon: FaHandsHelping,     title: 'Volunteer Programs',          desc: 'Opportunities to serve the community and develop civic-mindedness.' },
];

const Services = () => {
  return (
    <section id="services" className="py-24 section-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.span
            className="section-label"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            What We Offer
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            Our Primary <span className="text-osas-primary">Services</span>
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            A comprehensive range of services designed to support your academic journey and holistic development.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="card p-6 flex flex-col group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              whileHover={{ y: -6 }}
            >
              <div className="icon-box w-14 h-14 rounded-xl mb-5 group-hover:bg-osas-primary group-hover:text-white">
                <service.icon className="text-2xl" />
              </div>
              <h3 className="text-base font-bold mb-2 text-osas-text font-poppins group-hover:text-osas-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-grow">
                {service.desc}
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-osas-primary text-xs font-semibold group-hover:gap-2.5 transition-all duration-200">
                Learn More
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Services;
