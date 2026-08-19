import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Loader } from 'lucide-react';
import { supabase } from '../../config/supabase';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px 16px;
  border-bottom: 1px solid #f3f4f6;

  h2 {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }

  button {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;

    &:hover {
      background-color: #f3f4f6;
      color: #374151;
    }
  }
`;

const ModalBody = styled.div`
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input, textarea, select {
    width: 100%;
    padding: 12px 16px;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    color: #111827;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: #03632B;
      background-color: #ffffff;
      box-shadow: 0 0 0 3px rgba(3, 99, 43, 0.1);
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const PriorityGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    text-transform: none;
    letter-spacing: normal;
    cursor: pointer;

    input[type="radio"] {
      width: 16px;
      height: 16px;
      accent-color: #03632B;
      margin: 0;
    }
  }
`;

const ModalFooter = styled.div`
  padding: 16px 32px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  transition: all 0.2s ease;
  border: ${props => props.$primary ? 'none' : '1px solid #e5e7eb'};
  background-color: ${props => props.$primary ? '#03632B' : '#ffffff'};
  color: ${props => props.$primary ? '#ffffff' : '#374151'};

  &:hover {
    background-color: ${props => props.$primary ? '#024d21' : '#f9fafb'};
  }
  &:disabled {
    opacity: 0.7; cursor: not-allowed;
  }
`;

const TaskModal = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('cancelled'); 
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title) return alert('Task Deliverable Name is required');
    setLoading(true);

    try {

      const { data, error } = await supabase
        .from('admin_tasks')
        .insert([{
          title,
          description: desc,
          due_date: dueDate || new Date().toISOString().split('T')[0],
          assignee: assignee, 
          status,
          priority: 'medium'
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      if (onSuccess) onSuccess(data);
      
      
      setTitle(''); setDesc(''); setAssignee(''); setDueDate(''); setStatus('cancelled');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to submit task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>Register Workplace Deliverable</h2>
          <button onClick={onClose}><X size={20} /></button>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <label>Task Deliverable Name *</label>
            <input type="text" placeholder="e.g. Audit Feedback, Conduct design" value={title} onChange={e => setTitle(e.target.value)} />
          </FormGroup>

          <FormGroup>
            <label>Description / Action Plan</label>
            <textarea placeholder="Type down specific action steps, expectations, or references required..." value={desc} onChange={e => setDesc(e.target.value)} />
          </FormGroup>

          <Row>
            <FormGroup>
              <label>Assigned Member Name</label>
              <input type="text" placeholder="e.g. John Smith" value={assignee} onChange={e => setAssignee(e.target.value)} />
            </FormGroup>
            <FormGroup>
              <label>Target Due Date</label>
              <div style={{ position: 'relative' }}>
                <input type="date" style={{ color: '#6b7280' }} value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </FormGroup>
          </Row>

          <Row>
            <FormGroup>
              <label>Priority Status</label>
              <PriorityGroup>
                <label><input type="radio" name="priority" value="low" defaultChecked /> LOW</label>
                <label><input type="radio" name="priority" value="medium" /> MEDIUM</label>
                <label><input type="radio" name="priority" value="high" /> HIGH</label>
              </PriorityGroup>
            </FormGroup>
            <FormGroup>
              <label>Workflow Column Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="cancelled">Draft / Backlog</option>
                <option value="pending">Pending Review</option>
                <option value="approved">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </FormGroup>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} disabled={loading}>Discard</Button>
          <Button $primary onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader size={16} /> : 'Submit Task'}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default TaskModal;
