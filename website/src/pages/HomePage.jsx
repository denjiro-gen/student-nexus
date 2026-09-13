import React from 'react';
import HeroCarousel from '../components/HeroCarousel';
import WelcomeSection from '../components/WelcomeSection';
import OrganizationsSection from '../components/OrganizationsSection';
import Announcements from '../components/Announcements';
import Staff from '../components/Staff';
import Contact from '../components/Contact';

const HomePage = () => {
  return (
    <div className="flex-grow">
      <HeroCarousel />
      <WelcomeSection />
      <OrganizationsSection />
      <Announcements />
      <Staff />
      <Contact />
    </div>
  );
};

export default HomePage;
