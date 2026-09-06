'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Filter, Users, Clock, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VisualPerformanceCharts() {
  const [activeRange, setActiveRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const dailyData = [
    { day: 'Mon', calls: 38, leads: 16, convRate: 42, avgDuration: '4m 12s' },
    { day: 'Tue', calls: 52, leads: 24, convRate: 46, avgDuration: '5m 05s' },
    { day: 'Wed', calls: 45, leads: 19, convRate: 42, avgDuration: '4m 45s' },
    { day: 'Thu', calls: 64, leads: 31, convRate: 48, avgDuration: '5m 30s' },
    { day: 'Fri', calls: 58, leads: 28, convRate: 48, avgDuration: '4m 50s' },
    { day: 'Sat', calls: 22, leads: 9,  convRate: 40, avgDuration: '3m 20s' },
    { day: 'Sun', calls: 26, leads: 11, convRate: 42, avgDuration: '3m 45s' },
  ];

  const maxCalls = 70;

  const funnelStages = [
    { stage: 'Voice Inbound & Outbound', count: '1,420', pct: 100, color: 'from-blue-500 to-indigo-500' },
    { stage: 'Engaged (>60s Dialog)', count: '980', pct: 69, color: 'from-indigo-500 to-violet-500' },
    { stage: 'Qualified by Nova', count: '462', pct: 32, color: 'from-violet-500 to-purple-500' },
    { stage: 'Demo / Meeting Booked', count: '184', pct: 13, color: 'from-purple-500 to-pink-500' },
    { stage: 'Deal Closed / Pipeline ARR', count: '68', pct: 4.8, color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar: Title & Filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            Revenue &amp; Call Performance Analytics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics powered by Agora SD-RTN event logs &amp; AI conversation transcripts.
          </p>
        </div>

        {/* Range switcher */}
        <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-1">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                activeRange === range
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Q3 (90 Days)'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Daily Calls & Lead Conversion Bar Graph */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 glass-panel-elevated p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Daily Calls vs. Lead Conversions
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Volume comparison across days of the week</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded bg-gradient-to-t from-indigo-600 to-indigo-400" />
                Total Calls
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded bg-gradient-to-t from-emerald-600 to-emerald-400" />
                Qualified Leads
              </span>
            </div>
          </div>

          {/* Interactive SVG Bar Chart */}
          <div className="h-56 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-white/10">
            {dailyData.map((d, i) => {
              const callHeight = (d.calls / maxCalls) * 100;
              const leadHeight = (d.leads / maxCalls) * 100;
              const isHovered = hoveredBar === i;

              return (
                <div
                  key={d.day}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative"
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 rounded-xl border border-white/15 bg-black/90 px-3 py-1.5 text-[11px] text-white shadow-xl whitespace-nowrap animate-fade-up">
                      <p className="font-bold">{d.day}: {d.calls} calls · {d.leads} leads</p>
                      <p className="text-[10px] text-emerald-300">{d.convRate}% Conv · Avg {d.avgDuration}</p>
                    </div>
                  )}

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Calls Bar */}
                    <div
                      className={cn(
                        'w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-300',
                        isHovered && 'brightness-125 scale-y-105'
                      )}
                      style={{ height: `${callHeight}%` }}
                    />
                    {/* Leads Bar */}
                    <div
                      className={cn(
                        'w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-300',
                        isHovered && 'brightness-125 scale-y-105'
                      )}
                      style={{ height: `${leadHeight}%` }}
                    />
                  </div>

                  <span className={cn(
                    'text-[11px] font-medium transition-colors',
                    isHovered ? 'text-white font-bold' : 'text-slate-400'
                  )}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Peak performance: <strong>Thursday (64 calls, 48% conversion)</strong></span>
            <span className="text-emerald-400 font-bold">+28% efficiency vs. manual dialing</span>
          </div>
        </div>

        {/* Chart 2: Qualification Funnel */}
        <div className="rounded-3xl border border-white/10 glass-panel-elevated p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-violet-400" />
              Sales Qualification Funnel
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Drop-off rate across conversation stages</p>
          </div>

          <div className="space-y-3 pt-2">
            {funnelStages.map(stage => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 text-[11px] truncate">{stage.stage}</span>
                  <span className="font-mono font-bold text-white">{stage.count} <span className="text-slate-400 text-[10px]">({stage.pct}%)</span></span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', stage.color)}
                    style={{ width: `${stage.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Pipeline Generated</span>
              <span className="font-extrabold text-emerald-400 font-mono">$184,200 ARR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
