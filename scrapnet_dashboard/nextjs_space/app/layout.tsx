import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import AppShell from '@/components/app-shell';
import SolanaProvider from '@/components/solana-provider';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'Bedrock ESG - Industrial Carbon Verification Platform',
  description: 'Institutional-grade ESG verification for the Circular Trifecta: Asphalt, Biochar, and Metal Recovery',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'Bedrock ESG - Industrial Carbon Verification Platform',
    description: 'Institutional-grade ESG verification for the Circular Trifecta: Asphalt, Biochar, and Metal Recovery',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SolanaProvider>
            <AppShell>{children}</AppShell>
          </SolanaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
