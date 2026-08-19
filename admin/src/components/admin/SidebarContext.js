import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext({ collapsed: false, setCollapsed: () => {} });

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
