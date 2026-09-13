import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import heroBg from '../images/DSC_3272.JPG';

const Hero = () => {
  return (
    <section className="relative w-full h-[85vh] min-h-[600px] mt-16 md:mt-[72px] flex items-center">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-osas-secondary/90 via-osas-primary/80 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-osas-accent/20 text-white font-semibold text-sm mb-4 border border-osas-accent/30 tracking-wider uppercase backdrop-blur-sm shadow-sm">
            Colegio de Montalban
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-poppins font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
            Student Nexus
          </h1>
          <p className="text-base md:text-xl text-white/95 mb-8 leading-relaxed font-inter drop-shadow-md">
            Student Nexus is dedicated to developing proactive, 
            responsible, and empowered student leaders by providing quality student services, 
            leadership opportunities, and holistic development programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#organizations" className="btn-primary text-center text-base px-8 py-3.5 bg-osas-accent hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition-colors">
              Explore Organizations
            </a>
            <a href="#services" className="bg-white/10 text-center border border-white/30 text-white hover:bg-white hover:text-osas-primary px-8 py-3.5 rounded-xl font-semibold text-base transition-colors duration-200 backdrop-blur-sm">
              Our Services
            </a>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative Wave or Shape */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-osas-secondary-bg to-transparent" />
    </section>
  );
};

export default Hero;
