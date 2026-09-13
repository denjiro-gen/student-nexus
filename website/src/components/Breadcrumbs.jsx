import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items }) {
  // items format: [{ label: 'Home', path: '/' }, { label: 'Organizations' }, { label: 'ITSS', path: '/organization/1' }]
  // If path is not provided, it's not clickable (active page)
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-osas-primary transition-colors flex items-center">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.path ? (
            <Link to={item.path} className="hover:text-osas-primary transition-colors font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="text-osas-primary font-bold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
