import React from 'react';
import { useDisaster } from '../context/DisasterContext';
import { 
  Radio, 
  MapPin, 
  Video, 
  FlaskConical, 
  PlusCircle, 
  Settings, 
  ShieldAlert, 
  Activity,
  Sparkles,
  BarChart3,
  RotateCcw,
  FileText
} from 'lucide-react';

export default function Navbar() {
  const { 
    activeView, 
    setActiveView, 
    setIsReportModalOpen, 
    setIsSettingsModalOpen,
    stats,
    resetDemoData,
    geminiApiKey
  } = useDisaster();

  return (
    <header className="sticky top-0 z-40 bg-[#0a0e17]/95 backdrop-blur-md border-b border-[#1f293d] shadow-lg">
      {/* Emergency Broadcast Ticker */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 px-4 py-1 border-b border-rose-900/40 text-xs flex items-center justify-between text-rose-300">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="font-semibold text-rose-400 uppercase tracking-wider text-[10px] bg-rose-900/40 px-1.5 py-0.5 rounded border border-rose-700/50">
            LIVE TRIAGE FEED
          </span>
          <span className="truncate text-slate-300">
            Active Disasters: <b className="text-rose-400 font-mono">{stats.critical} Critical</b>, <b className="text-amber-400 font-mono">{stats.high} High</b> | First Responders Deployed: <b className="text-emerald-400 font-mono">{stats.activeDispatches} Units</b> | AI False Alarms Blocked: <b className="text-sky-400 font-mono">{stats.falseAlarms}</b>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            Gemini 3.7 Vision: <span className={geminiApiKey ? "text-emerald-400 font-bold" : "text-amber-400"}>{geminiApiKey ? "Connected" : "Hybrid Mode"}</span>
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setActiveView('map')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 shadow-md shadow-rose-900/30 border border-rose-400/30">
            <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0e17]"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ResQMap<span className="text-rose-500 font-mono">.AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-md">
                Citizen Triage
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Geotagged Damage Mapping & Responder Live Feed
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center bg-[#111827] p-1 rounded-xl border border-[#1f293d] overflow-x-auto max-w-full">
          {/* Live Response Map */}
          <button
            onClick={() => setActiveView('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeView === 'map'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Live Map</span>
          </button>

          {/* All Reports Feed Tab */}
          <button
            onClick={() => setActiveView('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeView === 'reports'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>All Reports</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded-full text-[10px] font-mono">
              {stats.total}
            </span>
          </button>

          {/* Responder Live Feed */}
          <button
            onClick={() => setActiveView('responder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeView === 'responder'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
            <span>Responder Live Feed</span>
            {stats.activeDispatches > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>

          {/* Judge Sandbox */}
          <button
            onClick={() => setActiveView('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeView === 'sandbox'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-amber-300 hover:text-amber-100 hover:bg-amber-950/40 border border-amber-500/20'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span>Judge Sandbox</span>
            <span className="text-[9px] uppercase tracking-wider bg-amber-400 text-black px-1.5 py-0.5 rounded font-bold">
              Live Test
            </span>
          </button>

          {/* Analytics */}
          <button
            onClick={() => setActiveView('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeView === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 border border-rose-400/40 transition-transform active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Submit Citizen SOS</span>
            <span className="sm:hidden">SOS</span>
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            title="API Key & System Settings"
            className="p-2 rounded-xl bg-[#111827] hover:bg-slate-800 border border-[#1f293d] text-slate-300 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={resetDemoData}
            title="Reset to Initial Hackathon Demo Data"
            className="p-2 rounded-xl bg-[#111827] hover:bg-slate-800 border border-[#1f293d] text-slate-400 hover:text-amber-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
