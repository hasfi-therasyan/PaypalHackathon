import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stake — Commit-Contract App with PayPal Sandbox Hold',
  description: 'Stake puts money behind promises. A commitment-contract app where a PayPal hold backs a goal. Owned by Hasfi. Built for the PayPal AI Hackathon. Sandbox only — no real money moves.',
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-slate-900 antialiased">
        <nav className="border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-indigo-600">Stake</span>
              <span className="text-xs text-slate-500 font-normal">
                · PayPal AI Hackathon
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-sm text-slate-600 hover:text-slate-900 underline underline-offset-2"
              >
                Home
              </a>
              <a
                href="/new"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Create Pledge
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-500">
            <p>
              Built by Hasfi for the PayPal AI Hackathon ·{' '}
              <span className="font-medium text-slate-700">Sandbox only</span> ·{' '}
              <span className="font-medium text-slate-700">No real money moves</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}