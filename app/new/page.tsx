'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth-context';

export default function CreatePledgePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Everyday consumer lifestyle categories
  type CategoryId = 'fitness' | 'study' | 'habit' | 'productivity' | 'custom' | 'coding';
  const [goalCategory, setGoalCategory] = useState<CategoryId>('fitness');
  const [goalType, setGoalType] = useState<'photo' | 'custom' | 'github'>('photo');
  const [goalTitle, setGoalTitle] = useState('Morning Gym Workout Consistency');
  const [stakeDollars, setStakeDollars] = useState(15);
  const [sprintHours, setSprintHours] = useState(24);

  // Photo & Visual proof configuration
  const [sceneElements, setSceneElements] = useState('gym, workout weights, sneakers');
  const [proofHint, setProofHint] = useState('Snap a photo of your gym floor or workout spot with your handwritten challenge code.');

  // Custom milestone deliverables
  const [customMilestones, setCustomMilestones] = useState('1. Finish 30 minutes cardio\n2. Log morning water intake');

  // GitHub rubric fields (optional fallback)
  const [repo, setRepo] = useState('hasfi/stake-contract');
  const [username, setUsername] = useState('hasfi');
  const [minCommits, setMinCommits] = useState(5);

  // Counterparty fields
  const [beneficiaryName, setBeneficiaryName] = useState('Sam Rivera');
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('sb-sam@personal.example.com');
  const [refereeEmail, setRefereeEmail] = useState('referee@example.com');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Category Selector with Everyday Motivation Presets
  const handleCategorySelect = (cat: CategoryId) => {
    setGoalCategory(cat);
    if (cat === 'fitness') {
      setGoalType('photo');
      setGoalTitle('Morning Gym Workout Consistency');
      setSceneElements('gym, fitness equipment, workout space');
      setProofHint('Snap a photo of your gym weights or running shoes with your challenge code.');
    } else if (cat === 'study') {
      setGoalType('photo');
      setGoalTitle('Read 30 Pages & Review Study Notes');
      setSceneElements('book, open notebook, desk, highlighter');
      setProofHint('Snap a photo of your book or study notes with your challenge code.');
    } else if (cat === 'habit') {
      setGoalType('photo');
      setGoalTitle('7:00 AM Morning Wakeup & Screen-Free Routine');
      setSceneElements('alarm clock, window sunrise, morning journal');
      setProofHint('Snap a photo of your morning routine area with the challenge code before 8 AM.');
    } else if (cat === 'productivity') {
      setGoalType('photo');
      setGoalTitle('Complete Project Presentation Deck & Inbox Zero');
      setSceneElements('laptop, presentation slides, desk');
      setProofHint('Snap a photo of your finished work slides with your challenge code.');
    } else if (cat === 'coding') {
      setGoalType('github');
      setGoalTitle('Ship Next.js Hackathon API & Auth Sprints');
      setProofHint('AI referee scans your GitHub repo commits directly.');
    } else {
      setGoalType('custom');
      setGoalTitle('My Personal Challenge Goal');
      setProofHint('Submit your milestone notes or photo proof for referee confirmation.');
    }
  };

  // Construct Rubric JSON
  const rubricJson = useMemo(() => {
    if (goalType === 'photo') {
      return {
        category: goalCategory,
        type: 'photo',
        challenge_code_format: 'three-words-plus-digits',
        required_scene_elements: sceneElements.split(',').map((s) => s.trim()).filter(Boolean),
        proof_hint: proofHint,
        min_confidence: 0.8,
      };
    } else if (goalType === 'github') {
      return {
        category: goalCategory,
        type: 'github',
        repo,
        username,
        min_commits: Number(minCommits),
        min_distinct_days: 1,
        min_changed_lines: 50,
      };
    } else {
      return {
        category: goalCategory,
        type: 'custom',
        milestones: customMilestones.split('\n').filter(Boolean),
        referee_confirmation_required: true,
      };
    }
  }, [goalCategory, goalType, sceneElements, proofHint, repo, username, minCommits, customMilestones]);

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
        <Link href="/dashboard" className="text-xs font-semibold text-[#0070ba] hover:underline mb-2 inline-block">
          ← Return to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#003087]">
          Create a New Commitment
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pick your challenge, choose a safe stake, and invite a friend as your referee.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Everyday Motivation Categories */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">1. What Do You Want to Achieve?</h2>
            <span className="text-[11px] text-slate-400 font-medium">Select a category</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'fitness', icon: '🏃', label: 'Fitness & Health', desc: 'Workouts, runs, healthy habits' },
              { id: 'study', icon: '📚', label: 'Study & Reading', desc: 'Books, courses, practice exams' },
              { id: 'habit', icon: '🌅', label: 'Daily Routine', desc: 'Wake up early, meditation, no-screen' },
              { id: 'productivity', icon: '💼', label: 'Productivity', desc: 'Finish projects, clear tasks' },
              { id: 'custom', icon: '✨', label: 'Custom Goal', desc: 'Any personal challenge' },
              { id: 'coding', icon: '💻', label: 'Developer Sprint', desc: 'GitHub commits & coding' },
            ].map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id as CategoryId)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  goalCategory === cat.id
                    ? 'border-[#0070ba] bg-blue-50/80 text-[#003087] ring-2 ring-[#0070ba]/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-xl block mb-1">{cat.icon}</span>
                <span className="font-bold text-xs block text-slate-900">{cat.label}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">{cat.desc}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-slate-700">Goal Description</label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-hidden focus:border-[#0070ba]"
              placeholder="e.g. Morning gym session before 8:00 AM"
            />
          </div>
        </div>

        {/* Step 2: Proof & Verification Method */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">2. How You'll Submit Proof</h2>
            <span className="text-[11px] font-mono text-[#0070ba] font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              AI + FRIEND VERIFICATION
            </span>
          </div>

          {goalType === 'photo' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1.5">
                <span className="font-bold text-[#003087] block">📸 Automated Photo & Challenge Code Check:</span>
                <p className="text-slate-600 leading-relaxed">
                  When you lock in this commitment, Stake generates a unique 3-word code (like <code className="bg-white px-1 py-0.5 rounded border font-mono text-[11px] font-bold text-[#003087]">cedar-falcon-42</code>). 
                  Simply snap a photo of your space showing this handwritten code.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Expected Visual Elements (comma-separated)</label>
                <input
                  type="text"
                  value={sceneElements}
                  onChange={(e) => setSceneElements(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium"
                  placeholder="e.g. gym, workout weights, sneakers"
                />
                <span className="text-[11px] text-slate-400">
                  Our AI vision model will check for these elements to confirm authenticity.
                </span>
              </div>
            </div>
          )}

          {goalType === 'custom' && (
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700">Checklist or Milestone Goals</label>
              <textarea
                value={customMilestones}
                onChange={(e) => setCustomMilestones(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900"
                placeholder="List your specific targets..."
              />
              <span className="text-[11px] text-slate-500">
                Your nominated friend referee will verify these upon deadline.
              </span>
            </div>
          )}

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
            </div>
          )}
        </div>

        {/* Step 3: Safe Stake & Sprint Window */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">3. Choose Your Stake &amp; Timeline</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">
                  PayPal Authorization Hold:
                </label>
                <span className="font-mono text-base font-black text-[#003087]">
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
                  ? 'Zero-risk mode ($0.00). Great for practice runs.'
                  : 'Funds stay in your balance—only held as a temporary authorization.'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Deadline:</label>
                <span className="font-mono text-base font-bold text-slate-800">
                  {sprintHours} Hours
                </span>
              </div>
              <select
                value={sprintHours}
                onChange={(e) => setSprintHours(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white text-slate-900"
              >
                <option value={12}>12 Hours (Quick Sprint)</option>
                <option value={24}>24 Hours (Next Day Target)</option>
                <option value={36}>36 Hours (Weekend Goal)</option>
                <option value={48}>48 Hours (Max Sprint Window)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 4: Accountability & Beneficiary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">4. Referee &amp; Beneficiary</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Friend Referee Email (Final Authority)</label>
              <input
                type="email"
                value={refereeEmail}
                onChange={(e) => setRefereeEmail(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900"
                placeholder="friend@example.com"
              />
              <span className="text-[11px] text-slate-400">
                Your friend gets a referee review link if automated verification is ever borderline.
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Beneficiary if Forfeited</label>
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900"
                placeholder="Charity or Friend Name"
              />
              <input
                type="email"
                value={beneficiaryEmail}
                onChange={(e) => setBeneficiaryEmail(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 mt-1 font-mono"
                placeholder="sb-friend@personal.example.com"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#0070ba] hover:bg-[#003087] text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Locking In Rubric…</span>
            ) : (
              <span>
                {stakeDollars > 0
                  ? `Lock Rubric & Continue to PayPal Hold ($${stakeDollars}.00) →`
                  : 'Start Commitment Sprint (Free $0.00) →'}
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
