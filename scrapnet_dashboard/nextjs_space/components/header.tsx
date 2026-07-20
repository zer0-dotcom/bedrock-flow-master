'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Leaf, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSidebar } from '@/contexts/sidebar-context';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isOpen, toggle } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/50 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button - Mobile Only */}
        <button
          onClick={toggle}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors md:hidden"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
        
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span className="text-xs font-black text-white">B</span>
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline font-medium">
            Industrial Carbon Verification Platform
          </span>
          <span className="text-sm text-muted-foreground sm:hidden font-medium">
            Bedrock ESG
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-2 md:px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hidden sm:inline">
            AI Workflow Active
          </span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 sm:hidden">
            Active
          </span>
        </div>

        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}
