import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Stake</h1>
        <p className="text-lg text-gray-600">
          Commit-contract app with PayPal sandbox hold
        </p>
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-4">18 Days Remaining</h2>
          <p className="text-gray-500">
            Demo mode — simulated PayPal flow
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Create pledge with locked rubric</li>
            <li>PayPal AUTHORIZE hold</li>
            <li>GitHub + photo proof</li>
            <li>AI referee verdict</li>
            <li>Settlement: void/capture/payout</li>
            <li>Tamper-evident ledger</li>
          </ul>
        </div>
      </div>
    </main>
  );
}