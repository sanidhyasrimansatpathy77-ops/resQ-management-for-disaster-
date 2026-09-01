import Peer from 'peerjs';

/**
 * ResQNet Peer-to-Peer Live Video Broadcast Service using WebRTC (PeerJS)
 * Allows First Responders to broadcast live bodycam / smartphone camera streams across the internet
 * to any colleague, dispatcher, or commander in real-time with sub-second latency.
 */

class LiveStreamManager {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.activeCalls = [];
    this.remoteStream = null;
    this.isBroadcasting = false;
    this.isWatching = false;
    this.broadcastRoomId = null;
  }

  // Sanitize room ID for WebRTC peer names
  getPeerRoomId(incidentId) {
    const clean = incidentId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `resqnet-${clean}`;
  }

  /**
   * Start broadcasting local camera stream to the internet
   */
  startBroadcast(incidentId, stream, onViewerJoined = null) {
    return new Promise((resolve, reject) => {
      this.stopBroadcast();

      const roomId = this.getPeerRoomId(incidentId);
      this.broadcastRoomId = roomId;
      this.localStream = stream;
      this.isBroadcasting = true;

      // Connect to free public PeerJS WebRTC signaling broker
      this.peer = new Peer(roomId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log(`[LiveStream] Broadcast online with Room ID: ${id}`);
        resolve({ roomId: id, isHost: true });
      });

      // Answer incoming calls from colleagues/viewers and send our camera stream
      this.peer.on('call', (call) => {
        console.log(`[LiveStream] Incoming colleague connected to live feed!`);
        call.answer(this.localStream);
        this.activeCalls.push(call);

        if (onViewerJoined) {
          onViewerJoined(this.activeCalls.length);
        }

        call.on('close', () => {
          this.activeCalls = this.activeCalls.filter(c => c !== call);
          if (onViewerJoined) onViewerJoined(this.activeCalls.length);
        });
      });

      this.peer.on('error', (err) => {
        console.warn("[LiveStream] PeerJS broadcaster error:", err);
        // If room ID already taken, create random extension
        if (err.type === 'unavailable-id') {
          console.info("[LiveStream] Room ID already in use, attaching randomized token.");
          const randomId = `${roomId}-${Math.floor(100 + Math.random() * 900)}`;
          this.peer = new Peer(randomId);
          this.peer.on('open', (newId) => resolve({ roomId: newId, isHost: true }));
          this.peer.on('call', (call) => {
            call.answer(this.localStream);
            this.activeCalls.push(call);
            if (onViewerJoined) onViewerJoined(this.activeCalls.length);
          });
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Join and watch a colleague's live broadcast
   */
  joinBroadcast(incidentId, onStreamReceived, onConnectionChange = null) {
    return new Promise((resolve, reject) => {
      this.disconnectWatcher();

      const targetRoomId = this.getPeerRoomId(incidentId);
      this.isWatching = true;

      // Create random viewer peer
      this.peer = new Peer({
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.peer.on('open', (myId) => {
        console.log(`[LiveStream] Viewer peer active (${myId}), connecting to colleague broadcaster (${targetRoomId})...`);

        // Create empty media stream or silent audio track to initiate call
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 2;
          canvas.height = 2;
          const dummyStream = canvas.captureStream(5);

          const call = this.peer.call(targetRoomId, dummyStream);

          if (!call) {
            throw new Error("Colleague stream offline or unreachable.");
          }

          call.on('stream', (incomingStream) => {
            console.log("[LiveStream] Received live colleague video stream!", incomingStream);
            this.remoteStream = incomingStream;
            if (onStreamReceived) onStreamReceived(incomingStream);
            if (onConnectionChange) onConnectionChange('CONNECTED');
          });

          call.on('close', () => {
            console.log("[LiveStream] Broadcaster closed the stream.");
            if (onConnectionChange) onConnectionChange('DISCONNECTED');
          });

          call.on('error', (e) => {
            console.warn("[LiveStream] Call error:", e);
            if (onConnectionChange) onConnectionChange('ERROR');
          });

          resolve(call);
        } catch (e) {
          reject(e);
        }
      });

      this.peer.on('error', (err) => {
        console.warn("[LiveStream] Viewer peer error:", err);
        if (onConnectionChange) onConnectionChange('ERROR');
        reject(err);
      });
    });
  }

  stopBroadcast() {
    this.isBroadcasting = false;
    this.activeCalls.forEach(call => {
      try { call.close(); } catch (e) {}
    });
    this.activeCalls = [];
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }

  disconnectWatcher() {
    this.isWatching = false;
    this.remoteStream = null;
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }
}

export const liveStreamService = new LiveStreamManager();
