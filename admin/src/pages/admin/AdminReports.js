import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Filter, Loader, FileText,
  CheckCircle, XCircle, Clock, Users, Building2, ShieldCheck,
  TrendingUp, BarChart3, Printer
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../config/supabase';

const GREEN = '#03632B';
const GREEN_LIGHT = '#f0fdf4';

const Page = styled.div`max-width: 1200px; margin: 0 auto;`;

const Header = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 22px; font-weight: 700; color: #111827;
  display: flex; align-items: center; gap: 10px;
`;

const Controls = styled.div`
  display: flex; gap: 12px; background: #ffffff; padding: 16px;
  border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 24px;
  align-items: center; flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 8px 12px; border-radius: 8px; border: 1px solid #d1d5db;
  font-size: 13px; outline: none; min-width: 220px; cursor: pointer;
  &:focus { border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(3,99,43,0.08); }
`;

const Btn = styled.button`
  background: ${p => p.$secondary ? '#f3f4f6' : GREEN};
  color: ${p => p.$secondary ? '#374151' : '#fff'};
  border: ${p => p.$secondary ? '1px solid #d1d5db' : 'none'};
  padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
  display: flex; align-items: center; gap: 7px; cursor: pointer; transition: opacity 0.2s;
  &:hover { opacity: 0.88; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
`;

const StatCard = styled.div`
  background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 18px 20px; display: flex; align-items: center; gap: 14px;

  .icon { width: 42px; height: 42px; border-radius: 10px; background: ${p => p.$bg || GREEN_LIGHT};
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .value { font-size: 24px; font-weight: 800; color: #111827; }
  .label { font-size: 11px; color: #6b7280; margin-top: 2px; }
`;

const Card = styled.div`
  background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;
  overflow: hidden; margin-bottom: 24px;
`;

const CardHeader = styled.div`
  padding: 16px 20px; font-size: 14px; font-weight: 700; color: #111827;
  border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px;
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse;
  th {
    background: #f9fafb; padding: 11px 18px; text-align: left; font-size: 11px;
    font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 1px solid #e5e7eb;
  }
  td { padding: 13px 18px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f9fafb; }
`;

const Badge = styled.span`
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
  background: ${p => ({
    approved: '#dcfce7', pending: '#fef9c3', rejected: '#fee2e2',
    completed: '#dbeafe', cancelled: '#f3f4f6', active: '#dcfce7', inactive: '#fee2e2',
    submitted: '#ede9fe', reviewed: '#dbeafe',
  }[p.$s] || '#f3f4f6')};
  color: ${p => ({
    approved: '#15803d', pending: '#a16207', rejected: '#dc2626',
    completed: '#1d4ed8', cancelled: '#6b7280', active: '#15803d', inactive: '#dc2626',
    submitted: '#7c3aed', reviewed: '#1d4ed8',
  }[p.$s] || '#374151')};
`;

const Empty = styled.div`
  padding: 48px; text-align: center; color: #9ca3af;
  svg { margin: 0 auto 12px; display: block; opacity: 0.4; }
  p { font-size: 14px; margin: 0; }
`;

const printReport = (title, htmlContent) => {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
        h1 { color: #03632B; font-size: 22px; margin-bottom: 4px; }
        .sub { color: #6b7280; font-size: 12px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-weight: 700; border: 1px solid #e5e7eb; }
        td { padding: 8px 12px; border: 1px solid #e5e7eb; }
        .stats { display: flex; gap: 20px; margin-bottom: 24px; }
        .stat { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 18px; flex: 1; }
        .stat .val { font-size: 28px; font-weight: 800; color: #03632B; }
        .stat .lbl { font-size: 11px; color: #6b7280; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>
      <h1>${title}</h1>
      <div class="sub">Generated on: ${format(new Date(), 'MMMM d, yyyy h:mm a')} | Student Nexus – OSAS</div>
      ${htmlContent}
      <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `);
  win.document.close();
};

const REPORT_TYPES = [
  { value: 'events_summary',    label: 'Events Summary',            icon: FileText },
  { value: 'compliance_status', label: 'Organization Compliance',   icon: ShieldCheck },
  { value: 'user_activity',     label: 'User & Student Leaders',    icon: Users },
  { value: 'org_overview',      label: 'Organization Overview',     icon: Building2 },
];

export default function AdminReports() {
  const [reportType, setReportType] = useState('events_summary');
  const [loading, setLoading]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadReport(reportType);
  }, [reportType]);

  const loadReport = async (type) => {
    setLoading(true);
    setReportData(null);
    try {
      if (type === 'events_summary') {
        const { data } = await supabase
          .from('event_proposals')
          .select(`id, title, status, event_date, venue, expected_attendees, budget_amount, created_at,
            organization:organizations(name, acronym),
            submitter:users!event_proposals_submitted_by_fkey(full_name)`)
          .order('created_at', { ascending: false });
        setReportData({ type, rows: data || [] });

      } else if (type === 'compliance_status') {
        const { data } = await supabase
          .from('organization_compliance')
          .select(`id, status, notes, submitted_at, reviewed_at,
            organization:organizations(name, acronym),
            requirement:compliance_requirements(name, deadline_type)`)
          .order('submitted_at', { ascending: false });
        setReportData({ type, rows: data || [] });

      } else if (type === 'user_activity') {
        const { data } = await supabase
          .from('users')
          .select('id, full_name, email, role, is_active, created_at, last_login, student_id')
          .order('created_at', { ascending: false });
        setReportData({ type, rows: data || [] });

      } else if (type === 'org_overview') {
        const { data } = await supabase
          .from('organizations')
          .select(`id, name, acronym, accreditation_status, compliance_rate, is_active, created_at,
            members:organization_members(count),
            events:event_proposals(count)`)
          .order('name');
        setReportData({ type, rows: data || [] });
      }
    } catch (err) {
      console.error('Report load error:', err);
      setReportData({ type, rows: [], error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!reportData) return;
    setGenerating(true);
    const cfg = REPORT_TYPES.find(r => r.value === reportType);
    let html = '';

    const { type, rows } = reportData;

    if (type === 'events_summary') {
      const total    = rows.length;
      const pending  = rows.filter(r => r.status === 'pending').length;
      const approved = rows.filter(r => r.status === 'approved').length;
      const rejected = rows.filter(r => r.status === 'rejected').length;
      const completed= rows.filter(r => r.status === 'completed').length;
      html = `
        <div class="stats">
          <div class="stat"><div class="val">${total}</div><div class="lbl">Total Events</div></div>
          <div class="stat"><div class="val">${approved}</div><div class="lbl">Approved</div></div>
          <div class="stat"><div class="val">${pending}</div><div class="lbl">Pending</div></div>
          <div class="stat"><div class="val">${rejected}</div><div class="lbl">Rejected</div></div>
          <div class="stat"><div class="val">${completed}</div><div class="lbl">Completed</div></div>
        </div>
        <table>
          <tr><th>Event Title</th><th>Organization</th><th>Status</th><th>Date</th><th>Venue</th><th>Budget</th><th>Attendees</th></tr>
          ${rows.map(r => `
            <tr>
              <td>${r.title || '—'}</td>
              <td>${r.organization?.name || '—'}</td>
              <td>${r.status || '—'}</td>
              <td>${r.event_date ? format(parseISO(r.event_date), 'MMM d, yyyy') : '—'}</td>
              <td>${r.venue || '—'}</td>
              <td>${r.budget_amount ? 'PHP ' + Number(r.budget_amount).toLocaleString() : '—'}</td>
              <td>${r.expected_attendees || '—'}</td>
            </tr>`).join('')}
        </table>`;

    } else if (type === 'compliance_status') {
      const submitted = rows.filter(r => r.status === 'submitted').length;
      const reviewed  = rows.filter(r => r.status === 'reviewed').length;
      html = `
        <div class="stats">
          <div class="stat"><div class="val">${rows.length}</div><div class="lbl">Total Records</div></div>
          <div class="stat"><div class="val">${submitted}</div><div class="lbl">Submitted</div></div>
          <div class="stat"><div class="val">${reviewed}</div><div class="lbl">Reviewed</div></div>
        </div>
        <table>
          <tr><th>Organization</th><th>Requirement</th><th>Status</th><th>Submitted</th><th>Reviewed</th></tr>
          ${rows.map(r => `
            <tr>
              <td>${r.organization?.name || '—'}</td>
              <td>${r.requirement?.name || '—'}</td>
              <td>${r.status || '—'}</td>
              <td>${r.submitted_at ? format(new Date(r.submitted_at), 'MMM d, yyyy') : '—'}</td>
              <td>${r.reviewed_at ? format(new Date(r.reviewed_at), 'MMM d, yyyy') : 'Pending'}</td>
            </tr>`).join('')}
        </table>`;

    } else if (type === 'user_activity') {
      const leaders = rows.filter(r => r.role === 'student_leader').length;
      html = `
        <div class="stats">
          <div class="stat"><div class="val">${rows.length}</div><div class="lbl">Total Users</div></div>
          <div class="stat"><div class="val">${leaders}</div><div class="lbl">Student Leaders</div></div>
          <div class="stat"><div class="val">${rows.filter(r => r.is_active).length}</div><div class="lbl">Active</div></div>
        </div>
        <table>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Student ID</th><th>Status</th><th>Joined</th></tr>
          ${rows.map(r => `
            <tr>
              <td>${r.full_name || '—'}</td>
              <td>${r.email || '—'}</td>
              <td>${r.role || '—'}</td>
              <td>${r.student_id || '—'}</td>
              <td>${r.is_active ? 'Active' : 'Inactive'}</td>
              <td>${r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—'}</td>
            </tr>`).join('')}
        </table>`;

    } else if (type === 'org_overview') {
      html = `
        <div class="stats">
          <div class="stat"><div class="val">${rows.length}</div><div class="lbl">Total Orgs</div></div>
          <div class="stat"><div class="val">${rows.filter(r => r.is_active).length}</div><div class="lbl">Active</div></div>
          <div class="stat"><div class="val">${rows.filter(r => r.accreditation_status === 'accredited').length}</div><div class="lbl">Accredited</div></div>
        </div>
        <table>
          <tr><th>Organization</th><th>Acronym</th><th>Status</th><th>Accreditation</th><th>Members</th><th>Events</th><th>Compliance %</th></tr>
          ${rows.map(r => `
            <tr>
              <td>${r.name || '—'}</td>
              <td>${r.acronym || '—'}</td>
              <td>${r.is_active ? 'Active' : 'Inactive'}</td>
              <td>${r.accreditation_status || '—'}</td>
              <td>${r.members?.[0]?.count ?? 0}</td>
              <td>${r.events?.[0]?.count ?? 0}</td>
              <td>${r.compliance_rate != null ? r.compliance_rate + '%' : '—'}</td>
            </tr>`).join('')}
        </table>`;
    }

    printReport(cfg.label, html);
    setGenerating(false);
  };

  const cfg   = REPORT_TYPES.find(r => r.value === reportType);
  const rows  = reportData?.rows || [];

  
  const stats = (() => {
    if (!reportData) return [];
    if (reportData.type === 'events_summary') return [
      { label: 'Total Events',  value: rows.length,                                          bg: '#eff6ff', color: '#3b82f6', icon: FileText },
      { label: 'Approved',      value: rows.filter(r=>r.status==='approved').length,         bg: '#dcfce7', color: GREEN,     icon: CheckCircle },
      { label: 'Pending',       value: rows.filter(r=>r.status==='pending').length,          bg: '#fef9c3', color: '#a16207', icon: Clock },
      { label: 'Rejected',      value: rows.filter(r=>r.status==='rejected').length,         bg: '#fee2e2', color: '#dc2626', icon: XCircle },
    ];
    if (reportData.type === 'compliance_status') return [
      { label: 'Total Records',  value: rows.length,                                          bg: '#eff6ff', color: '#3b82f6', icon: ShieldCheck },
      { label: 'Submitted',      value: rows.filter(r=>r.status==='submitted').length,        bg: '#ede9fe', color: '#7c3aed', icon: FileText },
      { label: 'Reviewed',       value: rows.filter(r=>r.status==='reviewed').length,         bg: '#dcfce7', color: GREEN,     icon: CheckCircle },
      { label: 'Pending Review', value: rows.filter(r=>!r.status||r.status==='submitted').length, bg: '#fef9c3', color: '#a16207', icon: Clock },
    ];
    if (reportData.type === 'user_activity') return [
      { label: 'Total Users',      value: rows.length,                                        bg: '#eff6ff', color: '#3b82f6', icon: Users },
      { label: 'Student Leaders',  value: rows.filter(r=>r.role==='student_leader').length,   bg: '#dcfce7', color: GREEN,     icon: Users },
      { label: 'Active',           value: rows.filter(r=>r.is_active).length,                 bg: '#dcfce7', color: GREEN,     icon: CheckCircle },
      { label: 'Inactive',         value: rows.filter(r=>!r.is_active).length,                bg: '#fee2e2', color: '#dc2626', icon: XCircle },
    ];
    if (reportData.type === 'org_overview') return [
      { label: 'Total Orgs',   value: rows.length,                                                       bg: '#eff6ff', color: '#3b82f6', icon: Building2 },
      { label: 'Active',       value: rows.filter(r=>r.is_active).length,                                bg: '#dcfce7', color: GREEN,     icon: CheckCircle },
      { label: 'Accredited',   value: rows.filter(r=>r.accreditation_status==='accredited').length,      bg: '#ede9fe', color: '#7c3aed', icon: ShieldCheck },
      { label: 'Avg Compliance', value: rows.length ? Math.round(rows.reduce((s,r)=>s+(r.compliance_rate||0),0)/rows.length) + '%' : '—', bg: '#fef9c3', color: '#a16207', icon: TrendingUp },
    ];
    return [];
  })();

  return (
    <Page>
      <Header>
        <Title><BarChart3 size={26} color={GREEN} /> Report Generation</Title>
      </Header>

      {}
      <Controls>
        <div style={{ display:'flex', alignItems:'center', gap:8, color:'#374151', fontWeight:600, fontSize:13 }}>
          <Filter size={16} /> Report Type:
        </div>
        <Select value={reportType} onChange={e => setReportType(e.target.value)}>
          {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>

        <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
          <Btn $secondary onClick={() => loadReport(reportType)} disabled={loading}>
            {loading ? <Loader size={15} style={{animation:'spin 1s linear infinite'}} /> : <Filter size={15} />}
            Refresh Data
          </Btn>
          <Btn onClick={handleGenerate} disabled={loading || generating || !reportData || rows.length === 0}>
            {generating ? <Loader size={15} /> : <Printer size={15} />}
            Print / Export Report
          </Btn>
        </div>
      </Controls>

      {}
      {!loading && stats.length > 0 && (
        <StatsGrid>
          {stats.map((s, i) => (
            <StatCard key={i} $bg={s.bg}>
              <div className="icon"><s.icon size={20} color={s.color} /></div>
              <div>
                <div className="value">{s.value}</div>
                <div className="label">{s.label}</div>
              </div>
            </StatCard>
          ))}
        </StatsGrid>
      )}

      {}
      <Card>
        <CardHeader>
          <cfg.icon size={16} color={GREEN} />
          {cfg.label} — {rows.length} record{rows.length !== 1 ? 's' : ''}
        </CardHeader>

        {loading && (
          <div style={{ padding:'48px', textAlign:'center', color:'#6b7280' }}>
            <Loader size={28} style={{ animation:'spin 1s linear infinite', display:'block', margin:'0 auto 12px' }} />
            <p style={{margin:0, fontSize:13}}>Loading live data…</p>
          </div>
        )}

        {!loading && reportData?.error && (
          <div style={{ padding:'32px', textAlign:'center', color:'#dc2626', fontSize:13 }}>
            Error loading report: {reportData.error}
          </div>
        )}

        {!loading && !reportData?.error && rows.length === 0 && (
          <Empty>
            <BarChart3 size={40} />
            <p>No data found for this report type.</p>
          </Empty>
        )}

        {!loading && !reportData?.error && rows.length > 0 && (
          <div style={{ overflowX:'auto' }}>
            {}
            {reportType === 'events_summary' && (
              <Table>
                <thead><tr>
                  <th>Event Title</th><th>Organization</th><th>Status</th>
                  <th>Date</th><th>Venue</th><th>Budget</th><th>Attendees</th>
                </tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight:600, color:'#111827' }}>{r.title || '—'}</td>
                      <td>{r.organization?.name || '—'}</td>
                      <td><Badge $s={r.status}>{r.status}</Badge></td>
                      <td>{r.event_date ? format(parseISO(r.event_date), 'MMM d, yyyy') : '—'}</td>
                      <td>{r.venue || '—'}</td>
                      <td>{r.budget_amount ? 'PHP ' + Number(r.budget_amount).toLocaleString() : '—'}</td>
                      <td>{r.expected_attendees ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            {}
            {reportType === 'compliance_status' && (
              <Table>
                <thead><tr>
                  <th>Organization</th><th>Requirement</th><th>Status</th>
                  <th>Submitted</th><th>Reviewed</th>
                </tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight:600, color:'#111827' }}>{r.organization?.name || '—'}</td>
                      <td>{r.requirement?.name || '—'}</td>
                      <td><Badge $s={r.status}>{r.status || '—'}</Badge></td>
                      <td>{r.submitted_at ? format(new Date(r.submitted_at), 'MMM d, yyyy') : '—'}</td>
                      <td>{r.reviewed_at ? format(new Date(r.reviewed_at), 'MMM d, yyyy') : <span style={{color:'#9ca3af'}}>Pending</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            {}
            {reportType === 'user_activity' && (
              <Table>
                <thead><tr>
                  <th>Name</th><th>Email</th><th>Role</th>
                  <th>Student ID</th><th>Status</th><th>Joined</th>
                </tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight:600, color:'#111827' }}>{r.full_name || '—'}</td>
                      <td style={{ color:'#6b7280' }}>{r.email || '—'}</td>
                      <td><Badge $s={r.role === 'student_leader' ? 'approved' : 'pending'}>{r.role?.replace('_',' ')}</Badge></td>
                      <td>{r.student_id || '—'}</td>
                      <td><Badge $s={r.is_active ? 'active' : 'inactive'}>{r.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td>{r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            {}
            {reportType === 'org_overview' && (
              <Table>
                <thead><tr>
                  <th>Organization</th><th>Acronym</th><th>Status</th>
                  <th>Accreditation</th><th>Members</th><th>Events</th><th>Compliance %</th>
                </tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight:600, color:'#111827' }}>{r.name || '—'}</td>
                      <td>{r.acronym || '—'}</td>
                      <td><Badge $s={r.is_active ? 'active' : 'inactive'}>{r.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td><Badge $s={r.accreditation_status === 'accredited' ? 'approved' : 'pending'}>{r.accreditation_status || '—'}</Badge></td>
                      <td>{r.members?.[0]?.count ?? 0}</td>
                      <td>{r.events?.[0]?.count ?? 0}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, background:'#e5e7eb', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${r.compliance_rate||0}%`, height:'100%', background: r.compliance_rate>=80?GREEN:'#f59e0b', borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:12, color:'#374151', minWidth:36 }}>{r.compliance_rate != null ? r.compliance_rate + '%' : '—'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        )}
      </Card>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Page>
  );
}
