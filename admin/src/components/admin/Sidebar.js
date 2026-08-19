import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, KanbanSquare, ClipboardList,
  Users, Settings, LogOut, Bot, Award, ShieldCheck,
  FileBarChart, Calendar, MessageSquare, Package,
  Archive, Megaphone, Mail
} from 'lucide-react';
import { useSidebar } from './SidebarContext';

const GREEN = '#03632B';
const SIDEBAR_NARROW = 72;
const SIDEBAR_WIDE = 228;

const SidebarContainer = styled.aside`
  width: ${p => p.$open ? SIDEBAR_WIDE : SIDEBAR_NARROW}px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 56px;
  z-index: 40;
  overflow: hidden;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  overflow-y: auto;
  flex: 1;
  padding: 4px 8px 8px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
  &::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
`;

// Section divider label
const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 12px;
  margin-bottom: 4px;
  padding: 0 8px;
  text-align: left;
  display: ${p => p.$open ? 'block' : 'none'};
  white-space: nowrap;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px ${p => p.$open ? '12px' : '0'};
  justify-content: ${p => p.$open ? 'flex-start' : 'center'};
  border-radius: 10px;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  min-height: 40px;

  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }

  &.active {
    background-color: ${GREEN};
    color: #ffffff;
    box-shadow: 0 2px 8px -1px rgba(3, 99, 43, 0.25);
  }
`;

const NavLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  opacity: ${p => p.$show ? 1 : 0};
  max-width: ${p => p.$show ? '160px' : '0px'};
  overflow: hidden;
  transition: opacity 0.15s ease 0.05s, max-width 0.2s ease;
  pointer-events: none;
`;

const BottomNav = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-top: 1px solid #f3f4f6;
  width: 100%;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px ${p => p.$open ? '12px' : '0'};
  justify-content: ${p => p.$open ? 'flex-start' : 'center'};
  border-radius: 10px;
  color: ${p => p.$danger ? '#ef4444' : '#6b7280'};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
  min-height: 40px;

  &:hover {
    background-color: ${p => p.$danger ? '#fee2e2' : '#f3f4f6'};
    color: ${p => p.$danger ? '#dc2626' : '#111827'};
  }
`;

// Grouped navigation
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/kanban',           icon: KanbanSquare,  label: 'Kanban Board'    },
      { to: '/register',         icon: ClipboardList, label: 'Booking Register'},
      { to: '/calendar',         icon: Calendar,      label: 'Event Calendar'  },
      { to: '/announcements',    icon: Megaphone,     label: 'Announcements'   },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to: '/messages',         icon: MessageSquare, label: 'Messages'        },
      { to: '/contact-messages', icon: Mail,          label: 'Contact Inbox'  },
      { to: '/search',           icon: Bot,           label: 'AI Assistant'    },
      { to: '/faculty-requests', icon: Package,       label: 'Faculty Requests'},
    ],
  },
  {
    label: 'Records',
    items: [
      { to: '/users',      icon: Users,       label: 'Users'          },
      { to: '/portfolios', icon: Award,       label: 'Portfolios'     },
      { to: '/compliance', icon: ShieldCheck, label: 'Compliance'     },
      { to: '/repository', icon: Archive,     label: 'Repository'     },
      { to: '/reports',    icon: FileBarChart,label: 'Reports'        },
    ],
  },
];

const Sidebar = () => {
  const { collapsed } = useSidebar();
  const open = !collapsed;

  return (
    <SidebarContainer $open={open}>
      <NavList>
        {NAV_GROUPS.map(group => (
          <React.Fragment key={group.label}>
            <SectionLabel $open={open}>{group.label}</SectionLabel>
            {group.items.map(({ to, icon: Icon, label }) => (
              <StyledNavLink key={to} to={to} $open={open} title={!open ? label : undefined}>
                <Icon size={20} style={{ flexShrink: 0 }} />
                <NavLabel $show={open}>{label}</NavLabel>
              </StyledNavLink>
            ))}
          </React.Fragment>
        ))}
      </NavList>

      <BottomNav>
        <IconButton
          $open={open}
          title={!open ? 'Settings' : undefined}
          onClick={() => document.dispatchEvent(new Event('openSecurityModal'))}
        >
          <Settings size={20} style={{ flexShrink: 0 }} />
          <NavLabel $show={open}>Settings</NavLabel>
        </IconButton>
        <IconButton
          $open={open}
          $danger
          title={!open ? 'Logout' : undefined}
          onClick={async () => {
            const { supabase } = await import('../../config/supabase');
            await supabase.auth.signOut();
            window.location.href = '#/login';
          }}
        >
          <LogOut size={20} style={{ flexShrink: 0 }} />
          <NavLabel $show={open}>Logout</NavLabel>
        </IconButton>
      </BottomNav>
    </SidebarContainer>
  );
};

export default Sidebar;
