import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Menu, Search, Bell, ChevronDown, LogOut, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { supabase } from '../../config/supabase';
import { formatDistanceToNow } from 'date-fns';
import SecuritySettingsModal from './SecuritySettingsModal';
import { useSidebar } from './SidebarContext';

const PAGE_LABELS = {
  '/dashboard':  'Dashboard',
  '/kanban':     'Kanban Board',
  '/register':   'Event Approval',
  '/search':     'Intelligent Search / Assistant',
  '/users':      'Users',
  '/compliance': 'Org & Compliance',
  '/reports':    'Reports',
  '/portfolios': 'Student Portfolios',
};

const GREEN = '#03632B';

const HeaderWrap = styled.header`
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 0 24px;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 50;
`;

const Left = styled.div`display: flex; align-items: center; gap: 14px;`;

const HamBtn = styled.button`
  background: none; border: none; cursor: pointer; color: #374151;
  display: flex; align-items: center; padding: 4px; border-radius: 6px;
  &:hover { background: #f3f4f6; }
`;

const LogoLink = styled(Link)`
  font-size: 17px; font-weight: 800; color: #111827; text-decoration: none;
  letter-spacing: -0.4px; font-family: 'Inter', sans-serif;
`;

const Center = styled.div`flex: 1; max-width: 440px; margin: 0 24px;`;

const SearchBar = styled.div`
  display: flex; align-items: center; background: #f9fafb;
  border: 1px solid #e5e7eb; border-radius: 20px; padding: 7px 16px;
  gap: 8px; transition: all 0.15s;
  &:focus-within {
    border-color: ${GREEN}; background: #ffffff;
    box-shadow: 0 0 0 3px rgba(3,99,43,0.08);
  }
  svg { color: #9ca3af; flex-shrink: 0; }
  input {
    border: none; background: transparent; outline: none;
    width: 100%; font-size: 13px; color: #374151;
    &::placeholder { color: #9ca3af; }
  }
`;

const Right = styled.div`display: flex; align-items: center; gap: 14px;`;

const BellWrap = styled.button`
  position: relative; width: 36px; height: 36px;
  border: 1px solid #e5e7eb; border-radius: 8px; background: #ffffff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #6b7280; transition: all 0.15s;
  &:hover { background: #f3f4f6; border-color: #d1d5db; }
`;

const BellBadge = styled.span`
  position: absolute; top: -4px; right: -4px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #ef4444; color: #fff; font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
`;

const NotifDropdown = styled.div`
  position: absolute; top: calc(100% + 8px); right: 0;
  width: 340px; background: #ffffff; border: 1px solid #e5e7eb;
  border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.12);
  z-index: 200; overflow: hidden;
`;

const NotifHeader = styled.div`
  padding: 14px 16px 10px; font-size: 13px; font-weight: 700; color: #111827;
  border-bottom: 1px solid #e5e7eb; display: flex;
  justify-content: space-between; align-items: center;
`;

const NotifList = styled.div`max-height: 320px; overflow-y: auto;`;

const NotifRow = styled.div`
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 16px; cursor: pointer;
  border-bottom: 1px solid #f9fafb;
  background: ${p => p.$unread ? '#f0fdf4' : '#ffffff'};
  &:hover { background: #f9fafb; }

  .icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: #dcfce7; color: ${GREEN};
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .body { flex: 1; }
  .title { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 2px; }
  .msg   { font-size: 11px; color: #6b7280; line-height: 1.4; }
  .time  { font-size: 10px; color: #9ca3af; margin-top: 3px; }
`;

const UserWrap = styled.div`
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  padding: 4px 6px 4px 4px; border-radius: 20px;
  &:hover { background: #f3f4f6; }
`;
const Avatar = styled.div`
  width: 32px; height: 32px; border-radius: 50%;
  background: ${GREEN}; color: #fff; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
`;

