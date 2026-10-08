import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '../config/supabase';
import { rateLimiter } from '../config/security';
import { ShieldCheck, Lock, Mail, Loader, ShieldAlert, Eye, EyeOff } from 'lucide-react';

const GREEN      = '#03632B';
const GREEN_DARK = '#024d21';

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  padding: 20px;
`;

const Box = styled.div`
  background: #ffffff;
  padding: 40px 36px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  border: 1px solid #e5e7eb;
  width: 100%;
  max-width: 400px;
`;

const LogoBlock = styled.div`
  text-align: center;
  margin-bottom: 28px;

  .icon-wrap {
    width: 52px;
    height: 52px;
    background: #f0fdf4;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 14px;
  }

  h2 { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 6px 0; }
  p  { font-size: 13px; color: #6b7280; margin: 0; }
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
`;

const InputWrap = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const InputIcon = styled.div`
  position: absolute;
  top: 50%; left: 11px;
  transform: translateY(-50%);
  color: #9ca3af;
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const EyeBtn = styled.button`
  position: absolute;
  top: 50%; right: 11px;
  transform: translateY(-50%);
  background: none; border: none;
  cursor: pointer; color: #9ca3af;
  display: flex; align-items: center; padding: 0;
  &:hover { color: #6b7280; }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 36px 10px 36px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  outline: none;
  box-sizing: border-box;
  font-size: 14px;
  color: #111827;
  background: #fff;
  &:focus {
    border-color: ${GREEN};
    box-shadow: 0 0 0 2px rgba(3,99,43,0.12);
  }
  &::placeholder { color: #9ca3af; }
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: 6px;
  background: ${GREEN};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-top: 4px;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: ${GREEN_DARK}; }
  &:disabled { opacity: 0.65; cursor: not-allowed; }
`;

const ErrorMsg = styled.div`
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 18px;
  display: flex; align-items: flex-start; gap: 8px;
  svg { flex-shrink: 0; margin-top: 1px; }
`;

const FooterNote = styled.div`
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: #9ca3af;
`;

export default function AdminLogin() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // No navigate() here — App.js AuthGate handles routing automatically
  // when supabase.auth session changes.

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const limitCheck = rateLimiter.checkLogin(email);
    if (!limitCheck.allowed) {
      const mins = Math.ceil(limitCheck.lockoutSeconds / 60);
      setError(`Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`);
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        rateLimiter.recordFailed(email);
        const remaining = limitCheck.remainingAttempts - 1;
        throw new Error(
          remaining > 0
            ? `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
            : 'Invalid credentials. Please contact IT support.'
        );
      }

      // Verify role — PGRST116/406 means no row in public.users yet
      const ALLOWED_ROLES = ['admin', 'superadmin', 'osas_admin', 'gso', 'pso', 'supply', 'venue', 'admin_assistant', 'osas_staff'];

      const { data: roleData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (roleError && roleError.code !== 'PGRST116' && roleError.status !== 406) {
        await supabase.auth.signOut();
        throw new Error('Could not verify your account role. Please try again.');
      }

      if (!roleData || !ALLOWED_ROLES.includes(roleData?.role)) {
        await supabase.auth.signOut();
        if (!roleData) {
          throw new Error('Your account profile has not been set up yet. Please contact OSAS Admin to assign your role.');
        }
        throw new Error('Access denied. Your account does not have dashboard access. Please contact OSAS Admin.');
      }

      rateLimiter.recordSuccess(email);
      
      // ✅ Login succeeded — App.js onAuthStateChange will detect the new session
      // and automatically redirect to /dashboard. 
      // If for some reason the component doesn't unmount, reset loading state after 3 seconds.
      setTimeout(() => {
        setLoading(false);
      }, 3000);

    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Page>
      <Box>
        <LogoBlock>
          <div className="icon-wrap">
            <ShieldCheck size={26} color={GREEN} />
          </div>
          <h2>Admin Portal</h2>
          <p>Student Nexus Admin Dashboard</p>
        </LogoBlock>

        {error && (
          <ErrorMsg>
            <ShieldAlert size={15} />
            {error}
          </ErrorMsg>
        )}

        <form onSubmit={handleLogin}>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <InputWrap>
              <InputIcon><Mail size={15} /></InputIcon>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
            </InputWrap>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <InputWrap>
              <InputIcon><Lock size={15} /></InputIcon>
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
              <EyeBtn type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </EyeBtn>
            </InputWrap>
          </div>

          <SubmitBtn type="submit" disabled={loading}>
            {loading
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
              : 'Sign In'}
          </SubmitBtn>
        </form>

        <FooterNote>
          Protected by Student Nexus Security · Admin access only
        </FooterNote>
      </Box>
    </Page>
  );
}
