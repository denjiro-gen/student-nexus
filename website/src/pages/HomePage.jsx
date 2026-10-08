import React from 'react';
import HeroCarousel from '../components/HeroCarousel';
import WelcomeSection from '../components/WelcomeSection';
import OrganizationsSection from '../components/OrganizationsSection';
import Announcements from '../components/Announcements';
import Staff from '../components/Staff';
import Contact from '../components/Contact';
import CalendarSection from '../components/CalendarSection';

const HomePage = () => {
  return (
    <div className="flex-grow">
      <HeroCarousel />
      <WelcomeSection />
      <OrganizationsSection />
      <Announcements />
      <CalendarSection />
      <Staff />
      <Contact />
    </div>
  );
};

export default HomePage;
