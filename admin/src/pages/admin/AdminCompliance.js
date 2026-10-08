import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  ShieldCheck, FileText, CheckCircle2, XCircle, Loader,
  Trash2, RotateCcw, Search, ChevronDown, ChevronUp, AlertTriangle, Building,
  Plus, Calendar, Settings, X, BookOpen
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { auditTrail } from '../../config/security';
import { supabase } from '../../config/supabase';
import { format } from 'date-fns';

const GREEN = '#03632B';
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

/* ─── Layout ──────────────────────────────────────────── */
const Page = styled.div`max-width: 1300px; margin: 0 auto;`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
`;

const Title = styled.h1`
  font-size: 22px; font-weight: 700; color: #111827;
  display: flex; align-items: center; gap: 12px; margin: 0;
`;

const ToolRow = styled.div`
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
`;

const SearchWrap = styled.div`
  display: flex; align-items: center;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 8px 14px; gap: 8px; width: 260px;
  input { border: none; outline: none; font-size: 13px; color: #374151; width: 100%; background: transparent; }
  svg { color: #9ca3af; flex-shrink: 0; }
`;

const Card = styled.div`
  background: #ffffff; border: 1px solid #e5e7eb;
  border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;
`;

/* ─── Semester Info Bar ───────────────────────────────── */
const SemesterBar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  background: ${GREEN}10; border: 1px solid ${GREEN}30; border-radius: 10px;
  padding: 12px 18px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
`;
const SemInfo = styled.div`
  display: flex; align-items: center; gap: 10px;
  span.label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
  span.name  { font-size: 15px; font-weight: 700; color: ${GREEN}; }
  span.dates { font-size: 12px; color: #6b7280; }
`;

/* ─── Progress Bar ────────────────────────────────────── */
const ProgressTrack = styled.div`
  width: 100%; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden;
  margin-top: 6px;
`;
const ProgressFill = styled.div`
  height: 100%; background: ${p => p.$color || GREEN};
  width: ${p => p.$percent}%; transition: width 0.3s ease;
`;

/* ─── Table ───────────────────────────────────────────── */
const Table = styled.table`
  width: 100%; border-collapse: collapse;
  th {
    background: #f9fafb; padding: 14px 16px; text-align: left;
    font-size: 11px; font-weight: 700; color: #6b7280;
    text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;
  }
  td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; }
`;

const OrgRow = styled.tr`
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #fafafa; }
  ${p => p.$expanded && `background: #f8fafc;`}
`;

const SubRow = styled.tr`
  background: #f8fafc;
`;

const SubTableWrapper = styled.div`
  padding: 16px 24px 24px 64px;
`;

const SubTable = styled.table`
  width: 100%; border-collapse: collapse;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;
  th { background: #f9fafb; padding: 10px 14px; font-size: 11px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  td { padding: 10px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6; }
  tr:last-child td { border-bottom: none; }
`;

const Badge = styled.span`
  padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.4px;
  background: ${p =>
    p.$s === 'approved'    ? '#dcfce7' :
    p.$s === 'rejected'    ? '#fee2e2' :
    p.$s === 'compliant'   ? '#dbeafe' :
    p.$s === 'active'      ? '#dcfce7' :
    p.$s === 'under_review'? '#fef9c3' : '#fef3c7'};
  color: ${p =>
    p.$s === 'approved'    ? '#15803d' :
    p.$s === 'rejected'    ? '#b91c1c' :
    p.$s === 'compliant'   ? '#1d4ed8' :
    p.$s === 'active'      ? '#15803d' :
    p.$s === 'under_review'? '#854d0e' : '#92400e'};
`;

/* ─── Buttons ─────────────────────────────────────────── */
const Btn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  padding: ${p => p.$sm ? '5px 10px' : '8px 14px'};
  border-radius: 6px; font-size: ${p => p.$sm ? '12px' : '13px'};
  font-weight: 600; border: none; cursor: pointer; transition: all 0.15s;
  background: ${p => p.$danger ? '#ef4444' : p.$ghost ? '#fff' : p.$warn ? '#f97316' : GREEN};
  color: ${p => p.$ghost ? '#374151' : '#fff'};
  border: ${p => p.$ghost ? '1px solid #d1d5db' : 'none'};
  opacity: ${p => p.disabled ? 0.5 : 1};
  &:hover { opacity: ${p => p.disabled ? 0.5 : 0.88}; }
`;

const IconBtn = styled.button`
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
  transition: all 0.15s;
  background: ${p => p.$danger ? '#fee2e2' : p.$approve ? '#dcfce7' : '#f3f4f6'};
  color: ${p => p.$danger ? '#dc2626' : p.$approve ? '#16a34a' : '#6b7280'};
  &:hover { opacity: 0.78; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

const SpinIcon = styled(Loader)`animation: ${spin} 1s linear infinite;`;

/* ─── Modals ───────────────────────────────────────────── */
const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(17,24,39,0.45);
  backdrop-filter: blur(4px); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
`;
const ModalBox = styled.div`
  background: #fff; border-radius: 12px; width: 100%; max-width: ${p => p.$wide ? '640px' : '440px'};
  box-shadow: 0 20px 30px rgba(0,0,0,0.1); overflow: hidden; max-height: 90vh;
  display: flex; flex-direction: column;
`;
const MHead = styled.div`
  padding: 18px 24px; border-bottom: 1px solid #f3f4f6;
  display: flex; align-items: center; gap: 12px; justify-content: space-between;
  h3 { margin: 0; font-size: 16px; font-weight: 700; color: #111827; }
  .left { display: flex; align-items: center; gap: 10px; }
`;
const MBody = styled.div`
  padding: 24px; overflow-y: auto; flex: 1;
  p { margin: 0 0 14px; font-size: 13px; color: #4b5563; line-height: 1.5; }
`;
const MFoot = styled.div`
  padding: 16px 24px; background: #f9fafb; border-top: 1px solid #f3f4f6;
  display: flex; justify-content: flex-end; gap: 10px;
`;

const TextareaWrap = styled.div`
  textarea {
    width: 100%; padding: 12px 14px;
    border: 1px solid #d1d5db; border-radius: 8px;
    font-size: 13px; font-family: inherit; resize: vertical; min-height: 90px;
    outline: none; box-sizing: border-box; color: #111827;
    &:focus { border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(3,99,43,0.10); }
  }
`;

const InputWrap = styled.div`
  margin-bottom: 14px;
  label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
  input, select {
    width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px;
    font-size: 13px; font-family: inherit; outline: none; box-sizing: border-box; color: #111827;
    &:focus { border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(3,99,43,0.10); }
  }
`;

const SemRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px;
  background: ${p => p.$active ? `${GREEN}08` : '#fff'};
  border-color: ${p => p.$active ? `${GREEN}40` : '#e5e7eb'};
`;

const ReqItem = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px;
  background: #fff;
`;

/* ═══════════════════════════════════════════════════════ */
export default function AdminCompliance() {
  const [orgs,     setOrgs]     = useState([]);
  const [reqs,     setReqs]     = useState([]);
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState(new Set());

  // Active semester
  const [activeSemester, setActiveSemester] = useState(null);
  const [allSemesters,   setAllSemesters]   = useState([]);

  // Category tabs: 'all' | 'accreditation' | 'clearance'
  const [activeCategory, setActiveCategory] = useState('all');

  // Approve/reject modal
  const [modal,    setModal]    = useState({ open: false, type: '', item: null });
  const [notes,    setNotes]    = useState('');
  const [saving,   setSaving]   = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [deleting,    setDeleting]    = useState(false);

  // Semester management modal
  const [semModal,  setSemModal]  = useState(false);
  const [semTab,    setSemTab]    = useState('semesters'); // 'semesters' | 'requirements'
  const [newSem,    setNewSem]    = useState({ name: '', start_date: '', end_date: '' });
  const [newReq,    setNewReq]    = useState({ name: '', description: '', deadline_type: 'semester', category: 'accreditation' });
  const [semSaving, setSemSaving] = useState(false);
  const [reqSaving, setReqSaving] = useState(false);

  // Version history modal
  const [vhModal,   setVhModal]   = useState({ open: false, item: null });

  /* ─── Load ─── */
  const load = useCallback(async () => {
    setLoading(true);
    const [orgsRes, compRes, semRes] = await Promise.all([
      adminAPI.getOrganizations(),
      adminAPI.getComplianceList(),
      supabase.from('semesters').select('*').order('created_at', { ascending: false })
    ]);

    const sems = semRes.data || [];
    const active = sems.find(s => s.is_active) || null;
    setAllSemesters(sems);
    setActiveSemester(active);

    setOrgs(orgsRes.data || []);
    setItems(compRes.data || []);

    // Load requirements filtered to active semester (or all if no semester)
    let reqQuery = supabase.from('compliance_requirements').select('*').order('name');
    if (active) reqQuery = reqQuery.eq('semester_id', active.id);
    const reqsRes = await reqQuery;
    setReqs(reqsRes.data || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase.channel('realtime_organization_compliance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organization_compliance' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  /* ─── Data Processing ─── */
  const orgsMap = new Map();
  orgs.forEach(org => {
    orgsMap.set(org.id, { id: org.id, name: org.name, acronym: org.acronym, items: [] });
  });
  items.forEach(item => {
    if (!item.organization_id) return;
    if (!orgsMap.has(item.organization_id)) {
      orgsMap.set(item.organization_id, {
        id: item.organization_id,
        name: item.organization?.name || 'Unknown',
        acronym: item.organization?.acronym || '?',
        items: [],
      });
    }
    orgsMap.get(item.organization_id).items.push(item);
  });

  const processedOrgs = Array.from(orgsMap.values()).map(org => {
    // Filter items by active category if set
    const categoryItems = activeCategory === 'all'
      ? org.items
      : org.items.filter(it => (it.requirement?.category || 'accreditation') === activeCategory);

    const categoryReqs = activeCategory === 'all'
      ? reqs
      : reqs.filter(r => (r.category || 'accreditation') === activeCategory);

    const TOTAL = categoryReqs.length || 14;
    const compliantCount = categoryItems.filter(it => it.status === 'compliant' || it.status === 'approved').length;
    const percentage = TOTAL === 0 ? 0 : Math.min(100, Math.round((compliantCount / TOTAL) * 100));
    return { ...org, items: categoryItems, submittedCount: categoryItems.length, compliantCount, total: TOTAL, percentage };
  });

  const visibleOrgs = processedOrgs.filter(org => {
    const q = search.toLowerCase();
    return !q ||
      org.name.toLowerCase().includes(q) ||
      org.acronym.toLowerCase().includes(q) ||
      org.items.some(it => it.requirement?.name?.toLowerCase().includes(q));
  });

  const toggleExpand = (id) => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  /* ─── Approve / Reject ─── */
  const openDecision = (item, type) => { setModal({ open: true, type, item }); setNotes(''); };
  const submitDecision = async () => {
    if (modal.type === 'rejected' && !notes.trim()) {
      alert('Remarks are required for rejection.'); return;
    }
    setSaving(true);
    const { error } = await adminAPI.updateComplianceStatus(modal.item.id, modal.type, notes);
    setSaving(false);
    if (!error) {
      auditTrail.log('UPDATE_COMPLIANCE', 'organization_compliance', modal.item.id, null,
        { status: modal.type, notes: notes.trim() || null });
      setModal({ open: false, type: '', item: null });
      load();
    } else alert('Failed to update status. Please try again.');
  };

  /* ─── Delete ─── */
  const confirmDelete = (id) => setDeleteModal({ open: true, id });
  const execDelete = async () => {
    setDeleting(true);
    const { error } = await adminAPI.deleteCompliance(deleteModal.id);
    setDeleting(false);
    if (!error) { setDeleteModal({ open: false, id: null }); load(); }
    else alert('Delete failed. Please try again.');
  };

  /* ─── Semester Management ─── */
  const createSemester = async () => {
    if (!newSem.name || !newSem.start_date || !newSem.end_date) {
      alert('Please fill all fields.'); return;
    }
    setSemSaving(true);
    // Deactivate all existing semesters first
    await supabase.from('semesters').update({ is_active: false }).neq('id', 'none');
    // Create new active semester
    const { error } = await supabase.from('semesters').insert({
      name: newSem.name,
      start_date: newSem.start_date,
      end_date: newSem.end_date,
      is_active: true,
    });
    setSemSaving(false);
    if (!error) {
      setNewSem({ name: '', start_date: '', end_date: '' });
      load();
      alert('New semester created and set as active!');
    } else alert('Failed to create semester: ' + error.message);
  };

  const activateSemester = async (semId) => {
    await supabase.from('semesters').update({ is_active: false }).neq('id', 'none');
    await supabase.from('semesters').update({ is_active: true }).eq('id', semId);
    load();
  };

  const createRequirement = async () => {
    if (!newReq.name) { alert('Requirement name is required.'); return; }
    if (!activeSemester) { alert('Please create and activate a semester first.'); return; }
    setReqSaving(true);
    const { error } = await supabase.from('compliance_requirements').insert({
      name: newReq.name,
      description: newReq.description,
      deadline_type: newReq.deadline_type,
      semester_id: activeSemester.id,
      category: newReq.category || 'accreditation',
    });
    setReqSaving(false);
    if (!error) {
      setNewReq({ name: '', description: '', deadline_type: 'semester', category: 'accreditation' });
      load();
    } else alert('Failed to add requirement: ' + error.message);
  };

  const deleteRequirement = async (reqId) => {
    if (!window.confirm('Delete this requirement? This will also remove all related org submissions.')) return;
    await supabase.from('compliance_requirements').delete().eq('id', reqId);
    load();
  };

  /* ─── Helpers ─── */
  const getPercentColor = pct => pct === 100 ? GREEN : pct >= 50 ? '#f59e0b' : '#ef4444';

  /* ══════════════════════════════════════════ RENDER ═══ */
  return (
    <Page>
      <TopBar>
        <Title><ShieldCheck size={26} color={GREEN} /> Org &amp; Compliance Management</Title>
        <ToolRow>
          <SearchWrap>
            <Search size={14} />
            <input
              placeholder="Search org or requirement…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </SearchWrap>
          <Btn $ghost onClick={load} title="Refresh"><RotateCcw size={14} /> Refresh</Btn>
          <Btn onClick={() => setSemModal(true)}><Settings size={14} /> Manage Semester &amp; Requirements</Btn>
        </ToolRow>
      </TopBar>

      {/* Active Semester Banner */}
      <SemesterBar>
        <SemInfo>
          <Calendar size={18} color={GREEN} />
          <div>
            <span className="label">Active Semester: </span>
            <span className="name">{activeSemester ? activeSemester.name : 'No Active Semester'}</span>
            {activeSemester && (
              <span className="dates" style={{ marginLeft: 8 }}>
                ({format(new Date(activeSemester.start_date), 'MMM d, yyyy')} – {format(new Date(activeSemester.end_date), 'MMM d, yyyy')})
              </span>
            )}
          </div>
        </SemInfo>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{reqs.length} requirement(s) this semester</span>
          <Btn $ghost $sm onClick={() => { setSemModal(true); setSemTab('requirements'); }}>
            <Plus size={12} /> Add Requirement
          </Btn>
        </div>
      </SemesterBar>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 24, padding: '0 8px', marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
        {[
          { id: 'all', label: 'All Requirements' },
          { id: 'accreditation', label: 'Accreditation' },
          { id: 'clearance', label: 'Clearance' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '0 0 12px 0', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              color: activeCategory === cat.id ? GREEN : '#6b7280',
              borderBottom: activeCategory === cat.id ? `2px solid ${GREEN}` : '2px solid transparent',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Compliance Table */}
      <Card>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
            <SpinIcon size={28} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>Loading compliance data…</div>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Organization</th>
                <th style={{ width: '15%' }}>Status</th>
                <th style={{ width: '25%' }}>Compliance Progress</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrgs.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                    <Building size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <div style={{ fontSize: 14 }}>No organizations found.</div>
                  </td>
                </tr>
              )}

              {visibleOrgs.map(org => {
                const isExp = expanded.has(org.id);
                const pctColor = getPercentColor(org.percentage);
                return (
                  <React.Fragment key={org.id}>
                    <OrgRow $expanded={isExp} onClick={() => toggleExpand(org.id)}>
                      <td style={{ textAlign: 'center', color: '#9ca3af' }}>
                        {isExp ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>{org.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{org.acronym}</div>
                      </td>
                      <td>
                        {org.percentage === 100
                          ? <Badge $s="approved">Fully Compliant</Badge>
                          : <Badge $s="pending">Action Needed</Badge>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#374151' }}>
                          <span>{org.compliantCount} / {org.total} Req</span>
                          <span style={{ color: pctColor }}>{org.percentage}%</span>
                        </div>
                        <ProgressTrack>
                          <ProgressFill $percent={org.percentage} $color={pctColor} />
                        </ProgressTrack>
                        {org.submittedCount !== org.compliantCount && (
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                            {org.submittedCount} documents submitted total
                          </div>
                        )}
                      </td>
                    </OrgRow>

                    {isExp && (
                      <SubRow>
                        <td colSpan="4" style={{ padding: 0 }}>
                          <SubTableWrapper>
                            {reqs.length === 0 ? (
                              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                                No requirements set for the current semester.{' '}
                                <button
                                  style={{ color: GREEN, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                  onClick={() => { setSemModal(true); setSemTab('requirements'); }}
                                >
                                  Add Requirements →
                                </button>
                              </div>
                            ) : (
                              <SubTable>
                                <thead>
                                  <tr>
                                    <th>Requirement</th>
                                    <th>Submitted</th>
                                    <th>Attachment</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reqs.map(req => {
                                    const item = org.items.find(it => it.requirement_id === req.id);
                                    return (
                                      <tr key={req.id}>
                                        <td>
                                          <div style={{ fontWeight: 600 }}>{req.name}</div>
                                          <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>
                                            {req.deadline_type}
                                          </div>
                                        </td>
                                        <td>
                                          {item?.submitted_at || item?.created_at
                                            ? format(new Date(item.submitted_at || item.created_at), 'MMM d, yyyy')
                                            : <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>}
                                        </td>
                                        <td>
                                          {item?.document_url ? (
                                            <a href={item.document_url} target="_blank" rel="noreferrer"
                                              style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', fontWeight: 500 }}>
                                              <FileText size={14} /> View Document
                                            </a>
                                          ) : (
                                            <span style={{ color: '#d1d5db', fontSize: 12 }}>Not provided</span>
                                          )}
                                        </td>
                                        <td>
                                          {item
                                            ? <Badge $s={item.status}>{item.status?.replace(/_/g, ' ')}</Badge>
                                            : <Badge $s="rejected" style={{ background: '#f3f4f6', color: '#6b7280' }}>Missing</Badge>}
                                        </td>
                                        <td>
                                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                                            {item && (item.status === 'pending' || item.status === 'under_review') ? (
                                              <>
                                                <IconBtn $approve title="Approve" onClick={e => { e.stopPropagation(); openDecision(item, 'approved'); }}>
                                                  <CheckCircle2 size={15} />
                                                </IconBtn>
                                                <IconBtn $danger title="Reject" onClick={e => { e.stopPropagation(); openDecision(item, 'rejected'); }}>
                                                  <XCircle size={15} />
                                                </IconBtn>
                                              </>
                                            ) : item ? (
                                              <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <CheckCircle2 size={12} color={GREEN} /> Resolved
                                              </span>
                                            ) : (
                                              <span style={{ fontSize: 11, color: '#d1d5db' }}>—</span>
                                            )}
                                            {item && item.version_history && item.version_history.length > 0 && (
                                              <IconBtn title="Version History" onClick={e => { e.stopPropagation(); setVhModal({ open: true, item }); }}>
                                                <RotateCcw size={14} />
                                              </IconBtn>
                                            )}
                                            {item && (
                                              <IconBtn $danger title="Delete" onClick={e => { e.stopPropagation(); confirmDelete(item.id); }}>
                                                <Trash2 size={14} />
                                              </IconBtn>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </SubTable>
                            )}
                          </SubTableWrapper>
                        </td>
                      </SubRow>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ══════════ Semester & Requirements Management Modal ══════════ */}
      {semModal && (
        <Overlay onClick={e => e.target === e.currentTarget && setSemModal(false)}>
          <ModalBox $wide>
            <MHead>
              <div className="left">
                <Settings size={20} color={GREEN} />
                <h3>Semester &amp; Requirements Management</h3>
              </div>
              <button onClick={() => setSemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </MHead>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              {[
                { id: 'semesters',    label: 'Semesters',    icon: Calendar },
                { id: 'requirements', label: 'Requirements', icon: BookOpen  },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSemTab(tab.id)}
                  style={{
                    padding: '12px 22px', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: 13,
                    color: semTab === tab.id ? GREEN : '#6b7280',
                    borderBottom: semTab === tab.id ? `2px solid ${GREEN}` : '2px solid transparent',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <tab.icon size={14} />{tab.label}
                </button>
              ))}
            </div>

            <MBody>
              {/* ── Semesters Tab ── */}
              {semTab === 'semesters' && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 12 }}>
                      Create New Semester
                    </div>
                    <InputWrap>
                      <label>Semester Name</label>
                      <input
                        placeholder="e.g. 1st Semester 2025-2026"
                        value={newSem.name}
                        onChange={e => setNewSem(p => ({ ...p, name: e.target.value }))}
                      />
                    </InputWrap>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <InputWrap>
                        <label>Start Date</label>
                        <input type="date" value={newSem.start_date} onChange={e => setNewSem(p => ({ ...p, start_date: e.target.value }))} />
                      </InputWrap>
                      <InputWrap>
                        <label>End Date</label>
                        <input type="date" value={newSem.end_date} onChange={e => setNewSem(p => ({ ...p, end_date: e.target.value }))} />
                      </InputWrap>
                    </div>
                    <Btn onClick={createSemester} disabled={semSaving}>
                      {semSaving ? <SpinIcon size={14} /> : <Plus size={14} />}
                      {semSaving ? 'Creating…' : 'Create &amp; Activate Semester'}
                    </Btn>
                  </div>

                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 12 }}>
                      All Semesters
                    </div>
                    {allSemesters.length === 0 ? (
                      <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                        No semesters created yet.
                      </div>
                    ) : allSemesters.map(sem => (
                      <SemRow key={sem.id} $active={sem.is_active}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {sem.name}
                            {sem.is_active && <Badge $s="active">Active</Badge>}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                            {format(new Date(sem.start_date), 'MMM d, yyyy')} – {format(new Date(sem.end_date), 'MMM d, yyyy')}
                          </div>
                        </div>
                        {!sem.is_active && (
                          <Btn $ghost $sm onClick={() => activateSemester(sem.id)}>
                            Set Active
                          </Btn>
                        )}
                      </SemRow>
                    ))}
                  </div>
                </>
              )}

              {/* ── Requirements Tab ── */}
              {semTab === 'requirements' && (
                <>
                  {!activeSemester ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
                      <AlertTriangle size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                      <div style={{ fontSize: 13 }}>No active semester. Create one in the Semesters tab first.</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: 4, padding: '10px 14px', background: `${GREEN}08`, borderRadius: 8, border: `1px solid ${GREEN}20` }}>
                        <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>
                          Adding requirements for: {activeSemester.name}
                        </span>
                      </div>
                      <div style={{ marginTop: 16, marginBottom: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 12 }}>
                          Add New Requirement
                        </div>
                        <InputWrap>
                          <label>Requirement Name</label>
                          <input
                            placeholder="e.g. Financial Report, Constitution"
                            value={newReq.name}
                            onChange={e => setNewReq(p => ({ ...p, name: e.target.value }))}
                          />
                        </InputWrap>
                        <InputWrap>
                          <label>Description (optional)</label>
                          <input
                            placeholder="Brief description of this requirement"
                            value={newReq.description}
                            onChange={e => setNewReq(p => ({ ...p, description: e.target.value }))}
                          />
                        </InputWrap>
                        <InputWrap>
                          <label>Category</label>
                          <select value={newReq.category} onChange={e => setNewReq(p => ({ ...p, category: e.target.value }))}>
                            <option value="accreditation">Accreditation</option>
                            <option value="clearance">Clearance</option>
                          </select>
                        </InputWrap>
                        <InputWrap>
                          <label>Deadline Type</label>
                          <select value={newReq.deadline_type} onChange={e => setNewReq(p => ({ ...p, deadline_type: e.target.value }))}>
                            <option value="semester">End of Semester</option>
                            <option value="monthly">Monthly</option>
                            <option value="annual">Annual</option>
                            <option value="start_of_semester">Start of Semester</option>
                          </select>
                        </InputWrap>
                        <Btn onClick={createRequirement} disabled={reqSaving}>
                          {reqSaving ? <SpinIcon size={14} /> : <Plus size={14} />}
                          {reqSaving ? 'Adding…' : 'Add Requirement'}
                        </Btn>
                      </div>

                      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 12 }}>
                          Current Requirements ({reqs.length})
                        </div>
                        {reqs.length === 0 ? (
                          <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                            No requirements added for this semester yet.
                          </div>
                        ) : reqs.map(req => (
                          <ReqItem key={req.id}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{req.name}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'capitalize', marginTop: 2 }}>
                                {req.deadline_type?.replace(/_/g, ' ')} {req.description && `· ${req.description}`}
                              </div>
                            </div>
                            <IconBtn $danger onClick={() => deleteRequirement(req.id)} title="Remove requirement">
                              <Trash2 size={13} />
                            </IconBtn>
                          </ReqItem>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </MBody>

            <MFoot>
              <Btn $ghost onClick={() => setSemModal(false)}>Close</Btn>
            </MFoot>
          </ModalBox>
        </Overlay>
      )}

      {/* ─ Decision Modal ─ */}
      {modal.open && (
        <Overlay onClick={e => e.target === e.currentTarget && setModal({ open: false, type: '', item: null })}>
          <ModalBox>
            <MHead>
              <div className="left">
                {modal.type === 'approved'
                  ? <CheckCircle2 color={GREEN}   size={20} />
                  : <XCircle      color="#ef4444" size={20} />}
                <h3>{modal.type === 'approved' ? 'Approve Document' : 'Reject Document'}</h3>
              </div>
            </MHead>
            <MBody>
              <p>
                You are about to <strong>{modal.type === 'approved' ? 'approve' : 'reject'}</strong> the
                document for <strong style={{ color: '#111827' }}>{modal.item?.requirement?.name}</strong>.
              </p>
              <div style={{ marginBottom: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Remarks / Feedback
                  {modal.type === 'rejected' && <span style={{ color: '#ef4444' }}> *</span>}
                </label>
                <TextareaWrap>
                  <textarea
                    autoFocus
                    placeholder={modal.type === 'rejected' ? 'Required reason for rejection…' : 'Optional remarks…'}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </TextareaWrap>
              </div>
            </MBody>
            <MFoot>
              <Btn $ghost onClick={() => setModal({ open: false, type: '', item: null })} disabled={saving}>Cancel</Btn>
              <Btn
                style={{ background: modal.type === 'approved' ? GREEN : '#ef4444' }}
                onClick={submitDecision}
                disabled={saving}
              >
                {saving ? <SpinIcon size={14} /> : (modal.type === 'approved' ? <CheckCircle2 size={14} /> : <XCircle size={14} />)}
                {saving ? 'Saving…' : 'Confirm'}
              </Btn>
            </MFoot>
          </ModalBox>
        </Overlay>
      )}

      {/* ─ Delete Confirmation Modal ─ */}
      {deleteModal.open && (
        <Overlay onClick={e => e.target === e.currentTarget && !deleting && setDeleteModal({ open: false, id: null })}>
          <ModalBox>
            <MHead>
              <div className="left">
                <AlertTriangle color="#ef4444" size={20} />
                <h3>Delete Record</h3>
              </div>
            </MHead>
            <MBody>
              <p>
                Are you sure you want to permanently delete this compliance record?
                This action <strong>cannot be undone</strong>.
              </p>
            </MBody>
            <MFoot>
              <Btn $ghost onClick={() => setDeleteModal({ open: false, id: null })} disabled={deleting}>Cancel</Btn>
              <Btn $danger onClick={execDelete} disabled={deleting}>
                {deleting ? <SpinIcon size={14} /> : <Trash2 size={14} />}
                {deleting ? 'Deleting…' : 'Delete'}
              </Btn>
            </MFoot>
          </ModalBox>
        </Overlay>
      )}

      {/* ─ Version History Modal ─ */}
      {vhModal.open && vhModal.item && (
        <Overlay onClick={e => e.target === e.currentTarget && setVhModal({ open: false, item: null })}>
          <ModalBox>
            <MHead>
              <div className="left">
                <RotateCcw color={GREEN} size={20} />
                <h3>Version History</h3>
              </div>
              <button onClick={() => setVhModal({ open: false, item: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </MHead>
            <MBody>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{vhModal.item.requirement?.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{vhModal.item.organization?.name}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...(vhModal.item.version_history || [])].reverse().map((v, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: i === 0 ? GREEN : '#9ca3af', marginTop: 6 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Version {v.version}</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>
                          {new Date(v.actioned_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#374151' }}>
                        Action: <span style={{ fontWeight: 600 }}>{v.action === 'upload' ? 'Initial Upload' : 'Updated'}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        By: {v.uploaded_by_name || 'Student Officer'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </MBody>
            <MFoot>
              <Btn $ghost onClick={() => setVhModal({ open: false, item: null })}>Close</Btn>
            </MFoot>
          </ModalBox>
        </Overlay>
      )}
    </Page>
  );
}
