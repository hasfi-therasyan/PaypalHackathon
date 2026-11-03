import type { Metadata } from 'next';
import { Header } from './components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stake — Commitment Contracts with PayPal Sandbox Hold',
  description: 'Stake puts money behind promises. Back your sprint with a PayPal authorization hold, AI referee verification, and a tamper-evident SHA-256 ledger.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {/* Top Status Announcement Banner */}
        <div className="bg-slate-950 text-slate-400 text-[11px] py-1.5 px-4 text-center border-b border-slate-800/80 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span className="font-semibold text-slate-300">PayPal AI Hackathon 2026</span>
          <span className="text-slate-600">·</span>
          <span>PayPal Sandbox Active</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-indigo-400">api-m.sandbox.paypal.com</span>
        </div>

        {/* Global Responsive Navigation Header */}
        <Header />

        {/* Main Application Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/70 mt-16 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Stake</span>
              <span>· Built by Hasfi for the PayPal AI Hackathon</span>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                Sandbox Mode · No Real Money Moves
              </span>
              <span>MIT License</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
