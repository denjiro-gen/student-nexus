import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import PageTransition from './components/PageTransition';

// Pages
import HomePage from './pages/HomePage';
import OrganizationPage from './pages/OrganizationPage';
import EventArticlePage from './pages/EventArticlePage';
import SuccessPage from './pages/SuccessPage';

function AppContent() {
  const location = useLocation();
  
  return (
    <div className="flex flex-col min-h-screen bg-osas-secondary-bg overflow-hidden">
      <Header />
      <main className="flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="/organization/:id" element={<PageTransition><OrganizationPage /></PageTransition>} />
            <Route path="/event/:id" element={<PageTransition><EventArticlePage /></PageTransition>} />
            <Route path="/success" element={<PageTransition><SuccessPage /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
