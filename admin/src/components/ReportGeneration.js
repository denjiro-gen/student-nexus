import React, { useState } from 'react';

const ReportGeneration = ({ onNavigate }) => {
  const [reportType, setReportType] = useState('');
  const [filters, setFilters] = useState({
    organization: '',
    dateFrom: '',
    dateTo: '',
    status: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const reportTypes = [
    { id: 'events', name: 'Events Report', icon: '📅', description: 'Summary of all events and proposals' },
    { id: 'organizations', name: 'Organizations Report', icon: '🏢', description: 'Organization information and statistics' },
    { id: 'compliance', name: 'Compliance Report', icon: '✓', description: 'Compliance status across all organizations' },
    { id: 'attendance', name: 'Attendance Report', icon: '👥', description: 'Event attendance and participation data' },
    { id: 'financial', name: 'Financial Report', icon: '💰', description: 'Budget and financial summaries' },
    { id: 'audit', name: 'Audit Log Report', icon: '📋', description: 'System activity and audit trails' }
  ];

  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    
    setTimeout(() => {
      setGeneratedReport({
        type: reportTypes.find(r => r.id === reportType)?.name || 'Report',
        generatedAt: new Date().toLocaleString(),
        recordCount: Math.floor(Math.random() * 100) + 50,
        fileSize: '2.4 MB'
      });
      setIsGenerating(false);
    }, 2000);
  };

  const handleExportPDF = () => {
    alert('PDF export functionality would be implemented here');
  };

  const handleExportExcel = () => {
    alert('Excel export functionality would be implemented here');
  };

  return (
    <div className="report-generation">
      <div className="page-header">
        <div>
          <h2>Report Generation</h2>
          <p>Select Report Type & Filters • Generate Report • Export/Download</p>
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
              <h3 className="card-title">Select Report Type</h3>
              <p className="card-subtitle">Choose the type of report to generate</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {reportTypes.map(type => (
              <div
                key={type.id}
                onClick={() => setReportType(type.id)}
                style={{
                  padding: '16px 20px',
                  border: reportType === type.id ? '2px solid #4a8c66' : '2px solid #e0e0e0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: reportType === type.id ? '#f5f7f5' : 'white',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
                onMouseEnter={(e) => {
                  if (reportType !== type.id) e.currentTarget.style.borderColor = '#c0c0c0';
                }}
                onMouseLeave={(e) => {
                  if (reportType !== type.id) e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <div style={{ fontSize: '36px' }}>{type.icon}</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>
                    {type.name}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                    {type.description}
                  </p>
                </div>
                {reportType === type.id && (
                  <div style={{ color: '#4a8c66', fontSize: '20px' }}>✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {}
        <div>
          {}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Report Filters</h3>
                <p className="card-subtitle">Customize your report parameters</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Organization (Optional)</label>
              <select 
                className="form-select"
                value={filters.organization}
                onChange={(e) => setFilters({ ...filters, organization: e.target.value })}
              >
                <option value="">All Organizations</option>
                <option value="css">Computer Student Society</option>
                <option value="ssg">Supreme Student Government</option>
                <option value="panthers">Panthers Sports</option>
                <option value="engineering">Engineering Society</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date From</label>
              <input 
                type="date"
                className="form-input"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date To</label>
              <input 
                type="date"
                className="form-input"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button 
              className="btn-primary"
              onClick={handleGenerateReport}
              disabled={!reportType || isGenerating}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {isGenerating ? '⏳ Generating Report...' : '📊 Generate Report'}
            </button>
          </div>

          {}
          {generatedReport && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Generated Report</h3>
                  <p className="card-subtitle">Report is ready for download</p>
                </div>
              </div>

              <div style={{ 
                padding: '24px', 
                background: '#f5f7f5', 
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>📄</div>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#2d6f4a', marginBottom: '8px' }}>
                    {generatedReport.type}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#666' }}>
                    Generated: {generatedReport.generatedAt}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '13px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: '700', color: '#2d6f4a', fontSize: '20px' }}>
                      {generatedReport.recordCount}
                    </div>
                    <div style={{ color: '#888' }}>Records</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: '700', color: '#2d6f4a', fontSize: '20px' }}>
                      {generatedReport.fileSize}
                    </div>
                    <div style={{ color: '#888' }}>File Size</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-primary"
                  onClick={handleExportPDF}
                  style={{ flex: 1 }}
                >
                  📥 Export as PDF
                </button>
                <button 
                  className="btn-secondary"
                  onClick={handleExportExcel}
                  style={{ flex: 1 }}
                >
                  📊 Export as Excel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Report Archive</h3>
            <p className="card-subtitle">Previously generated reports</p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report Type</th>
                <th>Generated Date</th>
                <th>Records</th>
                <th>Generated By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ fontWeight: '600' }}>Compliance Report</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Monthly Summary</div>
                </td>
                <td>May 20, 2026</td>
                <td>48 records</td>
                <td>Admin User</td>
                <td>
                  <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }}>
                    Download
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div style={{ fontWeight: '600' }}>Events Report</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Q2 2026</div>
                </td>
                <td>April 15, 2026</td>
                <td>87 records</td>
                <td>Admin User</td>
                <td>
                  <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }}>
                    Download
                  </button>
                </td>
              </tr>
              <tr>
                <td>
                  <div style={{ fontWeight: '600' }}>Financial Report</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>March Budget</div>
                </td>
                <td>March 30, 2026</td>
                <td>35 records</td>
                <td>Admin User</td>
                <td>
                  <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }}>
                    Download
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportGeneration;
