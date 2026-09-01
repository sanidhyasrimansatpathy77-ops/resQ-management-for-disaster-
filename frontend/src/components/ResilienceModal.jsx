import React from 'react';
import { useDisaster } from '../context/DisasterContext';
import { 
  X, 
  Server, 
  Database, 
  Activity, 
  Power, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

export default function ResilienceModal() {
  const { 
    isResilienceModalOpen, 
    setIsResilienceModalOpen, 
    nodesStatus, 
    toggleNodeStatus 
  } = useDisaster();

  if (!isResilienceModalOpen) return null;

  const onlineNodesCount = Object.entries(nodesStatus).filter(([k, v]) => k.startsWith('api') && v.online).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0d131f] border border-[#1f293d] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-[#1f293d] bg-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 font-bold block">
                Slide 12 · Cluster Architecture
              </span>
              <h3 className="font-extrabold text-white text-base">High-Availability Multi-Node Resilience</h3>
            </div>
          </div>
          <button
            onClick={() => setIsResilienceModalOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300">
          
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
            <h4 className="font-bold text-white text-sm">"One server can fail. The response should not."</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              ResQNet utilizes a shared data layer (PostgreSQL + Redis Event Stream) with multiple API instances behind a load balancer. If an API node goes offline, another node immediately handles incoming citizen reports.
            </p>
          </div>

          {/* Load Balancer Status */}
          <div className="p-3 bg-[#111827] rounded-xl border border-[#1f293d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
              <div>
                <span className="font-bold text-white block">Cluster Load Balancer</span>
                <span className="text-[11px] text-slate-400">Distributing traffic across {onlineNodesCount} active API nodes</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40">
              HEALTHY
            </span>
          </div>

          {/* 3 API Nodes (Interactive Demo from Slide 12) */}
          <div className="space-y-2">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">
              API Node Pool (Click power icon to simulate node outage):
            </span>

            {['api01', 'api02', 'api03'].map(key => {
              const node = nodesStatus[key];
              return (
                <div
                  key={key}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    node.online
                      ? 'bg-slate-900/80 border-slate-700 text-slate-200'
                      : 'bg-rose-950/30 border-rose-600/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${node.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                    <div>
                      <span className="font-bold text-white block">{node.name}</span>
                      <span className="text-[10px] text-slate-400">{node.region} · Status: {node.online ? 'Online & Serving' : 'Offline / Simulating Outage'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleNodeStatus(key)}
                    title={node.online ? "Simulate Taking Node Offline" : "Restore Node"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      node.online
                        ? 'bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200'
                        : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{node.online ? 'Simulate Outage' : 'Bring Online'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Data Layer */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1f293d]">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                <span>PostgreSQL Database</span>
              </div>
              <p className="text-[10px] text-slate-400">Persistent incident records & spatial indices.</p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Redis Event Stream</span>
              </div>
              <p className="text-[10px] text-slate-400">Live telemetry & WebSocket broadcasts.</p>
            </div>
          </div>

          {/* Footer Close */}
          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={() => setIsResilienceModalOpen(false)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
            >
              Close Monitor
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
