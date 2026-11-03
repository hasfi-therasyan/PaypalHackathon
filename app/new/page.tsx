'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';

export default function CreatePledgePage() {
  const router = useRouter();
  const { user } = useAuth();

  // All custom goal categories supported
  const [goalCategory, setGoalCategory] = useState<'coding' | 'fitness' | 'study' | 'custom'>('coding');
  const [goalType, setGoalType] = useState<'github' | 'photo' | 'custom'>('github');
  const [goalTitle, setGoalTitle] = useState('Ship Next.js Hackathon API & Auth');
  const [stakeDollars, setStakeDollars] = useState(0); // Minimum $0 as requested
  const [sprintHours, setSprintHours] = useState(48);

  // GitHub rubric fields
  const [repo, setRepo] = useState('hasfi/stake-contract');
  const [username, setUsername] = useState('hasfi');
  const [minCommits, setMinCommits] = useState(5);
  const [minDays, setMinDays] = useState(2);
  const [minLines, setMinLines] = useState(100);

  // Photo & General rubric fields
  const [sceneElements, setSceneElements] = useState('laptop, code editor, desk');
  const [minConfidence, setMinConfidence] = useState(0.8);
  const [customMilestones, setCustomMilestones] = useState('1. Deploy frontend\n2. Complete referee review');

  // Counterparty fields
  const [beneficiaryName, setBeneficiaryName] = useState('Sam Rivera');
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('sb-sam@personal.example.com');
  const [refereeEmail, setRefereeEmail] = useState('referee@example.com');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync category changes
  const handleCategorySelect = (cat: 'coding' | 'fitness' | 'study' | 'custom') => {
    setGoalCategory(cat);
    if (cat === 'coding') {
      setGoalType('github');
      setGoalTitle('Ship Next.js Hackathon API & Auth');
    } else if (cat === 'fitness') {
      setGoalType('photo');
      setGoalTitle('Morning Gym Workout Consistency');
      setSceneElements('gym, fitness equipment, workout space');
    } else if (cat === 'study') {
      setGoalType('photo');
      setGoalTitle('Read 2 Chapters & Complete Practice Exam');
      setSceneElements('book, study desk, notebook');
    } else {
      setGoalType('custom');
      setGoalTitle('Custom Personal Sprint Milestone');
    }
  };

  // Construct rubric JSON object
  const rubricJson = useMemo(() => {
    if (goalType === 'github') {
      return {
        category: goalCategory,
        type: 'github',
        repo,
        username,
        min_commits: Number(minCommits),
        min_distinct_days: Number(minDays),
        min_changed_lines: Number(minLines),
        ignore_paths: ['package-lock.json', '*.lock', 'dist/**'],
      };
    } else if (goalType === 'photo') {
      return {
        category: goalCategory,
        type: 'photo',
        challenge_code_format: 'three-words-plus-digits',
        required_scene_elements: sceneElements.split(',').map((s) => s.trim()).filter(Boolean),
        min_confidence: Number(minConfidence),
      };
    } else {
      return {
        category: goalCategory,
        type: 'custom',
        milestones: customMilestones.split('\n').filter(Boolean),
        referee_confirmation_required: true,
      };
    }
  }, [goalCategory, goalType, repo, username, minCommits, minDays, minLines, sceneElements, minConfidence, customMilestones]);

  const stakeCents = Math.round(stakeDollars * 100);

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
          user_email: user?.email,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create commitment.');
      }

      // If stake is $0 or greater, proceed to authorization or details
      if (stakeCents === 0) {
        router.push(`/pledges/${data.id}`);
      } else {
        router.push(`/pledges/new/checkout/${data.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <Link href="/" className="text-xs font-semibold text-[#0070ba] hover:underline mb-2 inline-block">
          ← Return to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003087]">
          Create a New Commitment Pledge
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Lock in your goal with verifiable rubric criteria and assign a referee to hold you accountable.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Goal Category */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">1. Select Goal Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'coding', label: '💻 Coding / GitHub', desc: 'Commits & code lines' },
              { id: 'fitness', label: '🏋️ Fitness / Health', desc: 'Workout photo proof' },
              { id: 'study', label: '📚 Study / Reading', desc: 'Milestone & notes' },
              { id: 'custom', label: '✨ Custom Goal', desc: 'Any habit or pledge' },
            ].map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  goalCategory === cat.id
                    ? 'border-[#0070ba] bg-blue-50/70 text-[#003087] ring-1 ring-[#0070ba]'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="font-bold text-xs block">{cat.label}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{cat.desc}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-slate-700">Goal Commitment Title</label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-hidden focus:border-[#0070ba]"
              placeholder="e.g. Complete 5 LeetCode problems & deploy MVP"
            />
          </div>
        </div>

        {/* Step 2: Verification Rubric */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">2. Verification Rubric</h2>

          {goalType === 'github' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">GitHub Repository (owner/repo)</label>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">GitHub Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Minimum Commits</label>
                <input
                  type="number"
                  min="1"
                  value={minCommits}
                  onChange={(e) => setMinCommits(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Minimum Distinct Days Active</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={minDays}
                  onChange={(e) => setMinDays(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
            </div>
          )}

          {goalType === 'photo' && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Required Scene Elements (comma-separated)</label>
                <input
                  type="text"
                  value={sceneElements}
                  onChange={(e) => setSceneElements(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900"
                  placeholder="e.g. gym, fitness equipment, timer"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                A 3-word challenge code will be generated upon rubric lock. You will present the code inside your photo proof.
              </p>
            </div>
          )}

          {goalType === 'custom' && (
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">Custom Milestone Deliverables</label>
              <textarea
                value={customMilestones}
                onChange={(e) => setCustomMilestones(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900"
                placeholder="List your specific goals..."
              />
            </div>
          )}
        </div>

        {/* Step 3: Stake & Sprint Duration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">3. Stake Amount & Sprint Window</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">
                  Stake Amount ($0 to $50 USD)
                </label>
                <span className="font-mono text-sm font-black text-[#003087]">
                  ${stakeDollars.toFixed(2)} USD
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={stakeDollars}
                onChange={(e) => setStakeDollars(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-[#0070ba]"
              />
              <span className="text-[11px] text-slate-500 block">
                {stakeDollars === 0
                  ? 'Zero-risk mode ($0.00). No PayPal hold required.'
                  : 'Protected by PayPal temporary authorization hold.'}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Sprint Expiration Window</label>
              <select
                value={sprintHours}
                onChange={(e) => setSprintHours(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
              >
                <option value={12}>12 Hours (Quick Sprint)</option>
                <option value={24}>24 Hours (Daily Goal)</option>
                <option value={48}>48 Hours (Weekend / Hackathon Sprint)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 4: Referee & Beneficiary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">4. Referee & Beneficiary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Friend Referee Email (Final Authority)</label>
              <input
                type="email"
                value={refereeEmail}
                onChange={(e) => setRefereeEmail(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900"
                placeholder="referee@example.com"
              />
              <span className="text-[10px] text-slate-500 block">
                If the automated referee is uncertain or borderline, your friend casts the final verdict.
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Beneficiary PayPal Email</label>
              <input
                type="email"
                value={beneficiaryEmail}
                onChange={(e) => setBeneficiaryEmail(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900"
                placeholder="beneficiary@personal.example.com"
              />
              <span className="text-[10px] text-slate-500 block">
                Receives the payout only if the sprint commitment is failed or unfulfilled.
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-[#0070ba] hover:bg-[#003087] text-white font-bold rounded-xl text-sm transition-all shadow-xs disabled:opacity-50"
        >
          {isSubmitting ? 'Sealing Rubric & Initializing...' : 'Lock Rubric & Create Commitment →'}
        </button>
      </form>
    </div>
  );
}
