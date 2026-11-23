import React from 'react';
import HelpDrawer from '@/components/ui/HelpDrawer';

export default function BedrockfadLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HelpDrawer />
    </>
  );
}
