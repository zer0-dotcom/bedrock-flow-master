'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context';

// Routes that should be standalone (no sidebar/header)
const STANDALONE_ROUTES = ['/impact-calculator', '/global-ledger'];

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  
  // Check if this is a standalone route (public calculator, etc.)
  const isStandalone = STANDALONE_ROUTES.some(route => pathname.startsWith(route));

  if (isStandalone) {
    // Render without sidebar/header for standalone pages
    return <>{children}</>;
  }

  // Standard layout with sidebar and header
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
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
