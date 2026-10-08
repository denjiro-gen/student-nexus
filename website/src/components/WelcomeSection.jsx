import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaHandsHelping, FaAward } from 'react-icons/fa';
import { supabase } from '../config/supabase';
import cdmImg from '../images/cdm.jpg';

const features = [
  {
    icon: FaUsers,
    title: 'Student Organizations',
    description: 'Manage accredited student organizations and leadership development across campus.',
  },
  {
    icon: FaHandsHelping,
    title: 'Guidance & Counseling',
    description: 'Counseling, mental wellness programs, and personalized student support services.',
  },
  {
    icon: FaAward,
    title: 'Scholarships & Assistance',
    description: 'Scholarships, grants, and financial programs to support your academic journey.',
  },
];

const WelcomeSection = () => {
  const [orgCount, setOrgCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      if (count !== null) setOrgCount(count);
    };
    fetchCount();
  }, []);

  return (
    <section id="about" className="py-24 section-white relative overflow-hidden">
      {/* Decorative lively blobs */}
      <div className="blob w-80 h-80 bg-osas-accent/15 -top-20 -left-20 animate-float-slow"></div>
      <div className="blob w-96 h-96 bg-osas-primary/10 bottom-0 right-0 translate-x-1/3 translate-y-1/3 animate-float"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left:
          
          Image */}
          <motion.div
            className="lg:w-1/2 w-full"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-100">
              <img
                src={cdmImg}
                alt="Students collaborating"
                className="w-full h-[520px] object-cover"
              />
              {/* Stat badge */}
              <div className="absolute bottom-6 left-6 bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-4 border border-gray-100">
                <div className="icon-box w-12 h-12 rounded-xl">
                  <FaUsers className="text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold font-poppins text-osas-text">{orgCount}</p>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Student Orgs</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Text */}
          <motion.div
            className="lg:w-1/2 w-full"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">About Student Nexus</span>
            <h2 className="section-title">
              Welcome to <span className="text-osas-primary">Student Nexus</span>
            </h2>
            <p className="section-subtitle mb-10">
              We are dedicated to fostering an environment that enhances your holistic development — providing quality programs, leadership opportunities, guidance, and unwavering support for your academic success.
            </p>

            <div className="flex flex-col gap-7 mb-10">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-5">
                  <div className="icon-box shrink-0">
                    <feature.icon className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-osas-text mb-1 font-poppins">
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <button className="btn-primary">
                Discover Our Mission
              </button>
              <a
                href="https://submission-portal-cdm.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                Submit Online →
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
