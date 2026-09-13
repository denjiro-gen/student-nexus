import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Users } from 'lucide-react';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo.png'; // Placeholder logo

export default function OrganizationsSection() {
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    // If the database isn't ready or fails, we will still show a layout 
    // but ideally we fetch from the real table.
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name');
      
    if (!error && data) {
      setOrganizations(data);
    }
  };

  // If no orgs are loaded (e.g. database not seeded), provide some dummy ones
  const displayOrgs = organizations.length > 0 ? organizations : Array.from({ length: 7 }).map((_, i) => ({
    id: `placeholder-${i}`,
    name: `Student Organization ${i + 1}`,
    type: 'Recognized Organization',
    description: 'This is a placeholder description for the recognized student organization.',
    acronym: `SO${i+1}`
  }));

  return (
    <section id="organizations" className="py-20 px-5 bg-osas-secondary-bg">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-osas-primary mb-4 font-poppins">
            Recognized Student Organizations
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore the diverse student organizations available on campus. Get involved, develop your leadership skills, and make a difference.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayOrgs.map((org, index) => (
            <Link to={`/organization/${org.id}`} key={org.id}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-osas-accent transition-all duration-300 h-full flex flex-col group cursor-pointer"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-osas-primary/5 mb-6 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                  <img src={org.logo_url || logoImg} alt={org.name} className={`object-contain ${org.logo_url ? 'w-full h-full' : 'w-10 h-10 opacity-80'}`} />
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-osas-primary transition-colors">
                  {org.name}
                </h3>
                <p className="text-xs font-semibold text-osas-accent uppercase tracking-wider mb-4">
                  {org.type || 'Student Organization'}
                </p>
                
                <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-grow">
                  {org.description || 'No description available for this organization.'}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center text-sm font-medium text-osas-primary group-hover:text-osas-accent transition-colors">
                  View Details
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
