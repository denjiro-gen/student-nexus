import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  Users, Search, RefreshCw, Shield, GraduationCap,
  UserCheck, Mail, Calendar, XCircle, CheckCircle2
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
  width: 220px;

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
    width: 36px; height: 36px;
    border-radius: 50%;
    background: ${p => p.$color || GREEN};
    color: #ffffff;
    font-weight: 700;
    font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .name { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 1px; }
  .email { font-size: 11px; color: #6b7280; display: flex; align-items: center; gap: 3px; }
`;

const RoleBadge = styled.span`
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  background: ${p => {
    if (p.$r === 'admin')          return '#fce7f3';
    if (p.$r === 'osas_staff')     return '#dbeafe';
    if (p.$r === 'student_leader') return '#d1fae5';
    if (p.$r === 'advisor')        return '#fef3c7';
    return '#f3f4f6';
  }};
  color: ${p => {
    if (p.$r === 'admin')          return '#9d174d';
    if (p.$r === 'osas_staff')     return '#1d4ed8';
    if (p.$r === 'student_leader') return '#065f46';
    if (p.$r === 'advisor')        return '#92400e';
    return '#374151';
  }};
  text-transform: capitalize;
  white-space: nowrap;
`;

// eslint-disable-next-line no-unused-vars
const StatusDot = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: ${p => p.$active ? GREEN : '#ef4444'};

  &::before {
    content: '';
    width: 7px; height: 7px;
    border-radius: 50%;
    background: ${p => p.$active ? GREEN : '#ef4444'};
    display: block;
  }
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  background: ${p => p.$active ? '#f0fdf4' : '#fffbeb'};
  color: ${p => p.$active ? '#166534' : '#b45309'};
  border: 1px solid ${p => p.$active ? '#bbf7d0' : '#fde68a'};

  .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: ${p => p.$active ? '#16a34a' : '#d97706'};
  }
`;

const DateCell = styled.div`
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
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
  color: ${p => p.$danger ? '#ef4444' : p.$success ? GREEN : '#6b7280'};
  transition: all 0.12s;

  &:hover {
    background: ${p => p.$danger ? '#fef2f2' : p.$success ? '#f0fdf4' : '#f3f4f6'};
    border-color: ${p => p.$danger ? '#fca5a5' : p.$success ? '#86efac' : '#d1d5db'};
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

const ROLE_COLORS = {
  admin:          '#9d174d',
  osas_staff:     '#1d4ed8',
  student_leader: GREEN,
  advisor:        '#92400e',
  student:        '#6b7280',
};

function formatRole(role) {
  return role?.replace(/_/g, ' ') || '—';
}

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await adminAPI.getUsers();
    if (data) setUsers(data);
    if (error) console.error('Users load error:', error);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (user) => {
    const newStatus = !user.is_active;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
    
    const { error } = await adminAPI.updateUserStatus(user.id, newStatus);
    if (error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: user.is_active } : u));
      console.error('Update user error:', error);
    } else if (newStatus === true && !user.is_active) {
      // Send notification when account is approved
      await adminAPI.sendNotification(
        user.id,
        'Account Approved',
        'Your account has been verified by the OSAS Administrator. You can now access all features.',
        'system'
      );
    }
  };

  const q = search.toLowerCase();
  const filtered = users.filter(u => {
    const matchSearch = !q ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.student_id?.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  
  const totalActive   = users.filter(u => u.is_active).length;
  const totalStudents = users.filter(u => u.role === 'student' || u.role === 'student_leader').length;
  const totalStaff    = users.filter(u => u.role === 'admin' || u.role === 'osas_staff').length;
  const totalAdvisors = users.filter(u => u.role === 'advisor').length;

  return (
    <Page>
      <TopRow>
        <TitleBlock>
          <h1>User Management</h1>
          <p>Manage accounts, roles, and access across the OSAS platform.</p>
        </TitleBlock>
        <Controls>
          <SearchWrap>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search name, email, ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </SearchWrap>
          <FilterSelect value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="osas_staff">OSAS Staff</option>
            <option value="student_leader">Student Leader</option>
            <option value="advisor">Advisor</option>
            <option value="student">Student</option>
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
          <div className="icon"><Users size={18} color={GREEN} /></div>
          <div className="info">
            <div className="lbl">Active Users</div>
            <div className="val">{totalActive}</div>
          </div>
        </StatChip>
        <StatChip $bg="#dbeafe">
          <div className="icon"><GraduationCap size={18} color="#3b82f6" /></div>
          <div className="info">
            <div className="lbl">Students</div>
            <div className="val">{totalStudents}</div>
          </div>
        </StatChip>
        <StatChip $bg="#fce7f3">
          <div className="icon"><Shield size={18} color="#9d174d" /></div>
          <div className="info">
            <div className="lbl">Staff &amp; Admin</div>
            <div className="val">{totalStaff}</div>
          </div>
        </StatChip>
        <StatChip $bg="#fef3c7">
          <div className="icon"><UserCheck size={18} color="#92400e" /></div>
          <div className="info">
            <div className="lbl">Advisors</div>
            <div className="val">{totalAdvisors}</div>
          </div>
        </StatChip>
      </StatsRow>

      {}
      <TableWrap>
        <TableHead>
          <span>User</span>
          <span>Student ID</span>
          <span>Role</span>
          <span>Status</span>
          <span>Joined</span>
          <span>Actions</span>
        </TableHead>

        <TableBody>
          {loading && <LoadingRow>Loading users…</LoadingRow>}

          {!loading && filtered.length === 0 && (
            <EmptyState>
              <Users size={40} />
              <p>No users found{search ? ` for "${search}"` : ''}.</p>
            </EmptyState>
          )}

          {filtered.map(u => (
            <TableRow key={u.id}>
              <UserCell $color={ROLE_COLORS[u.role]}>
                <div className="avatar">
                  {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="name">{u.full_name || '—'}</div>
                  <div className="email">
                    <Mail size={10} />
                    {u.email}
                  </div>
                </div>
              </UserCell>

              <DateCell>
                {u.student_id || <span style={{ color: '#d1d5db' }}>—</span>}
              </DateCell>

              <div>
                <RoleBadge $r={u.role}>{formatRole(u.role)}</RoleBadge>
              </div>

              <StatusBadge $active={u.is_active}>
                <span className="dot" />
                {u.is_active ? 'Active' : 'Pending Approval'}
              </StatusBadge>

              <DateCell>
                <Calendar size={12} />
                {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
              </DateCell>

              <ActionBtns>
                {u.is_active ? (
                  <ActionBtn title="Deactivate User" $danger onClick={() => toggleStatus(u)}>
                    <XCircle size={16} />
                  </ActionBtn>
                ) : (
                  <ActionBtn title="Approve User" $success style={{ background: '#f0fdf4', borderColor: '#86efac' }} onClick={() => toggleStatus(u)}>
                    <CheckCircle2 size={16} />
                  </ActionBtn>
                )}
                <ActionBtn title="Send message">
                  <Mail size={13} />
                </ActionBtn>
              </ActionBtns>
            </TableRow>
          ))}
        </TableBody>
      </TableWrap>

      {}
      {!loading && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#6b7280', textAlign: 'right' }}>
          Showing {filtered.length} of {users.length} users
        </div>
      )}
    </Page>
  );
}
