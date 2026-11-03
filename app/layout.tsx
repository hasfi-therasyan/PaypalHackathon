import type { Metadata, Viewport } from 'next';
import { Header } from './components/Header';
import { HackathonBanner } from './components/HackathonBanner';
import { AuthProvider } from './lib/auth-context';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stake — Habit & Goal Commitments Powered by PayPal',
  description: 'Commit to your daily goals and sprint milestones. Backed by safe PayPal sandbox authorization holds and automated verification.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Stake',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#003087',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 antialiased">
        <AuthProvider>
          {/* PayPal Verified Official Banner */}
          <HackathonBanner />

          {/* Global Navigation Header */}
          <Header />

          {/* Main Application Container */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Clean Light Footer */}
          <footer className="border-t border-slate-200 bg-white mt-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#003087]">Stake</span>
                <span>· Powered by PayPal Orders v2 Sandbox</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700">
                  Sandbox Mode · Risk-Free Simulated Authorization
                </span>
                <span className="text-slate-500">MIT License</span>
              </div>
            </div>
          </footer>

          {/* PWA Mobile App Download Prompt */}
          <PwaInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
