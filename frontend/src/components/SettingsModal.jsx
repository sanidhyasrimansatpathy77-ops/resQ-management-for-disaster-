import React, { useState } from 'react';
import { useDisaster } from '../context/DisasterContext';
import { 
  X, 
  Settings, 
  Key, 
  Server, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  MapPin, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function SettingsModal() {
  const { 
    isSettingsModalOpen, 
    setIsSettingsModalOpen, 
    geminiApiKey, 
    updateApiKey,
    backendUrl,
    updateBackendUrl,
    resetDemoData
  } = useDisaster();

  const [inputKey, setInputKey] = useState(geminiApiKey);
  const [inputUrl, setInputUrl] = useState(backendUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    updateApiKey(inputKey.trim());
    updateBackendUrl(inputUrl.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsSettingsModalOpen(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0d131f] border border-[#1f293d] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-[#1f293d] bg-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/40">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">System & API Configuration</h3>
              <p className="text-xs text-slate-400">
                Gemini Vision AI integration & external server endpoints
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs text-slate-300">
          
          {/* Gemini API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                Get Free Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="AIzaSy..."
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                className="w-full bg-[#111827] text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-[#1f293d] focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                If no API key is provided, ResQMap seamlessly utilizes its built-in <b>Smart Hybrid Computer Vision Analyzer</b> to classify damage and explain visual features offline.
              </p>
            </div>
          </div>

          {/* External Backend URL (For Teammate Integration) */}
          <div className="space-y-2 pt-2 border-t border-[#1f293d]">
            <label className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-rose-400" />
              Teammate Backend Server Endpoint
            </label>
            <input
              type="text"
              placeholder="http://localhost:8000"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              className="w-full bg-[#111827] text-xs text-white px-3 py-2.5 rounded-xl border border-[#1f293d] focus:outline-none focus:border-sky-500 font-mono"
            />
            <p className="text-[11px] text-slate-400">
              When your teammate's backend server is deployed, enter their endpoint to route telemetry and disaster queries automatically.
            </p>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-2 border-t border-[#1f293d] flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block">Reset Demo State</span>
              <span className="text-[11px] text-slate-400">Restore 8 initial seed disaster incidents around Chennai.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                alert("Demo data reset to default seed state.");
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Data</span>
            </button>
          </div>

          {/* Footer Save Actions */}
          <div className="pt-4 border-t border-[#1f293d] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md shadow-sky-900/30 flex items-center gap-1.5"
            >
              {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : null}
              <span>{savedSuccess ? "Saved Successfully!" : "Save Settings"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
