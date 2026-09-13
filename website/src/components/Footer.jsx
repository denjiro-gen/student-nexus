import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-scroll';
import logoImg from '../assets/logo.png';

const quickLinks = [
  { label: 'Home',            to: 'home' },
  { label: 'About OSAS',      to: 'about' },
  { label: 'Announcements',   to: 'announcements' },
];

const resourceLinks = [
  'Student Handbook',
  'Downloadable Forms',
  'Scholarship Application',
  'Organization Manual',
  'Privacy Policy',
];

const socials = [
  { icon: FaFacebookF,  href: '#', label: 'Facebook' },
  { icon: FaTwitter,    href: '#', label: 'Twitter' },
  { icon: FaInstagram,  href: '#', label: 'Instagram' },
  { icon: FaLinkedinIn, href: '#', label: 'LinkedIn' },
];

const contactItems = [
  { icon: FaMapMarkerAlt, label: 'Address', value: 'Student Center Building, Main Campus' },
  { icon: FaPhoneAlt,     label: 'Phone',   value: '(02) 1234 – 5678' },
  { icon: FaEnvelope,     label: 'Email',   value: 'osas@university.edu' },
];

const Footer = () => {
  return (
    <footer className="bg-osas-primary text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">

        {/* Top grid — responsive: stacked on mobile, 2-col on tablet, 3-col on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-8 lg:gap-10 mb-10">

          {/* Brand — full width on mobile, span 2 on md if needed */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoImg} alt="OSAS Logo" className="h-10 w-auto object-contain" />
              <div>
                <span className="font-poppins font-bold text-lg text-white block leading-tight">OSAS</span>
                <span className="text-white/50 text-[11px] leading-tight hidden sm:block">Office of Student Affairs Services</span>
              </div>
            </div>
            <p className="text-white/65 text-sm leading-relaxed mb-5 max-w-xs">
              Empowering students through quality services, holistic development, and unwavering support for academic success.
            </p>
            {/* Social Icons */}
            <div className="flex gap-2.5">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-osas-accent hover:scale-110 transition-all duration-200 text-sm"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-poppins font-bold text-xs uppercase tracking-widest mb-4 pb-2 border-b border-white/10">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    smooth={true}
                    duration={400}
                    offset={-72}
                    className="text-white/65 text-sm hover:text-osas-accent cursor-pointer transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="inline-block w-1 h-1 rounded-full bg-osas-accent/50 group-hover:bg-osas-accent transition-colors shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>



          {/* Contact Info */}
          <div>
            <h4 className="text-white font-poppins font-bold text-xs uppercase tracking-widest mb-4 pb-2 border-b border-white/10">
              Contact Info
            </h4>
            <ul className="flex flex-col gap-4">
              {contactItems.map(({ icon: Icon, label, value }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 bg-white/10 p-1.5 rounded-lg shrink-0">
                    <Icon className="text-osas-accent text-xs" />
                  </div>
                  <div>
                    <p className="text-white/45 text-[10px] font-semibold uppercase tracking-widest mb-0.5">{label}</p>
                    <p className="text-white/80 text-sm">{value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/40">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} Office of Student Affairs Services. All rights reserved.
          </p>
          <p className="text-center sm:text-right">Built with care for student success.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
