import React, { useState } from 'react';
import { MdSearch, MdFilterList, MdEvent, MdBusiness, MdDescription } from 'react-icons/md';

const Search = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const mockResults = [
    {
      id: 1,
      type: 'Event',
      title: 'Build with AI CDM 2026',
      organization: 'Computer Student Society',
      date: 'June 19, 2026',
      status: 'Approved'
    },
    {
      id: 2,
      type: 'Organization',
      title: 'Computer Student Society',
      members: 120,
      president: 'El Cano',
      status: 'Active'
    },
    {
      id: 3,
      type: 'Document',
      title: 'Event Proposal - Leadership Summit',
      organization: 'Supreme Student Government',
      uploadDate: 'May 15, 2026',
      status: 'Pending'
    }
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    setTimeout(() => {
      const filtered = activeFilter === 'all' 
        ? mockResults 
        : mockResults.filter(r => r.type.toLowerCase() === activeFilter);
      setSearchResults(filtered);
      setIsSearching(false);
    }, 800);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Event':
        return <MdEvent size={24} color="#4a8c66" />;
      case 'Organization':
        return <MdBusiness size={24} color="#667eea" />;
      case 'Document':
        return <MdDescription size={24} color="#f39c12" />;
      default:
        return <MdSearch size={24} />;
    }
  };

  return (
    <div className="search-page">
      <div className="page-header">
        <div>
          <h2>Search Database</h2>
          <p>Search across events, organizations, and documents</p>
        </div>
        <button className="btn-secondary" onClick={() => onNavigate('dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <MdSearch 
                size={20} 
                color="#888" 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input 
                type="text"
                className="form-input"
                placeholder="Search for events, organizations, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{ paddingLeft: '48px' }}
              />
            </div>
            <button 
              className="btn-primary"
              onClick={handleSearch}
              disabled={isSearching}
              style={{ minWidth: '120px' }}
            >
              <MdSearch size={18} />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <MdFilterList size={20} color="#666" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>Filter:</span>
            {['all', 'event', 'organization', 'document'].map((filter) => (
              <button
                key={filter}
                className={activeFilter === filter ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 20px', fontSize: '13px' }}
                onClick={() => setActiveFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {}
        {searchResults.length > 0 && (
          <div className="search-results">
            <div style={{ 
              padding: '12px 16px', 
              background: '#f5f7f5', 
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#2d6f4a'
            }}>
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>

            {searchResults.map(result => (
              <div 
                key={result.id}
                className="card"
                style={{
                  padding: '20px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: '#f5f7f5', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getTypeIcon(result.type)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <span className="badge badge-pending" style={{ marginBottom: '8px', display: 'inline-block' }}>
                          {result.type}
                        </span>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>
                          {result.title}
                        </h4>
                      </div>
                      {result.status && (
                        <span className={`badge badge-${result.status.toLowerCase()}`}>
                          {result.status}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {result.organization && <div>Organization: <strong>{result.organization}</strong></div>}
                      {result.date && <div>Date: {result.date}</div>}
                      {result.members && <div>Members: {result.members}</div>}
                      {result.president && <div>President: {result.president}</div>}
                      {result.uploadDate && <div>Upload Date: {result.uploadDate}</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && !isSearching && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: '#888' 
          }}>
            <MdSearch size={64} color="#ddd" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>Start searching</p>
            <p style={{ fontSize: '13px' }}>Enter keywords to search for events, organizations, or documents</p>
          </div>
        )}

        {isSearching && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px'
          }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '20px', color: '#888' }}>Searching database...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
