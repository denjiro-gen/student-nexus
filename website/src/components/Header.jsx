import { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import { FaSun, FaMoon } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/logo.png';

const navLinks = [
  { name: 'Home',          to: '/' },
  { name: 'Organizations', to: '/#organizations' },
  { name: 'Announcements', to: '/#announcements' },
  { name: 'Team',          to: '/#staff' },
  { name: 'Contact',       to: '/#contact' },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { dark, toggle }            = useTheme();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' && location.hash === '';
    return location.hash === path.substring(1);
  };

  return (
    <header
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white dark:bg-[#0f1117] shadow-md py-2'
          : 'bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-md py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">

          {/* Logo */}
          <RouterLink to="/" className="flex items-center gap-3 cursor-pointer">
            <img
              src={logoImg}
              alt="OSAS Logo"
              className="h-9 md:h-10 w-auto object-contain"
            />
            <div>
              <span className="font-poppins font-bold text-base md:text-lg text-osas-primary dark:text-osas-accent leading-tight block">
                Student Nexus
              </span>
              <span className="text-[11px] text-gray-400 hidden md:block leading-tight">
                Colegio de Montalban
              </span>
            </div>
          </RouterLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.to}
                className={`relative px-3 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 group ${
                  isActive(link.to)
                    ? 'text-osas-primary dark:text-osas-accent'
                    : 'text-gray-600 dark:text-gray-300 hover:text-osas-primary dark:hover:text-osas-accent'
                }`}
              >
                {link.name}
                <span 
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-osas-primary dark:bg-osas-accent transition-all duration-300 rounded-full ${
                    isActive(link.to) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} 
                />
              </a>
            ))}

            {/* Submit Online Portal Link */}
            <a
              href="https://submission-portal-cdm.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-4 py-1.5 bg-osas-primary text-white text-sm font-semibold rounded-lg hover:bg-osas-primary/90 transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              Submit Online
            </a>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggle}
              className="ml-2 p-2 rounded-lg text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {dark ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
            </button>
          </nav>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {dark ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
            </button>
          </div>
        </div>
      </div>

    </header>
  );
};

export default Header;
