import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  Award, Search, RefreshCw, CheckCircle, Clock,
  ExternalLink, Paperclip, Calendar, XCircle,
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';

const GREEN = '#03632B';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 114px);
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
`;

const TitleBlock = styled.div`
  h1 { font-size: 20px; font-weight: 800; color: ${GREEN}; margin-bottom: 4px; }
  p  { font-size: 13px; color: #6b7280; }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SearchWrap = styled.div`
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 7px 14px;
  gap: 8px;
  width: 240px;

  input {
    border: none; outline: none;
    font-size: 13px; color: #374151; width: 100%;
    &::placeholder { color: #9ca3af; }
  }
  svg { color: #9ca3af; flex-shrink: 0; }
`;

const FilterSelect = styled.select`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  color: #374151;
  background: #ffffff;
  cursor: pointer;
  outline: none;
  &:hover { border-color: #d1d5db; }
`;

const RefreshBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  color: #6b7280;
  background: #ffffff;
  cursor: pointer;
  &:hover { background: #f3f4f6; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const StatChip = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;

  .icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: ${p => p.$bg || '#f3f4f6'}; flex-shrink: 0; }
  .info .lbl { font-size: 11px; color: #6b7280; font-weight: 500; }
  .info .val { font-size: 20px; font-weight: 800; color: #111827; }
`;

const TableWrap = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 120px;
  gap: 12px;
  padding: 12px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 11px;
  font-weight: 800;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableBody = styled.div`
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 120px;
  gap: 12px;
  padding: 14px 20px;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.12s;
  &:hover { background: #fafafa; }
  &:last-child { border-bottom: none; }
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  .avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: ${GREEN};
    color: #ffffff;
    font-weight: 700;
    font-size: 13px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .name  { font-size: 13px; font-weight: 700; color: #111827; }
  .sub   { font-size: 11px; color: #6b7280; }
`;

const StatusBadge = styled.span`
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${p => p.$verified ? '#d1fae5' : '#fef3c7'};
  color: ${p => p.$verified ? '#065f46' : '#92400e'};
`;

const MetaCell = styled.div`
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const FileLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: ${GREEN};
  text-decoration: none;
  background: #dcfce7;
  padding: 3px 8px;
  border-radius: 6px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover { background: #bbf7d0; }
`;

const ActionBtns = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionBtn = styled.button`
  width: 30px; height: 30px;
  border-radius: 7px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: ${p => p.$success ? GREEN : p.$danger ? '#ef4444' : '#6b7280'};
  transition: all 0.12s;

  &:hover {
    background: ${p => p.$success ? '#f0fdf4' : p.$danger ? '#fef2f2' : '#f3f4f6'};
    border-color: ${p => p.$success ? '#86efac' : p.$danger ? '#fca5a5' : '#d1d5db'};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #9ca3af;

  svg { margin-bottom: 12px; }
  p { font-size: 14px; font-weight: 500; }
`;

const LoadingRow = styled.div`
  padding: 40px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
`;

export default function AdminPortfolios() {
  const [portfolios, setPortfolios] = useState([]);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await adminAPI.getAllPortfolios();
    if (data) setPortfolios(data);
    if (error) console.error('Portfolio load error:', error);
    setLoading(false);
  }, []);

  useEffect(() => { 
    load(); 
    const interval = setInterval(load, 10000); 
    return () => clearInterval(interval);
  }, [load]);

  const toggleVerify = async (p) => {
    const newVal = !p.verified;
    setPortfolios(prev => prev.map(x => x.id === p.id ? { ...x, verified: newVal } : x));
    const { error } = await adminAPI.verifyPortfolio(p.id, newVal);
    if (error) {
      
      setPortfolios(prev => prev.map(x => x.id === p.id ? { ...x, verified: p.verified } : x));
      console.error('Verify error:', error);
    }
  };

  const q = search.toLowerCase();
  const filtered = portfolios.filter(p => {
    const matchSearch = !q ||
      p.title?.toLowerCase().includes(q) ||
      p.user?.full_name?.toLowerCase().includes(q) ||
      p.user?.email?.toLowerCase().includes(q) ||
      p.user?.student_id?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'verified' && p.verified)
      || (statusFilter === 'pending' && !p.verified);
    return matchSearch && matchStatus;
  });

  const totalVerified  = portfolios.filter(p => p.verified).length;
  const totalPending   = portfolios.length - totalVerified;
  const totalWithFiles = portfolios.filter(p => !!p.file_url).length;

  return (
    <Page>
      <TopRow>
        <TitleBlock>
          <h1>Student Portfolios</h1>
          <p>Review and verify student achievements and uploaded certificates.</p>
        </TitleBlock>
        <Controls>
          <SearchWrap>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search name, title, ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </SearchWrap>
          <FilterSelect value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </FilterSelect>
          <RefreshBtn onClick={load} disabled={loading}>
            <RefreshCw size={14} />
            {loading ? 'Loading…' : 'Refresh'}
          </RefreshBtn>
        </Controls>
      </TopRow>

      {}
      <StatsRow>
        <StatChip $bg="#dcfce7">
          <div className="icon"><Award size={18} color={GREEN} /></div>
          <div className="info">
            <div className="lbl">Total</div>
            <div className="val">{portfolios.length}</div>
          </div>
        </StatChip>
        <StatChip $bg="#d1fae5">
          <div className="icon"><CheckCircle size={18} color="#10b981" /></div>
          <div className="info">
            <div className="lbl">Verified</div>
            <div className="val">{totalVerified}</div>
          </div>
        </StatChip>
        <StatChip $bg="#fef3c7">
          <div className="icon"><Clock size={18} color="#f59e0b" /></div>
          <div className="info">
            <div className="lbl">Pending</div>
            <div className="val">{totalPending}</div>
          </div>
        </StatChip>
        <StatChip $bg="#dbeafe">
          <div className="icon"><Paperclip size={18} color="#3b82f6" /></div>
          <div className="info">
            <div className="lbl">With Files</div>
            <div className="val">{totalWithFiles}</div>
          </div>
        </StatChip>
      </StatsRow>

      {}
      <TableWrap>
        <TableHead>
          <span>Student</span>
          <span>Achievement</span>
          <span>Date</span>
          <span>Status</span>
          <span>Attachment</span>
          <span>Actions</span>
        </TableHead>

        <TableBody>
          {loading && <LoadingRow>Loading portfolios…</LoadingRow>}

          {!loading && filtered.length === 0 && (
            <EmptyState>
              <Award size={40} />
              <p>No portfolios found{search ? ` for "${search}"` : ''}.</p>
            </EmptyState>
          )}

          {filtered.map(p => (
            <TableRow key={p.id}>
              <UserCell>
                <div className="avatar">
                  {(p.user?.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="name">{p.user?.full_name || '—'}</div>
                  <div className="sub">{p.user?.student_id || p.user?.email || '—'}</div>
                </div>
              </UserCell>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{p.achievement_type || '—'}</div>
              </div>

              <MetaCell>
                <Calendar size={12} />
                {p.achievement_date ? format(new Date(p.achievement_date), 'MMM d, yyyy') : '—'}
              </MetaCell>

              <div>
                <StatusBadge $verified={p.verified}>
                  {p.verified
                    ? <><CheckCircle size={10} /> Verified</>
                    : <><Clock size={10} /> Pending</>
                  }
                </StatusBadge>
              </div>

              <div>
                {p.file_url ? (
                  <FileLink href={p.file_url} target="_blank" rel="noopener noreferrer" title={p.file_name}>
                    <Paperclip size={10} />
                    {p.file_name || 'View File'}
                    <ExternalLink size={10} />
                  </FileLink>
                ) : (
                  <span style={{ fontSize: 11, color: '#d1d5db' }}>No file</span>
                )}
              </div>

              <ActionBtns>
                {p.verified
                  ? <ActionBtn $danger title="Unverify" onClick={() => toggleVerify(p)}>
                      <XCircle size={13} />
                    </ActionBtn>
                  : <ActionBtn $success title="Verify achievement" onClick={() => toggleVerify(p)}>
                      <CheckCircle size={13} />
                    </ActionBtn>
                }
              </ActionBtns>
            </TableRow>
          ))}
        </TableBody>
      </TableWrap>

      {!loading && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280', textAlign: 'right' }}>
          Showing {filtered.length} of {portfolios.length} portfolios
        </div>
      )}
    </Page>
  );
}
