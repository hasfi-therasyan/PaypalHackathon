'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatePledgePage() {
  const router = useRouter();

  const [goalType, setGoalType] = useState<'github' | 'photo'>('github');
  const [goalTitle, setGoalTitle] = useState('Ship Next.js Hackathon API & Auth');
  const [stakeDollars, setStakeDollars] = useState(25);
  const [sprintHours, setSprintHours] = useState(48);

  // GitHub rubric fields
  const [repo, setRepo] = useState('hasfi/stake-contract');
  const [username, setUsername] = useState('hasfi');
  const [minCommits, setMinCommits] = useState(5);
  const [minDays, setMinDays] = useState(2);
  const [minLines, setMinLines] = useState(100);

  // Photo rubric fields
  const [sceneElements, setSceneElements] = useState('laptop, code editor, desk');
  const [minConfidence, setMinConfidence] = useState(0.8);

  // Counterparty fields
  const [beneficiaryName, setBeneficiaryName] = useState('Sam Rivera');
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('sb-sam@personal.example.com');
  const [refereeEmail, setRefereeEmail] = useState('referee@example.com');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Construct rubric JSON object
  const rubricJson = useMemo(() => {
    if (goalType === 'github') {
      return {
        type: 'github',
        repo,
        username,
        min_commits: Number(minCommits),
        min_distinct_days: Number(minDays),
        min_changed_lines: Number(minLines),
        ignore_paths: ['package-lock.json', '*.lock', 'dist/**'],
      };
    } else {
      return {
        type: 'photo',
        challenge_code_format: 'three-words-plus-digits',
        required_scene_elements: sceneElements.split(',').map((s) => s.trim()).filter(Boolean),
        min_confidence: Number(minConfidence),
      };
    }
  }, [goalType, repo, username, minCommits, minDays, minLines, sceneElements, minConfidence]);

  // Compute canonical JSON string for preview
  const canonicalJsonString = useMemo(() => {
    const sortedKeys = Object.keys(rubricJson).sort();
    const sortedObj: Record<string, any> = {};
    for (const k of sortedKeys) {
      sortedObj[k] = (rubricJson as any)[k];
    }
    return JSON.stringify(sortedObj, null, 2);
  }, [rubricJson]);

  const stakeCents = stakeDollars * 100;
  const formattedStake = `${stakeDollars.toFixed(2)} USD (sandbox)`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/pledges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_type: goalType,
          goal_title: goalTitle,
          rubric_json: rubricJson,
          stake_cents: stakeCents,
          sprint_hours: Number(sprintHours),
          beneficiary_name: beneficiaryName,
          beneficiary_paypal_email: beneficiaryEmail,
          referee_email: refereeEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create pledge.');
      }

      router.push(`/pledges/${data.id}/approve`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-white font-semibold">New Commitment Contract</span>
      </div>

      <div className="text-center pb-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Commitment Pledge</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
          Define verifiable rules, place a PayPal sandbox hold, and assign your friend referee.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
          <span className="font-bold">Error:</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-8 backdrop-blur-md">
        {/* Step 1: Goal Specification */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
            <h2 className="text-base font-bold text-white">Select Goal Verification Type</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setGoalType('github')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                goalType === 'github'
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </div>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${goalType === 'github' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                  {goalType === 'github' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">GitHub Activity</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Evaluates author commits, active UTC days, and changed lines via REST API. Merge commits and lockfiles dropped.
              </p>
            </div>

            <div
              onClick={() => setGoalType('photo')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                goalType === 'photo'
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${goalType === 'photo' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                  {goalType === 'photo' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">Challenge-Code Photo</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Verifies handwritten 3-word code (Levenshtein distance ≤ 1) and physical scene elements with confidence thresholds.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="goalTitle" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Goal Pledge Title *
            </label>
            <input
              id="goalTitle"
              type="text"
              required
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g. Finish Core PayPal API Integration"
            />
          </div>
        </div>

        {/* Step 2: Locked Rubric Rules */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
            <h2 className="text-base font-bold text-white">Locked Rubric Rules</h2>
          </div>

          {goalType === 'github' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="repo" className="block text-xs font-semibold text-slate-300 mb-1">
                  GitHub Repository (owner/repo)
                </label>
                <input
                  id="repo"
                  type="text"
                  required
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm font-mono text-white"
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-xs font-semibold text-slate-300 mb-1">
                  Author Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm font-mono text-white"
                />
              </div>
              <div>
                <label htmlFor="minCommits" className="block text-xs font-semibold text-slate-300 mb-1">
                  Min Commits
                </label>
                <input
                  id="minCommits"
                  type="number"
                  min={1}
                  max={50}
                  value={minCommits}
                  onChange={(e) => setMinCommits(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="minDays" className="block text-xs font-semibold text-slate-300 mb-1">
                  Min Active Days
                </label>
                <input
                  id="minDays"
                  type="number"
                  min={1}
                  max={2}
                  value={minDays}
                  onChange={(e) => setMinDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="minLines" className="block text-xs font-semibold text-slate-300 mb-1">
                  Min Changed Lines
                </label>
                <input
                  id="minLines"
                  type="number"
                  min={10}
                  max={5000}
                  value={minLines}
                  onChange={(e) => setMinLines(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sceneElements" className="block text-xs font-semibold text-slate-300 mb-1">
                  Required Physical Elements (comma-separated)
                </label>
                <input
                  id="sceneElements"
                  type="text"
                  value={sceneElements}
                  onChange={(e) => setSceneElements(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="minConfidence" className="block text-xs font-semibold text-slate-300 mb-1">
                  Min Confidence Score (0.5 – 1.0)
                </label>
                <input
                  id="minConfidence"
                  type="number"
                  step={0.05}
                  min={0.5}
                  max={1.0}
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>
            </div>
          )}

          {/* Locked Rubric JSON Preview with SHA-256 Badge */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Deterministic Rubric Canonical JSON
              </span>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                🔒 SHA-256 Sealed at Creation
              </span>
            </div>
            <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
              {canonicalJsonString}
            </pre>
          </div>
        </div>

        {/* Step 3: Stake Slider & Honor Period */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
            <h2 className="text-base font-bold text-white">Stake Hold Amount & Honor Period</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="stakeSlider" className="text-xs font-bold uppercase text-slate-400">
                  Stake Amount ($5 – $50 USD Limit)
                </label>
                <span className="text-base font-extrabold font-mono text-indigo-400 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  {formattedStake}
                </span>
              </div>
              <input
                id="stakeSlider"
                type="range"
                min={5}
                max={50}
                step={1}
                value={stakeDollars}
                onChange={(e) => setStakeDollars(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>$5.00 min</span>
                <span>$50.00 max (hard cap)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="sprintHours" className="text-xs font-bold uppercase text-slate-400">
                  Sprint Duration (Max 48h)
                </label>
                <span className="text-sm font-bold font-mono text-white bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  {sprintHours} Hours
                </span>
              </div>
              <input
                id="sprintHours"
                type="range"
                min={6}
                max={48}
                step={6}
                value={sprintHours}
                onChange={(e) => setSprintHours(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>6h</span>
                <span>48h (PayPal honor window compliant)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Beneficiary & Friend Referee */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">4</span>
            <h2 className="text-base font-bold text-white">Beneficiary & Friend Referee</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="beneficiaryName" className="block text-xs font-semibold text-slate-300 mb-1">
                Beneficiary Name
              </label>
              <input
                id="beneficiaryName"
                type="text"
                required
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="beneficiaryEmail" className="block text-xs font-semibold text-slate-300 mb-1">
                Beneficiary PayPal Email
              </label>
              <input
                id="beneficiaryEmail"
                type="email"
                required
                value={beneficiaryEmail}
                onChange={(e) => setBeneficiaryEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="refereeEmail" className="block text-xs font-semibold text-slate-300 mb-1">
                Friend Referee Email
              </label>
              <input
                id="refereeEmail"
                type="email"
                required
                value={refereeEmail}
                onChange={(e) => setRefereeEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Legal Consent Banner */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
          <p className="text-sm font-semibold text-amber-200 text-center">
            &ldquo;If I fail, <span className="font-extrabold text-amber-400 underline decoration-amber-400/50">{formattedStake}</span> goes to {beneficiaryName}.&rdquo;
          </p>
          <p className="text-xs text-amber-300/80 text-center">
            PayPal authorization hold reserves the funds without immediate capture. You can cancel within 5 minutes of activation.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Hashing Rubric & Initializing...</span>
              </>
            ) : (
              <span>Proceed to PayPal Hold Authorization →</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