const UserDropdown = styled.div`
  position: absolute; top: calc(100% + 8px); right: 20px;
  width: 220px; background: #ffffff; border: 1px solid #e5e7eb;
  border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.12);
  z-index: 200; overflow: hidden; padding: 8px;
`;
const DropdownItem = styled.div`
  padding: 10px 12px; font-size: 13px; font-weight: 500; color: #374151;
  display: flex; align-items: center; gap: 10px; cursor: pointer; border-radius: 8px;
  &:hover { background: #f3f4f6; color: #111827; }
`;

export default function Header() {
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [userInitial, setUserInitial] = useState('A');
  const bellRef = useRef(null);
  const userRef = useRef(null);
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();

  const searchLabel = PAGE_LABELS[location.pathname] || 'Search';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserInitial(data.user.email[0].toUpperCase());
    });
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data } = await adminAPI.getAdminNotifications();
    setNotifs(data || []);
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    const modalHandler = () => setShowSecurityModal(true);

    document.addEventListener('mousedown', handler);
    document.addEventListener('openSecurityModal', modalHandler);
    
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('openSecurityModal', modalHandler);
    };
  }, []);

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      await adminAPI.markNotificationRead(notif.id);
      loadNotifications();
    }
    setShowNotif(false);
    if (notif.action_url) {
      window.location.hash = notif.action_url;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '#/login';
  };

  return (
    <>
    <HeaderWrap>
      <Left>
        <HamBtn onClick={() => setCollapsed(v => !v)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <Menu size={22} />
        </HamBtn>
        <LogoLink to="/"><span style={{fontWeight:900, color:'#03632B'}}>OSAS</span></LogoLink>
      </Left>

      <Center>
        <SearchBar>
          <Search size={15} />
          <input
            type="text"
            placeholder={searchLabel === 'Intelligent Search / Assistant' ? 'Intelligent Search' : 'Search'}
          />
        </SearchBar>
      </Center>

      <Right>
        {}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <BellWrap onClick={() => { setShowNotif(v => !v); loadNotifications(); }}>
            <Bell size={18} />
            {unreadCount > 0 && <BellBadge>{unreadCount > 9 ? '9+' : unreadCount}</BellBadge>}
          </BellWrap>

          {showNotif && (
            <NotifDropdown>
              <NotifHeader>
                <span>Notifications</span>
                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{unreadCount} unread</span>
              </NotifHeader>
              <NotifList>
                {notifs.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    No notifications yet
                  </div>
                )}
                {notifs.map(n => (
                  <NotifRow key={n.id} $unread={!n.is_read} onClick={() => handleNotifClick(n)}>
                    <div className="icon"><Bell size={14} /></div>
                    <div className="body">
                      <div className="title">{n.title || 'System Notification'}</div>
                      <div className="msg">{n.message || (n.data && n.data.message) || '—'}</div>
                      <div className="time">
                        {n.created_at ? formatDistanceToNow(new Date(n.created_at)) + ' ago' : ''}
                      </div>
                    </div>
                  </NotifRow>
                ))}
              </NotifList>
            </NotifDropdown>
          )}
        </div>

        {}
        <div ref={userRef} style={{ position: 'relative' }}>
          <UserWrap onClick={() => setShowUserMenu(v => !v)}>
            <Avatar>{userInitial}</Avatar>
            <ChevronDown size={14} color="#9ca3af" />
          </UserWrap>

          {showUserMenu && (
            <UserDropdown>
              <DropdownItem onClick={() => { setShowUserMenu(false); setShowSecurityModal(true); }}>
                <Shield size={16} color={GREEN} /> Security Settings
              </DropdownItem>
              <DropdownItem onClick={handleLogout} style={{ color: '#dc2626' }}>
                <LogOut size={16} /> Logout
              </DropdownItem>
            </UserDropdown>
          )}
        </div>
      </Right>
    </HeaderWrap>
    
    {showSecurityModal && <SecuritySettingsModal onClose={() => setShowSecurityModal(false)} />}
    </>
  );
}
