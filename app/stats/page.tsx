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
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Analytics & Calibration</span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Reliability Stats & Stake Recommender
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bayesian Beta posterior calibration and expected-loss optimization over PayPal sandbox sprints.
          </p>
        </div>
        <Link
          href="/"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Grid: Reliability Card + Stake Recommender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reliability Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">User Reliability Score</h2>
            <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
              Beta Posterior
            </span>
          </div>

          {sprintCount < 5 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
              Not enough data yet (minimum 5 sprints required to fit Bayesian prior).
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-6 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-5xl font-black text-indigo-700 tracking-tight">
                  {(posteriorMean * 100).toFixed(1)}%
                </p>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Posterior Expected Success Rate
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  80% Credible Interval: [{(ci80Lower * 100).toFixed(0)}% – {(ci80Upper * 100).toFixed(0)}%]
                </p>
              </div>

              <div className="text-xs text-slate-500 space-y-2 p-3 bg-white rounded-xl border border-slate-100 font-mono">
                <div className="flex justify-between">
                  <span>Prior Strength:</span>
                  <span className="font-semibold text-slate-800">6 sprints (α=4.5, β=1.5)</span>
                </div>
                <div className="flex justify-between">
                  <span>Historical Record:</span>
                  <span className="font-semibold text-slate-800">{successes} Succeeded / {failures} Forfeited</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stake Recommender Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Optimal Stake Recommendation</h2>
            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
              Loss-Constrained
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Comfort Loss Budget:</span>
              <span className="text-indigo-600 font-extrabold">${comfortBudget}.00 USD</span>
            </div>
            <input
              type="range"
              min={5}
              max={25}
              step={1}
              value={comfortBudget}
              onChange={(e) => setComfortBudget(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400">
              Recommends largest stake where Expected Loss = (1 - p) × stake ≤ comfort budget.
            </p>
          </div>

          <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center space-y-1">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Recommended Optimal Stake</span>
            <p className="text-3xl font-extrabold text-emerald-800">
              {recommendedStake.stake}.00 USD (sandbox)
            </p>
            <p className="text-xs text-emerald-700 font-medium">
              Estimated Success: {recommendedStake.pSuccess}% · Expected Loss: ${recommendedStake.expectedLoss} USD
            </p>
          </div>
        </div>
      </div>

      {/* Stake Curve Grid Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">Stake Optimization Grid & Trade-Off</h2>
          <span className="text-xs text-slate-400 font-mono">5 – 50 USD Grid</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Stake Amount</th>
                <th className="px-4 py-3">Predicted P(Success)</th>
                <th className="px-4 py-3">Expected Loss</th>
                <th className="px-4 py-3 rounded-r-lg">Constraint Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stakeCurve.map((row) => (
                <tr key={row.stake} className={row.stake === recommendedStake.stake ? 'bg-indigo-50/60 font-semibold text-slate-900' : ''}>
                  <td className="px-4 py-3 font-mono">{row.stake}.00 USD (sandbox)</td>
                  <td className="px-4 py-3 font-mono">{row.pSuccess}%</td>
                  <td className="px-4 py-3 font-mono">${row.expectedLoss} USD</td>
                  <td className="px-4 py-3">
                    {row.stake === recommendedStake.stake ? (
                      <span className="text-emerald-700 font-extrabold">★ Recommended Stake</span>
                    ) : row.underBudget ? (
                      <span className="text-slate-500">Within Budget</span>
                    ) : (
                      <span className="text-rose-500">Exceeds Budget</span>
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
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Success Rate by Goal Type</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>GitHub Activity (Code Commit Goals):</span>
              <span className="font-bold text-slate-900">85.7% (6/7)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Photo Proof (Physical Activity Goals):</span>
              <span className="font-bold text-slate-900">80.0% (4/5)</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Optimal Start Weekdays</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span>Tuesday / Wednesday Starts:</span>
              <span className="font-bold text-emerald-600">88.9% (Highest focus)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Friday / Saturday Starts:</span>
              <span className="font-bold text-amber-600">71.4% (Weekend friction)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
