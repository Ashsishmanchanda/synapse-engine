'use client';

import React, { useState } from 'react';
import { Sparkles, Users, Server, ShieldCheck, ArrowRight, Zap, TrendingUp } from 'lucide-react';

export function ApexRoiAppView() {
  const tiers = [
    { id: 'starter', name: 'Starter Launch', base: 29, userFee: 5, serverFee: 12 },
    { id: 'growth', name: 'Scale Growth', base: 99, userFee: 4, serverFee: 10 },
    { id: 'enterprise', name: 'Apex Enterprise', base: 299, userFee: 3, serverFee: 8 }
  ];

  const [params, setParams] = useState({
    users: 35,
    servers: 12,
    selectedTier: 'growth',
    annual: true
  });

  // Calculate ROI using exact node logic
  const tier = tiers.find(t => t.id === params.selectedTier) || tiers[0];
  const rawMonthly = tier.base + (params.users * tier.userFee) + (params.servers * tier.serverFee);
  const effectiveMonthly = params.annual ? Math.round(rawMonthly * 0.8) : rawMonthly;
  const annualCost = effectiveMonthly * 12;
  const hoursSavedMonthly = params.users * 3.5;
  const grossSavingsMonthly = Math.round(hoursSavedMonthly * 60);
  const netSavingsAnnual = (grossSavingsMonthly * 12) - annualCost;
  const roiPercent = Math.round((netSavingsAnnual / annualCost) * 100);

  const metrics = [
    { label: 'Monthly Investment', val: '$' + effectiveMonthly, badge: 'Active Bill', color: 'text-amber-400' },
    { label: 'Annual Commitment', val: '$' + annualCost.toLocaleString(), badge: '-20% Auto-Applied', color: 'text-orange-400' },
    { label: 'Net Annual Savings', val: '$' + netSavingsAnnual.toLocaleString(), badge: 'Labor Time Reclaimed', color: 'text-emerald-400' },
    { label: 'Projected ROI', val: roiPercent + '%', badge: 'Payback < 2 Mo', color: 'text-lime-400' }
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-[#080b11] text-slate-100 p-6 md:p-8 select-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(255,102,0,0.5)]">
              <Zap className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-200">
                APEX ROI CALCULATOR
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Live Next.js 15 SaaS App Running from 5 Constitutional Micro-Nodes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-mono">
            <button
              onClick={() => setParams(prev => ({ ...prev, annual: false }))}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                !params.annual ? 'bg-slate-800 text-amber-300 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setParams(prev => ({ ...prev, annual: true }))}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                params.annual ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-slate-950/40 text-slate-950 px-1.5 py-0.5 rounded-full font-black">20% OFF</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#0d121d] border border-slate-800 hover:border-amber-500/40 transition-all shadow-md flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-400 tracking-wider uppercase mb-1">{m.label}</div>
                <div className={`text-2xl font-black ${m.color}`}>{m.val}</div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{m.badge}</span>
                <Sparkles className="w-3 h-3 text-amber-400/80" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid: Plan Selector & Sliders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Plan Selector */}
          <div className="lg:col-span-2 space-y-4">
            <div className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Select Cloud Subscription Tier</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tiers.map(t => {
                const isSelected = t.id === params.selectedTier;
                return (
                  <button
                    key={t.id}
                    onClick={() => setParams(prev => ({ ...prev, selectedTier: t.id }))}
                    className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#141b2b] to-[#0d121d] border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                        : 'bg-[#0d121d] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {t.id === 'growth' && (
                      <div className="absolute -top-2 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow">
                        Most Popular
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">{t.name}</h3>
                      <div className="text-xl font-black text-amber-300 mt-1">
                        ${t.base}<span className="text-xs text-slate-400 font-normal"> /mo</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                      <span>{isSelected ? '● Active' : 'Select'}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Insight Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-[#101725] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Projected Net ROI: {roiPercent}%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calculated from {params.users} seats + {params.servers} compute instances.
                </p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-lg text-xs shadow hover:scale-105 transition-transform shrink-0">
                Start Free Trial
              </button>
            </div>
          </div>

          {/* Usage Controls */}
          <div className="p-5 rounded-xl bg-[#0d121d] border border-slate-800 space-y-5">
            <div className="text-xs font-black font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span>Configure Workload</span>
            </div>

            {/* Users Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Team Seats:</span>
                <span className="text-amber-400 font-bold">{params.users} Users</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={params.users}
                onChange={e => setParams(prev => ({ ...prev, users: parseInt(e.target.value) || 1 }))}
                className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Servers Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Compute Nodes:</span>
                <span className="text-orange-400 font-bold">{params.servers} Servers</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={params.servers}
                onChange={e => setParams(prev => ({ ...prev, servers: parseInt(e.target.value) || 1 }))}
                className="w-full accent-orange-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="text-slate-400 font-bold mb-1">Monthly Breakdown:</div>
              <div className="flex justify-between text-slate-400">
                <span>Base Tier:</span>
                <span className="text-slate-200">${tier.base}/mo</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Usage Scale:</span>
                <span className="text-slate-200">${rawMonthly - tier.base}/mo</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-amber-300">
                <span>Total Bill:</span>
                <span>${effectiveMonthly}/mo</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
