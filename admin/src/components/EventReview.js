import React, { useState } from 'react';

const EventReview = ({ onNavigate }) => {
  const [proposals, setProposals] = useState([
    { 
      id: 1, 
      title: 'Build with AI CDM 2026', 
      organization: 'Computer Student Society',
      date: 'June 19, 2026',
      venue: 'Function Hall',
      status: 'pending',
      attendees: 150,
      budget: '₱25,000'
    },
    { 
      id: 2, 
      title: 'Leadership Summit 2026', 
      organization: 'Supreme Student Government',
      date: 'July 5, 2026',
      venue: 'Auditorium',
      status: 'pending',
      attendees: 300,
      budget: '₱45,000'
    },
    { 
      id: 3, 
      title: 'Sports Fest Opening', 
      organization: 'Panthers Sports',
      date: 'August 12, 2026',
      venue: 'Sports Complex',
      status: 'pending',
      attendees: 500,
      budget: '₱80,000'
    }
  ]);

  const [selectedProposal, setSelectedProposal] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  const handleApprove = (id) => {
    setProposals(proposals.map(p => 
      p.id === id ? { ...p, status: 'approved' } : p
    ));
    setSelectedProposal(null);
    setReviewNote('');
  };

  const handleReject = (id) => {
    setProposals(proposals.map(p => 
      p.id === id ? { ...p, status: 'rejected' } : p
    ));
    setSelectedProposal(null);
    setReviewNote('');
  };

  return (
    <div className="event-review">
      <div className="page-header">
        <div>
          <h2>Event Review & Approval</h2>
          <p>Retrieve Pending Proposals • Review Details • Approve or Reject</p>
        </div>
        <button className="btn-secondary" onClick={() => onNavigate('dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="grid-2">
        {}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Pending Event Proposals</h3>
              <p className="card-subtitle">{proposals.filter(p => p.status === 'pending').length} awaiting review</p>
            </div>
          </div>

          <div className="proposals-list">
            {proposals.map(proposal => (
              <div 
                key={proposal.id}
                className="proposal-item"
                onClick={() => setSelectedProposal(proposal)}
                style={{
                  padding: '20px',
                  border: selectedProposal?.id === proposal.id ? '2px solid #4a8c66' : '2px solid #e0e0e0',
                  borderRadius: '12px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  background: selectedProposal?.id === proposal.id ? '#f5f7f5' : 'white',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>
                    {proposal.title}
                  </h4>
                  <span className={`badge badge-${proposal.status}`}>
                    {proposal.status}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  <strong>{proposal.organization}</strong>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#888' }}>
                  <span>📅 {proposal.date}</span>
                  <span>📍 {proposal.venue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Review Proposal Details</h3>
          </div>

          {selectedProposal ? (
            <div className="proposal-details">
              <div className="detail-section" style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '20px', fontWeight: '700', color: '#2d6f4a', marginBottom: '16px' }}>
                  {selectedProposal.title}
                </h4>
                
                <div className="detail-grid" style={{ display: 'grid', gap: '16px' }}>
                  <div className="detail-item">
                    <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
                      Organization
                    </span>
                    <p style={{ fontSize: '15px', color: '#333', marginTop: '4px', fontWeight: '500' }}>
                      {selectedProposal.organization}
                    </p>
                  </div>

                  <div className="detail-item">
                    <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
                      Event Date
                    </span>
                    <p style={{ fontSize: '15px', color: '#333', marginTop: '4px', fontWeight: '500' }}>
                      {selectedProposal.date}
                    </p>
                  </div>

                  <div className="detail-item">
                    <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
                      Venue
                    </span>
                    <p style={{ fontSize: '15px', color: '#333', marginTop: '4px', fontWeight: '500' }}>
                      {selectedProposal.venue}
                    </p>
                  </div>

                  <div className="detail-item">
                    <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
                      Expected Attendees
                    </span>
                    <p style={{ fontSize: '15px', color: '#333', marginTop: '4px', fontWeight: '500' }}>
                      {selectedProposal.attendees} students
                    </p>
                  </div>

                  <div className="detail-item">
                    <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
                      Budget
                    </span>
                    <p style={{ fontSize: '15px', color: '#333', marginTop: '4px', fontWeight: '500' }}>
                      {selectedProposal.budget}
                    </p>
                  </div>
                </div>
              </div>

              {}
              <div className="compliance-section" style={{ 
                background: '#f5f7f5', 
                padding: '20px', 
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>
                  Requirements Compliance
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#27ae60', fontSize: '18px' }}>✓</span>
                    <span style={{ fontSize: '14px' }}>Project Charter Submitted</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#27ae60', fontSize: '18px' }}>✓</span>
                    <span style={{ fontSize: '14px' }}>Budget Plan Approved</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#27ae60', fontSize: '18px' }}>✓</span>
                    <span style={{ fontSize: '14px' }}>Risk Assessment Complete</span>
                  </div>
                </div>
              </div>

              {}
              <div className="form-group">
                <label className="form-label">Review Notes</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Add your review notes here..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows="4"
                />
              </div>

              {}
              {selectedProposal.status === 'pending' && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button 
                    className="btn-success"
                    onClick={() => handleApprove(selectedProposal.id)}
                    style={{ flex: 1 }}
                  >
                    ✓ Approve Proposal
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleReject(selectedProposal.id)}
                    style={{ flex: 1 }}
                  >
                    ✗ Reject Proposal
                  </button>
                </div>
              )}

              {selectedProposal.status !== 'pending' && (
                <div style={{ 
                  padding: '16px', 
                  background: selectedProposal.status === 'approved' ? '#d4edda' : '#f8d7da',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: selectedProposal.status === 'approved' ? '#155724' : '#721c24',
                  marginTop: '24px'
                }}>
                  {selectedProposal.status === 'approved' ? '✓ Proposal Approved' : '✗ Proposal Rejected'}
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: '#888' 
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
              <p>Select a proposal to review details</p>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Workflow Process</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>1️⃣</div>
            <p style={{ fontSize: '13px', fontWeight: '600' }}>Retrieve Pending<br />Proposals</p>
          </div>
          <div style={{ fontSize: '24px', color: '#ddd' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>2️⃣</div>
            <p style={{ fontSize: '13px', fontWeight: '600' }}>Review Proposal<br />Details</p>
          </div>
          <div style={{ fontSize: '24px', color: '#ddd' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>3️⃣</div>
            <p style={{ fontSize: '13px', fontWeight: '600' }}>Approve or<br />Reject</p>
          </div>
          <div style={{ fontSize: '24px', color: '#ddd' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>4️⃣</div>
            <p style={{ fontSize: '13px', fontWeight: '600' }}>Update Status<br />& Notify</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventReview;
