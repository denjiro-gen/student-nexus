import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiHome, HiUserGroup, HiCalendar, HiMenu, HiSpeakerphone } from 'react-icons/hi';
import { useLocation, useNavigate } from 'react-router-dom';


const navItems = [
  { name: 'Home', path: '/', icon: <HiHome className="text-2xl" /> },
  { name: 'Orgs', path: '/#organizations', icon: <HiUserGroup className="text-2xl" /> },
  { name: 'News', path: '/#announcements', icon: <HiSpeakerphone className="text-2xl" /> },
  { name: 'Menu', path: '#menu', icon: <HiMenu className="text-2xl" /> },
];

const extraLinks = [
  { name: 'Team', path: '/#staff', external: false },
  { name: 'Contact', path: '/#contact', external: false },
  { name: 'Submit Online', path: 'http://localhost:5174', external: true },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const [itemWidth, setItemWidth] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const currentPath = location.pathname + location.hash;
    const index = navItems.findIndex(item => {
      if (item.path === '/') return currentPath === '/';
      if (item.path === '#menu') return false;
      return currentPath.includes(item.path);
    });
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location]);

  useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        const totalWidth = containerRef.current.offsetWidth;
        const padding = 16; // px-2 is 8px on each side
        setItemWidth((totalWidth - padding) / navItems.length);
      };

      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, []);

  return (
    <>
      {/* Overlay for Extra Menu */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-[55]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Extra Menu Drawer */}
      <div className={`md:hidden fixed bottom-[100px] left-4 right-4 bg-white dark:bg-[#1e2430] rounded-2xl shadow-xl z-[55] transition-all duration-300 origin-bottom ${isMenuOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
        <div className="p-4 grid grid-cols-2 gap-2">
          {extraLinks.map(link => (
            <div
              key={link.name}
              className="px-4 py-3 bg-gray-50 dark:bg-[#0f1117] rounded-xl text-center text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer"
              onClick={() => {
                if (link.external) {
                  window.open(link.path, '_blank', 'noopener,noreferrer');
                } else {
                  navigate(link.path);
                }
                setIsMenuOpen(false);
              }}
            >
              {link.name}
            </div>
          ))}
        </div>
      </div>

      {/* Main Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-[60]">
        <div
          ref={containerRef}
          className="bg-osas-primary text-white dark:bg-[#1e2430] rounded-[32px] h-[72px] shadow-2xl flex items-center relative px-2"
        >

          {/* Floating Indicator with thick border for cutout effect */}
          {itemWidth > 0 && (
            <motion.div
              className="absolute top-[-26px] w-[64px] h-[64px] bg-osas-primary dark:bg-[#1e2430] rounded-full border-[8px] border-white dark:border-[#0f1117] z-10"
              initial={false}
              animate={{
                x: (activeIndex * itemWidth) + (itemWidth / 2) - 32 + 8,
              }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}

          {navItems.map((item, index) => {
            const isActive = activeIndex === index;
            const isMenu = item.name === 'Menu';

            return (
              <div
                key={item.name}
                className="flex-1 h-full flex flex-col items-center justify-center relative z-20 cursor-pointer"
                onClick={() => {
                  if (isMenu) {
                    setIsMenuOpen(!isMenuOpen);
                  } else {
                    navigate(item.path);
                    setActiveIndex(index);
                    setIsMenuOpen(false);
                  }
                }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <motion.div
                  initial={false}
                  animate={{
                    y: (isActive && !isMenu) ? -30 : (isMenu && isMenuOpen ? -4 : 0),
                    color: (isActive && !isMenu) ? '#ffffff' : '#a7f3d0' // a light green for inactive, white for active
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className={`relative ${(!isActive || isMenu) && 'dark:text-gray-400'}`}
                >
                  {item.icon}
                </motion.div>

                <motion.span
                  initial={false}
                  animate={{
                    opacity: (isActive && !isMenu) ? 1 : 0,
                    y: (isActive && !isMenu) ? 14 : 20,
                    scale: (isActive && !isMenu) ? 1 : 0.8
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="absolute text-[11px] font-semibold tracking-wide text-white"
                >
                  {item.name}
                </motion.span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default BottomNav;
