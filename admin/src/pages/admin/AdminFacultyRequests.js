import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAPI } from '../../services/api';
import { supabase } from '../../config/supabase';
import { CheckCircle2, XCircle, Clock, Package, Link as LinkIcon, ShieldCheck } from 'lucide-react';
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

const RequestTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
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
  &.view { background: #f3f4f6; color: #374151; border-color: #d1d5db; }
  
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

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
`;

const ModalBox = styled.div`
  background: #fff;
  border-radius: 16px;
  width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  overflow: hidden;
`;

const ModalHead = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
  h3 { margin: 0; font-size: 18px; font-weight: 800; color: #111827; }
  p  { margin: 6px 0 0; font-size: 13px; color: #6b7280; }
`;

const ModalBody = styled.div`
  padding: 20px 24px;
  textarea {
    width: 100%; box-sizing: border-box;
    padding: 12px 14px; font-size: 14px; font-family: inherit;
    border: 1px solid #d1d5db; border-radius: 8px;
    resize: vertical; min-height: 100px; outline: none;
    &:focus { border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(3,99,43,0.1); }
  }
`;

const ModalFoot = styled.div`
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
  display: flex; justify-content: flex-end; gap: 10px;
`;

const ModalBtn = styled.button`
  padding: 9px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;
  cursor: pointer; border: none;
  &.cancel { background: #fff; border: 1px solid #d1d5db; color: #374151; &:hover { background: #f3f4f6; } }
  &.confirm { background: ${p => p.$color || GREEN}; color: white; &:hover { filter: brightness(0.9); } }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default function AdminFacultyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state — replaces prompt() and confirm()
  const [modal, setModal] = useState(null); // { type: 'approve'|'reject', req }
  const [rejectNotes, setRejectNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { 
    load(); 
    
    // Auto-refresh when new requests arrive or get updated
    const channel = supabase
      .channel('faculty-requests-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'faculty_requests' },
        () => {
          console.log('Real-time update received for faculty_requests');
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await adminAPI.getFacultyRequests();
    if (error) console.error("Error fetching faculty requests:", error);
    if (data) setRequests(data);
    setLoading(false);
  };

  const handleDecision = (req, status) => {
    // Open custom modal instead of using window.prompt/confirm
    setRejectNotes('');
    setModal({ type: status, req });
  };

  const confirmDecision = async () => {
    if (!modal) return;
    const { type, req } = modal;
    const notes = type === 'rejected' ? rejectNotes.trim() : null;
    if (type === 'rejected' && !notes) return;

    setActionLoading(true);
    const { error } = await adminAPI.updateFacultyRequestStatus(req.id, type, notes);
    setActionLoading(false);
    setModal(null);
    if (!error) {
      load();
    } else {
      alert('Failed to update request: ' + (error.message || 'Unknown error'));
    }
  };

  const handleViewDoc = (url) => {
    window.open(url, '_blank');
  };

  if (loading) return <Page style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading faculty requests...</Page>;

  return (
    <>
      {/* Custom Confirm Modal */}
      {modal && (
        <Overlay onClick={() => !actionLoading && setModal(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalHead>
              {modal.type === 'approved' ? (
                <><h3>✅ Approve Request</h3><p>Are you sure you want to approve this faculty request?</p></>
              ) : (
                <><h3>❌ Reject Request</h3><p>Please provide a reason for rejecting this request.</p></>
              )}
            </ModalHead>
            {modal.type === 'rejected' && (
              <ModalBody>
                <textarea
                  placeholder="Enter rejection reason..."
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  autoFocus
                />
              </ModalBody>
            )}
            <ModalFoot>
              <ModalBtn className="cancel" onClick={() => setModal(null)} disabled={actionLoading}>Cancel</ModalBtn>
              <ModalBtn
                className="confirm"
                $color={modal.type === 'approved' ? GREEN : '#ef4444'}
                onClick={confirmDecision}
                disabled={actionLoading || (modal.type === 'rejected' && !rejectNotes.trim())}
              >
                {actionLoading ? 'Processing...' : modal.type === 'approved' ? 'Approve' : 'Reject'}
              </ModalBtn>
            </ModalFoot>
          </ModalBox>
        </Overlay>
      )}

      <Page>
        <Header>
          <h1><Package size={28} color={GREEN} /> Faculty Requests</h1>
          <p>Review and approve equipment, venue, and resource requests from faculty members.</p>
        </Header>

        {requests.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            <ShieldCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ margin: 0, color: '#374151' }}>No Requests</h3>
            <p style={{ marginTop: 8 }}>There are no faculty requests pending review.</p>
          </Card>
        ) : (
          requests.map(req => (
            <Card key={req.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <RequestTitle>{req.title}</RequestTitle>
                <StatusBadge $status={req.status}>
                  {req.status === 'approved' ? <CheckCircle2 size={12}/> : req.status === 'rejected' ? <XCircle size={12}/> : <Clock size={12}/>}
                  {req.status}
                </StatusBadge>
              </div>

              <Meta>
                <span>By: <strong>{req.user?.full_name || 'Faculty Member'}</strong> {req.user?.email ? `(${req.user.email})` : ''}</span>
                <span>Submitted: {format(new Date(req.created_at), 'MMM d, yyyy h:mm a')}</span>
              </Meta>

              <ContentBox>{req.description}</ContentBox>

              {req.status === 'pending' && (
                <ActionRow>
                  <Btn className="approve" onClick={() => handleDecision(req, 'approved')}>
                    <CheckCircle2 size={16} /> Approve
                  </Btn>
                  <Btn className="reject" onClick={() => handleDecision(req, 'rejected')}>
                    <XCircle size={16} /> Reject
                  </Btn>
                  {req.document_url && (
                    <Btn className="view" onClick={() => handleViewDoc(req.document_url)} style={{ marginLeft: 'auto' }}>
                      <LinkIcon size={16} /> View Attached Document
                    </Btn>
                  )}
                </ActionRow>
              )}

              {req.status !== 'pending' && (
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {req.review_notes ? (
                    <div style={{ fontSize: 13, color: '#6b7280', display: 'flex', gap: 6, background: '#f3f4f6', padding: 12, borderRadius: 6, flex: 1 }}>
                      <ShieldCheck size={16} color={req.status === 'approved' ? GREEN : '#ef4444'} />
                      <div><strong>Admin Remarks:</strong> {req.review_notes}</div>
                    </div>
                  ) : <div />}

                  {req.document_url && (
                    <Btn className="view" onClick={() => handleViewDoc(req.document_url)} style={{ marginLeft: 16 }}>
                      <LinkIcon size={16} /> View Document
                    </Btn>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </Page>
    </>
  );
}
