'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatePledgePage() {
  const router = useRouter();

  const [goalType, setGoalType] = useState<'github' | 'photo'>('github');
  const [goalTitle, setGoalTitle] = useState('Ship Full Hackathon App MVP');
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

      // Redirect directly to PayPal hold authorization page
      router.push(`/pledges/${data.id}/approve`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Commitment Pledge</h1>
        <p className="text-sm text-slate-500 mt-2">
          Lock verifiable rules, set your PayPal sandbox hold, and assign your friend referee.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
        {/* Step 1: Goal Type & Title */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            1. Goal Specification
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <label
              className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors ${
                goalType === 'github' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="goalType"
                value="github"
                checked={goalType === 'github'}
                onChange={() => setGoalType('github')}
                className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="font-semibold text-sm text-slate-900">GitHub Activity</p>
                <p className="text-xs text-slate-500 mt-1">
                  Verifies repo commits, distinct days & line counts via REST API (merge commits dropped).
                </p>
              </div>
            </label>

            <label
              className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors ${
                goalType === 'photo' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="goalType"
                value="photo"
                checked={goalType === 'photo'}
                onChange={() => setGoalType('photo')}
                className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="font-semibold text-sm text-slate-900">Challenge-Code Photo</p>
                <p className="text-xs text-slate-500 mt-1">
                  Verifies written 3-word code (Levenshtein ≤ 1) and required physical scene elements.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label htmlFor="goalTitle" className="block text-sm font-medium text-slate-700 mb-1">
              Pledge Goal Title
            </label>
            <input
              id="goalTitle"
              type="text"
              required
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="e.g. Build PayPal Hackathon Project"
            />
          </div>
        </div>

        {/* Step 2: Rubric Form */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            2. Verifiable Rubric Rules
          </h2>

          {goalType === 'github' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label htmlFor="repo" className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub Repository (owner/repo)
                </label>
                <input
                  id="repo"
                  type="text"
                  required
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label htmlFor="minCommits" className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Commits
                </label>
                <input
                  id="minCommits"
                  type="number"
                  min={1}
                  max={50}
                  value={minCommits}
                  onChange={(e) => setMinCommits(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label htmlFor="minDays" className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Distinct Days
                </label>
                <input
                  id="minDays"
                  type="number"
                  min={1}
                  max={2}
                  value={minDays}
                  onChange={(e) => setMinDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label htmlFor="minLines" className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Changed Lines
                </label>
                <input
                  id="minLines"
                  type="number"
                  min={10}
                  max={5000}
                  value={minLines}
                  onChange={(e) => setMinLines(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="sceneElements" className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Scene Elements (comma-separated)
                </label>
                <input
                  id="sceneElements"
                  type="text"
                  value={sceneElements}
                  onChange={(e) => setSceneElements(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  placeholder="laptop, notebook, coffee"
                />
              </div>
              <div>
                <label htmlFor="minConfidence" className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Vision Confidence (0.5 - 1.0)
                </label>
                <input
                  id="minConfidence"
                  type="number"
                  step={0.05}
                  min={0.5}
                  max={1.0}
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>
          )}

          {/* Locked Rubric JSON Preview */}
          <div className="mt-4 p-4 bg-slate-900 rounded-lg text-slate-100 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2 border-b border-slate-700 pb-1">
              <span>Locked Rubric JSON Preview</span>
              <span className="text-emerald-400 font-semibold">🔒 Frozen with SHA-256 upon creation</span>
            </div>
            <pre className="overflow-x-auto">{canonicalJsonString}</pre>
          </div>
        </div>

        {/* Step 3: Stake Slider & Duration (Hard Limits Enforced) */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            3. Stake & Honor Period
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="stakeSlider" className="text-sm font-semibold text-slate-700">
                  Stake Amount ($5 - $50 USD limit)
                </label>
                <span className="text-base font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
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
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>$5.00 min</span>
                <span>$50.00 max (hard cap)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="sprintHours" className="text-sm font-semibold text-slate-700">
                  Sprint Duration (Max 48 hours)
                </label>
                <span className="text-sm font-bold text-slate-700">{sprintHours} Hours</span>
              </div>
              <input
                id="sprintHours"
                type="range"
                min={6}
                max={48}
                step={6}
                value={sprintHours}
                onChange={(e) => setSprintHours(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>6h</span>
                <span>48h (PayPal 3-day honor period compliant)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Beneficiary & Friend Referee */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            4. Beneficiary & Friend Referee
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="beneficiaryName" className="block text-xs font-semibold text-slate-700 mb-1">
                Beneficiary Name
              </label>
              <input
                id="beneficiaryName"
                type="text"
                required
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="beneficiaryEmail" className="block text-xs font-semibold text-slate-700 mb-1">
                Beneficiary PayPal Email
              </label>
              <input
                id="beneficiaryEmail"
                type="email"
                required
                value={beneficiaryEmail}
                onChange={(e) => setBeneficiaryEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="refereeEmail" className="block text-xs font-semibold text-slate-700 mb-1">
                Friend Referee Email
              </label>
              <input
                id="refereeEmail"
                type="email"
                required
                value={refereeEmail}
                onChange={(e) => setRefereeEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Consent Line */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg">
          <p className="text-sm font-semibold text-amber-900 text-center">
            &ldquo;If I fail, <span className="underline decoration-amber-500 font-bold">{formattedStake}</span> goes to {beneficiaryName} ({beneficiaryEmail}).&rdquo;
          </p>
          <p className="text-xs text-amber-700 text-center mt-1">
            PayPal authorization places a hold only — no funds transfer unless the sprint is forfeited.
          </p>
        </div>

        {/* Submit Button with Loading State */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
