import React, { useState } from 'react';

const OrgCompliance = ({ onNavigate }) => {
  const [organizations, setOrganizations] = useState([
    { 
      id: 1, 
      name: 'Computer Student Society', 
      president: 'El Cano',
      advisor: 'John Lawrence',
      members: 120,
      compliance: 98,
      status: 'compliant',
      lastUpdate: '2 days ago'
    },
    { 
      id: 2, 
      name: 'Supreme Student Government', 
      president: 'Joy El Cano',
      advisor: 'John Lawrence',
      members: 45,
      compliance: 95,
      status: 'compliant',
      lastUpdate: '1 week ago'
    },
    { 
      id: 3, 
      name: 'Panthers Sports', 
      president: 'Joy El Cano',
      advisor: 'John Lawrence',
      members: 85,
      compliance: 75,
      status: 'warning',
      lastUpdate: '3 weeks ago'
    },
    { 
      id: 4, 
      name: 'Engineering Society', 
      president: 'Maria Santos',
      advisor: 'Dr. Rodriguez',
      members: 95,
      compliance: 100,
      status: 'compliant',
      lastUpdate: '1 day ago'
    }
  ]);

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const handleEdit = (org) => {
    setSelectedOrg(org);
    setFormData({ ...org });
    setIsEditing(true);
  };

  const handleSave = () => {
    setOrganizations(organizations.map(org => 
      org.id === formData.id ? formData : org
    ));
    setIsEditing(false);
    setSelectedOrg(formData);
  };

  const handleVerifyCompliance = (id) => {
    setOrganizations(organizations.map(org => 
      org.id === id ? { ...org, compliance: 100, status: 'compliant' } : org
    ));
  };

  return (
    <div className="org-compliance">
      <div className="page-header">
        <div>
          <h2>Organization & Compliance Management</h2>
          <p>Manage Organization Information • Update Records • Verify Compliance</p>
        </div>
        <button className="btn-secondary" onClick={() => onNavigate('dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      {}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ borderLeftColor: '#4a8c66' }}>
          <div className="stat-number">{organizations.length}</div>
          <div className="stat-label">Total Organizations</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
          <div className="stat-number">{organizations.filter(o => o.status === 'compliant').length}</div>
          <div className="stat-label">Compliant</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
          <div className="stat-number">{organizations.filter(o => o.status === 'warning').length}</div>
          <div className="stat-label">Needs Attention</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#667eea' }}>
          <div className="stat-number">{organizations.reduce((sum, o) => sum + o.members, 0)}</div>
          <div className="stat-label">Total Members</div>
        </div>
      </div>

      <div className="grid-2">
        {}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Registered Organizations</h3>
              <p className="card-subtitle">Manage and monitor all student organizations</p>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Compliance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => (
                  <tr 
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{org.name}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{org.members} members</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '6px', 
                          background: '#e0e0e0', 
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${org.compliance}%`, 
                            height: '100%', 
                            background: org.compliance >= 90 ? '#27ae60' : '#f39c12',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{org.compliance}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${org.status}`}>
                        {org.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-secondary"
                        style={{ padding: '6px 16px', fontSize: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(org);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Organization Details</h3>
            {selectedOrg && !isEditing && (
              <button 
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
                onClick={() => handleEdit(selectedOrg)}
              >
                Edit Information
              </button>
            )}
          </div>

          {selectedOrg ? (
            isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label className="form-label">Organization Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">President</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={formData.president}
                    onChange={(e) => setFormData({ ...formData, president: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Advisor</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={formData.advisor}
                    onChange={(e) => setFormData({ ...formData, advisor: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Number of Members</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={formData.members}
                    onChange={(e) => setFormData({ ...formData, members: parseInt(e.target.value) })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button 
                    className="btn-primary"
                    onClick={handleSave}
                    style={{ flex: 1 }}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({});
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="org-details">
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '22px', fontWeight: '700', color: '#2d6f4a', marginBottom: '20px' }}>
                    {selectedOrg.name}
                  </h4>

                  <div style={{ display: 'grid', gap: '20px' }}>
                    <div className="detail-row">
                      <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
                        President
                      </span>
                      <p style={{ fontSize: '15px', color: '#333', marginTop: '6px', fontWeight: '500' }}>
                        {selectedOrg.president}
                      </p>
                    </div>

                    <div className="detail-row">
                      <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
                        Advisor
                      </span>
                      <p style={{ fontSize: '15px', color: '#333', marginTop: '6px', fontWeight: '500' }}>
                        {selectedOrg.advisor}
                      </p>
                    </div>

                    <div className="detail-row">
                      <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
                        Total Members
                      </span>
                      <p style={{ fontSize: '15px', color: '#333', marginTop: '6px', fontWeight: '500' }}>
                        {selectedOrg.members} active members
                      </p>
                    </div>

                    <div className="detail-row">
                      <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
                        Compliance Rate
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                        <div style={{ flex: 1, height: '10px', background: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${selectedOrg.compliance}%`, 
                            height: '100%', 
                            background: selectedOrg.compliance >= 90 ? '#27ae60' : '#f39c12',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#2d6f4a' }}>
                          {selectedOrg.compliance}%
                        </span>
                      </div>
                    </div>

                    <div className="detail-row">
                      <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
                        Last Updated
                      </span>
                      <p style={{ fontSize: '15px', color: '#333', marginTop: '6px', fontWeight: '500' }}>
                        {selectedOrg.lastUpdate}
                      </p>
                    </div>
                  </div>
                </div>

                {}
                <div style={{ 
                  background: '#f5f7f5', 
                  padding: '20px', 
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>
                    Compliance Requirements
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#27ae60', fontSize: '18px' }}>✓</span>
                      <span style={{ fontSize: '14px' }}>Organization Constitution</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: '#27ae60', fontSize: '18px' }}>✓</span>
                      <span style={{ fontSize: '14px' }}>Officer List Updated</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: selectedOrg.compliance >= 90 ? '#27ae60' : '#f39c12', fontSize: '18px' }}>
                        {selectedOrg.compliance >= 90 ? '✓' : '⚠'}
                      </span>
                      <span style={{ fontSize: '14px' }}>Activity Plan Submitted</span>
                    </div>
                  </div>
                </div>

                {selectedOrg.compliance < 100 && (
                  <button 
                    className="btn-success"
                    onClick={() => handleVerifyCompliance(selectedOrg.id)}
                    style={{ width: '100%' }}
                  >
                    Set Compliance Status → Complete
                  </button>
                )}

                {selectedOrg.compliance === 100 && (
                  <div style={{ 
                    padding: '16px', 
                    background: '#d4edda',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#155724'
                  }}>
                    ✓ Fully Compliant
                  </div>
                )}
              </div>
            )
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: '#888' 
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏢</div>
              <p>Select an organization to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgCompliance;
