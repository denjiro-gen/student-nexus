import { motion } from 'framer-motion';
import {
  FaFileDownload, FaBook, FaIdCard, FaHandsHelping,
  FaExclamationCircle, FaStethoscope, FaArrowRight,
} from 'react-icons/fa';

const resources = [
  { name: 'Download Forms',            icon: FaFileDownload,     desc: 'Access all official OSAS forms and documents.' },
  { name: 'Student Handbook',          icon: FaBook,             desc: 'Read the updated university rules and guidelines.' },
  { name: 'Scholarship Requirements',  icon: FaIdCard,           desc: 'Check eligibility and download application forms.' },
  { name: 'Organization Accreditation',icon: FaHandsHelping,     desc: 'Guidelines for student org renewal and creation.' },
  { name: 'Complaint Form',            icon: FaExclamationCircle,desc: 'Submit formal grievances or disciplinary reports.' },
  { name: 'Counseling Appointment',    icon: FaStethoscope,      desc: 'Schedule a session with our guidance counselors.' },
];

const Resources = () => {
  return (
    <section id="resources" className="py-24 section-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="max-w-xl">
            <motion.span
              className="section-label"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Essential Links
            </motion.span>
            <motion.h2
              className="section-title"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
            >
              Student <span className="text-osas-primary">Resources</span>
            </motion.h2>
            <motion.p
              className="section-subtitle"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Quick access to important forms, handbooks, and student service portals.
            </motion.p>
          </div>
          <motion.button
            className="btn-ghost hidden md:inline-flex"
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            View All <FaArrowRight className="text-xs" />
          </motion.button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((resource, index) => (
            <motion.a
              href="#"
              key={index}
              className="card p-6 flex items-start gap-5 group hover:border-osas-primary/30"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <div className="icon-box w-12 h-12 rounded-xl shrink-0 group-hover:bg-osas-primary group-hover:text-white transition-all duration-300">
                <resource.icon className="text-xl" />
              </div>
              <div className="flex-grow">
                <h3 className="text-sm font-bold text-osas-text mb-1 font-poppins group-hover:text-osas-primary transition-colors">
                  {resource.name}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  {resource.desc}
                </p>
              </div>
              <FaArrowRight className="text-gray-300 group-hover:text-osas-primary transition-colors shrink-0 mt-0.5 group-hover:translate-x-1 transform duration-200" />
            </motion.a>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Resources;
