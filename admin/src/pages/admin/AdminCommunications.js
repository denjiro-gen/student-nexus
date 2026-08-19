import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAPI } from '../../services/api';
import { supabase } from '../../config/supabase';
import { MessageSquare, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

const GREEN = '#03632B';

const Page = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 24px;
  h1 { font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 8px; display: flex; align-items: center; gap: 10px; }
  p { font-size: 14px; color: #6b7280; margin: 0; }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;

const AnnouncementTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 16px;
  
  strong { color: #374151; }
`;

const ContentBox = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  margin-bottom: 16px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
`;

const Btn = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  
  &.approve { background: ${GREEN}; color: white; }
  &.reject { background: #ffffff; border-color: #ef4444; color: #ef4444; }
  
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  
  background: ${p => p.$status === 'approved' ? '#d1fae5' : p.$status === 'rejected' ? '#fee2e2' : '#fef3c7'};
  color: ${p => p.$status === 'approved' ? '#065f46' : p.$status === 'rejected' ? '#991b1b' : '#92400e'};
`;

export default function AdminCommunications() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await adminAPI.getOfficialAnnouncements();
    if (data) setAnnouncements(data);
    setLoading(false);
  };

  const handleDecision = async (ann, status) => {
    let notes = null;
    if (status === 'rejected') {
      notes = window.prompt('Reason for rejection:');
      if (!notes) return;
    } else {
      if (!window.confirm('Approve this announcement to be broadcasted to all students?')) return;
    }

    
    const { data: { user } } = await supabase.auth.getUser();
    const adminId = user?.id || null;

    const { error } = await adminAPI.reviewAnnouncement(ann.id, status, notes, adminId);
    if (!error) {
      
      await adminAPI.logAction(
        'REVIEW_ANNOUNCEMENT',
        'official_announcements',
        ann.id,
        { status: ann.status },
        { status, review_notes: notes, reviewed_by: adminId }
      );
      load();
    } else {
      alert('Failed to review announcement: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) return <Page style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading communications...</Page>;

  return (
    <Page>
      <Header>
        <h1><MessageSquare size={28} color={GREEN} /> Official Communications</h1>
        <p>Manage official organizational announcements.</p>
      </Header>

      {announcements.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <ShieldCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ margin: 0, color: '#374151' }}>No Announcements</h3>
          <p style={{ marginTop: 8 }}>There are no official announcements pending review.</p>
        </Card>
      ) : (
        announcements.map(ann => (
          <Card key={ann.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <AnnouncementTitle>{ann.title}</AnnouncementTitle>
              <StatusBadge $status={ann.status}>
                {ann.status === 'approved' ? <CheckCircle2 size={12}/> : ann.status === 'rejected' ? <XCircle size={12}/> : <Clock size={12}/>}
                {ann.status}
              </StatusBadge>
            </div>

            <Meta>
              <span>By: <strong>{ann.author?.full_name || 'Unknown'}</strong></span>
              <span>Org: <strong>{ann.organization?.name}</strong></span>
              <span>Submitted: {format(new Date(ann.created_at), 'MMM d, yyyy h:mm a')}</span>
              {ann.reviewer && <span>Reviewed by: <strong>{ann.reviewer.full_name}</strong></span>}
            </Meta>

            <ContentBox>{ann.content}</ContentBox>

            {ann.status === 'pending' && (
              <ActionRow>
                <Btn className="approve" onClick={() => handleDecision(ann, 'approved')}>
                  <CheckCircle2 size={16} /> Approve &amp; Publish
                </Btn>
                <Btn className="reject" onClick={() => handleDecision(ann, 'rejected')}>
                  <XCircle size={16} /> Reject
                </Btn>
              </ActionRow>
            )}

            {ann.status !== 'pending' && ann.review_notes && (
              <div style={{ marginTop: 16, fontSize: 13, color: '#6b7280', display: 'flex', gap: 6, background: '#f3f4f6', padding: 12, borderRadius: 6 }}>
                <ShieldCheck size={16} color={ann.status === 'approved' ? GREEN : '#ef4444'} />
                <div>
                  <strong>Admin Remarks:</strong> {ann.review_notes}
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </Page>
  );
}

