import React, { createContext, useContext, useState, useEffect } from 'react';
import { SEED_INCIDENTS } from '../data/seedIncidents';
import { findCorroboratingIncident } from '../services/corroborationService';

const DisasterContext = createContext();

const STORAGE_KEY = 'RESQMAP_INCIDENTS_V3';
const API_KEY_STORAGE = 'RESQMAP_GEMINI_KEY';
const BACKEND_URL_STORAGE = 'RESQMAP_BACKEND_URL';

export function DisasterProvider({ children }) {
  const [incidents, setIncidents] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load saved incidents from storage:", e);
    }
    return SEED_INCIDENTS;
  });

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeResponderIncident, setActiveResponderIncident] = useState(() => SEED_INCIDENTS[0]);
  const [activeView, setActiveView] = useState('map'); // 'map' | 'reports' | 'responder' | 'sandbox' | 'analytics'
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isResilienceModalOpen, setIsResilienceModalOpen] = useState(false);

  // Multi-Node High Availability State (Slide 12)
  const [nodesStatus, setNodesStatus] = useState({
    api01: { name: 'API Node 01 (Primary)', online: true, region: 'In-Cluster' },
    api02: { name: 'API Node 02 (Secondary)', online: true, region: 'In-Cluster' },
    api03: { name: 'API Node 03 (Failover)', online: true, region: 'Edge Proxy' },
    dbPostgres: { name: 'PostgreSQL Incident Store', online: true, status: 'Synced' },
    redisEventStream: { name: 'Redis Live Telemetry Stream', online: true, status: 'Active' }
  });

  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  });

  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem(BACKEND_URL_STORAGE) || 'http://localhost:8000';
  });

  // Filter state
  const [filters, setFilters] = useState({
    hazardCategory: 'ALL',
    severity: 'ALL',
    priority: 'ALL', // 'ALL' | 'P0' | 'P1' | 'P2' | 'P3'
    status: 'ALL',
    verifiedOnly: false,
    corroboratedOnly: false,
    searchQuery: ''
  });

  // Save incidents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }, [incidents]);

  const updateApiKey = (key) => {
    setGeminiApiKey(key);
    localStorage.setItem(API_KEY_STORAGE, key);
  };

  const updateBackendUrl = (url) => {
    setBackendUrl(url);
    localStorage.setItem(BACKEND_URL_STORAGE, url);
  };

  // Toggle Node Outage simulation for Slide 12 Demo
  const toggleNodeStatus = (nodeKey) => {
    setNodesStatus(prev => ({
      ...prev,
      [nodeKey]: {
        ...prev[nodeKey],
        online: !prev[nodeKey].online
      }
    }));
  };

  // Map severity string to P0-P3 priority code
  const getPriorityCode = (sev) => {
    if (sev === 'CRITICAL') return 'P0';
    if (sev === 'HIGH') return 'P1';
    if (sev === 'MEDIUM') return 'P2';
    return 'P3';
  };

  /**
   * Add Incident with Spatial + Temporal Corroboration Engine (Slide 06)
   */
  const addIncident = (newIncident) => {
    const priority = newIncident.priority || getPriorityCode(newIncident.severity || 'MEDIUM');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check if this new report matches an existing nearby incident
    const corroboration = findCorroboratingIncident(newIncident, incidents);

    if (corroboration && newIncident.isRealDisaster) {
      const parent = corroboration.matchedIncident;
      const updatedCount = (parent.corroboratedReportsCount || 1) + 1;
      const updatedRadius = Math.max(parent.affectedRadiusMeters || 100, corroboration.distanceMeters + 80);

      const updatedEvents = [
        ...(parent.eventsTimeline || []),
        { 
          time: nowTime, 
          text: `Corroborated by new citizen report from ${newIncident.reporterName || 'Citizen'} (${corroboration.distanceMeters}m away)` 
        }
      ];

      // Boost confidence and update parent incident
      const updatedParent = {
        ...parent,
        isCorroborated: true,
        corroboratedReportsCount: updatedCount,
        affectedRadiusMeters: updatedRadius,
        confidence: Math.min(0.99, (parent.confidence || 0.9) + 0.04),
        trappedCount: (parent.trappedCount || 0) + (newIncident.trappedCount || 0),
        needsMedical: parent.needsMedical || newIncident.needsMedical,
        needsBoat: parent.needsBoat || newIncident.needsBoat,
        eventsTimeline: updatedEvents,
        updatedAt: new Date().toISOString()
      };

      setIncidents(prev => prev.map(inc => inc.id === parent.id ? updatedParent : inc));
      setSelectedIncident(updatedParent);
      return { ...updatedParent, wasCorroborated: true, parentId: parent.id };
    }

    // Otherwise create new distinct incident
    const initialEvents = [
      { time: nowTime, text: `Citizen report submitted by ${newIncident.reporterName || 'Citizen'}` },
      { time: nowTime, text: `AI Vision classified ${newIncident.hazardCategory} (${priority} ${newIncident.severity})` },
      { time: nowTime, text: `Incident created and placed on Live Dispatch Queue` }
    ];

    const enriched = {
      ...newIncident,
      id: newIncident.id || `RQN-${Math.floor(1040 + Math.random() * 900)}`,
      priority: priority,
      createdAt: newIncident.createdAt || new Date().toISOString(),
      status: newIncident.status || (newIncident.isRealDisaster ? 'VERIFIED' : 'FLAGGED_FALSE_ALARM'),
      isCorroborated: false,
      corroboratedReportsCount: 1,
      affectedRadiusMeters: 80,
      eventsTimeline: newIncident.eventsTimeline || initialEvents,
      dispatchFactors: newIncident.dispatchFactors || {
        specializationMatch: 95,
        distanceKm: 2.4,
        etaMins: 6,
        unitAvailability: "Available",
        existingWorkload: "Low"
      }
    };

    setIncidents(prev => [enriched, ...prev]);
    setSelectedIncident(enriched);
    return enriched;
  };

  const updateIncidentStatus = (id, newStatus, assignedUnit = null, responderNotes = null) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        const newEvents = [
          ...(inc.eventsTimeline || []),
          { time: nowTime, text: `Status updated to ${newStatus.replace('_', ' ')}${assignedUnit ? ` (Unit: ${assignedUnit})` : ''}` }
        ];

        const updated = {
          ...inc,
          status: newStatus,
          assignedUnit: assignedUnit !== null ? assignedUnit : inc.assignedUnit,
          responderNotes: responderNotes !== null ? responderNotes : inc.responderNotes,
          eventsTimeline: newEvents,
          updatedAt: new Date().toISOString()
        };

        if (selectedIncident && selectedIncident.id === id) {
          setSelectedIncident(updated);
        }
        if (activeResponderIncident && activeResponderIncident.id === id) {
          setActiveResponderIncident(updated);
        }
        return updated;
      }
      return inc;
    }));
  };

  const assignResponder = (incidentId, unitName, etaMinutes = 5, distanceKm = 1.8) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        const newEvents = [
          ...(inc.eventsTimeline || []),
          { time: nowTime, text: `${unitName} dispatched (Specialization match: 98%, ETA: ${etaMinutes} mins)` }
        ];

        const updated = {
          ...inc,
          assignedUnit: unitName,
          status: 'DISPATCHED',
          responderEtaMinutes: etaMinutes,
          responderDistanceKm: distanceKm,
          responderNotes: `Unit ${unitName} dispatched to GPS coordinates.`,
          eventsTimeline: newEvents
        };

        if (selectedIncident && selectedIncident.id === incidentId) {
          setSelectedIncident(updated);
        }
        setActiveResponderIncident(updated);
        return updated;
      }
      return inc;
    }));
  };

  const deleteIncident = (id) => {
    setIncidents(prev => prev.filter(inc => inc.id !== id));
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident(null);
    }
  };

  const resetDemoData = () => {
    setIncidents(SEED_INCIDENTS);
    setSelectedIncident(SEED_INCIDENTS[0]);
    setActiveResponderIncident(SEED_INCIDENTS[0]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INCIDENTS));
  };

  // Compute live triage statistics
  const stats = {
    total: incidents.length,
    p0Critical: incidents.filter(i => (i.priority === 'P0' || i.severity === 'CRITICAL') && i.isRealDisaster).length,
    p1High: incidents.filter(i => (i.priority === 'P1' || i.severity === 'HIGH') && i.isRealDisaster).length,
    p2Medium: incidents.filter(i => (i.priority === 'P2' || i.severity === 'MEDIUM') && i.isRealDisaster).length,
    p3Low: incidents.filter(i => (i.priority === 'P3' || i.severity === 'LOW') && i.isRealDisaster).length,
    corroboratedClusters: incidents.filter(i => i.isCorroborated && i.isRealDisaster).length,
    verified: incidents.filter(i => i.isRealDisaster).length,
    falseAlarms: incidents.filter(i => !i.isRealDisaster || i.status === 'FLAGGED_FALSE_ALARM').length,
    activeDispatches: incidents.filter(i => ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE'].includes(i.status)).length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length
  };

  return (
    <DisasterContext.Provider value={{
      incidents,
      selectedIncident,
      setSelectedIncident,
      activeResponderIncident,
      setActiveResponderIncident,
      activeView,
      setActiveView,
      filters,
      setFilters,
      isReportModalOpen,
      setIsReportModalOpen,
      isSettingsModalOpen,
      setIsSettingsModalOpen,
      isResilienceModalOpen,
      setIsResilienceModalOpen,
      nodesStatus,
      toggleNodeStatus,
      geminiApiKey,
      updateApiKey,
      backendUrl,
      updateBackendUrl,
      addIncident,
      updateIncidentStatus,
      assignResponder,
      deleteIncident,
      resetDemoData,
      stats
    }}>
      {children}
    </DisasterContext.Provider>
  );
}

export function useDisaster() {
  const context = useContext(DisasterContext);
  if (!context) {
    throw new Error('useDisaster must be used within a DisasterProvider');
  }
  return context;
}
