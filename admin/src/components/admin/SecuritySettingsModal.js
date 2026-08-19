import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Shield, Smartphone } from 'lucide-react';
import { mfaHelpers } from '../../config/security';
import { QRCodeSVG } from 'qrcode.react';

const GREEN = '#03632B';

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
`;
const Modal = styled.div`
  background: #fff; width: 450px; border-radius: 12px;
  overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
`;
const Head = styled.div`
  padding: 16px 24px; border-bottom: 1px solid #e5e7eb;
  display: flex; justify-content: space-between; align-items: center;
`;
const Title = styled.h3`
  margin: 0; font-size: 16px; font-weight: 700; color: #111827;
  display: flex; align-items: center; gap: 8px;
`;
const Body = styled.div`
  padding: 24px;
`;
const CloseBtn = styled.button`
  background: none; border: none; color: #9ca3af; cursor: pointer;
  &:hover { color: #111827; }
`;
const StatusBox = styled.div`
  padding: 16px; border-radius: 8px; margin-bottom: 24px;
  background: ${p => p.$active ? '#dcfce7' : '#f3f4f6'};
  border: 1px solid ${p => p.$active ? '#bbf7d0' : '#e5e7eb'};
  display: flex; align-items: center; gap: 12px;
`;
const ActionBtn = styled.button`
  width: 100%; padding: 12px; border-radius: 8px; font-weight: 600;
  background: ${p => p.$danger ? '#fee2e2' : GREEN};
  color: ${p => p.$danger ? '#dc2626' : '#fff'};
  border: 1px solid ${p => p.$danger ? '#f87171' : GREEN};
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
const CodeInput = styled.input`
  width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #d1d5db;
  text-align: center; font-size: 20px; letter-spacing: 4px; margin-bottom: 16px;
`;

export default function SecuritySettingsModal({ onClose }) {
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollData, setEnrollData] = useState(null); 
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => { loadMFA(); }, []);

  const loadMFA = async () => {
    setLoading(true);
    const { factors, error } = await mfaHelpers.getFactors();
    if (!error) {
      setFactors(factors.filter(f => f.status === 'verified'));
    }
    setLoading(false);
  };

  const handleEnroll = async () => {
    setLoading(true);
    setError(null);
    const result = await mfaHelpers.enrollTOTP();
    if (result.error) {
      setError(result.error.message);
    } else {
      setEnrollData(result);
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    const { error } = await mfaHelpers.verifyTOTP(enrollData.factorId, totpCode);
    if (error) {
      setError('Invalid verification code.');
      setLoading(false);
    } else {
      setEnrollData(null);
      setTotpCode('');
      loadMFA();
    }
  };

  const handleUnenroll = async (factorId) => {
    if (!window.confirm('Are you sure you want to disable MFA?')) return;
    setLoading(true);
    await mfaHelpers.unenroll(factorId);
    loadMFA();
  };

  const isEnrolled = factors.length > 0;

  return (
    <Overlay>
      <Modal>
        <Head>
          <Title><Shield size={18} color={GREEN} /> Security Settings</Title>
          <CloseBtn onClick={onClose}><X size={20} /></CloseBtn>
        </Head>
        <Body>
          {error && <div style={{ color: '#dc2626', background: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>
          ) : enrollData ? (
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 15 }}>Setup Authenticator App</h4>
              <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 20 }}>Scan this QR code with Google Authenticator or Authy.</p>
              
              <div style={{ background: '#f9fafb', padding: 16, display: 'inline-block', borderRadius: 8, marginBottom: 20 }}>
                <QRCodeSVG value={enrollData.qrUri} size={150} />
              </div>
              
              <CodeInput 
                type="text" 
                placeholder="000000" 
                maxLength={6} 
                value={totpCode} 
                onChange={e => setTotpCode(e.target.value)} 
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <ActionBtn $danger onClick={() => { setEnrollData(null); setTotpCode(''); }}>Cancel</ActionBtn>
                <ActionBtn onClick={handleVerify} disabled={totpCode.length !== 6}>Verify & Enable</ActionBtn>
              </div>
            </div>
          ) : (
            <>
              <StatusBox $active={isEnrolled}>
                <Smartphone size={24} color={isEnrolled ? '#059669' : '#9ca3af'} />
                <div>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>Multi-Factor Authentication (MFA)</div>
                  <div style={{ fontSize: 13, color: '#4b5563' }}>
                    {isEnrolled ? 'Your account is secured with TOTP.' : 'Add an extra layer of security to your account.'}
                  </div>
                </div>
              </StatusBox>

              {isEnrolled ? (
                <ActionBtn $danger onClick={() => handleUnenroll(factors[0].id)}>
                  Disable MFA
                </ActionBtn>
              ) : (
                <ActionBtn onClick={handleEnroll}>
                  Enable MFA
                </ActionBtn>
              )}
            </>
          )}
        </Body>
      </Modal>
    </Overlay>
  );
}
