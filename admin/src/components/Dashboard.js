import React from 'react';
import { MdEventNote, MdVerifiedUser, MdSearch, MdAssessment, MdTrendingUp, MdCheckCircle } from 'react-icons/md';

const Dashboard = ({ onNavigate }) => {
  const stats = [
    { label: 'Pending Event Proposals', value: '12', change: '+3 this week', positive: false },
    { label: 'Active Organizations', value: '48', change: '+2 new', positive: true },
    { label: 'Compliance Rate', value: '94%', change: '+2%', positive: true },
    { label: 'Reports Generated', value: '156', change: 'This month', positive: true }
  ];

  const recentActivities = [
    { id: 1, action: 'Event Proposal Submitted', org: 'Computer Student Society', time: '10 mins ago', status: 'pending' },
    { id: 2, action: 'Organization Approved', org: 'Panthers Sports', time: '1 hour ago', status: 'approved' },
    { id: 3, action: 'Compliance Update Required', org: 'Supreme Student Government', time: '2 hours ago', status: 'warning' },
    { id: 4, action: 'Event Completed', org: 'Engineering Society', time: '5 hours ago', status: 'approved' }
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Welcome to OSAS Admin Dashboard</h2>
        <p>Administrative Management, Approval, and Shared Services Workflow</p>
      </div>

      {}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-number">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div className={`stat-change ${stat.positive ? 'positive' : ''}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Choose Function</h3>
            <p className="card-subtitle">Select a workflow to begin</p>
          </div>
        </div>
        
        <div className="grid-4">
          <div 
            className="function-card"
            onClick={() => onNavigate('event-review')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '32px 24px',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <MdEventNote size={48} style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Event Review</h4>
            <p style={{ fontSize: '13px', opacity: '0.9' }}>Retrieve Pending Proposals</p>
          </div>

          <div 
            className="function-card"
            onClick={() => onNavigate('org-compliance')}
            style={{
              background: 'linear-gradient(135deg, #4a8c66 0%, #5a9d76 100%)',
              color: 'white',
              padding: '32px 24px',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(74, 140, 102, 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <MdVerifiedUser size={48} style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Org & Compliance</h4>
            <p style={{ fontSize: '13px', opacity: '0.9' }}>Manage Organization Information</p>
          </div>

          <div 
            className="function-card"
            onClick={() => onNavigate('search')}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '32px 24px',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <MdSearch size={48} style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Search</h4>
            <p style={{ fontSize: '13px', opacity: '0.9' }}>Search Database</p>
          </div>

          <div 
            className="function-card"
            onClick={() => onNavigate('report-generation')}
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              padding: '32px 24px',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <MdAssessment size={48} style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Report Generation</h4>
            <p style={{ fontSize: '13px', opacity: '0.9' }}>Select Report Type & Filters</p>
          </div>
        </div>
      </div>

      {}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Activities</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Organization</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map(activity => (
                <tr key={activity.id}>
                  <td>{activity.action}</td>
                  <td>{activity.org}</td>
                  <td>{activity.time}</td>
                  <td>
                    <span className={`badge badge-${activity.status}`}>
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
