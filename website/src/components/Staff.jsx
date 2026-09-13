import { motion } from 'framer-motion';
import { FaEnvelope, FaLinkedin } from 'react-icons/fa';

const dean = {
  name: 'Ms. Alyssa Marie S. Baylon, LPT',
  position: 'Head of the Student Affairs',
  email: 'allysamarie@cdm.edu.ph',
  image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzzntoNdAqVh16b25nQC1YT-Ae_wgL48J4w6L8NuJ_aYuIhkFoSqjuwTA&s=10',
};

const Staff = () => {
  return (
    <section id="staff" className="py-24 section-gray relative">
      {/* Decorative lively blobs */}
      <div className="blob w-96 h-96 bg-osas-primary/20 top-0 left-0 -translate-x-1/2 -translate-y-1/2 animate-float"></div>
      <div className="blob w-[30rem] h-[30rem] bg-osas-accent/10 bottom-0 right-0 translate-x-1/3 translate-y-1/3 animate-float-slow"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Dean ── */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.span
            className="section-label"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Leadership
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            Meet Our <span className="text-osas-primary dark:text-osas-accent">Leader</span>
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Guiding the Office of Student Affairs Services to foster a vibrant campus community.
          </motion.p>
        </div>

        {/* Profile card */}
        <motion.div
          className="max-w-sm mx-auto card"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative h-80 overflow-hidden">
            <img
              src={dean.image}
              alt={dean.name}
              className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-xl font-extrabold text-white font-poppins mb-0.5">{dean.name}</h3>
              <p className="text-osas-accent text-sm font-semibold">{dean.position}</p>
            </div>
          </div>
          <div className="p-5 flex justify-between items-center bg-white dark:bg-[#1e2430]">
            <p className="text-gray-500 dark:text-white/80 text-sm truncate">{dean.email}</p>
            <div className="flex gap-2 shrink-0">
              <a
                href={`mailto:${dean.email}`}
                className="icon-box w-9 h-9 rounded-xl hover:bg-osas-primary hover:text-white"
              >
                <FaEnvelope className="text-sm" />
              </a>
              <a
                href="#"
                className="icon-box w-9 h-9 rounded-xl hover:bg-osas-primary hover:text-white"
              >
                <FaLinkedin className="text-sm" />
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Staff;
