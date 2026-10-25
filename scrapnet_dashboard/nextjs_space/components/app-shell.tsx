'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context';
import ChatWindow from '@/components/ChatWindow';

const STANDALONE_ROUTES = ['/impact-calculator', '/global-ledger'];

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const [chatOpen, setChatOpen] = useState(false);

  const isStandalone = STANDALONE_ROUTES.some(route => pathname.startsWith(route));

  if (isStandalone) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <Header onAIWorkflowClick={() => setChatOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      {chatOpen && <ChatWindow open={chatOpen} onClose={() => setChatOpen(false)} />}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  );
}
