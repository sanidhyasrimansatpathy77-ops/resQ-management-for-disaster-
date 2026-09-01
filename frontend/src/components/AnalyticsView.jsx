import React from 'react';
import { useDisaster } from '../context/DisasterContext';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Truck, 
  Flame, 
  Waves, 
  Building2, 
  Zap, 
  Mountain, 
  TreePine 
} from 'lucide-react';
import { HAZARD_CATEGORIES } from '../data/seedIncidents';

export default function AnalyticsView() {
  const { incidents, stats } = useDisaster();

  // Category counts
  const categoryCounts = HAZARD_CATEGORIES.map(cat => ({
    name: cat,
    count: incidents.filter(i => i.hazardCategory === cat && i.isRealDisaster).length
  }));

  const maxCategoryCount = Math.max(...categoryCounts.map(c => c.count), 1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <BarChart3 className="w-5 h-5" />
            </span>
            <span className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Disaster Response Command Analytics
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-white mt-1">
            Real-Time Hazard Distribution & Response Metrics
          </h1>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#111827] rounded-2xl border border-[#1f293d] shadow-lg">
          <span className="text-xs text-slate-400">Total Ingested Reports</span>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">{stats.total}</div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-2 block">
            ↑ 100% Geotagged & Triaged
          </span>
        </div>

        <div className="p-4 bg-[#111827] rounded-2xl border border-rose-900/50 shadow-lg">
          <span className="text-xs text-rose-300">Critical Emergency Life Threats</span>
          <div className="text-3xl font-extrabold text-rose-400 font-mono mt-1">{stats.critical}</div>
          <span className="text-[11px] text-rose-300/80 mt-2 block">
            Immediate First Responder Triage
          </span>
        </div>

        <div className="p-4 bg-[#111827] rounded-2xl border border-sky-900/50 shadow-lg">
          <span className="text-xs text-sky-300">Average Unit Dispatch Time</span>
          <div className="text-3xl font-extrabold text-sky-400 font-mono mt-1">4.2 <span className="text-sm font-normal">mins</span></div>
          <span className="text-[11px] text-sky-300/80 mt-2 block">
            Fast Response Telemetry
          </span>
        </div>

        <div className="p-4 bg-[#111827] rounded-2xl border border-emerald-900/50 shadow-lg">
          <span className="text-xs text-emerald-300">AI Fraud & Hoax Block Rate</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">99.4%</div>
          <span className="text-[11px] text-emerald-300/80 mt-2 block">
            {stats.falseAlarms} False Alarms Filtered
          </span>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Category Distribution Bars */}
        <div className="p-5 bg-[#111827] rounded-2xl border border-[#1f293d] shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            Hazard Incident Breakdown
          </h3>

          <div className="space-y-3 pt-2">
            {categoryCounts.map(cat => {
              const pct = (cat.count / maxCategoryCount) * 100;
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat.name}</span>
                    <span className="font-mono text-slate-400 font-bold">{cat.count} Reports</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tactical Response Readiness */}
        <div className="p-5 bg-[#111827] rounded-2xl border border-[#1f293d] shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            Emergency Fleet Readiness
          </h3>

          <div className="space-y-3 pt-2">
            {[
              { unit: 'Swiftwater Rescue Boats (Alpha & Beta)', status: '2 Active / 4 Standby', ready: 80 },
              { unit: 'Urban Search & Rescue (USAR Heavy 1)', status: '1 On Scene / 2 Standby', ready: 90 },
              { unit: 'Industrial Foam Fire Engines', status: '1 En Route / 3 Standby', ready: 85 },
              { unit: 'TNEB High-Voltage Grid Isolation', status: '1 Dispatched / 2 Standby', ready: 75 },
              { unit: 'Disaster Paramedic Ambulances', status: '3 Active / 6 Standby', ready: 95 }
            ].map(item => (
              <div key={item.unit} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{item.unit}</span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">{item.status}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${item.ready}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
