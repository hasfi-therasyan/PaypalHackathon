'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ReliabilityStatsPage() {
  const [sprintCount] = useState(7);
  const [comfortBudget, setComfortBudget] = useState(10); // Default 10 USD

  // Beta distribution calculation for reliability score
  // Prior: Alpha = 4.5, Beta = 1.5 (strength around 6 sprints)
  // Likelihood: 6 successes, 1 failure in 7 sprints
  const priorAlpha = 4.5;
  const priorBeta = 1.5;
  const successes = 6;
  const failures = 1;
  const postAlpha = priorAlpha + successes; // 10.5
  const postBeta = priorBeta + failures;   // 2.5
  const posteriorMean = postAlpha / (postAlpha + postBeta); // ~0.807 (80.7%)
  const ci80Lower = 0.69;
  const ci80Upper = 0.91;

  // Stake curve grid from 5 to 50 USD
  const stakeGrid = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  const stakeCurve = stakeGrid.map((stake) => {
    const pSuccess = Math.min(0.95, 0.65 + 0.005 * stake);
    const expectedLoss = (1 - pSuccess) * stake;
    return {
      stake,
      pSuccess: (pSuccess * 100).toFixed(1),
      expectedLoss: expectedLoss.toFixed(2),
      underBudget: expectedLoss <= comfortBudget,
    };
  });

  const recommendedStake = stakeCurve.filter((s) => s.underBudget).pop() || stakeCurve[0];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0070ba]">
            Machine Learning & Analytics
          </span>
          <h1 className="text-3xl font-extrabold text-[#003087] tracking-tight mt-1">
            Reliability Stats & Stake Recommender
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bayesian Beta calibration and loss-budget optimization calibrated across your PayPal commitment sprints.
          </p>
        </div>
        <Link
          href="/"
          className="text-xs font-bold text-[#0070ba] hover:underline"
        >
          ← Return to Dashboard
        </Link>
      </div>

      {/* Grid: Reliability Card + Stake Recommender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reliability Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">User Reliability Score</h2>
            <span className="text-[11px] font-mono bg-blue-50 text-[#0070ba] border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
              Beta Posterior
            </span>
          </div>

          <div className="space-y-4">
            <div className="text-center py-6 bg-gradient-to-br from-blue-50/70 to-slate-50 rounded-2xl border border-blue-100 space-y-1">
              <p className="text-5xl font-black text-[#003087] tracking-tight font-mono">
                {(posteriorMean * 100).toFixed(1)}%
              </p>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Posterior Expected Success Rate
              </p>
              <p className="text-xs text-slate-500 font-mono">
                80% Credible Interval: [{(ci80Lower * 100).toFixed(0)}% – {(ci80Upper * 100).toFixed(0)}%]
              </p>
            </div>

            <div className="text-xs text-slate-600 space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Prior Calibration:</span>
                <span className="font-semibold text-slate-900">6 sprints (α=4.5, β=1.5)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Observed History:</span>
                <span className="font-semibold text-emerald-700">
                  {successes} Succeeded / {failures} Forfeited
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stake Recommender Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Optimal Stake Recommendation</h2>
            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              Risk-Bounded
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Maximum Comfort Loss Budget:</span>
              <span className="text-[#003087] font-mono font-extrabold text-sm">${comfortBudget}.00 USD</span>
            </div>
            <input
              type="range"
              min={5}
              max={25}
              step={1}
              value={comfortBudget}
              onChange={(e) => setComfortBudget(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-[#0070ba]"
            />
            <p className="text-[11px] text-slate-500">
              Calculates the highest motivating stake where Expected Loss ≤ your chosen comfort budget.
            </p>
          </div>

          <div className="p-5 bg-blue-50/80 border border-blue-200 rounded-2xl text-center space-y-1">
            <span className="text-xs font-bold text-[#003087] uppercase tracking-wider block">
              Recommended Optimal Stake
            </span>
            <p className="text-3xl font-extrabold font-mono text-[#0070ba]">
              ${recommendedStake.stake}.00 USD
            </p>
            <p className="text-xs text-slate-600 font-medium">
              Estimated Success: <strong className="text-slate-900">{recommendedStake.pSuccess}%</strong> · Expected Loss: <strong className="text-slate-900">${recommendedStake.expectedLoss} USD</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Stake Curve Grid Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">Stake Optimization Grid & Trade-Off</h2>
          <span className="text-xs text-slate-500 font-mono">5 – 50 USD Range</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Stake Amount</th>
                <th className="px-4 py-3">Predicted P(Success)</th>
                <th className="px-4 py-3">Expected Loss</th>
                <th className="px-4 py-3">Constraint Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stakeCurve.map((row) => (
                <tr
                  key={row.stake}
                  className={row.stake === recommendedStake.stake ? 'bg-blue-50/70 font-semibold text-slate-900' : 'hover:bg-slate-50/50'}
                >
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    ${row.stake}.00 USD
                  </td>
                  <td className="px-4 py-3 font-mono text-[#003087]">
                    {row.pSuccess}%
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">
                    ${row.expectedLoss} USD
                  </td>
                  <td className="px-4 py-3">
                    {row.stake === recommendedStake.stake ? (
                      <span className="inline-flex items-center gap-1 text-[#0070ba] font-bold text-xs bg-blue-100/70 px-2 py-0.5 rounded-full border border-blue-200">
                        ★ Recommended Stake
                      </span>
                    ) : row.underBudget ? (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 text-[11px]">
                        ✓ Within Budget
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 text-[11px]">
                        ✕ Exceeds Budget
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goal Type & Weekday Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Success Rate by Commitment Type
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 font-mono">
              <span className="text-slate-600 font-sans">GitHub Activity (Code Sprints):</span>
              <span className="font-bold text-[#003087]">85.7% (6/7)</span>
            </div>
            <div className="flex justify-between py-2 font-mono">
              <span className="text-slate-600 font-sans">Photo Proof (Physical & Study Goals):</span>
              <span className="font-bold text-[#003087]">80.0% (4/5)</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Optimal Sprint Start Weekdays
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 font-mono">
              <span className="text-slate-600 font-sans">Tuesday / Wednesday Starts:</span>
              <span className="font-bold text-emerald-700">88.9% (Highest focus)</span>
            </div>
            <div className="flex justify-between py-2 font-mono">
              <span className="text-slate-600 font-sans">Friday / Saturday Starts:</span>
              <span className="font-bold text-amber-700">71.4% (Weekend friction)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
