import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Archive, Download, Trash2, Search, RotateCcw } from 'lucide-react';
import { repositoryAPI, adminAPI } from '../../services/api';

const GREEN = '#03632B';

/* ─── Layout ─── */
const Page = styled.div`max-width: 1200px; margin: 0 auto;`;
const TopBar = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
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
  padding: 8px 14px; gap: 8px; width: 220px;
  input { border: none; outline: none; font-size: 13px; color: #374151; width: 100%; }
`;
const OrgSelect = styled.select`
  padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px;
  font-size: 13px; color: #374151; background: #fff; cursor: pointer; outline: none;
`;
const Card = styled.div`
  background: #ffffff; border: 1px solid #e5e7eb;
  border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse;
  th {
    background: #f9fafb; padding: 14px 16px; text-align: left;
    font-size: 11px; font-weight: 700; color: #6b7280;
    text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;
  }
  td { padding: 14px 16px; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafafa; }
`;

const ActionBtn = styled.button`
  background: transparent; border: none; cursor: pointer; color: ${p => p.$danger ? '#ef4444' : GREEN};
  padding: 6px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;
  &:hover { background: ${p => p.$danger ? '#fef2f2' : '#e8f5ee'}; }
`;

export default function AdminRepository() {
  const [docs, setDocs] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('all');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadDocs(); }, [selectedOrg]);

  const loadData = async () => {
    const res = await adminAPI.getOrganizations();
    if (res.data) setOrgs(res.data);
    loadDocs();
  };

  const loadDocs = async () => {
    setLoading(true);
    let res;
    if (selectedOrg === 'all') {
      res = await repositoryAPI.getAllRepositories();
    } else {
      res = await repositoryAPI.getOrgRepository(selectedOrg);
      // For specific org, we might need to patch the org object if it's missing in the query, 
      // but let's assume it's loaded in the parent component or join works.
    }
    if (res.data) {
      setDocs(res.data);
    }
    setLoading(false);
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      const { error } = await repositoryAPI.deleteRepositoryDoc(id);
      if (!error) {
        loadDocs();
      } else {
        alert('Failed to delete document.');
      }
    }
  };

  const filtered = docs.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return d.title?.toLowerCase().includes(s) || d.document_type?.toLowerCase().includes(s);
  });

  return (
    <Page>
      <TopBar>
        <Title><Archive size={26} color={GREEN} /> Organization Repositories</Title>
        <ToolRow>
          <SearchWrap>
            <Search size={14} color="#9ca3af" />
            <input
              placeholder="Search document title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </SearchWrap>
          <OrgSelect value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
            <option value="all">All Organizations</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </OrgSelect>
          <ActionBtn onClick={loadDocs} style={{ background: '#e8f5ee', padding: '8px 12px' }}>
            <RotateCcw size={14} /> Refresh
          </ActionBtn>
        </ToolRow>
      </TopBar>

      <Card>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading repository documents…</div>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Title</th>
                <th>Type</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <Archive size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <div>No documents found in repository.</div>
                  </td>
                </tr>
              ) : (
                filtered.map(doc => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600 }}>{doc.organization?.name || 'Unknown'}</td>
                    <td>{doc.title}</td>
                    <td>
                      <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: 12 }}>
                        {doc.document_type}
                      </span>
                    </td>
                    <td>
                      {doc.uploader?.full_name || 'Unknown'}<br/>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{doc.uploader?.email}</span>
                    </td>
                    <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <ActionBtn onClick={() => window.open(doc.document_url, '_blank')} title="Download">
                          <Download size={16} />
                        </ActionBtn>
                        <ActionBtn $danger onClick={() => handleDelete(doc.id, doc.title)} title="Delete">
                          <Trash2 size={16} />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </Card>
    </Page>
  );
}
