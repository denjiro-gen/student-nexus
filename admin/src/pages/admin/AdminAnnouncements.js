import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '../../config/supabase';
import { Megaphone, Plus, Trash2, Edit3, X, Check, Image, Globe, EyeOff, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const GREEN = '#03632B';

const Page = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  h1 { font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 4px; display: flex; align-items: center; gap: 10px; }
  p { font-size: 14px; color: #6b7280; margin: 0; }
`;

const AddBtn = styled.button`
  background: ${GREEN};
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  &:hover { background: #024d21; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
`;

const CardImg = styled.div`
  height: 180px;
  background: #f3f4f6;
  overflow: hidden;
  position: relative;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

const PublishedBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  background: ${p => p.$pub ? '#d1fae5' : '#f3f4f6'};
  color: ${p => p.$pub ? '#059669' : '#6b7280'};
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CardBody = styled.div`
  padding: 16px 18px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CardDate = styled.div`
  font-size: 11px;
  color: ${GREEN};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 800;
  color: #111827;
  margin: 0;
  line-height: 1.3;
`;

const CardDesc = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardActions = styled.div`
  padding: 12px 18px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const ActionBtn = styled.button`
  border: 1px solid ${p => p.$danger ? '#fca5a5' : '#e5e7eb'};
  background: ${p => p.$danger ? '#fee2e2' : '#f9fafb'};
  color: ${p => p.$danger ? '#dc2626' : '#374151'};
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  &:hover { opacity: 0.8; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const ModalHead = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 { margin: 0; font-size: 18px; font-weight: 800; color: #111827; }
  flex-shrink: 0;
`;

const ModalBody = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  flex: 1;
`;

const ModalFoot = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-shrink: 0;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 6px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: ${GREEN}; box-shadow: 0 0 0 2px rgba(3,99,43,0.1); }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  box-sizing: border-box;
  &:focus { border-color: ${GREEN}; box-shadow: 0 0 0 2px rgba(3,99,43,0.1); }
`;

const Toggle = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  background: white;
  border-radius: 14px;
  border: 1px dashed #e5e7eb;
  grid-column: 1 / -1;
`;

const BLANK = { title: '', description: '', image_url: '', is_published: true };

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = new
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [adminId, setAdminId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('official_announcements')
      .select(`*, author:users!official_announcements_author_id_fkey(full_name)`)
      .order('created_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAdminId(user.id);
    });
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(BLANK);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item.id);
    setForm({ title: item.title, description: item.description || '', image_url: item.image_url || '', is_published: item.is_published !== false });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Title is required.');
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim() || null,
      is_published: form.is_published,
      status: 'approved',
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('official_announcements').update(payload).eq('id', editing));
    } else {
      ({ error } = await supabase.from('official_announcements').insert({ ...payload, author_id: adminId, created_at: new Date().toISOString() }));
    }

    setSaving(false);
    if (error) { alert('Failed to save: ' + error.message); return; }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('official_announcements').delete().eq('id', id);
    if (error) { alert('Failed to delete: ' + error.message); return; }
    setConfirmDelete(null);
    load();
  };

  const togglePublish = async (item) => {
    await supabase.from('official_announcements').update({ is_published: !item.is_published }).eq('id', item.id);
    load();
  };

  return (
    <Page>
      <PageHeader>
        <div>
          <h1><Megaphone size={26} color={GREEN} /> Website Announcements</h1>
          <p>Manage announcements that appear on the public OSAS website.</p>
        </div>
        <AddBtn onClick={openNew}><Plus size={18} /> New Announcement</AddBtn>
      </PageHeader>

      <Grid>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Loading...</div>
        ) : announcements.length === 0 ? (
          <EmptyState>
            <Megaphone size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <h3 style={{ margin: '0 0 8px', color: '#374151' }}>No announcements yet</h3>
            <p style={{ margin: 0, fontSize: 14 }}>Create your first announcement to display it on the website.</p>
          </EmptyState>
        ) : (
          announcements.map(item => (
            <Card key={item.id}>
              <CardImg>
                {item.image_url
                  ? <img src={item.image_url} alt={item.title} />
                  : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#d1d5db' }}><Image size={48} /></div>
                }
                <PublishedBadge $pub={item.is_published}>
                  {item.is_published ? <><Globe size={11} /> Published</> : <><EyeOff size={11} /> Hidden</>}
                </PublishedBadge>
              </CardImg>
              <CardBody>
                <CardDate>{item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : '—'}</CardDate>
                <CardTitle>{item.title}</CardTitle>
                <CardDesc>{item.description || 'No description.'}</CardDesc>
              </CardBody>
              <CardActions>
                <ActionBtn onClick={() => togglePublish(item)}>
                  {item.is_published ? <><EyeOff size={13} /> Hide</> : <><Globe size={13} /> Publish</>}
                </ActionBtn>
                <ActionBtn onClick={() => openEdit(item)}><Edit3 size={13} /> Edit</ActionBtn>
                <ActionBtn $danger onClick={() => setConfirmDelete(item)}><Trash2 size={13} /> Delete</ActionBtn>
              </CardActions>
            </Card>
          ))
        )}
      </Grid>

      {/* Create / Edit Modal */}
      {showModal && (
        <Overlay onClick={() => setShowModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHead>
              <h2>{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
              <X size={20} style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setShowModal(false)} />
            </ModalHead>
            <ModalBody>
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Scholarship Applications Now Open" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Write the full announcement text here..." rows={5} />
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                {form.image_url && (
                  <img src={form.image_url} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} onError={e => e.target.style.display = 'none'} />
                )}
              </div>
              <Toggle>
                <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                Publish immediately (visible on website)
              </Toggle>
            </ModalBody>
            <ModalFoot>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', background: GREEN, color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving ? 'Saving...' : <><Check size={16} /> Save Announcement</>}
              </button>
            </ModalFoot>
          </Modal>
        </Overlay>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <Overlay onClick={() => setConfirmDelete(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 380, width: '90%', textAlign: 'center' }}>
            <div style={{ background: '#fee2e2', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} color="#dc2626" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Delete Announcement?</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
              "<strong>{confirmDelete.title}</strong>" will be permanently removed from the website.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', background: 'white', fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </Overlay>
      )}
    </Page>
  );
}
