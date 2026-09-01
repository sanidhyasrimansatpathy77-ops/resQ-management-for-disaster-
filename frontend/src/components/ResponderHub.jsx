import React, { useState, useEffect, useRef } from 'react';
import { useDisaster } from '../context/DisasterContext';
import { liveStreamService } from '../services/liveStreamService';
import { 
  Video, 
  VideoOff, 
  Compass, 
  Navigation, 
  Radio, 
  Volume2, 
  Eye, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Truck, 
  Flame, 
  Waves, 
  Building2, 
  Zap, 
  Camera, 
  Maximize2,
  Crosshair,
  Wifi,
  Sparkles,
  Users,
  Cast,
  Tv,
  Share2,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PRIORITY_CONFIG, SEVERITY_CONFIG } from '../data/seedIncidents';

const SIMULATED_FEEDS = [
  {
    id: 'sim-1',
    name: 'Bodycam Alpha: Disaster Rescue Unit 17',
    type: 'Bodycam',
    url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
    unit: 'Disaster Rescue Unit 17',
    speed: '28 km/h',
    heading: '048° NE'
  },
  {
    id: 'sim-2',
    name: 'Tactical Drone Alpha: High-Altitude Thermal',
    type: 'Thermal Drone',
    url: 'https://images.unsplash.com/photo-1602980085566-4c9f1b95b77c?auto=format&fit=crop&w=1200&q=80',
    unit: 'Drone Reconnaissance Unit 07',
    speed: '45 km/h',
    heading: '185° S'
  },
  {
    id: 'sim-3',
    name: 'USAR Search Cam: Structural Collapse Shoring',
    type: 'Search Probe',
    url: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=1200&q=80',
    unit: 'USAR Heavy Squad 1',
    speed: '0 km/h (On Scene)',
    heading: '310° NW'
  }
];

