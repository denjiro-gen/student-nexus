import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Search, Plus } from 'lucide-react';
import { adminAPI } from '../../services/api';
import TaskModal from '../../components/admin/TaskModal';

const GREEN = '#03632B';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 114px);
  position: relative;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
`;

const WelcomeText = styled.div`
  h1 { font-size: 20px; font-weight: 800; color: ${GREEN}; margin-bottom: 4px; }
  p  { font-size: 13px; color: #6b7280; }
`;

const TopRight = styled.div`
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
  width: 200px;

  input {
    border: none; outline: none; font-size: 13px;
    color: #374151; width: 100%;
    &::placeholder { color: #9ca3af; }
  }
  svg { color: #9ca3af; flex-shrink: 0; }
`;

const BoardWrap = styled.div`
  display: flex;
  gap: 14px;
  flex: 1;
  overflow-x: auto;
  padding-bottom: 16px;

  &::-webkit-scrollbar { height: 5px; }
  &::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  width: 262px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
`;

const ColHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px 11px 14px;
  border-bottom: 1px solid #f3f4f6;

  .title {
    font-size: 10.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #374151;
  }

  .cnt {
    background: #f3f4f6;
    color: #6b7280;
    font-size: 10px;
    font-weight: 700;
    border-radius: 20px;
    padding: 1px 7px;
  }
`;

const ColBody = styled.div`
  padding: 10px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fafafa;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
`;

const Card = styled.div`
  background: ${p => p.$bg || '#ffffff'};
  border: 1px solid ${p => p.$border || '#e5e7eb'};
  border-radius: 10px;
  padding: 12px 12px 10px;
  transition: box-shadow 0.15s;
  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
`;

const CardBadgeRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
`;

const Badge = styled.span`
  font-size: 9.5px;
  font-weight: 800;
  padding: 2px 9px;
  border-radius: 4px;
  letter-spacing: 0.3px;
  background: ${p => {
    if (p.$t === 'VETTING') return '#fcd34d';
    if (p.$t === 'HIGH')    return '#f97316';
    return '#e5e7eb';  /* MEDIUM */
  }};
  color: ${p => p.$t === 'HIGH' ? '#ffffff' : '#374151'};
`;

const CardTitle = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: #111827;
  line-height: 1.35;
  margin-bottom: 6px;
`;

const CardDesc = styled.div`
  font-size: 11px;
  color: #6b7280;
  line-height: 1.45;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardDate = styled.div`
  font-size: 10px;
  color: #9ca3af;
  text-align: right;
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
`;

const CardFoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0,0,0,0.06);
  padding-top: 8px;

  .lbl {
    font-size: 8.5px;
    font-weight: 800;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.4;
  }

  select {
    padding: 3px 6px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 10.5px;
    font-weight: 700;
    color: #374151;
    background: #ffffff;
    cursor: pointer;
    outline: none;
    appearance: auto;
    &:hover { border-color: #9ca3af; }
  }
`;

const CreateBtn = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${GREEN};
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 11px 20px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(3,99,43,0.25);
  transition: background 0.15s;
  z-index: 10;

  &:hover { background: #024d21; }
`;

const COLS = [
  { key: 'cancelled', label: 'DRAFT / BACKLOG', cardBg: '#ffffff',  cardBorder: '#e5e7eb' },
  { key: 'pending',   label: 'PENDING REVIEW',  cardBg: '#fef9c3',  cardBorder: '#fde68a' },
  { key: 'approved',  label: 'IN PROCESS',      cardBg: '#fee2e2',  cardBorder: '#fca5a5' },
  { key: 'rejected',  label: 'IN REVIEW',       cardBg: '#d1fae5',  cardBorder: '#6ee7b7' },
  { key: 'completed', label: 'COMPLETED',       cardBg: '#ffffff',  cardBorder: '#e5e7eb' },
];

const STATUS_OPTS = [
  { value: 'cancelled', label: 'DRAFT'      },
  { value: 'pending',   label: 'PENDING'    },
  { value: 'approved',  label: 'IN PROCESS' },
  { value: 'rejected',  label: 'REVIEW'     },
  { value: 'completed', label: 'COMPLETED'  },
];

function getTag(status) {
  if (status === 'pending')   return 'VETTING';
  return 'MEDIUM';
}

export default function AdminKanban() {
  const [events,  setEvents]  = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await adminAPI.getAdminTasks();
    if (data) setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id, newStatus) => {
    // Optimistically update
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
    
    // Commit to database
    const { error } = await adminAPI.updateAdminTaskStatus(id, newStatus);
    if (error) {
      alert(`Failed to save changes: ${error.message || 'Unknown error'}`);
      // Revert by reloading the data
      load();
    }
  };

  const q = search.toLowerCase();
  const filtered = events.filter(e =>
    !q || e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
  );

  return (
    <Page>
      {}
      <TopRow>
        <WelcomeText>
          <h1>Welcome back, Workspace Lead Admin!</h1>
          <p>Drag-and-drop or select statuses below. Changes commit instantly to the workspace ledger.</p>
        </WelcomeText>
        <TopRight>
          <SearchWrap>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </SearchWrap>
        </TopRight>
      </TopRow>

      {}
      <BoardWrap>
        {COLS.map(col => {
          const cards = filtered.filter(e => e.status === col.key);
          return (
            <Col key={col.key}>
              <ColHead>
                <span className="title">{col.label}</span>
                <span className="cnt">{cards.length}</span>
              </ColHead>

              <ColBody>
                {loading && <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>Loading…</div>}

                {cards.map(ev => (
                  <Card key={ev.id} $bg={col.cardBg} $border={col.cardBorder}>
                    <CardBadgeRow>
                      <Badge $t={getTag(ev.status)}>{getTag(ev.status)}</Badge>
                    </CardBadgeRow>
                    <CardTitle>{ev.title}</CardTitle>
                    <CardDesc>{ev.description}</CardDesc>
                    <CardDate>
                      {ev.due_date
                        ? new Date(ev.due_date).toLocaleDateString('en-CA')
                        : '—'}
                    </CardDate>
                    <CardFoot>
                      <div className="lbl">SYSTEM<br/>DOCUMENT</div>
                      <select
                        value={ev.status}
                        onChange={e => changeStatus(ev.id, e.target.value)}
                      >
                        {STATUS_OPTS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </CardFoot>
                  </Card>
                ))}
              </ColBody>
            </Col>
          );
        })}
      </BoardWrap>

      {}
      <CreateBtn onClick={() => setModal(true)}>
        <Plus size={15} />
        Create Task Form
      </CreateBtn>

      {}
      <TaskModal isOpen={modal} onClose={() => setModal(false)} onSuccess={() => { setModal(false); load(); }} />
    </Page>
  );
}
