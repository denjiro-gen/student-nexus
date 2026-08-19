import React from 'react';
import styled from 'styled-components';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';

const SIDEBAR_NARROW = 80;
const SIDEBAR_WIDE   = 220;

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f9fafb;
`;

const MainContent = styled.main`
  margin-top: 56px;
  margin-left: ${p => p.$open ? SIDEBAR_WIDE : SIDEBAR_NARROW}px;
  padding: 28px 32px;
  flex: 1;
  transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
`;

function LayoutInner() {
  const { collapsed } = useSidebar();
  return (
    <LayoutContainer>
      <Header />
      <Sidebar />
      <MainContent $open={!collapsed}>
        <Outlet />
      </MainContent>
    </LayoutContainer>
  );
}

const AdminLayout = () => (
  <SidebarProvider>
    <LayoutInner />
  </SidebarProvider>
);

export default AdminLayout;