export default function ResponderHub() {
  const { 
    incidents, 
    activeResponderIncident, 
    setActiveResponderIncident, 
    updateIncidentStatus,
    setSelectedIncident
  } = useDisaster();

  // Mode: 'broadcast' (sending my camera) | 'watch' (watching colleague stream) | 'simulated'
  const [streamMode, setStreamMode] = useState('simulated'); // 'broadcast' | 'watch' | 'simulated'
  const [selectedFeed, setSelectedFeed] = useState(SIMULATED_FEEDS[0]);
  const [hudFilter, setHudFilter] = useState('standard'); // 'standard' | 'night' | 'thermal'
  const [radioActive, setRadioActive] = useState(false);
  
  // Real camera & WebRTC states
  const [cameraStream, setCameraStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isWatchingLive, setIsWatchingLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('IDLE');
  const [copiedRoomId, setCopiedRoomId] = useState(false);

  // Approach telemetry
  const [simulatedDistance, setSimulatedDistance] = useState(2.4);
  const [simulatedEta, setSimulatedEta] = useState(6);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const incident = activeResponderIncident || incidents[0];
  const prioConf = PRIORITY_CONFIG[incident?.priority] || SEVERITY_CONFIG[incident?.severity] || PRIORITY_CONFIG.P1;
  const currentRoomId = incident ? liveStreamService.getPeerRoomId(incident.id) : 'resqnet-stream';

  // Approach distance simulation countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedDistance(prev => {
        if (prev <= 0.1) return 0.05;
        return parseFloat((prev - 0.05).toFixed(2));
      });
      setSimulatedEta(prev => {
        if (prev <= 1) return 1;
        return prev;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup WebRTC and local camera on unmount
  useEffect(() => {
    return () => {
      liveStreamService.stopBroadcast();
      liveStreamService.disconnectWatcher();
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraStream]);

  // Start Broadcasting from this device's camera (Responder role)
  const handleStartBroadcast = async () => {
    try {
      setConnectionStatus('CONNECTING');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      setCameraStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await liveStreamService.startBroadcast(incident.id, stream, (count) => {
        setViewerCount(count);
      });

      setIsBroadcasting(true);
      setStreamMode('broadcast');
      setConnectionStatus('LIVE_BROADCASTING');
    } catch (err) {
      console.warn("Could not start camera broadcast:", err);
      alert("Camera or microphone permission denied or unavailable. You can also view simulated tactical feeds.");
      setConnectionStatus('ERROR');
    }
  };

  // Stop Broadcasting
  const handleStopBroadcast = () => {
    liveStreamService.stopBroadcast();
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsBroadcasting(false);
    setStreamMode('simulated');
    setConnectionStatus('IDLE');
    setViewerCount(0);
  };

  // Watch Colleague's Live Stream across the Internet (Viewer / Commander role)
  const handleWatchColleagueStream = async () => {
    try {
      setConnectionStatus('CONNECTING_PEER');
      setStreamMode('watch');
      setIsWatchingLive(true);

      await liveStreamService.joinBroadcast(
        incident.id,
        (stream) => {
          setRemoteStream(stream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          setConnectionStatus('CONNECTED_WATCHING');
        },
        (status) => {
          if (status === 'DISCONNECTED') {
            setConnectionStatus('BROADCASTER_OFFLINE');
          } else if (status === 'ERROR') {
            setConnectionStatus('FAILED');
          }
        }
      );
    } catch (err) {
      console.warn("Could not connect to colleague broadcast:", err);
      setConnectionStatus('FAILED');
    }
  };

  // Disconnect watching
  const handleDisconnectWatcher = () => {
    liveStreamService.disconnectWatcher();
    setRemoteStream(null);
    setIsWatchingLive(false);
    setStreamMode('simulated');
    setConnectionStatus('IDLE');
  };

  const handleCopyRoomLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedRoomId(true);
    setTimeout(() => setCopiedRoomId(false), 2000);
  };

  const handleRadioBeep = () => {
    setRadioActive(true);
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
    setTimeout(() => setRadioActive(false), 800);
  };

  const handleStatusUpdate = (status) => {
    if (status === 'RESOLVED') {
      confetti({ particleCount: 70, spread: 60 });
    }
    updateIncidentStatus(incident.id, status);
  };

  return (
    <div className="space-y-4">
      {/* Top Incident Target Banner */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${prioConf.bg} ${prioConf.color} border ${prioConf.border}`}>
            <Truck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400 font-bold">{incident?.id}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${prioConf.badge}`}>
                {incident?.priority || 'P1'} · {prioConf.label}
              </span>
              <span className="text-xs text-sky-400 font-bold font-mono">
                Assigned: {incident?.assignedUnit || 'Disaster Rescue Unit 17'}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Live Responder Stream: {incident?.title}
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              {incident?.address} ({incident?.latitude.toFixed(4)}, {incident?.longitude.toFixed(4)})
            </p>
          </div>
        </div>

        {/* Target Switcher & Live Room Badge */}
        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
            <Cast className="w-3.5 h-3.5 text-sky-400" />
            <span>Room: <b>{currentRoomId}</b></span>
            <button
              onClick={handleCopyRoomLink}
              title="Copy Link for Colleagues"
              className="p-1 hover:text-white text-slate-400"
            >
              {copiedRoomId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <select
            value={incident?.id}
            onChange={e => {
              const found = incidents.find(i => i.id === e.target.value);
              if (found) setActiveResponderIncident(found);
            }}
            className="bg-slate-900 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500"
          >
            {incidents.filter(i => i.isRealDisaster).map(inc => (
              <option key={inc.id} value={inc.id}>
                {inc.id} - {inc.hazardCategory.split('/')[0]} ({inc.priority || inc.severity})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Tactical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Live Video HUD Stream */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-[#1f293d] bg-black aspect-video flex items-center justify-center shadow-2xl">
          
          {/* Mode 1: Local Responder Broadcasting from Phone Camera */}
          {streamMode === 'broadcast' && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                hudFilter === 'night' ? 'brightness-125 contrast-150 hue-rotate-90 saturate-200' :
                hudFilter === 'thermal' ? 'invert contrast-200 saturate-200' : ''
              }`}
            />
          )}

          {/* Mode 2: Watching Colleague's Live Stream from Another Phone/Laptop via WebRTC */}
          {streamMode === 'watch' && (
            <>
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${
                    hudFilter === 'night' ? 'brightness-125 contrast-150 hue-rotate-90 saturate-200' :
                    hudFilter === 'thermal' ? 'invert contrast-200 saturate-200' : ''
                  }`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <Cast className="w-10 h-10 text-sky-400 animate-bounce" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Connecting to Colleague's Live Camera Feed...</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Waiting for responder on scene to broadcast from Room <code className="text-sky-300 font-mono">{currentRoomId}</code>.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono bg-sky-950/80 text-sky-300 px-3 py-1 rounded-full border border-sky-600/40 animate-pulse">
                    WebRTC Peer-to-Peer Link Active
                  </span>
                </div>
              )}
            </>
          )}

          {/* Mode 3: High-Res Tactical Simulated Stream */}
          {streamMode === 'simulated' && (
            <img
              src={selectedFeed.url}
              alt="Tactical Feed"
              className={`w-full h-full object-cover ${
                hudFilter === 'night' ? 'brightness-125 contrast-150 hue-rotate-90 saturate-200' :
                hudFilter === 'thermal' ? 'invert contrast-200 saturate-200' : ''
              }`}
            />
          )}

          {/* Tactical HUD Scanline & Crosshair Overlay */}
          <div className="absolute inset-0 pointer-events-none border border-sky-500/20 tactical-scanline">
            
            {/* Corner Bracket Reticles */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-sky-400"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-sky-400"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-sky-400"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-sky-400"></div>

            {/* Center Crosshair Target Vector */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-16 h-16 border border-sky-400/40 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: '10s' }}>
                <div className="w-1 h-1 bg-rose-500 rounded-full animate-ping"></div>
              </div>
            </div>

            {/* Top Telemetry Bar */}
            <div className="absolute top-4 left-10 right-10 flex items-center justify-between font-mono text-[11px] text-sky-400 drop-shadow">
              <div className="flex items-center gap-2 bg-black/70 px-2.5 py-1 rounded border border-sky-500/30 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="font-bold uppercase tracking-wider text-rose-300">
                  {streamMode === 'broadcast' ? '🔴 YOU ARE BROADCASTING LIVE' :
                   streamMode === 'watch' ? '📡 WATCHING LIVE COLLEAGUE FEED' :
                   'SIMULATED TACTICAL STREAM'}
                </span>
                {isBroadcasting && (
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40">
                    <Users className="w-3 h-3 inline mr-1" />{viewerCount} Viewers
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 bg-black/70 px-2.5 py-1 rounded border border-sky-500/30 backdrop-blur-sm">
                <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-emerald-400" /> WEBRTC P2P</span>
                <span>LATENCY: <b>28ms</b></span>
                <span>FPS: <b>60</b></span>
              </div>
            </div>

            {/* Bottom Target Vector Telemetry */}
            <div className="absolute bottom-4 left-10 right-10 flex items-end justify-between font-mono text-xs drop-shadow">
              <div className="bg-black/80 p-2.5 rounded-xl border border-sky-500/40 text-slate-200 backdrop-blur-md space-y-1">
                <div className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1">
                  <Navigation className="w-3 h-3 animate-spin" /> TARGET VECTOR
                </div>
                <div className="text-sm font-black text-white font-mono">
                  DISTANCE: <span className="text-amber-400">{simulatedDistance} KM</span> | ETA: <span className="text-emerald-400">{simulatedEta} MINS</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  BEARING: <b>{selectedFeed.heading}</b> | SPEED: <b>{selectedFeed.speed}</b>
                </div>
              </div>

              {/* Radio Indicator */}
              {radioActive && (
                <div className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold font-mono animate-bounce flex items-center gap-1.5 shadow-lg shadow-rose-900">
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span>DISPATCH AUDIO TRANSMITTING...</span>
                </div>
              )}
            </div>
          </div>

          {/* Top Right Live Stream Switcher Buttons */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            
            {/* Broadcaster Toggle */}
            {streamMode !== 'broadcast' ? (
              <button
                onClick={handleStartBroadcast}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-900/50 border border-rose-400/40 transition-all active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Broadcast My Live Camera</span>
              </button>
            ) : (
              <button
                onClick={handleStopBroadcast}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-rose-950 text-rose-300 border border-rose-600 hover:bg-rose-900"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>Stop Broadcast</span>
              </button>
            )}

            {/* Watch Colleague Toggle */}
            {streamMode !== 'watch' ? (
              <button
                onClick={handleWatchColleagueStream}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/50 border border-sky-400/40"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Watch Colleague Feed</span>
              </button>
            ) : (
              <button
                onClick={handleDisconnectWatcher}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-800 text-slate-300 border border-slate-700"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>Exit Watcher</span>
              </button>
            )}
          </div>

          {/* Bottom Filter Selector */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-slate-700">
            {['standard', 'night', 'thermal'].map(mode => (
              <button
                key={mode}
                onClick={() => setHudFilter(mode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold transition-all ${
                  hudFilter === mode ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Right Col: Mission Controls, Colleague Peer Info & Triage */}
        <div className="space-y-4">
          
          {/* Mission Status Controller */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-400" />
                Responder Mission Status
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                incident?.status === 'RESOLVED' ? 'bg-emerald-900 text-emerald-300' : 'bg-sky-900 text-sky-300'
              }`}>
                {incident?.status?.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {['DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => handleStatusUpdate(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    incident?.status === st
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {st === 'RESOLVED' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : null}
                  <span>{st.replace('_', ' ')}</span>
                </button>
              ))}
            </div>

            {/* Roger Beep Comms */}
            <button
              onClick={handleRadioBeep}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Radio className="w-4 h-4 text-sky-400" />
              <span>Broadcast Tactical Roger Beep</span>
            </button>
          </div>

          {/* Multi-Peer Colleague Broadcast Status Box */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-4 shadow-xl space-y-2">
            <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cast className="w-4 h-4 text-sky-400" />
              Multi-Device Live Stream Hub
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When a responder on scene starts their live camera broadcast on their phone, any team member or commander on another phone/laptop can tap <b>"Watch Colleague Feed"</b> to see the live feed in real-time over WebRTC!
            </p>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
              <span className="text-slate-400">Stream Status:</span>
              <span className="font-mono font-bold text-emerald-400">
                {isBroadcasting ? `🔴 Broadcasting (${viewerCount} Connected)` :
                 isWatchingLive ? `📡 Watching Colleague` :
                 `Standby / Simulated`}
              </span>
            </div>
          </div>

          {/* Feed Presets Selector */}
          {streamMode === 'simulated' && (
            <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-4 shadow-xl space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Tactical Feeds
              </h3>
              <div className="space-y-1.5">
                {SIMULATED_FEEDS.map(feed => (
                  <div
                    key={feed.id}
                    onClick={() => setSelectedFeed(feed)}
                    className={`cursor-pointer p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      selectedFeed.id === feed.id
                        ? 'bg-sky-950/40 border-sky-600/50 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-semibold line-clamp-1">{feed.name}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-black/40 px-1.5 py-0.5 rounded text-slate-300">
                      {feed.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Victim Urgency Alert Box */}
          <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-4 shadow-xl space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Victim Triage Checklist
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Trapped Individuals:</span>
                <span className="font-bold text-rose-400 font-mono">{incident?.trappedCount || 0} Citizens</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Specialized Team:</span>
                <span className="font-bold text-sky-400">
                  {incident?.assignedUnit || 'Disaster Rescue Unit 17'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedIncident(incident)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Open Full Incident Inspector Drawer</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
