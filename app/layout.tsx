import type { Metadata } from 'next';
import Link from 'next/link';

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
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
        {/* Top Announcement Bar */}
        <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 text-center border-b border-slate-800 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span className="font-medium text-slate-200">PayPal AI Hackathon Submission</span>
          <span className="text-slate-500">·</span>
          <span>Sandbox Environment Active</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono text-indigo-400">api-m.sandbox.paypal.com</span>
        </div>

        {/* Main Navigation */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">Stake</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    MVP
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Commitment Contracts</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100/70 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/stats"
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100/70 transition-colors"
              >
                Reliability Stats
              </Link>
              <Link
                href="/admin/demo"
                className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
              >
                Demo Console
              </Link>
              <Link
                href="/new"
                className="ml-2 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
              >
                <span>+ Create Pledge</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200 bg-white mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Stake</span>
              <span>· Built by Hasfi for the PayPal AI Hackathon</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600">
                Sandbox Only — No Real Money Moves
              </span>
              <span>MIT License</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
