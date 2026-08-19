// Renderer process script
console.log('Student Nexus Desktop App loaded');

// Add any interactive functionality here
document.addEventListener('DOMContentLoaded', () => {
  // CTA Button click handler
  const ctaButton = document.querySelector('.cta-button');
  if (ctaButton) {
    ctaButton.addEventListener('click', () => {
      console.log('Explore Features clicked');
      // Add navigation logic here
    });
  }

  // Navigation link handlers
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href');
      console.log('Navigate to:', target);
      // Add navigation logic here
    });
  });
});
